/**
 * Contact, quote and estimate forms → email and/or a lead webhook (Vercel Function, Node runtime). The rest of the
 * site is static (D16). Env (Vercel → Project → Settings → Environment Variables, never in the repo):
 *   RESEND_API_KEY        sends the lead by email (resend.com, domain visionbotix.com verified there)
 *   CONTACT_TO            inbox, default info@visionbotix.com
 *   CONTACT_FROM          sender, default "Visionbotix website <website@visionbotix.com>"
 *   LEAD_WEBHOOK_URL      optional: also POSTs the lead as JSON (Google Sheet via scripts/lead-sheet.gs, Zapier, a CRM)
 *   LEAD_WEBHOOK_SECRET   optional: sent as `secret` in that JSON so the receiver can reject strangers
 *   TURNSTILE_SECRET_KEY  optional: Cloudflare Turnstile check (S6, D48); needs PUBLIC_TURNSTILE_SITE_KEY on the page
 * A lead counts as delivered when at least one of email or webhook accepts it. With neither configured, or both
 * failing, it answers 503/502 { fallback: "mailto" } and the page offers a pre-filled email (no lost leads, D40).
 * Spam: honeypot, minimum fill time, length caps, same-origin check, Turnstile when configured.
 */
const TO = process.env.CONTACT_TO || 'info@visionbotix.com';
const FROM = process.env.CONTACT_FROM || 'Visionbotix website <website@visionbotix.com>';
const ALLOWED_ORIGIN = /^https:\/\/((www\.)?visionbotix\.com|[a-z0-9-]+\.vercel\.app)$|^http:\/\/localhost(:\d+)?$/;

const LIMITS = {
  name: 120,
  email: 200,
  company: 160,
  country: 80,
  topic: 80,
  budget: 60,
  source: 80,
  timezone: 60,
  message: 5000,
  // S6: which form, the first page and referrer of the visit (D49), and the estimate range for the subject line.
  form: 20,
  landing: 300,
  range: 120,
};
const clean = (v, max) => (typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, max) : '');
const oneLine = (s) => s.replace(/[\r\n]+/g, ' ');
const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function parse(body) {
  if (!body) return {};
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return Object.fromEntries(new URLSearchParams(body));
    }
  }
  return body;
}

function clientIp(req) {
  const fwd = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return fwd || req.headers['x-real-ip'] || '';
}

/** Cloudflare Turnstile siteverify. Fails closed: the page then offers the pre-filled email. */
async function turnstileOk(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set('remoteip', ip);
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body, signal: AbortSignal.timeout(8000) });
    const j = await r.json();
    if (!j.success) console.warn('turnstile rejected', j['error-codes']);
    return !!j.success;
  } catch (e) {
    console.error('turnstile verify failed', e);
    return false;
  }
}

async function sendEmail(f, rows) {
  if (!process.env.RESEND_API_KEY) return null;
  const text = `${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\n${f.message}\n`;
  const html = `<table cellpadding="4">${rows.map(([k, v]) => `<tr><td><b>${esc(k)}</b></td><td>${esc(v)}</td></tr>`).join('')}</table><p style="white-space:pre-wrap">${esc(f.message)}</p>`;
  const what = f.form === 'estimate' ? `estimate ${f.range ? `(${f.range})` : ''}` : `enquiry: ${f.topic || 'website'}`;
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        reply_to: f.email,
        subject: oneLine(`New ${what} from ${f.name}${f.company ? `, ${f.company}` : ''}`).slice(0, 200),
        text,
        html,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) console.error('resend error', r.status, await r.text());
    return r.ok;
  } catch (e) {
    console.error('email send failed', e);
    return false;
  }
}

async function sendWebhook(f, wantsCall) {
  const url = process.env.LEAD_WEBHOOK_URL;
  if (!url) return null;
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: process.env.LEAD_WEBHOOK_SECRET || '', receivedAt: new Date().toISOString(), ...f, call: wantsCall }),
      redirect: 'follow', // Google Apps Script web apps answer with a 302 to the result
      signal: AbortSignal.timeout(10000),
    });
    const text = await r.text();
    // Apps Script always answers 200, so also honour an explicit { ok: false } in the body (wrong secret etc.).
    let refused = false;
    try {
      refused = JSON.parse(text)?.ok === false;
    } catch {}
    if (!r.ok || refused) console.error('lead webhook error', r.status, text.slice(0, 300));
    return r.ok && !refused;
  } catch (e) {
    console.error('lead webhook failed', e);
    return false;
  }
}

export default async function handler(req, res) {
  const wantsHtml = !String(req.headers['content-type'] || '').includes('application/json');
  const reply = (status, data) => {
    if (wantsHtml) {
      if (status === 200) return res.redirect(303, '/contact/thanks/');
      res.status(status).setHeader('content-type', 'text/html; charset=utf-8');
      return res.send(
        `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Message not sent</title><body style="font:16px system-ui;max-width:40rem;margin:4rem auto;padding:0 1rem"><h1>Sorry, your message was not sent.</h1><p>Please email us at <a href="mailto:${TO}">${TO}</a>.</p><p><a href="/contact/">Back to the contact page</a></p>`,
      );
    }
    return res.status(status).json(data);
  };

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return reply(405, { ok: false, error: 'Method not allowed' });
  }
  const origin = req.headers.origin;
  if (origin && !ALLOWED_ORIGIN.test(origin)) return reply(403, { ok: false, error: 'Forbidden' });

  const b = parse(req.body);
  const f = Object.fromEntries(Object.entries(LIMITS).map(([k, max]) => [k, clean(b[k], max)]));
  f.form = f.form === 'estimate' ? 'estimate' : 'contact';
  const wantsCall = b.call === true || b.call === 'on' || b.call === 'yes';

  // Bots: honeypot filled, or the form was submitted faster than a person could type it. Pretend success.
  const started = Number(b.started) || 0;
  if (clean(b.website, 200) || (started && Date.now() - started < 3000)) return reply(200, { ok: true });

  const errors = {};
  if (f.name.length < 2) errors.name = 'Please enter your name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email)) errors.email = 'Please enter a valid email address.';
  if (f.message.length < 10) errors.message = 'Please tell us a little about what you need.';
  if (Object.keys(errors).length) return reply(422, { ok: false, errors });

  if (!(await turnstileOk(clean(b['cf-turnstile-response'], 2048), clientIp(req)))) {
    return reply(403, { ok: false, error: 'verification', fallback: 'mailto' });
  }

  const rows = [
    ['Form', f.form === 'estimate' ? 'Cost estimator' : 'Contact'],
    ['Name', f.name],
    ['Email', f.email],
    ['Company', f.company],
    ['Country', f.country],
    ['Topic', f.topic],
    ['Budget', f.budget],
    ['Estimate', f.range],
    ['Wants a call', wantsCall ? `Yes${f.timezone ? ` (time zone ${f.timezone})` : ''}` : 'No'],
    ['Heard about us', f.source],
    ['Arrived from', f.landing],
  ].filter(([, v]) => v);

  const [mail, hook] = await Promise.all([sendEmail(f, rows), sendWebhook(f, wantsCall)]);
  if (mail === null && hook === null) return reply(503, { ok: false, fallback: 'mailto' });
  if (mail || hook) return reply(200, { ok: true });
  return reply(502, { ok: false, fallback: 'mailto' });
}
