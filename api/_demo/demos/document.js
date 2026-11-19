/**
 * Document demo (S7b): accounts payable at Fernhill Logistics (fictional). Sample documents arrive as OCR text; the
 * agent extracts structured data and the tool validates it in code (required fields, line maths, VAT, purchase-order
 * match, known supplier). Clean, small invoices post to the ERP; anything over $2,000 or with a warning waits for a
 * person. Visitors can also paste their own text. Goal: one document validated and posted.
 */
import { str, num } from './util.js';

const DOCS = {
  'INV-2041': {
    kind: 'invoice',
    text: `DELTA OFFICE SUPPLIES LTD  · VAT GB 284 1190 32
INVOICE INV-2041      Date: 03/11/2026      Due: 03/12/2026
Bill to: Fernhill Logistics, 9 Dock Road, Bristol      PO: PO-5531
Qty  Item                          Unit     Total
40   A4 copier paper (box)         18.50    740.00
12   Toner cartridge HP 89X        96.00    1152.00
6    Ergonomic chair (mesh)        215.00   1290.00
                          Subtotal          3182.00
                          VAT 20%            636.40
                          TOTAL GBP         3818.40`,
  },
  'INV-0877': {
    kind: 'invoice',
    text: `Northside Pallet Co.
Invoice no. INV-0877   Issued 12 Nov 2026   PO PO-5602
Pallets EUR 1200x800   x 50 @ 14.00 = 700.00
Strapping kit          x 4  @ 22.50 = 90.00
Subtotal 790.00
VAT (20%) 158.00
Total due: 958.00 GBP   Pay within 30 days`,
  },
  'INV-3310': {
    kind: 'invoice',
    text: `QUICKFIX FLEET SERVICES
inv# INV-3310  date 2026-11-14   PO: PO-5590
Brake pads van #12        2 x 85.00   = 170.00
Labour (hours)            3 x 60.00   = 180.00
Subtotal                               = 350.00
VAT 20%                                =  70.00
TOTAL                                  = 450.00`,
  },
};
const POS = { 'PO-5531': { supplier: 'Delta Office Supplies Ltd', approved: 3200 }, 'PO-5602': { supplier: 'Northside Pallet Co.', approved: 800 }, 'PO-5590': { supplier: 'QuickFix Fleet Services', approved: 300 } };
const SUPPLIERS = ['Delta Office Supplies Ltd', 'Northside Pallet Co.'];
const r2 = (n) => Math.round(n * 100) / 100;

function validate(d) {
  const rows = [];
  const lines = Array.isArray(d.lines) ? d.lines : [];
  const req = ['supplier', 'invoice_number', 'invoice_date', 'currency', 'subtotal', 'vat', 'total'];
  const missing = req.filter((k) => d[k] === undefined || d[k] === '' || d[k] === null);
  rows.push(['Required fields', missing.length ? `missing: ${missing.join(', ')}` : 'all present', missing.length ? 'bad' : 'ok']);
  const sumLines = r2(lines.reduce((t, l) => t + num(l?.qty) * num(l?.unit_price), 0));
  const badLine = lines.find((l) => Math.abs(num(l?.qty) * num(l?.unit_price) - num(l?.line_total)) > 0.01);
  rows.push(['Line maths', badLine ? `"${str(badLine.description, 40)}" qty × price ≠ total` : `${lines.length} lines add up`, badLine ? 'bad' : 'ok']);
  rows.push(['Subtotal', `lines ${sumLines} vs ${num(d.subtotal)}`, Math.abs(sumLines - num(d.subtotal)) <= 0.01 ? 'ok' : 'bad']);
  rows.push(['VAT 20%', `${r2(num(d.subtotal) * 0.2)} expected vs ${num(d.vat)}`, Math.abs(r2(num(d.subtotal) * 0.2) - num(d.vat)) <= 0.01 ? 'ok' : 'bad']);
  rows.push(['Total', `${r2(num(d.subtotal) + num(d.vat))} expected vs ${num(d.total)}`, Math.abs(r2(num(d.subtotal) + num(d.vat)) - num(d.total)) <= 0.01 ? 'ok' : 'bad']);
  rows.push(['Date format', /^\d{4}-\d{2}-\d{2}$/.test(str(d.invoice_date, 12)) ? str(d.invoice_date, 12) : 'use YYYY-MM-DD', /^\d{4}-\d{2}-\d{2}$/.test(str(d.invoice_date, 12)) ? 'ok' : 'bad']);
  const po = POS[str(d.po_number, 12).toUpperCase()];
  rows.push(['Purchase order', po ? `${str(d.po_number, 12).toUpperCase()} approved ${po.approved}` : 'no matching PO', po ? (num(d.subtotal) > po.approved ? 'warn' : 'ok') : 'warn']);
  if (po && num(d.subtotal) > po.approved) rows.push(['PO match', `subtotal ${num(d.subtotal)} is over the approved ${po.approved}`, 'warn']);
  const known = SUPPLIERS.some((x) => x.toLowerCase() === str(d.supplier, 80).toLowerCase());
  rows.push(['Supplier', known ? 'in the supplier master' : 'new supplier: needs vendor set-up', known ? 'ok' : 'warn']);
  return rows;
}

