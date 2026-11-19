/**
 * Support demo (S7): website chat for Kettle & Pine, a fictional online homeware store. Answers come only from the
 * sample help center (with citations); order actions need the order number and the email on the order. Refunds up to
 * $50 run automatically, larger ones wait for staff approval; handoff to a person at any time. Goal: a cited answer
 * plus one resolved action, or a clean handoff.
 */
import { str, num, code } from './util.js';
import { index } from '../retrieve.js';

const HELP = [
  { id: 'shipping-times', title: 'Delivery times', text: 'Orders ship from our warehouse within 1 business day. Standard delivery takes 3–5 business days in the US and 5–8 to Canada and the UK. Express (1–2 business days, US only) is $14.' },
  { id: 'shipping-costs', title: 'Delivery costs', text: 'Standard delivery is free on US orders over $60, otherwise $6.95. Canada and the UK cost a flat $19. We do not ship to other countries yet.' },
  { id: 'returns', title: 'Returns', text: 'You can return unused items in their original packaging within 30 days of delivery. US returns are free with our prepaid label; international returns are at your cost. Sale items marked "final sale" cannot be returned. Start a return in chat or from your order page.' },
  { id: 'refunds', title: 'Refunds', text: 'Refunds go back to the original payment method within 5–7 business days of the return reaching us, or straight away for damaged or missing items. Delivery fees are refunded only if the item arrived damaged or wrong.' },
  { id: 'damaged', title: 'Damaged or wrong items', text: 'If something arrives damaged or wrong, tell us within 14 days with a photo. We send a free replacement or a full refund, your choice, and you do not need to send the damaged item back.' },
  { id: 'tracking', title: 'Tracking your order', text: 'You get a tracking link by email when your order ships. Our chat can also look up any order with the order number and the email used at checkout.' },
  { id: 'change-cancel', title: 'Changing or cancelling an order', text: 'Orders can be changed or cancelled until they are packed, usually within 1 hour of ordering. After that, you can return the items once they arrive.' },
  { id: 'warranty', title: 'Warranty', text: 'Electricals such as kettles and toasters have a 2-year warranty against faults. Cookware has a lifetime warranty against manufacturing defects, not against wear or misuse.' },
  { id: 'cast-iron', title: 'Caring for cast iron', text: 'Wash cast iron by hand with hot water and a brush, dry it straight away on low heat, and wipe on a thin layer of oil. Never put it in the dishwasher. Light rust can be scrubbed off and re-seasoned.' },
  { id: 'payment', title: 'Payment methods', text: 'We accept Visa, Mastercard, American Express, PayPal, Apple Pay and Google Pay. Klarna lets you split orders over $100 into 4 payments.' },
  { id: 'gift-cards', title: 'Gift cards', text: 'Digital gift cards from $25 to $500 are delivered by email and never expire. They cannot be exchanged for cash.' },
];
const search = index(HELP);

const ORDERS = {
  1042: { email: 'alex@example.com', status: 'delivered', delivered: '3 days ago', items: [{ sku: 'KT-200', name: 'Ember electric kettle, sage', price: 64 }], shipping: 0 },
  1057: { email: 'sam@example.com', status: 'in transit', eta: 'tomorrow', items: [{ sku: 'CI-26', name: 'Cast iron skillet 26 cm', price: 48 }, { sku: 'TW-4', name: 'Linen tea towels, set of 4', price: 22 }], shipping: 0 },
  1063: { email: 'jo@example.com', status: 'processing', placed: '20 minutes ago', items: [{ sku: 'MG-6', name: 'Stoneware mugs, set of 6', price: 42 }], shipping: 6.95 },
};

const verify = (s, a) => {
  const n = String(num(a.order_number) || str(a.order_number, 10).replace(/\D/g, ''));
  const o = ORDERS[n];
  if (!o) return { err: 'No order with that number.' };
  if (str(a.email, 120).toLowerCase() !== o.email) return { err: 'The email does not match this order. Ask the customer to check it; never reveal the email on file.' };
  return { n, o, st: s.orders[n] };
};

