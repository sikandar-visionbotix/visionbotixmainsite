/**
 * AI MVP Sprint demo (S7b): an interactive scoping wizard. The agent interviews the founder (problem, users, the one
 * core journey, AI capability, platforms, integrations, data sensitivity, deadline), cuts the scope to a launchable
 * MVP (max 5 core features, the rest goes to "later"), and the tool turns it into a sprint plan plus an estimator input;
 * the browser prices it with the site's own estimator (same numbers as /estimate/). Goal: a scoped MVP.
 */
import { str } from './util.js';

const FEATURES = ['accounts', 'payments', 'admin', 'realtime', 'files', 'reporting', 'languages', 'offline', 'migration'];

export default {
  id: 'mvp',
  maxTokens: 700,
  rules: `You are Visionbotix's AI MVP scoping assistant. The user is a founder with an AI product idea. Our AI MVP Sprint ships an AI-native product in 6–8 weeks at a fixed price (from $12,000).
Interview them ONE short question at a time, at most 5 questions: the problem and who has it; the single core journey; what the AI must do (answer from documents = "rag", take actions or run workflows = "agent", or "none"); platforms (web, ios, android); systems to connect; whether it handles sensitive data; deadline.
Then call scope_mvp. Cut ruthlessly: at most 5 core features; everything else goes to later. Then summarise the plan in 3–4 lines. Do NOT state any price, range or number of weeks yourself: the card shows both from our estimator; say they are indicative and a fixed quote follows a call. Pass on any advice the tool returns (e.g. launch on one platform first). Never promise outcomes, investors or revenue.`,
  facts(state) {
    return `Scoped already: ${state.scoped ? 'yes' : 'no'}.`;
  },
  tools: [
    {
      name: 'scope_mvp',
      description: 'Turns the interview into an MVP scope, a sprint plan and an estimator input.',
      parameters: {
        type: 'object',
        properties: {
          product_name: { type: 'string' },
          problem: { type: 'string' },
          users: { type: 'string' },
          core_features: { type: 'array', items: { type: 'string' }, description: 'In priority order' },
          ai_capability: { type: 'string', enum: ['rag', 'agent', 'none'] },
          building_blocks: { type: 'array', items: { type: 'string', enum: FEATURES } },
          platforms: { type: 'array', items: { type: 'string', enum: ['web', 'ios', 'android'] } },
          integrations: { type: 'string', enum: ['none', 'few', 'some', 'many'] },
          sensitive_data: { type: 'boolean' },
          deadline: { type: 'string', enum: ['flexible', 'standard', 'rush'] },
        },
        required: ['product_name', 'problem', 'core_features', 'ai_capability', 'platforms'],
      },
      run(a, s) {
        const core = (Array.isArray(a.core_features) ? a.core_features : []).map((f) => str(f, 80)).filter(Boolean);
        if (core.length < 2) return { result: { error: 'Need at least 2 core features: ask one more question.' }, error: true, label: 'Not enough scope', detail: 'Fewer than 2 core features' };
        const platforms = [...new Set((Array.isArray(a.platforms) ? a.platforms : ['web']).filter((p) => ['web', 'ios', 'android'].includes(p)))];
        const mobileOnly = platforms.length && !platforms.includes('web');
        const blocks = [...new Set((Array.isArray(a.building_blocks) ? a.building_blocks : []).filter((f) => FEATURES.includes(f)))];
        if (!blocks.includes('accounts')) blocks.unshift('accounts');
        const input = {
          type: mobileOnly ? 'mobile' : 'saas',
          features: blocks,
          integrations: ['none', 'few', 'some', 'many'].includes(a.integrations) ? a.integrations : 'few',
          aiFeature: a.ai_capability === 'none' ? 'none' : a.ai_capability === 'rag' ? 'rag' : 'agent',
          platforms: platforms.length ? platforms : ['web'],
          design: 'us',
          sensitive: !!a.sensitive_data,
          stage: 'mvp',
          timeline: ['flexible', 'standard', 'rush'].includes(a.deadline) ? a.deadline : 'standard',
        };
        const now = core.slice(0, 5);
        const later = core.slice(5);
        // Phases without week numbers: the card shows the estimator's timeline, so the two can never disagree.
        const plan = [
          ['Discovery', 'Clickable prototype, AI evaluation set, scope sign-off'],
          ['Build 1', now.slice(0, 2).join(', ')],
          ['Build 2', `${now.slice(2).join(', ') || 'polish and edge cases'}${input.aiFeature !== 'none' ? ', AI guardrails' : ''}`],
          ['Launch', 'Hardening, evals, analytics, store or web release'],
        ];
        const advice = [];
        if (input.platforms.length > 1) advice.push(`Launching on ${input.platforms.length} platforms at once makes this larger than a 6–8 week sprint; consider ${input.platforms.includes('web') ? 'web' : input.platforms[0]} first.`);
        if (blocks.length > 5) advice.push('Many building blocks: some can wait for v2.');
        s.scoped = true;
        return {
          result: { core_now: now, later, plan, advice, priced_by: 'the website estimator, shown to the user in the card (price and timeline); do not state numbers yourself' },
          label: 'MVP scoped',
          detail: `${now.length} core features · ${later.length} moved to later · ${input.platforms.join(' + ')} · AI: ${input.aiFeature}`,
          cards: [{ type: 'mvp', title: str(a.product_name, 60) || 'Your MVP', problem: str(a.problem, 200), users: str(a.users, 120), now, later: [...later, ...advice.map((x) => `Advice: ${x}`)], plan, input }],
        };
      },
    },
  ],
  init: () => ({ scoped: false }),
  async approve() {
    return { note: '' };
  },
  decline() {
    return { note: '' };
  },
  complete: (s) => s.scoped,
  doneText: () => 'Idea turned into an MVP scope, a build plan and an indicative price and timeline',
  board(s) {
    return [{ title: 'Scoping', items: ['Problem and users', 'Core journey', 'AI capability', 'Platforms and systems', 'Data and deadline'].map((x) => ({ label: x, value: s.scoped ? 'covered' : '…', status: s.scoped ? 'ok' : 'info' })).concat([{ label: 'Scope and plan', value: s.scoped ? 'ready' : 'after the interview', status: s.scoped ? 'ok' : 'info' }]) }];
  },
};
