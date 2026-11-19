/**
 * Reputation demo (S7b): Juniper Café, a fictional café in Melbourne. Sample Google reviews. The agent drafts on-brand
 * replies (no incentives, no personal data, no arguing), posts replies to 4–5 star reviews, sends 1–3 star replies for
 * the owner's approval, reports policy-breaking reviews instead of replying, and asks every recent customer for a review
 * (no review gating). Goal: the negative reviews handled with approval.
 */
import { str } from './util.js';

const REVIEWS = [
  { id: 'R1', stars: 5, who: 'Mia T.', text: 'Best flat white in Fitzroy and the staff remembered my name on my second visit!' },
  { id: 'R2', stars: 2, who: 'Daniel R.', text: 'Waited 25 minutes for eggs on a Sunday. Food was good when it came but nobody told us about the delay.' },
  { id: 'R3', stars: 4, who: 'Aiko', text: 'Lovely brunch, a bit loud inside. Get the ricotta hotcakes.' },
  { id: 'R4', stars: 1, who: 'Burner Account 77', text: 'Terrible!!! Go to Bean Republic down the road instead, way better, 20% off with code BEAN20' },
  { id: 'R5', stars: 3, who: 'Grace L.', text: 'Coffee great, but my oat latte was charged as a large when I ordered a regular.' },
  { id: 'R6', stars: 5, who: 'Sam P.', text: 'Dog friendly, great playlist, will be back.' },
];
const VOICE = 'Friendly, local, sign off as "Jules, owner". Thank them by first name, mention one specific detail, keep it under 60 words, no emojis.';

export default {
  id: 'reputation',
  maxTokens: 600,
  rules: `You are the AI reputation agent for Juniper Café, a brunch café in Fitzroy, Melbourne. The user is the owner, Jules.
- list_reviews first. Voice: ${VOICE}
- Replies: specific, warm, never defensive, never share personal or order details, never offer discounts, refunds or freebies in public (invite them to email hello@junipercafe.example instead).
- 4–5 star replies post straight away; 1–3 star replies go to the owner for approval. Say which is which.
- A review that breaks platform rules (fake, spam, competitor promotion, abuse) gets report_review instead of a reply.
- request_reviews asks ALL of last week's customers; never only the happy ones (review gating breaks Google's rules).
- Keep chat short.`,
  facts(state) {
    return `Handled: ${Object.entries(state.done).map(([k, v]) => `${k} ${v}`).join(', ') || 'none'}. Review requests sent: ${state.requests ? 'yes' : 'no'}.`;
  },
  tools: [
    {
      name: 'list_reviews',
      description: 'New Google reviews with stars and status.',
      parameters: { type: 'object', properties: {} },
      run(_, s) {
        s.listed = true;
        return { result: REVIEWS.map((r) => ({ ...r, status: s.done[r.id] ?? 'new' })), label: 'Reviews fetched', detail: `${REVIEWS.length} new · average ${(REVIEWS.reduce((t, r) => t + r.stars, 0) / REVIEWS.length).toFixed(1)}★` };
      },
    },
    {
      name: 'reply_review',
      description: 'Posts a reply (4–5★) or sends it for approval (1–3★). Checked for incentives, personal data and length.',
      parameters: { type: 'object', properties: { review_id: { type: 'string' }, text: { type: 'string' } }, required: ['review_id', 'text'] },
      run(a, s) {
        const r = REVIEWS.find((x) => x.id === str(a.review_id, 4).toUpperCase());
        if (!r) return { result: { error: 'Unknown review id' }, error: true, label: 'Reply', detail: 'Unknown review' };
        if (s.done[r.id]) return { result: { already: s.done[r.id] }, label: 'Already handled', detail: `${r.id} ${s.done[r.id]}` };
        const t = str(a.text, 800);
        const problems = [];
        if (r.id === 'R4') problems.push('this review promotes a competitor: report it instead');
        if (/refund|discount|voucher|free (coffee|meal|drink)|% off|on the house/i.test(t)) problems.push('no incentives or compensation in public replies');
        if (t.split(/\s+/).length > 70) problems.push('over 60 words');
        if (/\b\d{6,}\b|order #/i.test(t)) problems.push('contains order or personal details');
        if (problems.length) return { result: { error: problems.join('; ') }, error: true, label: 'Reply blocked', detail: problems.join(' · ') };
        if (r.stars <= 3) return { result: { status: 'waiting_for_owner_approval' }, gate: { title: `Reply to ${r.who} (${r.stars}★)`, detail: `“${r.text}”\n\nReply: ${t}` } };
        s.done[r.id] = 'replied';
        return { result: { posted: true }, label: 'Reply posted', detail: `${r.id} ${r.who} (${r.stars}★)`, cards: [{ type: 'draft', title: `Reply to ${r.who} · ${r.stars}★ · posted`, meta: [], body: t }] };
      },
    },
    {
      name: 'report_review',
      description: 'Reports a review that breaks platform rules (spam, fake, competitor promotion, abuse).',
      parameters: { type: 'object', properties: { review_id: { type: 'string' }, reason: { type: 'string' } }, required: ['review_id', 'reason'] },
      run(a, s) {
        const r = REVIEWS.find((x) => x.id === str(a.review_id, 4).toUpperCase());
        if (!r) return { result: { error: 'Unknown review id' }, error: true, label: 'Report', detail: 'Unknown review' };
        if (r.id !== 'R4') return { result: { error: 'This is a genuine customer review: reply to it instead. Negative is not the same as fake.' }, error: true, label: 'Report refused', detail: `${r.id} is a real review` };
        s.done[r.id] = 'reported';
        return { result: { reported: true }, label: 'Reported to Google', detail: `${r.id} · ${str(a.reason, 80)}` };
      },
    },
    {
      name: 'request_reviews',
      description: 'Sends a review request to customers from the last 7 days.',
      parameters: { type: 'object', properties: { audience: { type: 'string', enum: ['all_recent', 'happy_only'] } }, required: ['audience'] },
      run(a, s) {
        if (a.audience === 'happy_only') return { result: { error: 'Review gating is against Google’s rules: ask all recent customers.' }, error: true, label: 'Request blocked', detail: 'Review gating not allowed' };
        s.requests = true;
        return { result: { sent: 184 }, label: 'Review requests sent', detail: '184 customers from the last 7 days (SMS + email)' };
      },
    },
  ],
  init: () => ({ done: {}, requests: false, listed: false }),
  async approve(g, s) {
    s.done[str(g.args.review_id, 4).toUpperCase()] = 'replied';
    return { note: 'Jules approved the reply; it is posted. Confirm in one line.', step: { label: 'Reply posted', detail: `${g.args.review_id} (approved)` } };
  },
  decline(g) {
    return { note: `Jules declined the reply to ${g.args.review_id}. Ask what to change.` };
  },
  complete: (s) => ['R2', 'R5'].some((id) => s.done[id] === 'replied') && Object.keys(s.done).length >= 2,
  doneText: () => 'Reviews answered in your voice, the critical ones approved by the owner',
  board(s) {
    return [{ title: 'Reviews', items: REVIEWS.map((r) => ({ label: `${r.id} · ${'★'.repeat(r.stars)} ${r.who}`, value: s.done[r.id] ?? 'new', status: s.done[r.id] ? 'ok' : r.stars <= 3 ? 'warn' : 'info' })) }, { title: 'Requests', items: [{ label: 'Last week’s customers', value: s.requests ? 'asked (all of them)' : 'not yet', status: s.requests ? 'ok' : 'info' }] }];
  },
};
