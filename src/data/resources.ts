/**
 * /resources/ (S10): tags, authors and hub copy. Posts live in src/content/posts/ and are read through getPosts()
 * (src/lib/posts.ts).
 *
 * Tags are a fixed list so the tag pages stay few and useful: a tag page is built only once 2+ posts carry the tag
 * (no thin pages); with one post the chip renders as plain text.
 * Authors are real people only (E-E-A-T, CLAUDE.md "never fabricate proof"). The bio states owner-confirmed facts.
 */
import { site } from './site';

export const tags = [
  { slug: 'pricing', name: 'Pricing and costs', blurb: 'What AI agents, apps and software teams cost in 2026, with the numbers behind the ranges.' },
  { slug: 'ai-agents', name: 'AI agents', blurb: 'How AI agents work, where they pay off and how to put one into a real business.' },
  { slug: 'comparisons', name: 'Comparisons', blurb: 'Side-by-side answers to the "this or that" questions buyers ask before they commit.' },
  { slug: 'outsourcing', name: 'Outsourcing', blurb: 'Hiring an offshore team: rates, time zones, contracts and what to check first.' },
  { slug: 'software-development', name: 'Software development', blurb: 'Building web apps, mobile apps and SaaS products: scope, cost and timelines.' },
  { slug: 'ai-explained', name: 'AI explained', blurb: 'Plain-English explanations of the terms and protocols behind modern AI systems.' },
] as const;
export type TagSlug = (typeof tags)[number]['slug'];
export const tagSlugs = tags.map((t) => t.slug) as [TagSlug, ...TagSlug[]];
export const tagBySlug = (s: string) => tags.find((t) => t.slug === s);

/** Post formats: the card label and, for the glossary, extra structured data (DefinedTermSet). */
export const formats = { guide: 'Guide', 'cost-guide': 'Cost guide', comparison: 'Comparison', explainer: 'Explainer', glossary: 'Glossary' } as const;
export type PostFormat = keyof typeof formats;

export const authors = [
  {
    slug: 'sikandar-farooq',
    name: site.founder.name,
    jobTitle: `${site.founder.jobTitle}, ${site.name}`,
    url: site.founder.url,
    /** Owner-confirmed facts only (site.facts). TODO(owner): review (TRACKER "Needs from owner", S10). */
    bio: `${site.founder.name} founded ${site.name} in ${site.facts.foundingYear}. He leads an engineering team of ${site.facts.teamSize} in ${site.address.locality}, Pakistan, that has delivered ${site.facts.projectsDelivered}+ projects for clients in ${site.facts.countriesServed} countries: AI agents, web and mobile apps, SaaS products, computer vision and security hardware.`,
    knowsAbout: ['AI agents', 'Software development', 'Offshore software teams', 'Computer vision', 'Cybersecurity'],
  },
] as const;
export type AuthorSlug = (typeof authors)[number]['slug'];
export const authorSlugs = authors.map((a) => a.slug) as [AuthorSlug, ...AuthorSlug[]];
export const authorBySlug = (s: string) => authors.find((a) => a.slug === s)!;

export const resourcesHero = {
  eyebrow: 'Resources',
  title: 'Straight answers on AI agents, software costs and outsourcing.',
  accent: 'software costs',
  lead: 'Cost guides with real numbers, comparisons that admit trade-offs, and plain-English explainers. Written by the people who build these systems, and updated when prices or tools change.',
};
