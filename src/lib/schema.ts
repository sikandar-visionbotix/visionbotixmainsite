/**
 * JSON-LD helpers. Every node uses stable @ids so pages can reference the Organization and WebSite
 * without repeating them. Only emit facts that are also visible on the page (GEO: visible facts beat markup),
 * and never Review/AggregateRating without real reviews (CLAUDE.md).
 */
import { site } from '@/data/site';

export type Thing = Record<string, unknown>;
export interface FaqItem {
  q: string;
  a: string;
}
export interface Crumb {
  name: string;
  href: string;
}

export const abs = (path: string) => new URL(path, site.url).href;
export const ORG_ID = `${site.url}/#organization`;
export const WEBSITE_ID = `${site.url}/#website`;

const regionName = new Intl.DisplayNames(['en'], { type: 'region' });
const countries = (codes: readonly string[]) => codes.map((c) => ({ '@type': 'Country', name: regionName.of(c) ?? c, identifier: c }));

const stripHtml = (s: string) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

export function organization(): Thing {
  const f = site.facts;
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: site.name,
    legalName: site.legalName,
    url: `${site.url}/`,
    logo: { '@type': 'ImageObject', url: abs(site.logoFull.src), width: site.logoFull.width, height: site.logoFull.height },
    description: site.description,
    slogan: site.tagline,
    email: site.contact.email,
    telephone: site.contact.phone.replace(/\s+/g, '-'),
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.address.street,
      addressLocality: site.address.locality,
      addressCountry: site.address.country,
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'sales',
      email: site.contact.email,
      telephone: site.contact.phone.replace(/\s+/g, '-'),
      availableLanguage: ['English'], // TODO(owner): add Urdu/Arabic only if sales calls are offered in them
      areaServed: countries(site.areaServed),
    },
    areaServed: countries(site.areaServed),
    knowsAbout: site.knowsAbout,
    sameAs: [...site.social.map((s) => s.href), ...site.properties.map((p) => p.href)],
    ...(f.foundingYear ? { foundingDate: String(f.foundingYear) } : {}),
    ...(f.teamSize ? { numberOfEmployees: { '@type': 'QuantitativeValue', value: f.teamSize } } : {}),
    founder: { '@type': 'Person', name: site.founder.name, jobTitle: site.founder.jobTitle, sameAs: [site.founder.url] },
  };
}

export function website(): Thing {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: `${site.url}/`,
    name: site.name,
    description: site.description,
    publisher: { '@id': ORG_ID },
    inLanguage: 'en',
  };
}

export function webPage(opts: { url: string; name: string; description: string; type?: string }): Thing {
  return {
    '@type': opts.type ?? 'WebPage',
    '@id': `${opts.url}#webpage`,
    url: opts.url,
    name: opts.name,
    description: opts.description,
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': ORG_ID },
    inLanguage: 'en',
  };
}

export interface ServiceInput {
  name: string;
  description: string;
  path: string;
  serviceType?: string;
  /** Single "from" price (services, S4). */
  priceFrom?: { amount: number; currency: string; unitText?: string } | undefined;
  /** Several "from" prices, e.g. an agent's one-off setup and its monthly fee (src/data/pricing.ts). */
  offers?: OfferInput[] | undefined;
  areaServed?: readonly string[];
}
export interface OfferInput {
  name: string;
  amount: number;
  currency: string;
  /** Recurring billing period as UN/CEFACT code, e.g. "MON" for monthly. Omit for one-off fees. */
  billingUnit?: 'MON' | 'ANN';
}

function offer(path: string, o: OfferInput): Thing {
  return {
    '@type': 'Offer',
    name: o.name,
    url: abs(path),
    priceCurrency: o.currency,
    availability: 'https://schema.org/InStock',
    seller: { '@id': ORG_ID },
    priceSpecification: {
      '@type': o.billingUnit ? 'UnitPriceSpecification' : 'PriceSpecification',
      minPrice: o.amount,
      priceCurrency: o.currency,
      ...(o.billingUnit ? { unitCode: o.billingUnit, referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: o.billingUnit } } : {}),
    },
  };
}

export function service(s: ServiceInput): Thing {
  const offers = s.offers?.length
    ? s.offers.map((o) => offer(s.path, o))
    : s.priceFrom
      ? [
          {
            '@type': 'Offer',
            url: abs(s.path),
            priceCurrency: s.priceFrom.currency,
            priceSpecification: {
              '@type': 'PriceSpecification',
              minPrice: s.priceFrom.amount,
              priceCurrency: s.priceFrom.currency,
              ...(s.priceFrom.unitText ? { unitText: s.priceFrom.unitText } : {}),
            },
          },
        ]
      : [];
  return {
    '@type': 'Service',
    '@id': `${abs(s.path)}#service`,
    name: s.name,
    description: s.description,
    url: abs(s.path),
    serviceType: s.serviceType ?? s.name,
    provider: { '@id': ORG_ID },
    areaServed: countries(s.areaServed ?? site.areaServed),
    ...(offers.length === 1 ? { offers: offers[0] } : offers.length > 1 ? { offers } : {}),
  };
}

/**
 * Our own products. Security products are `Product` (hardware/appliances, no public price: no `offers`, and never
 * Review/AggregateRating). Software platforms such as Wakeel are `WebApplication`.
 */
export function product(p: {
  name: string;
  description: string;
  path: string;
  kind: 'Product' | 'WebApplication';
  category: string;
  image?: string | undefined;
  externalUrl?: string | undefined;
}): Thing {
  return {
    '@type': p.kind,
    '@id': `${abs(p.path)}#product`,
    name: p.name,
    description: p.description,
    url: abs(p.path),
    ...(p.kind === 'Product'
      ? { category: p.category, brand: { '@type': 'Brand', name: site.name }, manufacturer: { '@id': ORG_ID } }
      : { applicationCategory: 'BusinessApplication', operatingSystem: 'Web', creator: { '@id': ORG_ID }, publisher: { '@id': ORG_ID } }),
    ...(p.image ? { image: abs(p.image) } : {}),
    ...(p.externalUrl ? { sameAs: [p.externalUrl] } : {}),
  };
}

/** An ordered list of links (hub pages), e.g. every agent on /ai-agents/. */
export function itemList(opts: { path: string; name: string; items: { name: string; path: string }[] }): Thing {
  return {
    '@type': 'ItemList',
    '@id': `${abs(opts.path)}#list`,
    name: opts.name,
    numberOfItems: opts.items.length,
    itemListElement: opts.items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, url: abs(it.path) })),
  };
}

export function faqPage(items: FaqItem[]): Thing {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({
      '@type': 'Question',
      name: stripHtml(i.q),
      acceptedAnswer: { '@type': 'Answer', text: stripHtml(i.a) },
    })),
  };
}

export function breadcrumbList(trail: Crumb[]): Thing {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: abs(c.href) })),
  };
}

/** Wraps nodes in one @graph document. */
export function graph(...nodes: Thing[]): Thing {
  return { '@context': 'https://schema.org', '@graph': nodes };
}