export default {
  id: 'document',
  maxTokens: 900,
  rules: `You are the AI document-processing agent in accounts payable at Fernhill Logistics. The user is an AP clerk.
- open_document gives the OCR text of a sample document (INV-2041, INV-0877, INV-3310). The user may also paste their own invoice text: then use doc_id "PASTED".
- Extract exactly what is on the page, never guess. Then call submit_extraction with: supplier, invoice_number, invoice_date (YYYY-MM-DD), currency (ISO), po_number, lines [{description, qty, unit_price, line_total}], subtotal, vat, total.
- The tool validates in code and returns checks. Report the result in 2–3 lines: what passed, what failed, and why.
- If checks passed, call post_to_erp. Over $2,000 (any currency) or with warnings, it goes to a person: say so. Never post a document with failed checks; explain the problem instead (e.g. ask the supplier for a credit note).`,
  facts(state) {
    return `Processed: ${Object.entries(state.docs).map(([k, v]) => `${k} ${v.status}`).join(', ') || 'none'}.`;
  },
  tools: [
    {
      name: 'open_document',
      description: 'OCR text of a sample document in the inbox.',
      parameters: { type: 'object', properties: { doc_id: { type: 'string' } }, required: ['doc_id'] },
      run(a, s) {
        const id = str(a.doc_id, 12).toUpperCase();
        const d = DOCS[id];
        if (!d) return { result: { error: `Inbox: ${Object.keys(DOCS).join(', ')}` }, error: true, label: 'Open', detail: 'Unknown document' };
        s.docs[id] = { status: 'opened' };
        return { result: { doc_id: id, ocr_text: d.text }, label: 'Document read (OCR)', detail: `${id} · ${d.text.split('\n').length} lines`, cards: [{ type: 'draft', title: `${id} · OCR text`, meta: [], body: d.text }] };
      },
    },
    {
      name: 'submit_extraction',
      description: 'Submits extracted fields; validated in code (maths, VAT, PO, supplier).',
      parameters: {
        type: 'object',
        properties: {
          doc_id: { type: 'string' },
          supplier: { type: 'string' },
          invoice_number: { type: 'string' },
          invoice_date: { type: 'string' },
          currency: { type: 'string' },
          po_number: { type: 'string' },
          lines: { type: 'array', items: { type: 'object', properties: { description: { type: 'string' }, qty: { type: 'number' }, unit_price: { type: 'number' }, line_total: { type: 'number' } } } },
          subtotal: { type: 'number' },
          vat: { type: 'number' },
          total: { type: 'number' },
        },
        required: ['doc_id', 'supplier', 'invoice_number', 'total'],
      },
      run(a, s) {
        const id = str(a.doc_id, 12).toUpperCase() || 'PASTED';
        const rows = validate(a);
        const bad = rows.filter((r) => r[2] === 'bad').length;
        const warn = rows.filter((r) => r[2] === 'warn').length;
        const data = { supplier: str(a.supplier, 80), invoice_number: str(a.invoice_number, 30), invoice_date: str(a.invoice_date, 12), currency: str(a.currency, 3).toUpperCase(), po_number: str(a.po_number, 12), lines: (Array.isArray(a.lines) ? a.lines : []).slice(0, 12), subtotal: num(a.subtotal), vat: num(a.vat), total: num(a.total) };
        s.docs[id] = { status: bad ? 'failed checks' : warn ? 'needs review' : 'validated', total: data.total, warn, bad, currency: data.currency };
        return {
          result: { checks: rows.map(([k, v, st]) => `${k}: ${v} (${st})`), failed: bad, warnings: warn },
          label: bad ? 'Validation failed' : 'Extraction validated',
          detail: `${id} · ${rows.length - bad - warn} passed, ${warn} warnings, ${bad} failed`,
          cards: [{ type: 'json', title: `${id} · extracted data`, json: JSON.stringify(data, null, 2), valid: !bad }, { type: 'kv', title: 'Validation checks', rows }],
        };
      },
    },
    {
      name: 'post_to_erp',
      description: 'Posts a validated document to the ERP for payment.',
      parameters: { type: 'object', properties: { doc_id: { type: 'string' } }, required: ['doc_id'] },
      run(a, s) {
        const id = str(a.doc_id, 12).toUpperCase() || 'PASTED';
        const d = s.docs[id];
        if (!d || !('total' in d)) return { result: { error: 'Submit the extraction first' }, error: true, label: 'Not posted', detail: 'Not extracted' };
        if (d.status === 'posted') return { result: { already_posted: true }, label: 'Already posted', detail: `${id} is already in the ERP` };
        if (d.bad) return { result: { error: 'Failed checks: do not post. Explain the issue.' }, error: true, label: 'Posting blocked', detail: `${id} has failed checks (tool rule)` };
        if (d.total > 2000 || d.warn) return { result: { status: 'waiting_for_approval' }, gate: { title: `Post ${id} (${d.currency} ${d.total}) to the ERP`, detail: `${d.warn ? `${d.warn} warning(s) from validation. ` : ''}${d.total > 2000 ? 'Over the 2,000 auto-post limit.' : ''}` } };
        d.status = 'posted';
        return { result: { posted: true, erp_ref: `AP-${id}` }, label: 'Posted to the ERP', detail: `${id} · scheduled for payment run` };
      },
    },
  ],
  init: () => ({ docs: {} }),
  async approve(g, s) {
    const id = str(g.args.doc_id, 12).toUpperCase() || 'PASTED';
    s.docs[id].status = 'posted';
    return { note: `The AP manager approved ${id}: posted to the ERP. Confirm in one line.`, step: { label: 'Posted to the ERP', detail: `${id} (approved)` } };
  },
  decline(g) {
    return { note: `The AP manager put ${g.args.doc_id} on hold. Suggest the next step (e.g. ask the buyer to raise the PO).` };
  },
  complete: (s) => Object.values(s.docs).some((d) => d.status === 'posted') || Object.values(s.docs).filter((d) => 'total' in d).length >= 2,
  doneText: (s) => (Object.values(s.docs).some((d) => d.status === 'posted') ? 'Document read, validated in code and posted to the ERP' : 'Documents read and validated: problems caught before posting'),
  board(s) {
    return [{ title: 'AP inbox', items: [...Object.keys(DOCS), ...(s.docs.PASTED ? ['PASTED'] : [])].map((id) => ({ label: id, value: s.docs[id]?.status ?? 'waiting', status: s.docs[id]?.status === 'posted' || s.docs[id]?.status === 'validated' ? 'ok' : s.docs[id]?.status === 'failed checks' ? 'bad' : s.docs[id]?.status === 'needs review' ? 'warn' : 'info' })) }, { title: 'Rules', items: [{ label: 'Auto-post', value: 'up to 2,000, all checks green' }, { label: 'Above or with warnings', value: 'a person approves' }] }];
  },
};
