/**
 * Content collections: typed data for every templated page (PLAN.md §9).
 * Each collection lives in src/content/<name>/. Files starting with "_" are ignored, so each folder has a
 * documented `_template.*` to copy. Adding an agent, service, country… is just adding a file.
 *
 * Truth policy built into the schemas (CLAUDE.md):
 *  - prices are optional and null until the owner approves them (TRACKER ⛔S3/S6);
 *  - case studies are anonymous (no client names or links) and mocks can't reach production (see `work`);
 *  - every outcome needs a `source`;
 *  - there is deliberately no testimonial/rating/review field anywhere (decision D12).
 */
import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const md = (base: string) => glob({ base: `./src/content/${base}`, pattern: '**/[^_]*.md' });

/* ---------- shared pieces ---------- */
const faq = z.array(z.object({ q: z.string().min(8), a: z.string().min(20) })).default([]);

const seo = z.object({
  /** ≤ 60 chars incl. " | Visionbotix"; primary keyword first. */
  title: z.string().max(60),
  /** 70–155 chars, answer-first. */
  description: z.string().min(70).max(155),
});

const keywords = z.object({
  primary: z.string(),
  secondary: z.array(z.string()).default([]),
});

const priceFrom = z
  .object({
    setup: z.number().positive().nullable().default(null),
    monthly: z.number().positive().nullable().default(null),
    currency: z.enum(['USD', 'GBP', 'EUR', 'AUD', 'CAD', 'AED', 'SAR', 'PKR']).default('USD'),
    note: z.string().optional(),
  })
  .nullable()
  .default(null);

const titled = z.object({ title: z.string(), body: z.string() });

const base = z.object({
  seo,
  keywords,
  /** 40–60 word answer-first intro shown under the H1 (GEO: this is what AI answers quote). */
  summary: z.string().min(120).max(480),
  updated: z.coerce.date(),
  draft: z.boolean().default(false),
  order: z.number().default(100),
  faq,
});

/* ---------- agents (S3) ---------- */
const agents = defineCollection({
  loader: md('agents'),
  schema: base.extend({
    name: z.string(),
    tagline: z.string(),
    group: z.enum(['answer', 'sell', 'market', 'operate', 'secure-build']),
    icon: z.string(),
    verbs: z.array(z.string()).min(3).max(6),
    dayInLife: z.array(z.object({ time: z.string(), step: z.string() })).default([]),
    useCases: z.array(titled).default([]),
    integrations: z.array(z.string()).default([]),
    controls: z.array(z.string()).default([]),
    security: z.array(z.string()).default([]),
    setup: z.array(titled).default([]),
    timeline: z.string().default('Live in about 2 weeks'),
    priceFrom,
    related: z
      .object({
        agents: z.array(reference('agents')).default([]),
        services: z.array(reference('services')).default([]),
        industries: z.array(reference('industries')).default([]),
      })
      .default({ agents: [], services: [], industries: [] }),
  }),
});

/* ---------- services (S4) ---------- */
const services = defineCollection({
  loader: md('services'),
  schema: base.extend({
    name: z.string(),
    tagline: z.string(),
    pillar: z.enum(['ai', 'software', 'deeptech']),
    icon: z.string(),
    offerings: z.array(titled).default([]),
    process: z.array(titled).default([]),
    stack: z.array(z.string()).default([]),
    engagement: z.array(z.enum(['fixed-scope', 'monthly-retainer', 'dedicated-team', 'audit'])).default([]),
    priceFrom,
    related: z
      .object({
        agents: z.array(reference('agents')).default([]),
        services: z.array(reference('services')).default([]),
        work: z.array(reference('work')).default([]),
      })
      .default({ agents: [], services: [], work: [] }),
  }),
});

/* ---------- industries (S8) ---------- */
const industries = defineCollection({
  loader: md('industries'),
  schema: base.extend({
    name: z.string(),
    tagline: z.string(),
    icon: z.string(),
    painPoints: z.array(z.string()).default([]),
    useCases: z.array(titled).default([]),
    compliance: z.array(z.string()).default([]),
    bundle: z.string().optional(),
    agents: z.array(reference('agents')).default([]),
    services: z.array(reference('services')).default([]),
  }),
});

/* ---------- locations (S9) ---------- */
const locations = defineCollection({
  loader: md('locations'),
  schema: base.extend({
    country: z.string(),
    /** ISO 3166-1 alpha-2 */
    code: z.string().length(2),
    region: z.enum(['north-america', 'europe', 'gcc', 'apac', 'south-asia']),
    currency: z.string().length(3),
    spelling: z.enum(['us', 'uk']).default('us'),
    overlap: z.string(),
    compliance: z.array(z.string()).default([]),
    localTerms: z.array(z.string()).default([]),
    industries: z.array(reference('industries')).default([]),
    services: z.array(reference('services')).default([]),
  }),
});

