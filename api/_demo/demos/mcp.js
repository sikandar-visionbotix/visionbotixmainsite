/**
 * MCP Connector demo (S7b): an AI assistant connected to Orbit Labs' (fictional SaaS) systems through MCP servers:
 * CRM, support tickets and internal docs. Every tool call is shown as the JSON-RPC message the MCP client sends.
 * Scopes are least-privilege and set by the visitor (read-only or read + write); write calls also need approval, and
 * every call lands in the audit log. Goal: a cross-system answer (and, with write scope, an approved ticket).
 */
import { str, code } from './util.js';

const ACCOUNTS = [
  { id: 'A-101', name: 'Helix Foods', plan: 'Enterprise', arr: 84000, owner: 'Rita (AM)', renewal: '2027-01-15', health: 'at risk' },
  { id: 'A-102', name: 'Copperline Media', plan: 'Growth', arr: 18000, owner: 'Ken (AM)', renewal: '2026-12-02', health: 'good' },
  { id: 'A-103', name: 'Nordwind Logistics', plan: 'Enterprise', arr: 126000, owner: 'Rita (AM)', renewal: '2027-04-30', health: 'good' },
];
const TICKETS = [
  { id: 'T-881', account: 'A-101', title: 'SSO login loop for 40 users', priority: 'high', status: 'open', age_days: 6 },
  { id: 'T-874', account: 'A-101', title: 'CSV export times out', priority: 'medium', status: 'open', age_days: 11 },
  { id: 'T-869', account: 'A-102', title: 'Invoice address change', priority: 'low', status: 'closed', age_days: 15 },
];
const DOCS = [
  { id: 'runbook-sso', title: 'Runbook: SSO login loops', text: 'Usually a clock skew or an expired IdP certificate. Check the SAML response time and the certificate expiry in Admin → SSO. Escalate to platform team if the cert is valid.' },
  { id: 'policy-credits', title: 'Policy: service credits', text: 'Enterprise accounts get a 10% monthly credit for a P1 incident lasting over 4 hours. Credits are approved by the account manager.' },
];
const SERVERS = { crm: ['crm.search_accounts', 'crm.get_account'], tickets: ['tickets.list', 'tickets.create'], docs: ['docs.search'] };
const rpc = (name, args) => JSON.stringify({ jsonrpc: '2.0', method: 'tools/call', params: { name, arguments: args } });

function mcpTool(name, description, properties, required, write, fn) {
  const [server] = name.split('.');
  return {
    name: name.replace('.', '_'),
    description: `[MCP ${server} server${write ? ', write scope' : ''}] ${description}`,
    parameters: { type: 'object', properties, required },
    run(a, s) {
      s.audit.push({ call: name, args: JSON.stringify(a).slice(0, 80), result: 'pending' });
      const last = s.audit.at(-1);
      if (write && s.role !== 'write') {
        last.result = 'denied (scope)';
        return { result: { error: `Permission denied: the token has no ${server}:write scope. Tell the user to grant write access if they want this.` }, error: true, label: 'Denied by MCP server', detail: `${name} needs ${server}:write`, call: rpc(name, a) };
      }
      const out = fn(a, s);
      last.result = out.gate ? 'awaiting approval' : out.error ? 'error' : 'ok';
      return { ...out, label: out.label ?? `MCP ${name}`, detail: `${rpc(name, a)}\n→ ${out.detail ?? 'ok'}` };
    },
  };
}

