/**
 * WhatsApp demo (S7): a WhatsApp-style thread with Oud & Linen, a fictional Dubai boutique. Product Q&A from the
 * catalog (product cards), live order status, abandoned-cart recovery with a checkout link, discounts above 10% only
 * with a manager's approval, replies in the customer's language. Goal: a checkout link sent or an order status shared.
 */
import { str, num, code } from './util.js';
import { index } from '../retrieve.js';

const PRODUCTS = [
  { id: 'P01', name: 'Linen kaftan', colours: ['sand', 'olive', 'white'], sizes: ['S', 'M', 'L', 'XL'], price: 340, tags: 'dress kaftan linen summer women loose', stock: { M: 2, L: 0 } },
  { id: 'P02', name: 'Classic black abaya', colours: ['black'], sizes: ['52', '54', '56', '58', '60'], price: 420, tags: 'abaya black women modest crepe', stock: {} },
  { id: 'P03', name: 'Open abaya with embroidered cuffs', colours: ['black', 'navy'], sizes: ['54', '56', '58'], price: 560, tags: 'abaya embroidered occasion women eid', stock: { 58: 0 } },
  { id: 'P04', name: 'Men’s linen shirt', colours: ['white', 'sky', 'stone'], sizes: ['S', 'M', 'L', 'XL', 'XXL'], price: 190, tags: 'shirt men linen summer', stock: {} },
  { id: 'P05', name: 'Kandura, premium cotton', colours: ['white', 'cream'], sizes: ['52', '54', '56', '58', '60', '62'], price: 380, tags: 'kandura men cotton dishdasha', stock: {} },
  { id: 'P06', name: 'Silk shayla', colours: ['black', 'rose', 'champagne'], sizes: ['one size'], price: 150, tags: 'shayla scarf hijab silk women', stock: {} },
  { id: 'P07', name: 'Oud Royale eau de parfum 100 ml', colours: [], sizes: ['100 ml'], price: 495, tags: 'perfume oud fragrance gift unisex woody', stock: {} },
  { id: 'P08', name: 'Rose & Amber eau de parfum 50 ml', colours: [], sizes: ['50 ml'], price: 260, tags: 'perfume rose amber fragrance women gift', stock: {} },
  { id: 'P09', name: 'Bakhoor gift set', colours: [], sizes: ['set'], price: 180, tags: 'bakhoor incense gift home oud', stock: {} },
  { id: 'P10', name: 'Linen wide-leg trousers', colours: ['sand', 'black'], sizes: ['S', 'M', 'L'], price: 220, tags: 'trousers pants linen women summer', stock: { S: 1 } },
];
const search = index(PRODUCTS.map((p) => ({ ...p, title: p.name, text: `${p.tags} ${p.colours.join(' ')}` })));
const ORDERS = {
  'OL-2231': { status: 'Out for delivery', detail: 'Today between 4 pm and 6 pm, Dubai Marina. The driver calls 30 minutes before.', items: 'Oud Royale 100 ml' },
  'OL-2198': { status: 'Delivered', detail: 'Delivered 9 days ago, signed by the customer.', items: 'Classic black abaya, size 56' },
};
const card = (p) => ({ type: 'product', id: p.id, name: p.name, price: `AED ${p.price}`, options: [p.colours.join(' · '), p.sizes.join(' · ')].filter(Boolean).join(' | ') });
const inStock = (p, size) => (p.stock[size] ?? 5) > 0;

