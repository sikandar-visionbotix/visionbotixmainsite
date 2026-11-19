/**
 * Site concierge (S7): the "Ask Visionbotix" assistant on every page. Answers from the site's own content
 * (api/_demo/data/site-kb.js, generated from llms-full.txt) with links, helps visitors pick an agent or service,
 * qualifies gently, and books a call. Sending the visitor's details to the team is an approval gate: the visitor sees
 * exactly what will be sent and confirms it (consent), then it goes through the same delivery as the contact form.
 */
import { str } from './util.js';
import { index } from '../retrieve.js';
import { EMAIL_RE, LIMITS, clean, deliverLead } from '../../_lib/lead.js';
import KB, { bookingUrl } from '../data/site-kb.js';

const search = index(KB);

export default {
  id: 'concierge',
  maxTokens: 380,
  rules: `You are the AI concierge on visionbotix.com, the website of Visionbotix, an AI-first product engineering studio (AI agents, web, mobile and SaaS software, security). Help visitors understand what we do, find the right agent or service, see prices, and book a free strategy call.
- Call search_site before answering anything about Visionbotix, its offers, prices, timelines or process. Use only what it returns; if it doesn't cover the question, say so and suggest a call. Never invent prices, clients, numbers, certifications or promises.
- Prices are "from" prices in USD exactly as the sources state; a fixed quote follows a call.
- Link the most relevant page with Markdown, like [Receptionist Agent](https://visionbotix.com/ai-agents/ai-receptionist/). Only link visionbotix.com pages from the results, or the booking link.
- Case studies are anonymous: never name or guess clients.
- Be concise and warm: two to five sentences, or a short list. One question at a time. Not pushy. No em dashes.
- To book a call, share the booking link: [Book a free strategy call](${bookingUrl}).
- If the visitor wants us to contact them or get a quote, collect their name, email and what they need (budget and timeline are optional), then call prepare_lead straight away. It shows the visitor a card with Send / Don't send: that card IS the confirmation, so don't ask them to confirm in text or reply "yes". Never collect anything else.
- Off-topic requests (homework, coding help, other companies): decline in one sentence and steer back.`,
  facts(state) {
    return `Contact: info@visionbotix.com. Booking link: ${bookingUrl}. Details already sent to the team in this chat: ${state.leadSent ? 'yes' : 'no'}.`;
  },
  tools: [
    {
      name: 'search_site',
      description: 'Searches visionbotix.com content (agents, services, pricing, products, process, company).',
      parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
      run(a) {
        const q = str(a.query, 200);
        const hits = search(q, 3);
        // Cost questions always get the published price list and typical project costs too.
        if (/cost|price|pricing|budget|how much|quote|\$/i.test(q)) {
          // …plus the main entry (with its price) of every page the hits came from.
          for (const url of new Set(hits.map((h) => h.url))) {
            const main = KB.find((k) => k.url === url && /^Price: /.test(k.text));
            if (main && !hits.some((x) => x.id === main.id)) hits.unshift({ ...main, score: 0 });
          }
          for (const h of KB.filter((k) => /^Visionbotix: (Pricing|Typical project costs)/.test(k.title))) if (!hits.some((x) => x.id === h.id)) hits.push({ ...h, score: 0 });
        }
        return {
          result: hits.length ? hits.map((h) => ({ title: h.title, url: h.url, text: h.text.slice(0, 900) })) : { found: false },
          label: 'Site searched',
          detail: hits.length ? hits.map((h) => h.title).join(' · ') : 'Nothing found',
        };
      },
    },
    {
      name: 'prepare_lead',
      description: 'Prepares the visitor’s details for the team. The visitor must confirm before it is sent.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string' },
          company: { type: 'string' },
          need: { type: 'string', description: 'What they want built or solved, in their words' },
          budget: { type: 'string' },
          timeline: { type: 'string' },
        },
        required: ['name', 'email', 'need'],
      },
      run(a, s) {
        if (s.leadSent) return { result: { error: 'Already sent in this chat.' }, error: true, label: 'Not sent again', detail: 'Details were already sent' };
        const name = str(a.name, 80);
        const email = str(a.email, 120);
        if (name.length < 2 || !EMAIL_RE.test(email)) return { result: { error: 'Need a name and a valid email address.' }, error: true, label: 'Lead not prepared', detail: 'Missing name or valid email' };
        const lines = [`Name: ${name}`, `Email: ${email}`, a.company && `Company: ${str(a.company, 80)}`, `Need: ${str(a.need, 300)}`, a.budget && `Budget: ${str(a.budget, 40)}`, a.timeline && `Timeline: ${str(a.timeline, 60)}`].filter(Boolean);
        return {
          result: { status: 'waiting_for_visitor_confirmation', note: 'Nothing is sent yet. Ask the visitor to check the details in the card below and press Send (or Don’t send). Do not say it was sent or saved.' },
          gate: { title: 'Send these details to the Visionbotix team?', detail: lines.join('\n'), consent: true },
        };
      },
    },
  ],
  init: () => ({ leadSent: false }),
  async approve(g, s, ctx) {
    const a = g.args;
    const userLines = ctx.transcript.filter((m) => m.role === 'user').map((m) => `- ${m.content}`);
    const f = Object.fromEntries(Object.keys(LIMITS).map((k) => [k, '']));
    Object.assign(f, {
      form: 'concierge',
      name: clean(a.name, LIMITS.name),
      email: clean(a.email, LIMITS.email),
      company: clean(a.company, LIMITS.company),
      topic: clean(a.need, LIMITS.topic),
      budget: clean(a.budget, LIMITS.budget),
      timezone: ctx.timezone,
      landing: ctx.landing,
      source: 'AI concierge',
      message: clean(`${str(a.need, 600)}${a.timeline ? `\nTimeline: ${str(a.timeline, 80)}` : ''}\n\nVisitor's messages in the concierge chat:\n${userLines.join('\n')}`, LIMITS.message),
    });
    const sent = await deliverLead(f, true);
    if (!sent) {
      return {
        note: 'Sending failed on our side. Apologise and ask the visitor to email info@visionbotix.com or use the booking link.',
        step: { label: 'Delivery failed', detail: 'Visitor asked to email or book instead' },
      };
    }
    s.leadSent = true;
    return {
      note: `The details were sent to the team (they reply within one business day). Thank the visitor and suggest picking a time now with the booking link.`,
      step: { label: 'Sent to the team', detail: `${f.name} · ${f.topic}` },
      cards: [{ type: 'booking', url: `${bookingUrl}?${new URLSearchParams({ name: f.name, email: f.email, notes: f.topic }).toString()}` }],
    };
  },
  decline() {
    return { note: 'The visitor chose not to send their details. Respect that, and mention they can book a call or use the contact page any time.' };
  },
  complete: (s) => s.leadSent,
  doneText: () => 'Details sent to the team; booking link shared',
};
