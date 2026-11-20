/**
 * Shared server helpers for lead delivery (contact/estimate forms and, from S7, the site concierge) and for
 * Cloudflare Turnstile. Files and folders under api/ that start with "_" are not routes on Vercel, only modules.
 * Env: RESEND_API_KEY, CONTACT_TO, CONTACT_FROM, LEAD_WEBHOOK_URL, LEAD_WEBHOOK_SECRET, TURNSTILE_SECRET_KEY
 * (see api/contact.js for what each does).
 */
export const TO = process.env.CONTACT_TO || 'info@visionbotix.com';
const FROM = process.env.CONTACT_FROM || 'Visionbotix website <website@visionbotix.com>';
export const ALLOWED_ORIGIN = /^https:\/\/((www\.)?visionbotix\.com|[a-z0-9-]+\.vercel\.app)$|^http:\/\/localhost(:\d+)?$/;

export const LIMITS = {
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

export const clean = (v, max) => (typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, max) : '');
const oneLine = (s) => s.replace(/[\r\n]+/g, ' ');
const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function parse(body) {
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

export function clientIp(req) {
  const fwd = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return fwd || req.headers['x-real-ip'] || '';
}

/** Cloudflare Turnstile siteverify. Without a secret it is off (true). Fails closed otherwise. */
export async function turnstileOk(token, ip) {
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

const SUBJECT = {
  estimate: (f) => `estimate ${f.range ? `(${f.range})` : ''}`,
  concierge: (f) => `concierge lead: ${f.topic || 'website'}`,
  checker: (f) => `AI visibility check ${f.range ? `(${f.range})` : ''}`,
  readiness: (f) => `AI readiness score ${f.range ? `(${f.range})` : ''}`,
  contact: (f) => `enquiry: ${f.topic || 'website'}`,
};

async function sendEmail(f, rows) {
  if (!process.env.RESEND_API_KEY) return null;
  const text = `${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\n${f.message}\n`;
  const html = `<table cellpadding="4">${rows.map(([k, v]) => `<tr><td><b>${esc(k)}</b></td><td>${esc(v)}</td></tr>`).join('')}</table><p style="white-space:pre-wrap">${esc(f.message)}</p>`;
  const what = (SUBJECT[f.form] ?? SUBJECT.contact)(f);
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

const FORM_LABEL = { estimate: 'Cost estimator', concierge: 'AI concierge', checker: 'AI visibility checker', readiness: 'AI readiness score', contact: 'Contact' };

/**
 * Sends a cleaned lead `f` (keys of LIMITS) by email and/or webhook.
 * Returns null when neither channel is configured, true when at least one accepted it, false when all failed.
 */
export async function deliverLead(f, wantsCall) {
  const rows = [
    ['Form', FORM_LABEL[f.form] ?? 'Contact'],
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
  if (mail === null && hook === null) return null;
  return !!(mail || hook);
}
