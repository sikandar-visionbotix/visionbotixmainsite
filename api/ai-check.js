/**
 * Free AI visibility checker (S11, D74): POST /api/ai-check/ { url, ts } → a report on how well AI search engines can
 * reach, read and identify one page (robots.txt per AI crawler, indexing directives, HTML text without JavaScript,
 * structure, schema, entity signals). No LLM is involved; checks run in code (api/_check/).
 *
 * Abuse controls: same-origin check, Cloudflare Turnstile (when TURNSTILE_SECRET_KEY is set), per-IP and daily limits
 * (global with Upstash/KV env, see api/_demo/guard.js), SSRF-safe fetching (public addresses only, validated redirects,
 * timeouts, byte caps; api/_check/fetch.js), and a 10-minute cache per URL. We only store a log line with the host
 * name and the score (no IP, no page content); see the privacy policy, "Free tools".
 *   CHECK_DAILY   default 800 checks a day    CHECK_IP   default 8 per 10 minutes
 */
import { createHash } from 'node:crypto';
import { ALLOWED_ORIGIN, clean, parse, clientIp, turnstileOk } from './_lib/lead.js';
import { incr } from './_demo/guard.js';
import { buildReport } from './_check/report.js';
import { normaliseUrl, FetchError } from './_check/fetch.js';

const DAILY = Number(process.env.CHECK_DAILY) || 800;
const PER_IP = Number(process.env.CHECK_IP) || 8;
const cache = new Map();

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method' });
  }
  const origin = req.headers.origin;
  if (origin && !ALLOWED_ORIGIN.test(origin)) return res.status(403).json({ ok: false, error: 'forbidden' });

  const b = parse(req.body);
  let url;
  try {
    url = normaliseUrl(clean(b.url, 300));
  } catch (e) {
    return res.status(422).json({ ok: false, error: 'bad_url', message: e.message });
  }

  const key = url.href;
  const hit = cache.get(key);
  if (hit && hit.exp > Date.now()) return res.status(200).json({ ok: true, cached: true, report: hit.report });

  const ip = clientIp(req);
  if (!(await turnstileOk(clean(b.ts, 2048), ip))) return res.status(403).json({ ok: false, error: 'verification' });

  const ipKey = createHash('sha256').update(`check:${ip || 'unknown'}`).digest('hex').slice(0, 20);
  const day = new Date().toISOString().slice(0, 10);
  const [n, d] = await Promise.all([incr(`vbx:check:ip:${ipKey}:${Math.floor(Date.now() / 600_000)}`, 600), incr(`vbx:check:day:${day}`, 90_000)]);
  if (n > PER_IP) return res.status(429).json({ ok: false, error: 'busy_ip' });
  if (d > DAILY) return res.status(429).json({ ok: false, error: 'busy' });

  try {
    const report = await buildReport(url);
    cache.set(key, { exp: Date.now() + 10 * 60_000, report });
    if (cache.size > 300) for (const [k, v] of cache) if (v.exp < Date.now()) cache.delete(k);
    console.log(JSON.stringify({ t: 'ai-check', host: report.host, score: report.score, ms: report.stats.ms }));
    return res.status(200).json({ ok: true, report });
  } catch (e) {
    const code = e instanceof FetchError ? e.code : 'unreachable';
    const message = e instanceof FetchError ? e.message : 'We could not check that page.';
    if (!(e instanceof FetchError)) console.error('ai-check failed', e);
    console.log(JSON.stringify({ t: 'ai-check', host: url.host, error: code }));
    return res.status(200).json({ ok: false, error: code, message });
  }
}
