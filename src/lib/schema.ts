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
  /** Only once the owner has approved prices (TRACKER ⛔S3/S6). */
  priceFrom?: { amount: number; currency: string; unitText?: string } | undefined;
  areaServed?: readonly string[];
}

export function service(s: ServiceInput): Thing {
  return {
    '@type': 'Service',
    '@id': `${abs(s.path)}#service`,
    name: s.name,
    description: s.description,
    url: abs(s.path),
    serviceType: s.serviceType ?? s.name,
    provider: { '@id': ORG_ID },
    areaServed: countries(s.areaServed ?? site.areaServed),
    ...(s.priceFrom
      ? {
          offers: {
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
        }
      : {}),
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