export default {
  id: 'whatsapp',
  maxTokens: 260,
  rules: `You are the WhatsApp assistant of Oud & Linen, a fashion and fragrance boutique in Dubai. You chat on WhatsApp: short, friendly messages (one to three lines), a light emoji now and then is fine, no markdown headings, no links except a checkout link from the tool.
- Always reply in the customer's language: English, Arabic, Urdu or Roman Urdu.
- Products, prices, sizes and stock come only from search_products and check_stock. Never invent a product, colour, size or price. Prices are in AED.
- Order status only from order_status. This chat's WhatsApp number is verified, so its orders can be shared.
- The customer left a Linen kaftan (sand, size M) in their basket yesterday. If it fits the conversation, help them complete it with create_checkout_link.
- Discounts: you may give up to 10% (code COMEBACK10) with offer_discount. If the customer asks for MORE than 10%, call offer_discount with exactly the percent they asked for (the tool sends it to the manager for approval) and tell them you're checking. Never apply a smaller discount instead without asking.
- Hand off to a person (handoff) for complaints, custom tailoring or anything you can't answer.
Store policies: free delivery in the UAE over AED 200, otherwise AED 20. Same-day delivery in Dubai for orders before 2 pm. Cash on delivery available (AED 10). Returns within 14 days, unworn with tags; perfume only if sealed. Showroom: Jumeirah (fictional), 10 am to 10 pm daily.`,
  facts(state) {
    return `Sandbox: customer WhatsApp +971 50 000 0000 (sandbox). Basket: ${state.cart.map((c) => `${c.name} ${c.colour} ${c.size}`).join(', ') || 'empty'}. Discount given: ${state.discount ? `${state.discount}%` : 'none'}. Checkout links sent: ${state.links}.`;
  },
  tools: [
    {
      name: 'search_products',
      description: 'Searches the catalog (query in English; translate if needed). Shows product cards to the customer.',
      parameters: { type: 'object', properties: { query: { type: 'string' }, max_price: { type: 'number', description: 'AED' } }, required: ['query'] },
      run(a) {
        const max = num(a.max_price);
        const hits = search(str(a.query, 120), 6)
          .map((h) => PRODUCTS.find((p) => p.id === h.id))
          .filter((p) => p && (!(max > 0) || p.price <= max))
          .slice(0, 3);
        return {
          result: hits.length ? hits.map((p) => ({ id: p.id, name: p.name, price_aed: p.price, colours: p.colours, sizes: p.sizes })) : { found: false },
          label: 'Catalog searched',
          detail: hits.length ? hits.map((p) => `${p.name} (AED ${p.price})`).join(' · ') : 'No match',
          cards: hits.map(card),
        };
      },
    },
    {
      name: 'check_stock',
      description: 'Stock for one product in a size.',
      parameters: { type: 'object', properties: { product_id: { type: 'string' }, size: { type: 'string' } }, required: ['product_id', 'size'] },
      run(a) {
        const p = PRODUCTS.find((x) => x.id === str(a.product_id, 5).toUpperCase());
        if (!p) return { result: { error: 'Unknown product id' }, error: true, label: 'Stock check failed', detail: 'Unknown product' };
        const size = str(a.size, 10).toUpperCase();
        if (!p.sizes.map((s) => s.toUpperCase()).includes(size)) return { result: { error: `Sizes: ${p.sizes.join(', ')}` }, label: 'Stock checked', detail: `${p.name}: no size ${size}` };
        const n = p.stock[size] ?? 5;
        return { result: { product: p.name, size, in_stock: n > 0, only_left: n > 0 && n < 3 ? n : undefined }, label: 'Stock checked', detail: `${p.name} ${size}: ${n > 0 ? `${n < 3 ? `only ${n} left` : 'in stock'}` : 'sold out'}` };
      },
    },
    {
      name: 'order_status',
      description: 'Live status of an order on this WhatsApp number.',
      parameters: { type: 'object', properties: { order_id: { type: 'string' } } },
      run(a, s) {
        const id = str(a.order_id, 12).toUpperCase().replace(/^(\d)/, 'OL-$1').replace(/^OL(\d)/, 'OL-$1');
        const o = ORDERS[id];
        if (!o) return { result: { orders_on_this_number: Object.keys(ORDERS), error: id ? 'Not an order on this number' : 'Which order?' }, label: 'Orders listed', detail: Object.keys(ORDERS).join(', ') };
        s.statusShared = true;
        return { result: { order: id, ...o }, label: 'Order status', detail: `${id}: ${o.status}`, cards: [{ type: 'order', order: id, status: o.status, items: [{ name: o.items }], note: o.detail }] };
      },
    },
    {
      name: 'create_checkout_link',
      description: 'Creates a secure checkout link for items (product id, size, colour, qty).',
      parameters: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: { type: 'object', properties: { product_id: { type: 'string' }, size: { type: 'string' }, colour: { type: 'string' }, qty: { type: 'number' } }, required: ['product_id'] },
          },
        },
        required: ['items'],
      },
      run(a, s) {
        const items = (Array.isArray(a.items) ? a.items : []).slice(0, 5).flatMap((i) => {
          const p = PRODUCTS.find((x) => x.id === str(i?.product_id, 5).toUpperCase());
          if (!p) return [];
          const size = str(i.size, 10) || p.sizes[0];
          return [{ p, size, colour: str(i.colour, 20) || p.colours[0] || '', qty: Math.min(5, Math.max(1, Math.round(num(i.qty)) || 1)) }];
        });
        if (!items.length) return { result: { error: 'No valid product ids' }, error: true, label: 'Checkout refused', detail: 'No valid items' };
        const sold = items.find((i) => !inStock(i.p, i.size.toUpperCase()));
        if (sold) return { result: { error: `${sold.p.name} size ${sold.size} is sold out` }, error: true, label: 'Checkout refused', detail: 'Item sold out (tool rule)' };
        const sub = items.reduce((t, i) => t + i.p.price * i.qty, 0);
        const off = Math.round((sub * (s.discount ?? 0)) / 100);
        const delivery = sub - off >= 200 ? 0 : 20;
        s.links += 1;
        const ref = code('CHK', 400 + s.links);
        return {
          result: { link: `checkout link ${ref} (sandbox)`, subtotal: sub, discount: off, delivery, total: sub - off + delivery, currency: 'AED' },
          label: 'Checkout link created',
          detail: `${ref} · AED ${sub - off + delivery}`,
          cards: [{ type: 'checkout', ref, lines: items.map((i) => `${i.qty} × ${i.p.name}${i.colour ? `, ${i.colour}` : ''}, ${i.size}`), total: `AED ${sub - off + delivery}`, note: [off ? `${s.discount}% off applied` : '', delivery ? 'Delivery AED 20' : 'Free delivery'].filter(Boolean).join(' · ') }],
        };
      },
    },
    {
      name: 'offer_discount',
      description: 'Gives a discount on the basket. Up to 10% is instant; more needs the manager.',
      parameters: { type: 'object', properties: { percent: { type: 'number' } }, required: ['percent'] },
      run(a, s) {
        const pct = Math.round(num(a.percent));
        if (!(pct > 0) || pct > 50) return { result: { error: 'Percent must be 1 to 50' }, error: true, label: 'Discount refused', detail: 'Out of range' };
        if (pct <= (s.discount ?? 0)) return { result: { already_applied: true, percent: s.discount, note: 'This discount is already applied to the basket. Do not ask again.' }, label: 'Discount already applied', detail: `${s.discount}%` };
        if (pct > 10) return { result: { status: 'pending_manager_approval' }, gate: { title: `${pct}% discount for this customer`, detail: 'Store rule: the agent may give up to 10%. Anything above needs the manager.' } };
        s.discount = pct;
        return { result: { code: 'COMEBACK10', percent: pct }, label: 'Discount applied', detail: `${pct}% (code COMEBACK10)` };
      },
    },
    {
      name: 'handoff',
      description: 'Moves the chat to the team inbox with a summary.',
      parameters: { type: 'object', properties: { summary: { type: 'string' } }, required: ['summary'] },
      run(a, s) {
        s.handoff = true;
        return { result: { done: true, reply_time: 'within 15 minutes, 10 am to 10 pm' }, label: 'Handed to the team inbox', detail: str(a.summary, 140) };
      },
    },
  ],
  init: () => ({ cart: [{ id: 'P01', name: 'Linen kaftan', colour: 'sand', size: 'M' }], discount: 0, links: 0, statusShared: false }),
  async approve(g, s) {
    s.discount = Math.round(num(g.args.percent));
    return { note: `The manager approved ${s.discount}% off for this customer. Tell them, then offer a checkout link.`, step: { label: 'Discount applied', detail: `${s.discount}% (manager approved)` } };
  },
  decline() {
    return { note: 'The manager declined a discount above 10%. Offer COMEBACK10 (10%) instead, kindly.' };
  },
  complete: (s) => s.links > 0 || s.handoff || s.statusShared,
  doneText: (s) => (s.links ? 'Basket recovered: checkout link sent' : s.statusShared ? 'Live order status shared on WhatsApp' : 'Chat handed to the team with full context'),
};
