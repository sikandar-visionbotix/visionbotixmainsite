/**
 * Ops demo (S7b): order-to-invoice at Brightline Print Co., a fictional print shop. The inbox holds sample emails; the
 * agent runs the workflow step by step: read the email, match the customer in the CRM, price the job from the price
 * list (code, not the model), create the invoice, log it in the orders sheet, notify the team, and email the customer
 * only after approval (anything that leaves the company is gated). Goal: one order processed end to end.
 */
import { str, num, code } from './util.js';

const PRICES = { 'business cards': { unit: 'box of 250', price: 24 }, flyers: { unit: 'pack of 500 (A5)', price: 68 }, posters: { unit: 'A2 poster', price: 9.5 }, banners: { unit: 'roll-up banner', price: 95 } };
const CRM = { 'harbour yoga': { name: 'Harbour Yoga Studio', email: 'accounts@harbouryoga.example', terms: '14 days', tier: 'regular' }, 'kiln coffee': { name: 'Kiln Coffee Roasters', email: 'ops@kilncoffee.example', terms: 'pay on order', tier: 'new' } };
const INBOX = [
  { id: 'E1', from: 'Harbour Yoga Studio <accounts@harbouryoga.example>', subject: 'Order for the spring open day', body: 'Hi! Could we get 2 boxes of business cards for our new teacher and 1 pack of A5 flyers (same design as last time)? Delivery by Friday please. Thanks, Nina' },
  { id: 'E2', from: 'Kiln Coffee Roasters <ops@kilncoffee.example>', subject: 'Posters + banner', body: 'Hello, we need 20 A2 posters and 1 roll-up banner for a market stall next week. Can you invoice us? Leo' },
  { id: 'E3', from: 'Paper Mill Supplies <billing@papermill.example>', subject: 'Invoice PM-8812 for paper stock', body: 'Please find attached our invoice PM-8812 for £1,240.00, due in 30 days.' },
];
const STEPS = ['Read email', 'Match customer', 'Price the job', 'Create invoice', 'Log in sheet', 'Notify team', 'Email customer'];