export default {
  id: 'mcp',
  roles: ['read', 'write'],
  maxTokens: 600,
  rules: `You are Orbit Labs' internal AI assistant, connected to company systems through MCP servers (crm, tickets, docs). The user is an account manager.
- Use the MCP tools to answer; combine systems when useful (e.g. account + its open tickets + the runbook). Never invent data.
- Respect scopes: if a write is denied, explain that the connector is read-only and the user can grant write scope (switch at the top).
- Creating a ticket also needs approval. Never claim it exists before approval.
- Be concise: lead with the answer, then the sources (system + id).`,
  facts(state) {
    return `Granted scopes: ${state.role === 'write' ? 'crm:read, tickets:read, tickets:write, docs:read' : 'crm:read, tickets:read, docs:read (read-only)'}.`;
  },
  tools: [
    mcpTool('crm.search_accounts', 'Find accounts by name, plan or health.', { query: { type: 'string' } }, ['query'], false, (a) => {
      const q = str(a.query, 60).toLowerCase();
      const hits = ACCOUNTS.filter((x) => JSON.stringify(x).toLowerCase().includes(q) || q.split(/\s+/).some((w) => w.length > 3 && x.name.toLowerCase().includes(w)));
      return { result: hits.length ? hits : { found: 0, all: ACCOUNTS.map((x) => x.name) }, detail: `${hits.length} account(s)` };
    }),
    mcpTool('crm.get_account', 'Full account record.', { account_id: { type: 'string' } }, ['account_id'], false, (a) => {
      const acc = ACCOUNTS.find((x) => x.id === str(a.account_id, 8).toUpperCase());
      return acc ? { result: acc, detail: `${acc.name} · ${acc.plan} · ARR $${acc.arr.toLocaleString('en-US')} · ${acc.health}`, cards: [{ type: 'kv', title: `${acc.name} (CRM)`, rows: [['Plan', acc.plan], ['ARR', `$${acc.arr.toLocaleString('en-US')}`], ['Owner', acc.owner], ['Renewal', acc.renewal], ['Health', acc.health, acc.health === 'good' ? 'ok' : 'warn']] }] } : { result: { error: 'No such account' }, error: true, detail: 'not found' };
    }),
    mcpTool('tickets.list', 'Support tickets for an account.', { account_id: { type: 'string' }, status: { type: 'string', enum: ['open', 'closed', 'all'] } }, ['account_id'], false, (a, s) => {
      const id = str(a.account_id, 8).toUpperCase();
      const list = [...TICKETS, ...s.created].filter((t) => t.account === id && (a.status === 'all' || !a.status || t.status === a.status));
      return { result: list, detail: `${list.length} ticket(s)`, cards: list.length ? [{ type: 'table', title: `Tickets · ${id}`, columns: ['Ticket', 'Title', 'Priority', 'Age'], rows: list.map((t) => [t.id, t.title, t.priority, `${t.age_days} d`]) }] : undefined };
    }),
    mcpTool('tickets.create', 'Opens a ticket (write scope, needs approval).', { account_id: { type: 'string' }, title: { type: 'string' }, priority: { type: 'string', enum: ['low', 'medium', 'high'] } }, ['account_id', 'title', 'priority'], true, (a) => ({
      result: { status: 'waiting_for_approval' },
      gate: { title: `Create ticket for ${str(a.account_id, 8).toUpperCase()}: ${str(a.title, 80)}`, detail: `Priority ${a.priority}. MCP call: tickets.create (write scope).` },
      detail: 'awaiting approval',
    })),
    mcpTool('docs.search', 'Searches internal runbooks and policies.', { query: { type: 'string' } }, ['query'], false, (a) => {
      const q = str(a.query, 80).toLowerCase();
      const hits = DOCS.filter((d) => q.split(/\s+/).some((w) => w.length > 2 && `${d.title} ${d.text}`.toLowerCase().includes(w)));
      return { result: hits, detail: hits.map((d) => d.title).join(' · ') || 'nothing found' };
    }),
  ],
  init: () => ({ role: 'read', audit: [], created: [] }),
  async approve(g, s) {
    const t = { id: code('T', 890 + s.created.length), account: str(g.args.account_id, 8).toUpperCase(), title: str(g.args.title, 80), priority: g.args.priority, status: 'open', age_days: 0 };
    s.created.push(t);
    const a = s.audit.findLast((x) => x.call === 'tickets.create');
    if (a) a.result = 'ok (approved)';
    return { note: `Approved: ticket ${t.id} created. Confirm in one line.`, step: { label: 'Ticket created (MCP write)', detail: `${t.id} · ${t.title}` } };
  },
  decline() {
    const note = 'The approver declined creating the ticket. Acknowledge briefly.';
    return { note };
  },
  complete: (s) => new Set(s.audit.filter((x) => x.result.startsWith('ok')).map((x) => x.call.split('.')[0])).size >= 2 && (s.created.length > 0 || s.audit.some((x) => x.result === 'denied (scope)') || s.audit.length >= 3),
  doneText: () => 'Answered across CRM, tickets and docs over MCP, with scopes enforced and every call audited',
  board(s) {
    return [
      { title: 'MCP servers', items: Object.entries(SERVERS).map(([k, v]) => ({ label: k, value: v.join(', '), status: 'ok' })) },
      { title: 'Token scopes', items: [{ label: 'crm, tickets, docs', value: 'read', status: 'ok' }, { label: 'tickets', value: s.role === 'write' ? 'write (with approval)' : 'no write', status: s.role === 'write' ? 'warn' : 'info' }] },
      { title: 'Audit log', items: s.audit.length ? s.audit.slice(-8).map((x) => ({ label: x.call, value: x.result, status: x.result.startsWith('ok') ? 'ok' : x.result.startsWith('denied') ? 'bad' : 'warn' })) : [{ label: 'No calls yet', value: '' }] },
    ];
  },
};
