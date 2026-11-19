/**
 * Posts (S10): read posts through `getPosts()`. It fails the build when a post breaks the hub-and-spoke rule (PLAN
 * §6.3): every money page named in `related` must also be linked from the post's body, so a post can never point at
 * a page only in its card list. Everything shared by the hub, tag, author and post pages is computed here.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import { tags, tagBySlug, type TagSlug } from '@/data/resources';
import { fillTokens } from '@/lib/tokens';

export type PostEntry = CollectionEntry<'posts'>;
export type PostData = PostEntry['data'];

const money = { agents: 'ai-agents', services: 'services', industries: 'industries', locations: 'locations' } as const;

/** Paths of the money pages a post sells into, e.g. /ai-agents/ai-receptionist/. */
export function relatedPaths(d: PostData): string[] {
  return (Object.keys(money) as (keyof typeof money)[]).flatMap((k) => d.related[k].map((r) => `/${money[k]}/${r.id}/`));
}

export async function getPosts(): Promise<PostEntry[]> {
  const all = await getCollection('posts', (e) => !e.data.draft);
  const problems: string[] = [];
  for (const e of all) {
    for (const p of relatedPaths(e.data)) if (!e.body?.includes(`](${p}`)) problems.push(`${e.id}: related page ${p} is not linked in the body`);
    if (e.data.updated < e.data.pubDate) problems.push(`${e.id}: updated is before pubDate`);
  }
  if (problems.length) throw new Error(`Posts:\n - ${problems.join('\n - ')}`);
  return all.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime() || a.data.title.localeCompare(b.data.title));
}

/** Words in the body (and glossary terms), for reading time and `wordCount`. */
export function wordCount(e: PostEntry): number {
  const text = (e.body ?? '').replace(/\{\{[^}]+\}\}/g, 'x').replace(/\]\([^)]*\)/g, ']').replace(/[#|*_>`-]/g, ' ');
  const terms = e.data.terms.map((t) => `${t.term} ${t.definition}`).join(' ');
  return `${text} ${terms}`.split(/\s+/).filter(Boolean).length;
}
export const readingMinutes = (e: PostEntry) => Math.max(1, Math.round(wordCount(e) / 230));

/** Tags with at least 2 posts get a page; a tag with one post is shown as plain text (no thin pages). */
export function liveTags(all: PostEntry[]) {
  return tags
    .map((t) => ({ ...t, posts: all.filter((e) => e.data.tags.includes(t.slug)) }))
    .filter((t) => t.posts.length >= 2);
}
export const tagName = (s: TagSlug) => tagBySlug(s)?.name ?? s;
/** The card's second label: the first tag that doesn't just repeat the format ("Comparison · Comparisons"). */
export const cardTag = (d: PostData) => tagName(d.tags.find((t) => !(d.format === 'comparison' && t === 'comparisons')) ?? d.tags[0]!);

/** Up to n other posts, ranked by shared tags, then shared money pages, then newest. */
export function relatedPosts(e: PostEntry, all: PostEntry[], n = 3): PostEntry[] {
  const mine = new Set(relatedPaths(e.data));
  const score = (o: PostEntry) =>
    o.data.tags.filter((t) => e.data.tags.includes(t)).length * 3 + relatedPaths(o.data).filter((p) => mine.has(p)).length;
  return all
    .filter((o) => o.id !== e.id)
    .map((o) => ({ o, s: score(o) }))
    .sort((a, b) => b.s - a.s || b.o.data.pubDate.getTime() - a.o.data.pubDate.getTime())
    .slice(0, n)
    .map((x) => x.o);
}

/** Posts that sell into (or link from their body to) a money page: the backlinks on agent, service, industry and country pages. */
export async function guidesFor(path: string, n = 3): Promise<PostEntry[]> {
  const all = await getPosts();
  const hits = all.filter((e) => relatedPaths(e.data).includes(path) || e.body?.includes(`](${path})`) || e.body?.includes(`](${path}#`));
  // Posts that name the page in `related` come first.
  return hits.sort((a, b) => Number(relatedPaths(b.data).includes(path)) - Number(relatedPaths(a.data).includes(path))).slice(0, n);
}

export const postDate = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
export const isoDate = (d: Date) => d.toISOString().slice(0, 10);

/** Front-matter text with price tokens filled (summary, FAQ answers, excerpts). */
export const filled = fillTokens;
