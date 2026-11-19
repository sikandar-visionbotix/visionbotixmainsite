/**
 * Ads demo (S7b): Peak Trail Outfitters, a fictional outdoor-gear store. A sample 7-day Meta + Google Ads account. The
 * agent reads performance, explains it, and proposes budget moves; every change waits for the marketer's approval
 * (shadow mode), and the tool refuses moves that break the daily budget or the per-change limit. Goal: an approved set.
 */
import { str, num } from './util.js';

const CAMPAIGNS = [
  { id: 'G1', name: 'Google · Search · Brand', platform: 'Google', budget: 40, spend: 266, conv: 61, revenue: 7930 },
  { id: 'G2', name: 'Google · Shopping · Tents', platform: 'Google', budget: 120, spend: 812, conv: 38, revenue: 4560 },
  { id: 'G3', name: 'Google · Search · Generic "hiking boots"', platform: 'Google', budget: 90, spend: 604, conv: 9, revenue: 990 },
  { id: 'M1', name: 'Meta · Retargeting · Cart abandoners', platform: 'Meta', budget: 35, spend: 241, conv: 27, revenue: 3240 },
  { id: 'M2', name: 'Meta · Prospecting · Lookalike 1%', platform: 'Meta', budget: 110, spend: 760, conv: 14, revenue: 1540 },
];
const TARGET_ROAS = 3;
const TOTAL = CAMPAIGNS.reduce((t, c) => t + c.budget, 0);
const roas = (c) => c.revenue / c.spend;

