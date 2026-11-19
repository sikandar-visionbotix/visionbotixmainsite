/** RSS 2.0 feed of /resources/ (S10). No dependency: the feed is small and the format is stable. */
import type { APIRoute } from 'astro';
import { site } from '@/data/site';
import { authorBySlug } from '@/data/resources';
import { getPosts, filled } from '@/lib/posts';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const GET: APIRoute = async () => {
  const posts = await getPosts();
  const url = (p: string) => new URL(p, site.url).href;
  const latest = posts.reduce((m, p) => (p.data.updated > m ? p.data.updated : m), new Date(0));
  const items = posts
    .map((p) => {
      const link = url(`/resources/${p.id}/`);
      return `    <item>
      <title>${esc(p.data.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${p.data.pubDate.toUTCString()}</pubDate>
      <dc:creator>${esc(authorBySlug(p.data.author).name)}</dc:creator>
      <description>${esc(filled(p.data.summary))}</description>
${p.data.tags.map((t) => `      <category>${t}</category>`).join('\n')}
    </item>`;
    })
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${esc(site.name)} Resources</title>
    <link>${url('/resources/')}</link>
    <atom:link href="${url('/resources/rss.xml')}" rel="self" type="application/rss+xml" />
    <description>Cost guides, comparisons and explainers on AI agents, software development and offshore teams.</description>
    <language>en</language>
    <lastBuildDate>${latest.toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
