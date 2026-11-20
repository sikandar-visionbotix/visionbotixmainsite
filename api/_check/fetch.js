/**
 * Safe outbound GET for the AI visibility checker (S11). The checker fetches pages that visitors name, so it must
 * never be usable to reach private networks (SSRF):
 *  - http/https only, ports 80/443 only, no credentials in the URL, max 300 characters
 *  - every address the hostname resolves to must be public (checked at connect time through `lookup`, so DNS
 *    rebinding between the check and the connection is not possible); IP literals go through the same check
 *  - redirects are followed by hand (max 5) and each hop is validated again
 *  - hard timeout and a byte cap; the body is decompressed (gzip, deflate, br) and decoded as UTF-8
 */
import http from 'node:http';
import https from 'node:https';
import dns from 'node:dns';
import net from 'node:net';
import zlib from 'node:zlib';

export const UA = 'VisionbotixAIVisibilityChecker/1.0 (+https://visionbotix.com/tools/ai-visibility-checker/)';

const blocked = new net.BlockList();
for (const [a, p] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16], ['172.16.0.0', 12],
  ['192.0.0.0', 24], ['192.0.2.0', 24], ['192.88.99.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15],
  ['198.51.100.0', 24], ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4],
]) blocked.addSubnet(a, p, 'ipv4');
for (const [a, p] of [
  ['::', 128], ['::1', 128], ['64:ff9b::', 96], ['64:ff9b:1::', 48], ['100::', 64],
  ['2001::', 23], ['2001:db8::', 32], ['2002::', 16], ['fc00::', 7], ['fe80::', 10], ['ff00::', 8],
]) blocked.addSubnet(a, p, 'ipv6');

export function isPublicIp(ip) {
  const v = net.isIP(ip);
  if (!v) return false;
  // IPv4-mapped IPv6 (::ffff:a.b.c.d): judge the IPv4 address. (A ::ffff:0:0/96 rule would also match every IPv4.)
  const mapped = v === 6 && ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped) return isPublicIp(mapped[1]);
  if (v === 6 && /^::ffff:/i.test(ip)) return false;
  return !blocked.check(ip, v === 4 ? 'ipv4' : 'ipv6');
}

export class FetchError extends Error {
  constructor(code, message) {
    super(message || code);
    this.code = code;
  }
}

/** Parses and validates a URL a visitor typed. Adds https:// when the scheme is missing. */
export function normaliseUrl(input) {
  let s = String(input ?? '').trim();
  if (!s || s.length > 300) throw new FetchError('bad_url', 'Enter a website address, for example example.com');
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = `https://${s}`;
  let u;
  try {
    u = new URL(s);
  } catch {
    throw new FetchError('bad_url', 'That does not look like a website address.');
  }
  checkUrl(u);
  u.hash = '';
  return u;
}

function checkUrl(u) {
  if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new FetchError('bad_url', 'Only http and https addresses can be checked.');
  if (u.username || u.password) throw new FetchError('bad_url', 'Addresses with a user name or password cannot be checked.');
  if (u.port && u.port !== '80' && u.port !== '443') throw new FetchError('bad_url', 'Only standard ports (80 and 443) can be checked.');
  const host = u.hostname.replace(/^\[|\]$/g, '');
  if (net.isIP(host)) {
    if (!isPublicIp(host)) throw new FetchError('blocked', 'That address is not on the public internet.');
  } else if (!host.includes('.') || /\.(local|localhost|internal|lan|home|corp|test|invalid|example)$/i.test(host) || /^localhost$/i.test(host)) {
    throw new FetchError('bad_url', 'Enter a public website address, for example example.com');
  }
}

/** dns.lookup that refuses non-public addresses (used at connect time, so it also covers rebinding). */
function safeLookup(hostname, opts, cb) {
  if (typeof opts === 'function') [cb, opts] = [opts, {}];
  dns.lookup(hostname, { all: true, verbatim: true }, (err, addrs) => {
    if (err) return cb(err);
    if (!addrs.length || addrs.some((a) => !isPublicIp(a.address))) {
      return cb(new FetchError('blocked', 'That address is not on the public internet.'));
    }
    const pick = opts?.family ? addrs.filter((a) => a.family === opts.family) : addrs;
    const list = pick.length ? pick : addrs;
    if (opts?.all) return cb(null, list);
    cb(null, list[0].address, list[0].family);
  });
}

