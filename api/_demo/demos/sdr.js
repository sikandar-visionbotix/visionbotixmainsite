/**
 * SDR demo (S7b): outbound for Northbeam, a fictional demand-forecasting SaaS. The visitor is the sales rep. The agent
 * researches sample accounts, finds the right contact (respecting a do-not-contact list), drafts a short personalised
 * email that must cite a real signal from the research, and only schedules the sequence after the rep approves.
 * Goal: an approved, scheduled sequence.
 */
import { str } from './util.js';

const ACCOUNTS = {
  'brightwater foods': { name: 'Brightwater Foods', industry: 'Food distribution', size: '420 staff', hq: 'Columbus, Ohio', signals: ['Hiring a demand planner (posted 6 days ago)', 'Opened a second cold-storage warehouse in Q3', 'Mentioned "stock-outs during holiday peaks" in a podcast interview'], stack: 'NetSuite, Excel planning', fit: 92 },
  'halcyon home goods': { name: 'Halcyon Home Goods', industry: 'Home goods e-commerce', size: '160 staff', hq: 'Leeds, UK', signals: ['Launched in 3 new EU markets this year', 'New COO hired from a large retailer', 'Customer reviews mention "out of stock" often'], stack: 'Shopify Plus, Brightpearl', fit: 85 },
  'ironclad tools': { name: 'Ironclad Tools', industry: 'Industrial tools wholesale', size: '2,300 staff', hq: 'Rotterdam, NL', signals: ['Signed a 5-year deal with a large forecasting vendor last year'], stack: 'SAP IBP', fit: 31 },
  'verdant pet supply': { name: 'Verdant Pet Supply', industry: 'Pet supplies retail', size: '75 staff', hq: 'Austin, Texas', signals: ['Raised a Series A in September', 'Hiring their first operations manager'], stack: 'Shopify, spreadsheets', fit: 78 },
};
const CONTACTS = {
  'Brightwater Foods': [{ name: 'Dana Ortiz', title: 'VP Supply Chain', email: 'd.ortiz@brightwater.example' }, { name: 'Sam Lee', title: 'CFO', email: 'sam.lee@brightwater.example' }],
  'Halcyon Home Goods': [{ name: 'Priya Shah', title: 'COO', email: 'priya@halcyon.example', doNotContact: true }, { name: 'Tom Briggs', title: 'Head of Operations', email: 'tom@halcyon.example' }],
  'Ironclad Tools': [{ name: 'Eva de Vries', title: 'Director of Planning', email: 'eva@ironclad.example' }],
  'Verdant Pet Supply': [{ name: 'Marcus Hill', title: 'Co-founder & CEO', email: 'marcus@verdant.example' }],
};
const find = (c) => ACCOUNTS[str(c, 60).toLowerCase().replace(/\s+(inc|ltd|llc|b\.?v\.?)\.?$/, '')] ?? Object.values(ACCOUNTS).find((a) => a.name.toLowerCase().startsWith(str(c, 60).toLowerCase().split(' ')[0]));
const BANNED = /\b(guarantee[ds]?|100%|risk[- ]free|act now|last chance|limited time)\b/i;

