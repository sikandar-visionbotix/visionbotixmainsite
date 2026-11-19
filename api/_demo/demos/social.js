/**
 * Social Media demo (S7b): Basil & Brick, a fictional pizzeria in Manchester. The visitor is the owner. The agent turns
 * a brief into a week of posts (checked against platform limits and the menu), which publish only after approval, and
 * handles sample comments: answers questions, hides spam, and drafts complaint replies for approval.
 * Goal: a week approved for publishing, or comments handled.
 */
import { str } from './util.js';

const MENU = 'Margherita £10, Nduja & honey £13, Wild mushroom & truffle £14, Vegan garden £12, gluten-free base +£2 (separate prep area, but the kitchen handles flour, so not for coeliacs), tiramisu £6';
const CONTEXT = {
  this_week: ['Thursday: new Wild mushroom & truffle pizza launches', 'Saturday: Manchester derby (busy delivery night)', 'Sunday: kids eat free 12–4pm (one per adult main)'],
  best_posts: ['Behind-the-scenes dough stretching reels (3x average reach)', 'Polls about toppings', 'Photos posted 5–6pm'],
  voice: 'Warm, a bit cheeky, local Manchester slang in moderation, no more than 2 emojis per post',
  platforms: 'Instagram (max 2,200 characters, up to 5 hashtags) and X (max 280 characters)',
};
const COMMENTS = [
  { id: 'C1', on: 'Instagram', from: '@mancfoodie', text: 'Best margherita in the Northern Quarter, no contest 🔥', kind: 'praise' },
  { id: 'C2', on: 'Instagram', from: '@lucy_k', text: 'Do you do gluten free? My daughter is coeliac.', kind: 'question' },
  { id: 'C3', on: 'X', from: '@jbrennan', text: 'Ordered at 7, pizza turned up cold at 8:40. Not impressed.', kind: 'complaint' },
  { id: 'C4', on: 'Instagram', from: '@crypto_gains_4u', text: 'DM me to 10x your money!!! 💰💰', kind: 'spam' },
];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default {
  id: 'social',
  maxTokens: 900,
  rules: `You are the AI social media manager for Basil & Brick, an independent pizzeria in Manchester. The user is the owner.
- Call get_week_context first when planning. Write posts in the brand voice, only about real menu items, prices and events from the tools/facts. No health or allergy promises.
- plan_week saves up to 7 posts (day, platform Instagram or X, text, hashtags). The tool checks length and hashtags; fix and retry if it rejects. Then summarise the week in 2–3 lines, don't paste every post.
- Publishing always needs the owner's approval: once plan_week passes, call publish_week straight away (the owner sees an approval card).
- If a tool rejects your input, fix exactly what it says and call it again.
- Comments: get_comments, then reply_comment for praise and questions, hide_comment for spam, and for complaints draft an apology reply (it goes to the owner for approval). Never offer refunds or freebies yourself.
- Be brief in chat.
Menu: ${MENU}.`,
  facts(state) {
    return `Posts planned: ${state.posts.length}. Published: ${state.published ? 'yes' : 'no'}. Comments handled: ${Object.keys(state.handled).join(', ') || 'none'}.`;
  },
  tools: [
    {
      name: 'get_week_context',
      description: 'This week’s events, best-performing post types, brand voice and platform limits.',
      parameters: { type: 'object', properties: {} },
      run(_, s) {
        s.context = true;
        return { result: CONTEXT, label: 'Week context loaded', detail: CONTEXT.this_week.join(' · ') };
      },
    },
    {
      name: 'plan_week',
      description: 'Saves the week’s posts. Rejected if a post breaks platform limits.',
      parameters: {
        type: 'object',
        properties: {
          posts: {
            type: 'array',
            items: { type: 'object', properties: { day: { type: 'string' }, platform: { type: 'string', enum: ['Instagram', 'X'] }, text: { type: 'string' }, hashtags: { type: 'array', items: { type: 'string' } } }, required: ['day', 'platform', 'text'] },
          },
        },
        required: ['posts'],
      },
      run(a, s) {
        const posts = (Array.isArray(a.posts) ? a.posts : []).slice(0, 7).map((p) => ({
          day: DAYS.find((d) => str(p?.day, 12).toLowerCase().startsWith(d.toLowerCase())) ?? 'Mon',
          platform: p?.platform === 'X' ? 'X' : 'Instagram',
          text: str(p?.text, 2400),
          tags: (Array.isArray(p?.hashtags) ? p.hashtags : []).map((t) => `#${str(t, 40).replace(/^#/, '').replace(/\s+/g, '')}`).slice(0, 10),
        }));
        const problems = [];
        posts.forEach((p, i) => {
          const len = `${p.text} ${p.tags.join(' ')}`.length;
          if (p.platform === 'X' && len > 280) problems.push(`post ${i + 1} (X) is ${len} characters, max 280`);
          if (p.platform === 'Instagram' && p.tags.length > 5) problems.push(`post ${i + 1} has ${p.tags.length} hashtags, max 5`);
          if ((p.text.match(/\p{Extended_Pictographic}/gu) ?? []).length > 2) problems.push(`post ${i + 1} has more than 2 emojis`);
          if (/gluten[- ]free.*(safe|coeliac|celiac)|(safe|suitable) for coeliacs/i.test(p.text)) problems.push(`post ${i + 1} makes an allergy promise`);
        });
        if (!posts.length) problems.push('no posts');
        if (problems.length) return { result: { error: `Rejected: ${problems.join('; ')}` }, error: true, label: 'Plan rejected', detail: problems.join(' · ') };
        s.posts = posts;
        s.published = false;
        return {
          result: { saved: posts.length },
          label: 'Week planned (checks passed)',
          detail: posts.map((p) => `${p.day} ${p.platform}`).join(' · '),
          cards: posts.slice(0, 7).map((p) => ({ type: 'draft', title: `${p.day} · ${p.platform}`, meta: [], body: `${p.text}${p.tags.length ? `\n${p.tags.join(' ')}` : ''}` })),
        };
      },
    },
    {
      name: 'publish_week',
      description: 'Schedules the planned posts. Needs the owner’s approval.',
      parameters: { type: 'object', properties: {} },
      run(_, s) {
        if (!s.posts.length) return { result: { error: 'Plan the week first' }, error: true, label: 'Not published', detail: 'No plan' };
        if (s.published) return { result: { already_scheduled: true }, label: 'Already scheduled', detail: `${s.posts.length} posts` };
        return { result: { status: 'waiting_for_owner_approval' }, gate: { title: `Schedule ${s.posts.length} posts for this week`, detail: s.posts.map((p) => `${p.day} · ${p.platform}: ${p.text.slice(0, 70)}${p.text.length > 70 ? '…' : ''}`).join('\n') } };
      },
    },
    {
      name: 'get_comments',
      description: 'New comments on Instagram and X.',
      parameters: { type: 'object', properties: {} },
      run(_, s) {
        return { result: COMMENTS.map((c) => ({ ...c, handled: s.handled[c.id] ?? null })), label: 'Comments fetched', detail: `${COMMENTS.length} new · 1 complaint · 1 likely spam` };
      },
    },
    {
      name: 'reply_comment',
      description: 'Replies to a comment. Complaint replies wait for the owner.',
      parameters: { type: 'object', properties: { comment_id: { type: 'string' }, text: { type: 'string' } }, required: ['comment_id', 'text'] },
      run(a, s) {
        const c = COMMENTS.find((x) => x.id === str(a.comment_id, 4).toUpperCase());
        if (!c) return { result: { error: 'Unknown comment id' }, error: true, label: 'Reply', detail: 'Unknown comment' };
        const text = str(a.text, 600);
        if (/refund|free (pizza|meal)|voucher|discount/i.test(text)) return { result: { error: 'Offers of refunds, freebies or discounts are for the owner to make. Remove it.' }, error: true, label: 'Reply blocked', detail: 'Offered compensation (owner only)' };
        if (c.kind === 'spam') return { result: { error: 'This is spam: hide it instead of replying.' }, error: true, label: 'Reply blocked', detail: 'Spam comment' };
        if (c.kind === 'complaint') return { result: { status: 'waiting_for_owner_approval' }, gate: { title: `Reply to ${c.from}'s complaint`, detail: `“${c.text}”\n\nDraft reply: ${text}` } };
        s.handled[c.id] = 'replied';
        return { result: { posted: true }, label: 'Reply posted', detail: `${c.id} ${c.from}: ${text.slice(0, 90)}` };
      },
    },
    {
      name: 'hide_comment',
      description: 'Hides spam or abuse and reports it to the platform.',
      parameters: { type: 'object', properties: { comment_id: { type: 'string' } }, required: ['comment_id'] },
      run(a, s) {
        const c = COMMENTS.find((x) => x.id === str(a.comment_id, 4).toUpperCase());
        if (!c) return { result: { error: 'Unknown comment id' }, error: true, label: 'Hide', detail: 'Unknown comment' };
        if (c.kind !== 'spam') return { result: { error: 'Only spam or abuse is hidden. Reply to real customers instead.' }, error: true, label: 'Hide refused', detail: `${c.id} is a real customer` };
        s.handled[c.id] = 'hidden';
        return { result: { hidden: true }, label: 'Spam hidden', detail: `${c.id} ${c.from}` };
      },
    },
  ],
  init: () => ({ posts: [], published: false, handled: {}, context: false }),
  async approve(g, s) {
    if (g.tool === 'publish_week') {
      s.published = true;
      return { note: 'The owner approved the week: all posts are scheduled at 5–6pm. Confirm briefly.', step: { label: 'Week scheduled', detail: `${s.posts.length} posts queued` } };
    }
    s.handled[str(g.args.comment_id, 4).toUpperCase()] = 'replied';
    return { note: 'The owner approved the complaint reply; it is posted. Confirm briefly.', step: { label: 'Complaint reply posted', detail: g.args.comment_id } };
  },
  decline(g) {
    return { note: g.tool === 'publish_week' ? 'The owner declined the plan. Ask what to change.' : 'The owner declined that complaint reply. Ask how they want to respond.' };
  },
  complete: (s) => s.published || Object.keys(s.handled).length >= 3,
  doneText: (s) => (s.published ? `A week of ${s.posts.length} posts planned, checked and approved` : 'Comments answered, spam hidden, complaint reply approved'),
  board(s) {
    return [
      { title: 'This week', items: s.posts.length ? s.posts.map((p) => ({ label: `${p.day} · ${p.platform}`, value: p.text.slice(0, 60) + (p.text.length > 60 ? '…' : ''), status: s.published ? 'ok' : 'info' })) : [{ label: 'No posts yet', value: 'give the agent a brief' }] },
      { title: 'Comments', items: COMMENTS.map((c) => ({ label: `${c.id} ${c.from}`, value: s.handled[c.id] ?? c.kind, status: s.handled[c.id] ? 'ok' : c.kind === 'complaint' || c.kind === 'spam' ? 'warn' : 'info' })) },
    ];
  },
};