export default {
  id: 'ads',
  maxTokens: 600,
  rules: `You are the AI ads agent for Peak Trail Outfitters, an online outdoor-gear store. The user is the marketing lead. Target ROAS ${TARGET_ROAS}.0; total daily budget $${TOTAL} must not grow.
- Call get_performance before any advice. Use only its numbers; ROAS = revenue / spend.
- Recommend moves from campaigns well below target to those above it. Never change Brand search by more than 10%.
- When the user asks to move budget (or agrees), call propose_changes in the same turn. It saves a change set (each: campaign_id, new_daily_budget, or pause). The tool rejects changes over 30% per campaign or a higher total. Week 1 is shadow mode: everything waits for approval.
- Explain each change in one line. Be concise. Don't promise results; say what you expect and that you'll check again tomorrow.`,
  facts(state) {
    return `Account: Meta + Google, last 7 days, sample data. Applied changes: ${state.applied ? 'yes' : 'none'}.`;
  },
  tools: [
    {
      name: 'get_performance',
      description: 'Last 7 days per campaign: budget, spend, conversions, revenue, ROAS, CPA.',
      parameters: { type: 'object', properties: {} },
      run(_, s) {
        s.read = true;
        const rows = (s.applied ? s.budgets : null) ?? {};
        return {
          result: CAMPAIGNS.map((c) => ({ id: c.id, name: c.name, daily_budget: rows[c.id] ?? c.budget, spend_7d: c.spend, conversions: c.conv, revenue: c.revenue, roas: +roas(c).toFixed(2), cpa: +(c.spend / c.conv).toFixed(2) })),
          label: 'Performance pulled',
          detail: `7 days · spend $${CAMPAIGNS.reduce((t, c) => t + c.spend, 0)} · ${CAMPAIGNS.filter((c) => roas(c) < TARGET_ROAS).length} campaigns below target`,
          cards: [
            { type: 'table', title: 'Last 7 days (sample account)', columns: ['Campaign', '$/day', 'Spend', 'Conv.', 'ROAS'], rows: CAMPAIGNS.map((c) => [c.name, rows[c.id] ?? c.budget, `$${c.spend}`, c.conv, roas(c).toFixed(1)]) },
            { type: 'chart', title: 'ROAS by campaign (target 3.0)', labels: CAMPAIGNS.map((c) => c.id), values: CAMPAIGNS.map((c) => +roas(c).toFixed(2)), target: TARGET_ROAS },
          ],
        };
      },
    },
    {
      name: 'propose_changes',
      description: 'Saves a set of budget changes or pauses. Always waits for approval.',
      parameters: {
        type: 'object',
        properties: {
          changes: { type: 'array', items: { type: 'object', properties: { campaign_id: { type: 'string' }, new_daily_budget: { type: 'number' }, pause: { type: 'boolean' }, reason: { type: 'string' } }, required: ['campaign_id'] } },
        },
        required: ['changes'],
      },
      run(a, s) {
        if (s.applied) return { result: { already_applied: true, budgets: s.budgets }, label: 'Already applied', detail: 'Changes are live; check again tomorrow' };
        if (!s.read) return { result: { error: 'Call get_performance first' }, error: true, label: 'Refused', detail: 'No data read yet' };
        const changes = (Array.isArray(a.changes) ? a.changes : []).slice(0, 6);
        const next = Object.fromEntries(CAMPAIGNS.map((c) => [c.id, c.budget]));
        const problems = [];
        const lines = [];
        for (const ch of changes) {
          const c = CAMPAIGNS.find((x) => x.id === str(ch?.campaign_id, 4).toUpperCase());
          if (!c) {
            problems.push(`unknown campaign ${str(ch?.campaign_id, 10)}`);
            continue;
          }
          const nb = ch.pause ? 0 : Math.round(num(ch.new_daily_budget));
          if (!(nb >= 0)) {
            problems.push(`${c.id}: no new budget`);
            continue;
          }
          const delta = Math.abs(nb - c.budget) / c.budget;
          if (!ch.pause && delta > 0.3) problems.push(`${c.id}: ${Math.round(delta * 100)}% change (max 30%)`);
          if (c.id === 'G1' && delta > 0.1) problems.push('G1 Brand: max 10% change');
          next[c.id] = nb;
          lines.push(`${c.id} ${c.name}: $${c.budget} → ${ch.pause ? 'paused' : `$${nb}`}${ch.reason ? ` (${str(ch.reason, 80)})` : ''}`);
        }
        const total = Object.values(next).reduce((t, v) => t + v, 0);
        if (total > TOTAL) problems.push(`total $${total}/day is above the $${TOTAL} budget`);
        if (!lines.length) problems.push('no valid changes');
        if (problems.length) return { result: { error: problems.join('; ') }, error: true, label: 'Change set rejected', detail: problems.join(' · ') };
        s.proposal = next;
        return { result: { status: 'waiting_for_approval', new_total: total }, gate: { title: `Apply ${lines.length} budget changes ($${total}/day total)`, detail: lines.join('\n') } };
      },
    },
  ],
  init: () => ({ read: false, applied: false, budgets: null, proposal: null }),
  async approve(_, s) {
    s.budgets = s.proposal;
    s.applied = true;
    return { note: 'The marketing lead approved: changes are live in Meta and Google. Confirm in one or two lines and say you will report tomorrow at 9:00.', step: { label: 'Changes applied', detail: Object.entries(s.budgets).map(([k, v]) => `${k} $${v}`).join(' · ') } };
  },
  decline() {
    return { note: 'The marketing lead declined. Ask which change they disagree with.' };
  },
  complete: (s) => s.applied,
  doneText: () => 'Account analysed, budget moves proposed, approved and applied',
  board(s) {
    return [
      { title: 'Daily budgets', items: CAMPAIGNS.map((c) => ({ label: c.name, value: s.applied && s.budgets[c.id] !== c.budget ? `$${c.budget} → ${s.budgets[c.id] ? `$${s.budgets[c.id]}` : 'paused'}` : `$${c.budget} · ROAS ${roas(c).toFixed(1)}`, status: s.applied && s.budgets[c.id] !== c.budget ? 'ok' : roas(c) < TARGET_ROAS ? 'warn' : 'info' })) },
      { title: 'Rules', items: [{ label: 'Mode', value: 'shadow (every change approved)' }, { label: 'Max change', value: '30% per campaign, 10% on Brand' }, { label: 'Total', value: `$${TOTAL}/day, never higher` }] },
    ];
  },
};
