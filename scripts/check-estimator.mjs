/**
 * Tests the estimator model (src/data/estimator.ts) with Node's built-in TypeScript support (Node 24+).
 *   npm run check:estimator
 * Fails (exit 1) if an invariant breaks: drivers must add up to the bottom of the range, ranges never fall below the
 * "from" price, query strings round-trip, bundles apply only when all their agents are picked, and so on.
 */
import { registerHooks } from 'node:module';
import assert from 'node:assert/strict';

// Resolve extensionless relative imports and the "@/" alias to .ts files, as Vite does.
registerHooks({
  resolve(spec, ctx, next) {
    if (spec.startsWith('@/')) spec = new URL(`../src/${spec.slice(2)}`, import.meta.url).href;
    try {
      return next(spec, ctx);
    } catch (e) {
      if (/^(\.|file:)/.test(spec) && !/\.[a-z]+$/.test(spec)) return next(`${spec}.ts`, ctx);
      throw e;
    }
  },
});

const E = await import('../src/data/estimator.ts');
const P = await import('../src/data/pricing.ts');
let n = 0;
const check = (name, fn) => {
  try {
    fn();
    n++;
  } catch (e) {
    console.error(`✗ ${name}\n  ${e.message}`);
    process.exitCode = 1;
  }
};

const sum = (e) => e.drivers.reduce((s, d) => s + d.amount, 0);

// Every build type, with nothing chosen, equals its "from" price.
for (const t of E.typeOptions.filter((o) => E.isBuild(o.value))) {
  check(`${t.value}: minimal = from price`, () => {
    const e = E.estimate({ type: t.value, design: 'own' });
    assert.equal(e.low, t.from, `${e.low} ≠ ${t.from}`);
    assert.ok(e.high > e.low);
  });
}

// Drivers add up, the range never falls below the base, weeks are sane, across many combinations.
const types = ['ai', 'web', 'mobile', 'saas', 'software', 'vision-iot'];
let combos = 0;
for (const type of types)
  for (const stage of ['prototype', 'mvp', 'production'])
    for (const timeline of ['flexible', 'standard', 'rush'])
      for (const integrations of ['none', 'some', 'many'])
        for (const feats of [[], ['accounts', 'admin'], E.featureOptions.map((f) => f.value)])
          for (const sensitive of [false, true]) {
            const input = { type, stage, timeline, integrations, features: feats, sensitive, aiKind: 'agent', platforms: ['web', 'ios'], channels: ['webchat', 'phone'], aiFeature: 'rag' };
            const e = E.estimate(input);
            combos++;
            check(`sum ${JSON.stringify(input)}`, () => {
              assert.equal(sum(e), e.low, `drivers ${sum(e)} ≠ low ${e.low}`);
              assert.ok(e.low >= e.drivers[0].amount, 'below base');
              assert.ok(e.low % 100 === 0 && e.high % 500 === 0, 'rounding');
              assert.ok(e.weeks[0] >= 1 && e.weeks[1] > e.weeks[0], `weeks ${e.weeks}`);
              assert.ok(e.drivers.every((d) => d.amount !== 0), 'zero driver');
            });
          }

// Features that do not apply to a type are ignored.
check('inapplicable features ignored', () => {
  const a = E.estimate({ type: 'ai', aiKind: 'chatbot' });
  const b = E.estimate({ type: 'ai', aiKind: 'chatbot', features: ['payments', 'offline', 'migration'], platforms: ['ios'] });
  assert.equal(a.low, b.low);
});

