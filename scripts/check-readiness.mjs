/**
 * Tests the AI readiness score model (src/data/readiness.ts) with Node's built-in TypeScript support (Node 24+).
 *   npm run check:readiness
 * Fails (exit 1) if an invariant breaks: weights add up to 100, scores stay within 0–100 and rise with better
 * answers, bands cover 0–100, every need maps to a priced catalogue agent, share codes round-trip, recommendations
 * and bundles stay consistent.
 */
import { registerHooks } from 'node:module';
import assert from 'node:assert/strict';

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

const R = await import('../src/data/readiness.ts');
const P = await import('../src/data/pricing.ts');
const C = await import('../src/data/catalogue.ts');
let n = 0;
const fails = [];
const check = (name, fn) => {
  try {
    fn();
    n++;
  } catch (e) {
    fails.push(`${name}: ${e.message}`);
  }
};

const all = (pts, extra = {}) => {
  const a = { sector: 0, size: 0, needs: [], data: 0, ...extra };
  for (const q of R.scored) a[q.id] = pts;
  return a;
};

check('weights add up to 100', () => assert.equal(Object.values(R.dims).reduce((s, d) => s + d.weight, 0), 100));
check('every dimension has a question', () => {
  for (const d of Object.keys(R.dims)) assert.ok(R.scored.some((q) => q.dim === d), d);
});
check('13 questions, unique ids', () => {
  assert.equal(R.questions.length, 13);
  assert.equal(new Set(R.questions.map((q) => q.id)).size, R.questions.length);
});
check('scored questions have exactly 4 options', () => R.scored.forEach((q) => assert.equal(q.options.length, 4, q.id)));
check('all-zero answers score 0, all-three score 100', () => {
  assert.equal(R.totalScore(all(0)), 0);
  assert.equal(R.totalScore(all(3)), 100);
});
check('score rises monotonically with every answer', () => {
  for (const q of R.scored) {
    let prev = -1;
    for (let p = 0; p <= 3; p++) {
      const s = R.totalScore({ ...all(1), [q.id]: p });
      assert.ok(s >= prev, `${q.id}=${p}`);
      prev = s;
    }
  }
});
check('bands cover 0–100 in order', () => {
  assert.equal(R.bands[0].min, 0);
  for (let s = 0; s <= 100; s++) assert.ok(R.bandFor(s));
  assert.equal(R.bandFor(39).key, 'groundwork');
  assert.equal(R.bandFor(40).key, 'first');
  assert.equal(R.bandFor(70).key, 'scale');
});
check('context questions do not change the score', () => {
  const base = R.totalScore(all(2));
  assert.equal(R.totalScore(all(2, { sector: 5, size: 3, needs: [1, 2, 3], data: 2 })), base);
});
check('every need maps to a priced catalogue agent', () => {
  for (const [k, slug] of Object.entries(R.needAgent)) {
    assert.ok(C.agents.some((a) => a.slug === slug), `${k} → ${slug} not in catalogue`);
    assert.ok(P.agentPrices[slug], `${slug} has no price`);
  }
  const multi = R.questions.find((q) => q.kind === 'multi');
  assert.deepEqual(new Set(multi.options.map((o) => o.key)), new Set(Object.keys(R.needAgent)));
});
check('sector starters and agentNeeds are catalogue agents', () => {
  for (const list of Object.values(R.sectorAgents)) for (const s of list) assert.ok(C.agents.some((a) => a.slug === s), s);
  for (const s of Object.keys(R.agentNeeds)) assert.ok(C.agents.some((a) => a.slug === s), s);
  assert.equal(Object.keys(R.sectorAgents).length, R.sectors.length);
});
check('sector bundles exist in pricing', () => {
  for (const b of Object.values(R.sectorBundle)) assert.ok(P.bundles.some((x) => x.slug === b), b);
});
check('share codes round-trip', () => {
  const samples = [all(0), all(3, { sector: 6, size: 3, needs: [0, 7, 13], data: 2 }), all(1, { sector: 2, needs: [] }), { ...all(2), needs: [4] }];
  for (let i = 0; i < 200; i++) {
    const a = { sector: i % 7, size: i % 4, data: i % 3, needs: [i % 14, (i * 5) % 14].filter((v, j, arr) => arr.indexOf(v) === j).sort((x, y) => x - y) };
    for (const q of R.scored) a[q.id] = (i + q.id.charCodeAt(1)) % 4;
    samples.push(a);
  }
  for (const a of samples) assert.deepEqual(R.decode(R.encode(a)), a, R.encode(a));
});
check('bad share codes are rejected', () => {
  for (const c of ['', 'zzzz', '<script>', '0'.repeat(41), '00[]', R.encode(all(1)) + '0', R.encode(all(1)).replace('[', ''), '00[7fff]0000000000']) assert.equal(R.decode(c), null, c);
});
check('recommend: picked needs, sector starters first, max 3', () => {
  const r = R.recommend(all(2, { needs: [10, 0, 4] }));
  assert.deepEqual(
    r.map((x) => x.slug),
    ['ai-receptionist', 'ai-sdr-agent', 'ai-document-processing-agent'],
  );
  assert.ok(r.every((x) => x.reason === 'need'));
});
check('recommend: sector fills in when fewer than 2 needs', () => {
  const r = R.recommend(all(2, { sector: 2, needs: [] }));
  assert.deepEqual(
    r.map((x) => x.slug),
    R.sectorAgents.retail,
  );
  const one = R.recommend(all(2, { sector: 0, needs: [6] }));
  assert.equal(one[0].slug, 'ai-seo-agent');
  assert.equal(one.length, 3);
  assert.equal(new Set(one.map((x) => x.slug)).size, 3);
});
check('recommend: prep note only when the dimension is under half', () => {
  const low = R.recommend({ ...all(3), k1: 0, k2: 0, needs: [9] });
  assert.ok(low[0].prep);
  const high = R.recommend(all(3, { needs: [9] }));
  assert.equal(high[0].prep, undefined);
});
check('bundle only for the sector bundle with 2+ recommended agents', () => {
  assert.equal(R.bundleFor(all(2, { sector: 0, needs: [] }), P.bundles), 'clinic-front-desk');
  assert.equal(R.bundleFor(all(2, { sector: 0, needs: [6, 10] }), P.bundles), null);
  assert.equal(R.bundleFor(all(2, { sector: 5, needs: [] }), P.bundles), null);
  assert.equal(R.bundleFor(all(2, { sector: 2, needs: [] }), P.bundles), 'ecommerce-support-desk');
});
check('weakest: at most 2, all under 67%, weakest first', () => {
  assert.deepEqual(R.weakest(all(3)), []);
  const w = R.weakest({ ...all(3), s1: 0, o1: 1, o2: 1 });
  assert.deepEqual(w, ['systems', 'people']);
});
check('isComplete', () => {
  assert.ok(R.isComplete(all(1)));
  const a = all(1);
  delete a.needs;
  assert.ok(!R.isComplete(a));
});

if (fails.length) {
  console.error(`check-readiness: ${fails.length} failed\n - ${fails.join('\n - ')}`);
  process.exit(1);
}
console.log(`check-readiness: ${n} checks passed`);
