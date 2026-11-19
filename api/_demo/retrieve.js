/**
 * Tiny BM25 search for the demos' sample documents and the concierge's site knowledge (S7). In memory, no
 * embeddings and no external service: the corpora are small and fixed, and every answer must cite what it used.
 */
const STOP = new Set(
  'a an and are as at be but by can do does for from has have how i if in into is it its me my no not of on or our so than that the their them then there these they this to too us was we what when where which who why will with you your'.split(
    ' ',
  ),
);

export const tokens = (s) =>
  String(s)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9$€£ ]+/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP.has(w))
    .map((w) => (w.length > 4 ? w.replace(/(ies|es|s|ing|ed)$/, '') : w));

/**
 * @template {{ id: string, title: string, text: string }} T
 * @param {T[]} docs
 */
export function index(docs) {
  const toks = docs.map((d) => tokens(`${d.title} ${d.title} ${d.text}`));
  const avg = toks.reduce((n, t) => n + t.length, 0) / Math.max(1, toks.length);
  const df = new Map();
  for (const t of toks) for (const w of new Set(t)) df.set(w, (df.get(w) ?? 0) + 1);
  const N = docs.length;
  const idf = (w) => Math.log(1 + (N - (df.get(w) ?? 0) + 0.5) / ((df.get(w) ?? 0) + 0.5));
  const tf = toks.map((t) => {
    const m = new Map();
    for (const w of t) m.set(w, (m.get(w) ?? 0) + 1);
    return m;
  });
  /**
   * @param {string} query
   * @param {number} [k]
   * @param {(d: T) => boolean} [allow] access filter (roles in the Knowledge demo)
   * @returns {(T & { score: number })[]}
   */
  return function search(query, k = 4, allow = () => true) {
    const q = [...new Set(tokens(query))];
    if (!q.length) return [];
    const k1 = 1.4;
    const b = 0.75;
    const scored = docs.map((d, i) => {
      let s = 0;
      for (const w of q) {
        const f = tf[i].get(w);
        if (f) s += idf(w) * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * toks[i].length) / avg)));
      }
      return { ...d, score: s };
    });
    // Relative cutoff: keep documents scoring at least 35% of the best match (restricted ones included), so a weak
    // keyword overlap never stands in for the real answer.
    const top = Math.max(0, ...scored.map((d) => d.score));
    return scored
      .filter((d) => d.score > 0.8 && d.score >= top * 0.35 && allow(d))
      .sort((a, b2) => b2.score - a.score)
      .slice(0, k);
  };
}