/* ---------- work / case studies ----------
 * ANONYMOUS BY DESIGN (owner, 2026-11-19): clients must not be named or linked. There is no client-name field and
 * links are only allowed for our own products. Content files live in a GitHub repo, so never write a client's
 * name, URL or identifying detail anywhere in them, not even in comments.
 *
 * Mock vs verified: `verified: false` entries are pre-launch mocks (adapted from icasta.com, YouTube or owner notes).
 * They render on previews with noindex, and a production build (VERCEL_ENV=production or SITE_LAUNCH=1) refuses
 * to ship any published entry that is still unverified. The owner flips `verified: true` after checking the facts. */
const isProductionBuild = process.env.VERCEL_ENV === 'production' || process.env.SITE_LAUNCH === '1';
const serviceSlugs = [
  'ai-agent-development', 'generative-ai-development', 'ai-automation', 'ai-chatbot-development', 'ai-voice-agents', 'ai-consulting',
  'custom-software-development', 'web-app-development', 'mobile-app-development', 'saas-mvp-development', 'ui-ux-design',
  'cloud-devops', 'dedicated-teams', 'computer-vision', 'iot-embedded', 'cybersecurity',
] as const;

const work = defineCollection({
  loader: md('work'),
  schema: ({ image }) =>
    base
      .extend({
        /** Descriptive title, never a client or product brand name. */
        title: z.string(),
        /** Anonymous description of the client, e.g. "A multi-vendor marketplace operator". */
        clientType: z.string(),
        sector: z.string(),
        region: z.enum(['Global', 'North America', 'Europe', 'UK', 'GCC', 'South Asia', 'Asia Pacific']).default('Global'),
        kind: z
          .array(z.enum(['web', 'ios', 'android', 'desktop', 'ai', 'computer-vision', 'marketplace', 'hardware', 'saas', 'iot', 'robotics', 'automation']))
          .min(1),
        year: z.number().int().min(2015).max(2100).optional(),
        /** Our own product (not client work): only then are public links allowed. */
        ownProduct: z.boolean().default(false),
        links: z.array(z.object({ label: z.string(), href: z.url() })).default([]),
        challenge: z.string().min(60),
        approach: z.string().min(60),
        built: z.array(z.string()).min(3),
        highlights: z.array(z.string()).default([]),
        stack: z.array(z.string()).default([]),
        /** Only measured, owner-supplied outcomes, each with a source. */
        outcomes: z.array(z.object({ label: z.string(), value: z.string(), source: z.string().min(3) })).default([]),
        cover: image().optional(),
        coverAlt: z.string().optional(),
        /** Illustration used when there is no screenshot (anonymous by design). */
        art: z.enum(['marketplace', 'mobile', 'vision', 'agent', 'dashboard', 'robot', 'health', 'kiosk', 'farm', 'security']).default('dashboard'),
        services: z.array(z.enum(serviceSlugs)).min(1),
        featured: z.boolean().default(false),
        /** Owner has checked every fact on this page. false = pre-launch mock. */
        verified: z.boolean().default(false),
        /** Where the mock text came from (internal provenance, not rendered). */
        provenance: z.enum(['owner', 'icasta', 'youtube', 'app-store', 'visionbotix-site']),
      })
      .refine((d) => d.ownProduct || d.links.length === 0, {
        message: 'Client work must not link to the client (owner rule). Links are only allowed when ownProduct: true.',
        path: ['links'],
      })
      .refine((d) => !(isProductionBuild && !d.draft && !d.verified), {
        message: 'Unverified mock case study in a production build. The owner must check it and set verified: true, or set draft: true.',
        path: ['verified'],
      }),
});

/* ---------- products (S5) ---------- */
const products = defineCollection({
  loader: md('products'),
  schema: ({ image }) =>
    base.extend({
      name: z.string(),
      tagline: z.string(),
      category: z.enum(['security-hardware', 'security-software', 'training', 'platform', 'app']),
      /** Old URL that must keep working, e.g. "/ip-encryptor.html". */
      legacyPath: z.string().startsWith('/').optional(),
      externalUrl: z.url().optional(),
      features: z.array(titled).default([]),
      specs: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
      cover: image().optional(),
    }),
});

/* ---------- posts (S10) ---------- */
const posts = defineCollection({
  loader: md('posts'),
  schema: ({ image }) =>
    z.object({
      title: z.string().max(70),
      description: z.string().min(70).max(155),
      pubDate: z.coerce.date(),
      updated: z.coerce.date().optional(),
      author: z.string(),
      tags: z.array(z.string()).default([]),
      keyword: z.string(),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      draft: z.boolean().default(false),
      faq,
      related: z.array(z.union([reference('agents'), reference('services')])).default([]),
    }),
});

/* ---------- faqs (shared Q&A sets, e.g. pricing, process, security) ---------- */
const faqs = defineCollection({
  loader: glob({ base: './src/content/faqs', pattern: '**/[^_]*.{yaml,yml,json}' }),
  schema: z.object({
    topic: z.string(),
    items: z.array(z.object({ q: z.string(), a: z.string() })).min(1),
  }),
});

export const collections = { agents, services, industries, locations, work, products, posts, faqs };
