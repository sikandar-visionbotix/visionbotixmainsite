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
 * Delivery and Turnstile live in api/_lib/lead.js (shared with the S7 concierge in api/demo.js).
 */
import { TO, ALLOWED_ORIGIN, LIMITS, EMAIL_RE, clean, parse, clientIp, turnstileOk, deliverLead } from './_lib/lead.js';

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
  f.form = ['estimate', 'checker'].includes(f.form) ? f.form : 'contact';
  const wantsCall = b.call === true || b.call === 'on' || b.call === 'yes';

  // Bots: honeypot filled, or the form was submitted faster than a person could type it. Pretend success.
  const started = Number(b.started) || 0;
  if (clean(b.website, 200) || (started && Date.now() - started < 3000)) return reply(200, { ok: true });

  const errors = {};
  if (f.name.length < 2) errors.name = 'Please enter your name.';
  if (!EMAIL_RE.test(f.email)) errors.email = 'Please enter a valid email address.';
  if (f.message.length < 10) errors.message = 'Please tell us a little about what you need.';
  if (Object.keys(errors).length) return reply(422, { ok: false, errors });

  if (!(await turnstileOk(clean(b['cf-turnstile-response'], 2048), clientIp(req)))) {
    return reply(403, { ok: false, error: 'verification', fallback: 'mailto' });
  }

  const sent = await deliverLead(f, wantsCall);
  if (sent === null) return reply(503, { ok: false, fallback: 'mailto' });
  if (sent) return reply(200, { ok: true });
  return reply(502, { ok: false, fallback: 'mailto' });
}