export default {
  id: 'ops',
  maxTokens: 600,
  maxRounds: 7, // a full order-to-invoice run is 6–7 tool calls
  rules: `You are the AI operations agent at Brightline Print Co., a small print shop. You run the order-to-invoice workflow for the operations manager (the user).
- Steps for a customer order email: read_email → find_customer → create_invoice (items from the price list; prices are applied by the tool) → log_order → notify_team → email_customer. Call email_customer right after notify_team in the same run: the manager gets an approval card.
- Supplier invoices (bills we must pay) are NOT orders: don't invoice them; use notify_team to send them to finance.
- Use only data from the tools. If an item isn't on the price list, ask or notify the team for a manual quote.
- After each step, say in one short line what you did. Keep going through the steps unless something needs the user.`,
  facts(state) {
    return `Price list: ${Object.entries(PRICES).map(([k, v]) => `${k} £${v.price} per ${v.unit}`).join('; ')}. Workflow runs: ${Object.entries(state.runs).map(([k, v]) => `${k}: ${v.steps.join(' → ')}`).join(' | ') || 'none'}.`;
  },
  tools: [
    {
      name: 'read_inbox',
      description: 'New emails in the orders inbox.',
      parameters: { type: 'object', properties: {} },
      run() {
        return { result: INBOX.map(({ id, from, subject }) => ({ id, from, subject })), label: 'Inbox read', detail: `${INBOX.length} new emails` };
      },
    },
    {
      name: 'read_email',
      description: 'Full text of one email.',
      parameters: { type: 'object', properties: { email_id: { type: 'string' } }, required: ['email_id'] },
      run(a, s) {
        const e = INBOX.find((x) => x.id === str(a.email_id, 4).toUpperCase());
        if (!e) return { result: { error: 'Unknown email' }, error: true, label: 'Email', detail: 'Unknown email' };
        step(s, e.id, 'Read email');
        return { result: e, label: 'Email read', detail: `${e.id} · ${e.subject}` };
      },
    },
    {
      name: 'find_customer',
      description: 'Looks up a customer in the CRM.',
      parameters: { type: 'object', properties: { email_id: { type: 'string' }, name: { type: 'string' } }, required: ['email_id', 'name'] },
      run(a, s) {
        const key = Object.keys(CRM).find((k) => str(a.name, 80).toLowerCase().includes(k));
        if (!key) return { result: { error: 'Not a customer in the CRM' }, error: true, label: 'CRM', detail: `No customer "${str(a.name, 40)}"` };
        step(s, str(a.email_id, 4).toUpperCase(), 'Match customer');
        return { result: CRM[key], label: 'Customer matched (CRM)', detail: `${CRM[key].name} · terms ${CRM[key].terms} · ${CRM[key].tier}` };
      },
    },
    {
      name: 'create_invoice',
      description: 'Creates a draft invoice; the tool applies price-list prices and VAT.',
      parameters: {
        type: 'object',
        properties: { email_id: { type: 'string' }, customer: { type: 'string' }, items: { type: 'array', items: { type: 'object', properties: { product: { type: 'string' }, quantity: { type: 'number' } }, required: ['product', 'quantity'] } } },
        required: ['email_id', 'customer', 'items'],
      },
      run(a, s) {
        const id = str(a.email_id, 4).toUpperCase();
        if (id === 'E3') return { result: { error: 'E3 is a supplier bill, not a customer order. Send it to finance with notify_team.' }, error: true, label: 'Invoice refused', detail: 'Supplier bill, not an order (tool rule)' };
        const lines = [];
        const unknown = [];
        for (const it of Array.isArray(a.items) ? a.items.slice(0, 8) : []) {
          const key = Object.keys(PRICES).find((k) => str(it?.product, 60).toLowerCase().includes(k.replace(/s$/, '')));
          const q = Math.max(1, Math.round(num(it?.quantity)) || 1);
          if (!key) unknown.push(str(it?.product, 40));
          else lines.push({ item: `${PRICES[key].unit} ${key}`, qty: q, unit: PRICES[key].price, total: +(q * PRICES[key].price).toFixed(2) });
        }
        if (unknown.length) return { result: { error: `Not on the price list: ${unknown.join(', ')}. Ask for a manual quote.` }, error: true, label: 'Invoice refused', detail: `Unknown item(s): ${unknown.join(', ')}` };
        const sub = +lines.reduce((t, l) => t + l.total, 0).toFixed(2);
        const inv = { no: code('BL', 7000 + Object.keys(s.runs).length + 1), customer: str(a.customer, 80), lines, subtotal: sub, vat: +(sub * 0.2).toFixed(2), total: +(sub * 1.2).toFixed(2) };
        s.runs[id] = { ...(s.runs[id] ?? { steps: [] }), invoice: inv };
        step(s, id, 'Price the job');
        step(s, id, 'Create invoice');
        return { result: inv, label: 'Invoice drafted', detail: `${inv.no} · £${inv.total} incl. VAT`, cards: [{ type: 'table', title: `Invoice ${inv.no} · ${inv.customer}`, columns: ['Item', 'Qty', 'Unit £', 'Total £'], rows: [...lines.map((l) => [l.item, l.qty, l.unit, l.total]), ['VAT 20%', '', '', inv.vat], ['Total', '', '', inv.total]] }] };
      },
    },
    {
      name: 'log_order',
      description: 'Adds the order to the orders sheet.',
      parameters: { type: 'object', properties: { email_id: { type: 'string' }, due: { type: 'string' } }, required: ['email_id'] },
      run(a, s) {
        const id = str(a.email_id, 4).toUpperCase();
        const r = s.runs[id];
        if (!r?.invoice) return { result: { error: 'Create the invoice first' }, error: true, label: 'Sheet', detail: 'No invoice yet' };
        step(s, id, 'Log in sheet');
        return { result: { row_added: true }, label: 'Logged in the orders sheet', detail: `${r.invoice.no} · due ${str(a.due, 30) || 'as agreed'}` };
      },
    },
    {
      name: 'notify_team',
      description: 'Posts a message to the team channel (production or finance).',
      parameters: { type: 'object', properties: { email_id: { type: 'string' }, channel: { type: 'string', enum: ['production', 'finance'] }, message: { type: 'string' } }, required: ['channel', 'message'] },
      run(a, s) {
        const id = str(a.email_id, 4).toUpperCase();
        if (id) step(s, id, 'Notify team');
        if (id === 'E3') s.bill = true;
        return { result: { posted: true }, label: `Team notified (#${a.channel === 'finance' ? 'finance' : 'production'})`, detail: str(a.message, 140) };
      },
    },
    {
      name: 'email_customer',
      description: 'Emails the invoice to the customer. Anything leaving the company needs approval.',
      parameters: { type: 'object', properties: { email_id: { type: 'string' }, message: { type: 'string' } }, required: ['email_id', 'message'] },
      run(a, s) {
        const id = str(a.email_id, 4).toUpperCase();
        const r = s.runs[id];
        if (!r?.invoice) return { result: { error: 'Create the invoice first' }, error: true, label: 'Email', detail: 'No invoice' };
        if (r.steps.includes('Email customer')) return { result: { already_sent: true }, label: 'Already emailed', detail: r.invoice.no };
        return { result: { status: 'waiting_for_approval' }, gate: { title: `Email invoice ${r.invoice.no} (£${r.invoice.total}) to ${r.invoice.customer}`, detail: str(a.message, 600) } };
      },
    },
  ],
  init: () => ({ runs: {}, bill: false }),
  async approve(g, s) {
    const id = str(g.args.email_id, 4).toUpperCase();
    step(s, id, 'Email customer');
    return { note: 'The operations manager approved: the invoice email is sent. Confirm in one line and summarise the run.', step: { label: 'Invoice emailed', detail: `${s.runs[id].invoice.no} sent` } };
  },
  decline() {
    return { note: 'The operations manager held the email. Ask what to change.' };
  },
  complete: (s) => Object.values(s.runs).some((r) => r.steps.includes('Email customer')),
  doneText: () => 'Order email → CRM → priced invoice → sheet → team → customer, approved',
  board(s) {
    const ids = Object.keys(s.runs);
    return [
      ...ids.map((id) => ({ title: `Run · ${id} ${s.runs[id].invoice ? `(${s.runs[id].invoice.no})` : ''}`, items: STEPS.map((st) => ({ label: st, value: s.runs[id].steps.includes(st) ? 'done' : 'waiting', status: s.runs[id].steps.includes(st) ? 'ok' : 'info' })) })),
      { title: 'Inbox', items: INBOX.map((e) => ({ label: `${e.id} · ${e.subject}`, value: s.runs[e.id] ? 'in progress' : e.id === 'E3' && s.bill ? 'sent to finance' : 'new', status: s.runs[e.id] || (e.id === 'E3' && s.bill) ? 'ok' : 'info' })) },
    ];
  },
};

function step(s, id, name) {
  if (!id) return;
  s.runs[id] ??= { steps: [] };
  if (!s.runs[id].steps.includes(name)) s.runs[id].steps.push(name);
}