function once(u, { timeout, maxBytes, accept }) {
  return new Promise((resolve, reject) => {
    const lib = u.protocol === 'https:' ? https : http;
    const started = Date.now();
    const req = lib.request(
      u,
      {
        method: 'GET',
        lookup: safeLookup,
        headers: { 'User-Agent': UA, Accept: accept, 'Accept-Encoding': 'gzip, deflate, br', 'Accept-Language': 'en' },
        timeout,
      },
      (res) => {
        const ttfb = Date.now() - started;
        const enc = String(res.headers['content-encoding'] || '').toLowerCase();
        let stream = res;
        if (enc === 'gzip' || enc === 'x-gzip') stream = res.pipe(zlib.createGunzip());
        else if (enc === 'deflate') stream = res.pipe(zlib.createInflate());
        else if (enc === 'br') stream = res.pipe(zlib.createBrotliDecompress());
        const chunks = [];
        let size = 0;
        let truncated = false;
        const done = () => {
          clearTimeout(timer);
          resolve({ status: res.statusCode ?? 0, headers: res.headers, body: Buffer.concat(chunks).toString('utf8'), ttfb, ms: Date.now() - started, truncated });
        };
        // 3xx and errors: we only need the headers and a little of the body.
        const cap = res.statusCode && res.statusCode >= 300 && res.statusCode < 400 ? 0 : maxBytes;
        stream.on('data', (c) => {
          if (truncated) return;
          size += c.length;
          if (size > cap) {
            chunks.push(c.subarray(0, Math.max(0, cap - (size - c.length))));
            truncated = true;
            res.destroy();
            done();
            return;
          }
          chunks.push(c);
        });
        stream.on('end', () => !truncated && done());
        stream.on('error', (e) => !truncated && (chunks.length ? done() : reject(new FetchError('unreachable', e.message))));
      },
    );
    const timer = setTimeout(() => req.destroy(new FetchError('timeout', 'The site took too long to answer.')), timeout + 500);
    req.on('timeout', () => req.destroy(new FetchError('timeout', 'The site took too long to answer.')));
    req.on('error', (e) => {
      clearTimeout(timer);
      if (e instanceof FetchError) return reject(e);
      if (e?.code === 'ENOTFOUND' || e?.code === 'EAI_AGAIN') return reject(new FetchError('dns', 'We could not find that domain.'));
      if (/certificate|SSL|TLS/i.test(String(e?.message)) || String(e?.code).startsWith('ERR_TLS') || /CERT/.test(String(e?.code))) {
        return reject(new FetchError('tls', 'The site’s HTTPS certificate is not valid.'));
      }
      reject(new FetchError('unreachable', 'We could not connect to the site.'));
    });
    req.end();
  });
}

/**
 * GET with validated redirects.
 * @returns {Promise<{url: string, status: number, headers: Record<string, any>, body: string, ttfb: number, ms: number, truncated: boolean, redirects: string[]}>}
 */
export async function safeGet(input, { timeout = 8000, maxBytes = 1_500_000, accept = 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5', maxRedirects = 5 } = {}) {
  let u = input instanceof URL ? new URL(input) : normaliseUrl(input);
  const redirects = [];
  const t0 = Date.now();
  for (let i = 0; ; i++) {
    checkUrl(u);
    const r = await once(u, { timeout: Math.max(1000, timeout - (Date.now() - t0)), maxBytes, accept });
    if (r.status >= 300 && r.status < 400 && r.headers.location) {
      if (i >= maxRedirects) throw new FetchError('redirects', 'The page redirects too many times.');
      redirects.push(`${r.status} → ${r.headers.location}`);
      try {
        u = new URL(String(r.headers.location), u);
      } catch {
        throw new FetchError('unreachable', 'The page redirects to an invalid address.');
      }
      continue;
    }
    return { url: u.href, ...r, ms: Date.now() - t0, redirects };
  }
}