export default {
  id: 'sdr',
  maxTokens: 420,
  rules: `You are the AI SDR (sales development) agent for Northbeam, a demand-forecasting SaaS for mid-size distributors and online retailers (cuts stock-outs and overstock; connects to NetSuite, Shopify and spreadsheets; pilots in 2 weeks). You work with a human sales rep (the user).
- To research an account, call research_account. Only use facts it returns; never invent news, numbers or names.
- Accounts below a fit score of 60 are poor fits: say so and suggest a better one instead of drafting.
- Find the right person with find_contact. Never email anyone marked do-not-contact.
- draft_email: subject under 8 words, body under 110 words, plain and specific, must reference one real signal from the research, one clear question, no hype. The tool checks this.
- When a draft passes the checks, call send_sequence straight away: the rep sees an approval card (that IS your question to them). Never claim it was sent before approval.
- Keep chat replies short; show the draft via the tool, don't repeat it in full.`,
  facts(state) {
    return `Sample accounts you can research: ${Object.values(ACCOUNTS).map((a) => a.name).join(', ')}. Drafts so far: ${state.drafts.length}. Sequences scheduled: ${state.sent.join(', ') || 'none'}.`;
  },
  tools: [
    {
      name: 'research_account',
      description: 'Company profile, recent buying signals, tech stack and ICP fit score (0–100).',
      parameters: { type: 'object', properties: { company: { type: 'string' } }, required: ['company'] },
      run(a, s) {
        const acc = find(a.company);
        if (!acc) return { result: { error: `Not in the sample list. Try: ${Object.values(ACCOUNTS).map((x) => x.name).join(', ')}` }, error: true, label: 'Research', detail: 'Unknown account' };
        if (!s.researched.includes(acc.name)) s.researched.push(acc.name);
        return {
          result: acc,
          label: 'Account researched',
          detail: `${acc.name} · fit ${acc.fit}/100 · ${acc.signals.length} signals`,
          cards: [{ type: 'kv', title: `${acc.name} · fit ${acc.fit}/100`, rows: [['Industry', acc.industry], ['Size', acc.size], ['HQ', acc.hq], ['Stack', acc.stack], ...acc.signals.map((x, i) => [`Signal ${i + 1}`, x, 'info'])] }],
        };
      },
    },
    {
      name: 'find_contact',
      description: 'Decision makers at a researched account, with do-not-contact flags.',
      parameters: { type: 'object', properties: { company: { type: 'string' } }, required: ['company'] },
      run(a) {
        const acc = find(a.company);
        const list = acc ? CONTACTS[acc.name] : null;
        if (!list) return { result: { error: 'Research the account first' }, error: true, label: 'Contacts', detail: 'Unknown account' };
        return { result: list.map((c) => ({ ...c, email: c.doNotContact ? '(hidden: do not contact)' : c.email })), label: 'Contacts found', detail: list.map((c) => `${c.name}, ${c.title}${c.doNotContact ? ' (do not contact)' : ''}`).join(' · ') };
      },
    },
    {
      name: 'draft_email',
      description: 'Saves a first-touch email draft. Checked for length, a real signal and banned phrases.',
      parameters: {
        type: 'object',
        properties: { company: { type: 'string' }, contact_name: { type: 'string' }, subject: { type: 'string' }, body: { type: 'string' }, signal_used: { type: 'string' } },
        required: ['company', 'contact_name', 'subject', 'body', 'signal_used'],
      },
      run(a, s) {
        const acc = find(a.company);
        const c = acc && CONTACTS[acc.name].find((x) => x.name.toLowerCase() === str(a.contact_name, 60).toLowerCase());
        const problems = [];
        if (!acc || !s.researched.includes(acc.name)) problems.push('research the account first');
        if (!c) problems.push('contact not found at this account');
        if (c?.doNotContact) problems.push(`${c.name} is on the do-not-contact list`);
        const body = str(a.body, 1500);
        const subject = str(a.subject, 120);
        const words = body.split(/\s+/).filter(Boolean).length;
        if (words > 110) problems.push(`body is ${words} words (max 110)`);
        if (subject.split(/\s+/).length > 8) problems.push('subject over 8 words');
        if (BANNED.test(`${subject} ${body}`)) problems.push('hype or a promise we can’t make');
        const sig = acc?.signals.find((x) => x.toLowerCase().split(/\W+/).filter((w) => w.length > 4).some((w) => body.toLowerCase().includes(w)));
        if (acc && !sig) problems.push('does not reference a real signal from the research');
        if (problems.length) return { result: { error: `Draft rejected: ${problems.join('; ')}. Fix and try again.` }, error: true, label: 'Draft rejected', detail: problems.join(' · ') };
        const d = { id: `D${s.drafts.length + 1}`, company: acc.name, to: `${c.name} <${c.email}>`, subject, body };
        s.drafts.push(d);
        return {
          result: { saved: true, draft_id: d.id, words },
          label: 'Draft saved (checks passed)',
          detail: `${d.id} to ${c.name} · ${words} words · signal: ${sig}`,
          cards: [{ type: 'draft', title: `Draft ${d.id} · to ${c.name}, ${c.title}`, meta: [`Subject: ${subject}`], body: `${body}\n\n(Unsubscribe line added automatically)` }],
        };
      },
    },
    {
      name: 'send_sequence',
      description: 'Schedules a saved draft plus 2 follow-ups. Needs the rep’s approval.',
      parameters: { type: 'object', properties: { draft_id: { type: 'string' } }, required: ['draft_id'] },
      run(a, s) {
        const d = s.drafts.find((x) => x.id === str(a.draft_id, 5).toUpperCase());
        if (!d) return { result: { error: 'Unknown draft id' }, error: true, label: 'Not scheduled', detail: 'Unknown draft' };
        if (s.sent.includes(d.id)) return { result: { already_scheduled: true }, label: 'Already scheduled', detail: d.id };
        return { result: { status: 'waiting_for_rep_approval' }, gate: { title: `Send ${d.id} to ${d.to.split(' <')[0]} + 2 follow-ups`, detail: `Subject: ${d.subject}\nDay 1 email, day 4 and day 9 follow-ups. Stops when they reply.` } };
      },
    },
  ],
  init: () => ({ researched: [], drafts: [], sent: [] }),
  async approve(g, s) {
    s.sent.push(g.args.draft_id.toUpperCase());
    return { note: `The rep approved ${g.args.draft_id}: the sequence is scheduled and logged in the CRM. Confirm briefly.`, step: { label: 'Sequence scheduled', detail: `${g.args.draft_id} · 3 touches · CRM activity logged` } };
  },
  decline(g) {
    return { note: `The rep declined sending ${g.args.draft_id}. Ask what to change in the draft.` };
  },
  complete: (s) => s.sent.length > 0,
  doneText: () => 'Account researched, email drafted and approved, sequence scheduled',
  board(s) {
    return [
      { title: 'Pipeline', items: Object.values(ACCOUNTS).map((a) => ({ label: a.name, value: s.sent.some((id) => s.drafts.find((d) => d.id === id)?.company === a.name) ? 'sequence scheduled' : s.drafts.some((d) => d.company === a.name) ? 'draft ready' : s.researched.includes(a.name) ? `researched · fit ${a.fit}` : 'not started', status: s.researched.includes(a.name) ? (a.fit < 60 ? 'warn' : 'ok') : 'info' })) },
      { title: 'Rules', items: [{ label: 'Do-not-contact list', value: 'enforced in the tool' }, { label: 'Every email', value: 'approved by the rep' }] },
    ];
  },
};
