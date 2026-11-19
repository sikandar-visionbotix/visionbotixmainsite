/**
 * Own products (S5): read them through `getProducts()`. It keeps the content collection and the menu catalogue
 * (`src/data/catalogue.ts` → `products`) in step and fails the build if they drift, like getAgents()/getServices().
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import { products as catalogue } from '@/data/catalogue';

export type ProductEntry = CollectionEntry<'products'>;

export async function getProducts(): Promise<ProductEntry[]> {
  const all = await getCollection('products', (e) => !e.data.draft);
  const problems: string[] = [];
  for (const c of catalogue) {
    const e = all.find((p) => p.id === c.slug);
    if (!e) problems.push(`catalogue product "${c.slug}" has no content file in src/content/products/`);
    else {
      if (e.data.name !== c.name) problems.push(`${c.slug}: name "${e.data.name}" ≠ catalogue "${c.name}"`);
      if (e.data.icon !== c.icon) problems.push(`${c.slug}: icon "${e.data.icon}" ≠ catalogue "${c.icon}"`);
    }
  }
  for (const e of all) if (!catalogue.some((c) => c.slug === e.id)) problems.push(`content file "${e.id}" is not in the catalogue (menus would miss it)`);
  if (problems.length) throw new Error(`Product catalogue out of sync:\n - ${problems.join('\n - ')}`);
  return all.sort((a, b) => a.data.order - b.data.order);
}

export const categoryLabel: Record<ProductEntry['data']['category'], string> = {
  'security-hardware': 'Security hardware',
  'security-software': 'Security software',
  training: 'Training and testing',
  platform: 'AI platform',
  app: 'App',
};