// Specific numbers (guards against silent changes to the formula).
check('mobile + accounts + web', () => {
  const R = P.estimatorRates;
  const e = E.estimate({ type: 'mobile', features: ['accounts'], platforms: ['ios', 'android', 'web'], design: 'own' });
  const s1 = P.projectFrom.mobileApp + R.features.accounts;
  assert.equal(e.low, s1 + Math.round((s1 * R.extraSurface) / 100) * 100);
});
check('single-OS mobile is cheaper', () => {
  // the base price is the floor: a one-OS app still costs at least the "from" price
  assert.equal(E.estimate({ type: 'mobile', platforms: ['ios'], design: 'own' }).low, P.projectFrom.mobileApp);
  const both = E.estimate({ type: 'mobile', features: ['accounts', 'admin'], design: 'own' }).low;
  assert.ok(E.estimate({ type: 'mobile', features: ['accounts', 'admin'], platforms: ['android'], design: 'own' }).low < both);
});
check('voice agent includes the phone channel', () => {
  const v = E.estimate({ type: 'ai', aiKind: 'voice', channels: ['phone'] });
  assert.equal(v.low, P.projectFrom.customVoice);
  const c = E.estimate({ type: 'ai', aiKind: 'chatbot', channels: ['webchat', 'phone'] });
  assert.equal(c.low, P.projectFrom.customChatbot + P.estimatorRates.extraChannel + P.estimatorRates.phoneChannel);
});

// Agents and bundles.
check('agents: separate sum without a full bundle', () => {
  const e = E.estimate({ type: 'agents', agents: ['ai-receptionist', 'ai-booking-agent'] });
  assert.equal(e.low, P.agentPrices['ai-receptionist'].setup + P.agentPrices['ai-booking-agent'].setup);
  assert.equal(e.monthlyLow, P.agentPrices['ai-receptionist'].monthly + P.agentPrices['ai-booking-agent'].monthly);
});
check('agents: full bundle applies the bundle price', () => {
  for (const b of P.bundles) {
    const e = E.estimate({ type: 'agents', agents: b.agents });
    assert.equal(e.low, b.setup, `${b.name} setup`);
    assert.equal(e.monthlyLow, b.monthly, `${b.name} monthly`);
  }
});
check('agents: project offers are not pickable', () => {
  const e = E.estimate({ type: 'agents', agents: ['ai-mvp-development', 'ai-receptionist'] });
  assert.equal(e.drivers.length, 1);
});

// Team.
check('team: monthly and total', () => {
  const team = P.teamRates.map((_, i) => (i === 1 ? 2 : i === 4 ? 1 : 0));
  const e = E.estimate({ type: 'team', team, months: 3 });
  const m = 2 * P.teamRates[1].monthly + P.teamRates[4].monthly;
  assert.equal(e.monthlyLow, m);
  assert.equal(e.low, m * 3);
});

// Query round-trip.
const samples = [
  ...E.typicalProjects.map((p) => p.input),
  { type: 'team', team: [1, 2, 0, 1, 0], months: 12 },
  { type: 'saas', features: ['accounts'], integrations: 'many', aiFeature: 'agent', platforms: ['web', 'desktop'], design: 'own', sensitive: true, stage: 'production', timeline: 'rush' },
];
for (const s of samples) {
  check(`round-trip ${s.type}`, () => {
    const back = E.fromQuery(E.toQuery(s));
    assert.ok(back);
    assert.equal(E.estimate(back).low, E.estimate(s).low);
    assert.equal(E.estimate(back).high, E.estimate(s).high);
  });
}
check('fromQuery rejects junk', () => {
  assert.equal(E.fromQuery('t=evil'), null);
  const j = E.fromQuery('t=web&f=accounts,<script>&i=lots&s=x');
  assert.deepEqual(j.features, ['accounts']);
  assert.equal(j.integrations, 'none');
  assert.equal(j.stage, 'mvp');
});

// Summary text.
check('summary text', () => {
  const t = E.summaryText(E.estimate(E.typicalProjects[2].input), 'https://visionbotix.com/estimate/?t=mobile');
  assert.match(t, /^Estimate \(indicative\): \$[\d,]+–\$[\d,]+, \d+–\d+ weeks\./);
  assert.ok(t.length < 1500);
});

console.log(`estimator: ${n} checks passed (${combos} build combinations)${process.exitCode ? ', with failures above' : ''}`);
for (const p of E.typicalProjects) {
  const e = E.estimate(p.input);
  console.log(`  ${p.name.padEnd(46)} ${E.rangeLabel(e).padEnd(32)} ${e.weeksLabel}`);
}
