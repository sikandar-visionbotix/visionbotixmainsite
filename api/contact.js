/**
 * Contact / quote form → email (Vercel Function, Node runtime). The rest of the site is static (D16).
 * Env (Vercel → Project → Settings → Environment Variables, never in the repo):
 *   RESEND_API_KEY  required to send (resend.com, domain visionbotix.com verified there)
 *   CONTACT_TO      inbox, default hello@visionbotix.com
 *   CONTACT_FROM    sender, default "Visionbotix website <website@visionbotix.com>"
 * Without RESEND_API_KEY it answers 503 { fallback: "mailto" } and the page offers a pre-filled email instead.
 * Spam: honeypot field, minimum fill time, length caps, same-origin check. Turnstile arrives in S6.
 */
const TO = process.env.CONTACT_TO || 'hello@visionbotix.com';
const FROM = process.env.CONTACT_FROM || 'Visionbotix website <website@visionbotix.com>';
const ALLOWED_ORIGIN = /^https:\/\/((www\.)?visionbotix\.com|[a-z0-9-]+\.vercel\.app)$|^http:\/\/localhost(:\d+)?$/;

const LIMITS = { name: 120, email: 200, company: 160, country: 80, topic: 80, budget: 60, source: 80, timezone: 60, message: 5000 };
const clean = (v, max) => (typeof v === 'string' ? v.replace(/\u0000/g, '').trim().slice(0, max) : '');
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
  const wantsCall = b.call === true || b.call === 'on' || b.call === 'yes';

  // Bots: honeypot filled, or the form was submitted faster than a person could type it. Pretend success.
  const started = Number(b.started) || 0;
  if (clean(b.website, 200) || (started && Date.now() - started < 3000)) return reply(200, { ok: true });

  const errors = {};
  if (f.name.length < 2) errors.name = 'Please enter your name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email)) errors.email = 'Please enter a valid email address.';
  if (f.message.length < 10) errors.message = 'Please tell us a little about what you need.';
  if (Object.keys(errors).length) return reply(422, { ok: false, errors });

  if (!process.env.RESEND_API_KEY) return reply(503, { ok: false, fallback: 'mailto' });

  const rows = [
    ['Name', f.name],
    ['Email', f.email],
    ['Company', f.company],
    ['Country', f.country],
    ['Topic', f.topic],
    ['Budget', f.budget],
    ['Wants a call', wantsCall ? `Yes${f.timezone ? ` (time zone ${f.timezone})` : ''}` : 'No'],
    ['Heard about us', f.source],
  ].filter(([, v]) => v);
  const text = `${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\n${f.message}\n`;
  const html = `<table cellpadding="4">${rows.map(([k, v]) => `<tr><td><b>${esc(k)}</b></td><td>${esc(v)}</td></tr>`).join('')}</table><p style="white-space:pre-wrap">${esc(f.message)}</p>`;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        reply_to: f.email,
        subject: `New enquiry: ${f.topic || 'website'} from ${f.name}${f.company ? `, ${f.company}` : ''}`,
        text,
        html,
      }),
    });
    if (!r.ok) {
      console.error('resend error', r.status, await r.text());
      return reply(502, { ok: false, fallback: 'mailto' });
    }
    return reply(200, { ok: true });
  } catch (e) {
    console.error('contact send failed', e);
    return reply(502, { ok: false, fallback: 'mailto' });
  }
}