export default {
  id: 'support',
  maxTokens: 320,
  rules: `You are the AI support agent for Kettle & Pine, an online homeware store, in the website chat. Be warm, brief and practical: two to four sentences, plain text, no headings.
- Answer policy questions ONLY from search_help results and cite them like [1] right after the sentence that uses them. If the help center does not cover it, say you are not sure and offer a handoff. Never guess a policy, price or date.
- Before any order lookup or action, you need the order number AND the email used at checkout. Never reveal order details or the email on file to someone who has not given both.
- Damaged or wrong item: apologise, then offer a free replacement or a full refund (customer's choice). Refunds over $50 go to a team member for approval: say so, it's quick.
- Returns: create_return gives a prepaid label for US orders.
- Hand off to a person (handoff) when the customer asks, is upset, or the case is outside policy. Write a one-line summary for the team.
- You can't give legal advice, change prices, or promise anything the policies don't say.`,
  facts(state) {
    const acts = state.actions.map((a) => a.text);
    return `Store facts: US-based, ships to the US, Canada and the UK. Help center articles are searchable with search_help. Customer service hours for human agents: Mon–Fri 9:00–18:00 ET.
Actions taken in this chat: ${acts.length ? acts.join('; ') : 'none'}.`;
  },
  tools: [
    {
      name: 'search_help',
      description: 'Searches the help center. Returns numbered articles to cite as [n].',
      parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
      run(a, s, ctx) {
        const hits = search(str(a.query, 200), 3);
        const citations = hits.map((h) => ({ n: (ctx.cite = (ctx.cite ?? 0) + 1), id: h.id, title: h.title, text: h.text, source: 'Help center' }));
        s.answers = (s.answers ?? 0) + (hits.length ? 1 : 0);
        return {
          result: citations.length ? citations.map((c) => ({ n: c.n, title: c.title, text: c.text })) : { found: false, note: 'Nothing in the help center. Say you are not sure and offer a handoff.' },
          label: 'Help center searched',
          detail: citations.length ? citations.map((c) => `[${c.n}] ${c.title}`).join(' · ') : 'No matching article',
          citations,
        };
      },
    },
    {
      name: 'lookup_order',
      description: 'Order status and items. Needs the order number and the checkout email.',
      parameters: { type: 'object', properties: { order_number: { type: 'string' }, email: { type: 'string' } }, required: ['order_number', 'email'] },
      run(a, s) {
        const v = verify(s, a);
        if (v.err) return { result: { error: v.err }, error: true, label: 'Identity check failed', detail: 'Order number and email do not match' };
        const { n, o, st } = v;
        return {
          result: { order: n, status: st?.status ?? o.status, delivered: o.delivered, eta: o.eta, placed: o.placed, items: o.items, refunded: st?.refunded ?? 0 },
          label: 'Order found (identity verified)',
          detail: `#${n} · ${st?.status ?? o.status} · ${o.items.map((i) => i.name).join(', ')}`,
          cards: [{ type: 'order', order: n, status: st?.status ?? o.status, items: o.items, note: o.delivered ? `Delivered ${o.delivered}` : o.eta ? `Arrives ${o.eta}` : `Placed ${o.placed}` }],
        };
      },
    },
    {
      name: 'issue_refund',
      description: 'Refunds an amount on a verified order. Up to $50 is instant; more needs staff approval.',
      parameters: {
        type: 'object',
        properties: { order_number: { type: 'string' }, email: { type: 'string' }, amount: { type: 'number' }, reason: { type: 'string' } },
        required: ['order_number', 'email', 'amount'],
      },
      run(a, s) {
        const v = verify(s, a);
        if (v.err) return { result: { error: v.err }, error: true, label: 'Refund refused', detail: 'Identity not verified' };
        const total = v.o.items.reduce((t, i) => t + i.price, 0) + v.o.shipping;
        const amount = Math.round(num(a.amount) * 100) / 100;
        const already = v.st?.refunded ?? 0;
        if (!(amount > 0) || amount + already > total) return { result: { error: `Amount must be between $0 and the order total of $${total - already} still refundable.` }, error: true, label: 'Refund refused', detail: `Over the order total (tool rule)` };
        if (amount > 50) {
          return {
            result: { status: 'pending_staff_approval', note: 'Refunds over $50 are approved by a team member, usually within minutes.' },
            gate: { title: `Refund $${amount} on order #${v.n}`, detail: `Reason: ${str(a.reason ?? a.reason_text, 120) || 'not given'}. Policy: refunds over $50 need a person.` },
          };
        }
        s.orders[v.n] = { ...(s.orders[v.n] ?? {}), refunded: already + amount };
        s.actions.push({ kind: 'refund', text: `Refunded $${amount} on #${v.n}` });
        return { result: { refunded: amount, arrives: '5–7 business days' }, label: 'Refund issued', detail: `$${amount} on #${v.n}` };
      },
    },
    {
      name: 'create_return',
      description: 'Creates a return and a prepaid label for a verified, delivered order.',
      parameters: { type: 'object', properties: { order_number: { type: 'string' }, email: { type: 'string' }, item: { type: 'string' } }, required: ['order_number', 'email'] },
      run(a, s) {
        const v = verify(s, a);
        if (v.err) return { result: { error: v.err }, error: true, label: 'Return refused', detail: 'Identity not verified' };
        if ((v.st?.status ?? v.o.status) !== 'delivered') return { result: { error: 'Only delivered orders can be returned. Offer a cancellation if it is still processing.' }, error: true, label: 'Return refused', detail: 'Order not delivered yet' };
        const rma = code('RMA', 500 + s.actions.length + 1);
        s.actions.push({ kind: 'return', text: `Return ${rma} for #${v.n}` });
        return { result: { rma, label: 'Prepaid label emailed', refund: 'after the return arrives, 5–7 business days' }, label: 'Return created', detail: `${rma} · prepaid label emailed`, cards: [{ type: 'ticket', title: `Return ${rma}`, lines: [`Order #${v.n}`, 'Prepaid label emailed', 'Refund when it arrives'] }] };
      },
    },
    {
      name: 'cancel_order',
      description: 'Cancels a verified order that is still processing.',
      parameters: { type: 'object', properties: { order_number: { type: 'string' }, email: { type: 'string' } }, required: ['order_number', 'email'] },
      run(a, s) {
        const v = verify(s, a);
        if (v.err) return { result: { error: v.err }, error: true, label: 'Cancel refused', detail: 'Identity not verified' };
        if ((v.st?.status ?? v.o.status) !== 'processing') return { result: { error: 'Already shipped: it can be returned after delivery.' }, error: true, label: 'Cancel refused', detail: 'Already shipped (tool rule)' };
        s.orders[v.n] = { ...(s.orders[v.n] ?? {}), status: 'cancelled' };
        s.actions.push({ kind: 'cancel', text: `Cancelled #${v.n}` });
        return { result: { cancelled: true, refund: 'full, to the original payment method' }, label: 'Order cancelled', detail: `#${v.n} · full refund queued` };
      },
    },
    {
      name: 'handoff',
      description: 'Passes the chat to a human agent with a one-line summary.',
      parameters: { type: 'object', properties: { summary: { type: 'string' }, priority: { type: 'string', enum: ['normal', 'high'] } }, required: ['summary'] },
      run(a, s) {
        const t = code('TCK', 800 + s.actions.length + 1);
        s.actions.push({ kind: 'handoff', text: `Ticket ${t} to the team` });
        return { result: { ticket: t, wait: 'a person replies here or by email within 2 business hours' }, label: 'Handed to a person', detail: `${t} · ${str(a.summary, 140)}`, cards: [{ type: 'ticket', title: `Ticket ${t}`, lines: [str(a.summary, 140), `Priority: ${a.priority === 'high' ? 'high' : 'normal'}`, 'Full chat attached'] }] };
      },
    },
  ],
  init: () => ({ orders: {}, actions: [], answers: 0 }),
  async approve(g, s) {
    const n = String(num(g.args.order_number) || str(g.args.order_number, 10).replace(/\D/g, ''));
    const amount = Math.round(num(g.args.amount) * 100) / 100;
    s.orders[n] = { ...(s.orders[n] ?? {}), refunded: (s.orders[n]?.refunded ?? 0) + amount };
    s.actions.push({ kind: 'refund', text: `Refunded $${amount} on #${n} (approved)` });
    return { note: `A team member approved the $${amount} refund on order #${n}. Tell the customer it is done and arrives in 5–7 business days.`, step: { label: 'Refund issued', detail: `$${amount} on #${n}` } };
  },
  decline(g) {
    return { note: `A team member declined the refund of $${g.args.amount} on order #${g.args.order_number} for now and will email the customer. Tell the customer kindly, and offer a replacement or a handoff.` };
  },
  complete: (s) => s.actions.length > 0 || s.answers >= 2,
  doneText: (s) => (s.actions.length ? s.actions.at(-1).text : 'Two questions answered from the help center, with sources'),
};
