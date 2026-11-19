/**
 * Data Analyst demo (S7b): plain-English questions over the sample database of Roastery Lane, a fictional coffee
 * e-commerce business. The agent writes SQL; the tool runs it on a real SQLite database opened READ-ONLY (Node's
 * built-in node:sqlite), only SELECT/WITH, one statement, a row cap, and the customers.email column masked. Results
 * come back as a table and, when the shape fits, a chart. Goal: two answered questions.
 */
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { str, rng } from './util.js';

const SCHEMA = `customers(id, name, country, segment ['retail'|'wholesale'], signup_date) -- email exists but is masked
products(id, name, category ['beans'|'equipment'|'subscription'], price)
orders(id, customer_id, order_date 'YYYY-MM-DD' (2026-01-01 to 2026-10-31), channel ['web'|'marketplace'|'wholesale'], status ['delivered'|'refunded'])
order_items(order_id, product_id, qty, unit_price)`;

let dbPromise = null;
/** Builds the sample database once per instance in /tmp, then opens it read-only. */
function db() {
  dbPromise ??= (async () => {
    const { DatabaseSync } = await import('node:sqlite');
    const file = join(tmpdir(), 'vbx-roastery-v1.db');
    if (!existsSync(file)) {
      const w = new DatabaseSync(file);
      w.exec(`create table customers(id integer primary key, name text, country text, segment text, signup_date text, email text);
        create table products(id integer primary key, name text, category text, price real);
        create table orders(id integer primary key, customer_id int, order_date text, channel text, status text);
        create table order_items(order_id int, product_id int, qty int, unit_price real);`);
      const r = rng('roastery');
      const products = [['House espresso 1kg', 'beans', 32], ['Ethiopia Yirgacheffe 250g', 'beans', 14], ['Colombia Huila 250g', 'beans', 12], ['Decaf Swiss water 250g', 'beans', 13], ['Monthly bean subscription', 'subscription', 28], ['Pour-over kit', 'equipment', 45], ['Burr grinder', 'equipment', 129], ['Milk jug 600ml', 'equipment', 18], ['Wholesale espresso 5kg', 'beans', 135], ['Cold brew bags x10', 'beans', 16]];
      const ip = w.prepare('insert into products values (?,?,?,?)');
      products.forEach((p, i) => ip.run(i + 1, ...p));
      const countries = ['UK', 'UK', 'UK', 'Ireland', 'Germany', 'France', 'Netherlands', 'USA'];
      const first = ['Amira', 'Ben', 'Chloe', 'Dev', 'Ella', 'Finn', 'Grace', 'Hugo', 'Isla', 'Jonah', 'Kai', 'Lena', 'Milo', 'Nora', 'Omar', 'Priya'];
      const ic = w.prepare('insert into customers values (?,?,?,?,?,?)');
      for (let i = 1; i <= 140; i++) {
        const wholesale = r() < 0.12;
        ic.run(i, wholesale ? `${first[i % 16]}'s Café ${i}` : `${first[i % 16]} ${String.fromCharCode(65 + (i % 26))}.`, countries[Math.floor(r() * countries.length)], wholesale ? 'wholesale' : 'retail', `2025-${String(1 + Math.floor(r() * 12)).padStart(2, '0')}-${String(1 + Math.floor(r() * 28)).padStart(2, '0')}`, `customer${i}@example.com`);
      }
      const io = w.prepare('insert into orders values (?,?,?,?,?)');
      const ii = w.prepare('insert into order_items values (?,?,?,?)');
      for (let o = 1; o <= 900; o++) {
        const month = 1 + Math.floor(Math.pow(r(), 0.8) * 10);
        const cust = 1 + Math.floor(r() * 140);
        const wholesale = cust % 9 === 0;
        io.run(o, cust, `2026-${String(month).padStart(2, '0')}-${String(1 + Math.floor(r() * 28)).padStart(2, '0')}`, wholesale ? 'wholesale' : r() < 0.25 ? 'marketplace' : 'web', r() < 0.05 ? 'refunded' : 'delivered');
        const n = 1 + Math.floor(r() * 3);
        for (let k = 0; k < n; k++) {
          const p = wholesale ? 9 : 1 + Math.floor(r() * 8 + (r() < 0.1 ? 2 : 0)) % 10;
          ii.run(o, p, wholesale ? 2 + Math.floor(r() * 6) : 1 + Math.floor(r() * 2), products[p - 1][2]);
        }
      }
      w.close();
    }
    return new DatabaseSync(file, { readOnly: true });
  })();
  return dbPromise;
}

