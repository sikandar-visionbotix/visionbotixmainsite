import { getCollection, type CollectionEntry } from 'astro:content';
import { services } from '@/data/catalogue';

export type WorkEntry = CollectionEntry<'work'>;

const isProductionBuild = process.env.VERCEL_ENV === 'production' || process.env.SITE_LAUNCH === '1';

/**
 * Published case studies, featured first, then by `order`. ALWAYS read case studies through this function:
 * it is the launch gate. A production build (VERCEL_ENV=production or SITE_LAUNCH=1) fails while any published
 * entry is still an unverified mock. (The schema has the same rule, but the content cache can skip it.)
 */
export async function getWork(): Promise<WorkEntry[]> {
  const all = await getCollection('work', (e) => !e.data.draft);
  const mocks = all.filter((e) => !e.data.verified);
  if (isProductionBuild && mocks.length) {
    throw new Error(
      `Launch gate: ${mocks.length} case stud${mocks.length === 1 ? 'y is' : 'ies are'} still unverified mocks: ${mocks.map((m) => m.id).join(', ')}. ` +
        'The owner must check each one and set `verified: true`, or set `draft: true`.',
    );
  }
  return all.sort((a, b) => Number(b.data.featured) - Number(a.data.featured) || a.data.order - b.data.order);
}

/** Filter groups for the /work/ hub (zero-JS chips). */
export const workFilters = [
  { key: 'ai', label: 'AI & automation', kinds: ['ai', 'automation'] },
  { key: 'vision', label: 'Computer vision', kinds: ['computer-vision'] },
  { key: 'mobile', label: 'Mobile apps', kinds: ['ios', 'android'] },
  { key: 'web', label: 'Web & SaaS', kinds: ['web', 'saas', 'marketplace', 'desktop'] },
  { key: 'robotics', label: 'Robotics & IoT', kinds: ['robotics', 'iot', 'hardware'] },
] as const;

export const filterKeysFor = (kinds: readonly string[]) =>
  workFilters.filter((f) => f.kinds.some((k) => kinds.includes(k))).map((f) => f.key);

const kindLabels: Record<string, string> = {
  web: 'Web', ios: 'iOS', android: 'Android', desktop: 'Desktop', ai: 'AI', 'computer-vision': 'Computer vision',
  marketplace: 'Marketplace', hardware: 'Hardware', saas: 'SaaS', iot: 'IoT', robotics: 'Robotics', automation: 'Automation',
};
export const kindLabel = (k: string) => kindLabels[k] ?? k;
export const serviceName = (slug: string) => services.find((s) => s.slug === slug)?.name ?? slug;