function check(sql) {
  const q = sql.trim().replace(/;\s*$/, '');
  if (!/^(select|with)\b/i.test(q)) return 'Only SELECT queries are allowed (read-only).';
  if (q.includes(';')) return 'One statement at a time.';
  if (/\b(pragma|attach|detach|insert|update|delete|drop|alter|create|replace|vacuum)\b/i.test(q)) return 'Write and admin statements are blocked.';
  if (/\bemail\b/i.test(q)) return 'customers.email is masked (personal data) and cannot be selected.';
  if ((q.match(/\b(from|join)\b/gi) ?? []).length > 5) return 'Too many joins for the sandbox (max 5 table references).';
  return null;
}

export default {
  id: 'data',
  maxTokens: 600,
  rules: `You are the AI data analyst for Roastery Lane, an online coffee roaster. The user is the founder; they ask business questions in plain English.
- Write one SQLite SELECT query per question and run it with run_sql. Revenue = sum(qty * unit_price) from order_items for orders with status 'delivered'. Months: strftime('%Y-%m', order_date).
- If the tool returns an error, fix the SQL and try again (max 2 retries).
- For trends or rankings, return exactly two columns (label, number) so it can be charted, ordered sensibly, max 12 rows.
- Answer in 1–3 sentences with the key number and what it means. Never invent numbers that are not in the result. Mention any caveat (e.g. refunds excluded).
- customers.email is masked; don't try to select it.
Schema:
${SCHEMA}`,
  facts(state) {
    return `Questions answered so far: ${state.answered}.`;
  },
  tools: [
    {
      name: 'run_sql',
      description: 'Runs one read-only SELECT on the sample database. Returns up to 50 rows.',
      parameters: { type: 'object', properties: { sql: { type: 'string' }, title: { type: 'string', description: 'Short chart/table title' } }, required: ['sql'] },
      async run(a, s) {
        const sql = str(a.sql, 2000).replace(/[\u0000-\u001f]+/g, ' ');
        const bad = check(sql);
        if (bad) return { result: { error: bad }, error: true, label: 'Query blocked', detail: bad };
        let rows;
        try {
          const d = await db();
          rows = d.prepare(`select * from (${sql.replace(/;\s*$/, '')}) limit 50`).all();
        } catch (e) {
          const msg = String(e?.message ?? e).slice(0, 200);
          if (/node:sqlite|Cannot find|No such built-in/i.test(msg)) return { result: { error: 'Database unavailable' }, error: true, label: 'Database unavailable', detail: msg };
          return { result: { error: `SQL error: ${msg}` }, error: true, label: 'SQL error', detail: msg };
        }
        s.answered += 1;
        s.queries.push(createHash('sha1').update(sql).digest('hex').slice(0, 6));
        const cols = rows.length ? Object.keys(rows[0]) : [];
        const fmt = (v) => (typeof v === 'number' && !Number.isInteger(v) ? Math.round(v * 100) / 100 : v);
        const cards = [{ type: 'sql', title: 'Query (read-only)', sql }];
        if (rows.length) cards.push({ type: 'table', title: str(a.title, 80) || 'Result', columns: cols, rows: rows.slice(0, 15).map((r) => cols.map((c) => fmt(r[c]))) });
        if (cols.length === 2 && rows.length >= 2 && rows.length <= 16 && rows.every((r) => typeof r[cols[1]] === 'number')) cards.push({ type: 'chart', title: str(a.title, 80) || cols[1], labels: rows.map((r) => String(r[cols[0]])), values: rows.map((r) => fmt(r[cols[1]])) });
        return { result: { columns: cols, rows: rows.slice(0, 30).map((r) => cols.map((c) => fmt(r[c]))), row_count: rows.length }, label: 'Query ran (read-only)', detail: `${rows.length} row${rows.length === 1 ? '' : 's'} · ${cols.join(', ')}`, cards };
      },
    },
  ],
  init: () => ({ answered: 0, queries: [] }),
  async approve() {
    return { note: '' };
  },
  decline() {
    return { note: '' };
  },
  complete: (s) => s.answered >= 2,
  doneText: () => 'Two questions answered from the database with read-only SQL, tables and a chart',
  board(s) {
    return [
      { title: 'Database (sample)', items: [{ label: 'customers', value: '140 rows · email masked' }, { label: 'products', value: '10 rows' }, { label: 'orders', value: '900 rows · Jan–Oct 2026' }, { label: 'order_items', value: '~1,800 rows' }] },
      { title: 'Guardrails', items: [{ label: 'Connection', value: 'read-only', status: 'ok' }, { label: 'Statements', value: 'one SELECT, 50-row cap', status: 'ok' }, { label: 'Personal data', value: 'email column masked', status: 'ok' }, { label: 'Queries run', value: String(s.answered), status: s.answered ? 'ok' : 'info' }] },
    ];
  },
};
