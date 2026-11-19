/**
 * Site-wide facts. Only real, owner-confirmed facts go here (see CLAUDE.md "Never fabricate proof").
 * Anything still unconfirmed is `null` and marked TODO(owner); components hide what is null.
 */
export const site = {
  name: 'Visionbotix',
  legalName: 'Visionbotix SMC-Private Limited', // as registered on the Apple App Store developer account
  url: 'https://visionbotix.com',
  tagline: 'AI agents and software that do the work.',
  description:
    'Visionbotix is an AI-first product engineering studio. We build AI agents that do real work, plus the web, mobile and SaaS software they run in, with security built in.',
  locale: 'en_US',
  /** Original logo (owner's hi-res file assets/visionbotix-logo-trimmed.png, 2026-11-19). `logo` = UI size (3x of 32px). */
  logo: { src: '/images/brand/visionbotix-logo-96.png', width: 338, height: 96 },
  logoFull: { src: '/images/brand/visionbotix-logo.png', width: 665, height: 189 },
  ogDefault: '/images/og/default.png',

  contact: {
    email: 'hello@visionbotix.com', // owner will create this inbox (2026-11-19); also receives form enquiries
    phone: '+92 51 8896050', // TODO(owner): confirm still current (TRACKER "Needs from owner")
    phoneHref: 'tel:+92518896050',
    whatsapp: null as string | null, // TODO(owner): WhatsApp Business number, digits only, e.g. "923001234567"
    bookingUrl: '/contact/', // TODO(owner): Cal.com or Calendly link; until then the contact page
  },

  address: {
    // Owner, 2026-11-19: new office
    street: '2nd Floor, Meridian Software Technology Park, Satellite Town, Murree Road',
    locality: 'Rawalpindi',
    country: 'PK',
    countryName: 'Pakistan',
  },

  /** Confirmed-active profiles only. TODO(owner): confirm each one (TRACKER "Needs from owner"). */
  social: [
    { name: 'LinkedIn', href: 'https://linkedin.com/company/visionbotix', icon: 'linkedin' },
    { name: 'Facebook', href: 'https://www.facebook.com/visionbotix', icon: 'facebook' },
    { name: 'Instagram', href: 'https://www.instagram.com/visionbotix', icon: 'instagram' },
    { name: 'YouTube', href: 'https://www.youtube.com/channel/UCZLe7Lz7Dg637D5bDiexa3g', icon: 'youtube' },
  ],

  /** Sister sites that already exist. */
  properties: [
    { name: 'Smart Livestock', href: 'https://livestock.visionbotix.com' },
    { name: 'Vision AI cameras', href: 'https://cv.visionbotix.com' },
  ],

  /** Markets we sell into (schema `areaServed`, decision D3). ISO 3166-1 alpha-2. */
  areaServed: ['US', 'GB', 'AU', 'NZ', 'CA', 'AE', 'SA', 'QA', 'KW', 'OM', 'PK', 'DE', 'CH', 'AT', 'IE', 'NL'],

  knowsAbout: [
    'AI agents',
    'Agentic AI',
    'Generative AI',
    'Retrieval-augmented generation',
    'Model Context Protocol',
    'Workflow automation',
    'Custom software development',
    'Web application development',
    'Mobile app development',
    'SaaS MVP development',
    'Computer vision',
    'IoT and embedded systems',
    'FPGA',
    'Cybersecurity',
  ],

  /** Owner-confirmed, 2026-11-19. Projects include our team's work delivered as iCasta (owner: "say our team's work"). */
  facts: {
    foundingYear: 2020 as number | null,
    teamSize: 30 as number | null,
    projectsDelivered: 50 as number | null,
    countriesServed: 20 as number | null,
  },
  /** Countries we have delivered to, as named by the owner (a selection of the 20). */
  deliveredIn: ['the USA', 'the UK', 'Germany', 'Switzerland', 'Austria', 'Australia', 'New Zealand', 'the UAE'],

  /** Founder (schema `founder` + About page). The owner prefers not to list the team. */
  founder: { name: 'Sikandar Farooq', jobTitle: 'Founder', url: 'https://www.linkedin.com/in/sikandar-farooq/' },

  /**
   * Search-engine verification. Paste the token from each tool and the meta tag appears on every page.
   * Google Search Console: Settings → Ownership verification → HTML tag → the `content` value.
   * Bing Webmaster Tools: can import the site from Search Console instead (no token needed).
   */
  verification: {
    google: null as string | null,
    bing: null as string | null,
    yandex: null as string | null,
  },
  /** IndexNow key (Bing, Yandex, Seznam, Naver). The matching key file is public/<key>.txt. */
  indexNowKey: '53935372858f2b1b18f76e0002961315',
} as const;

export type Site = typeof site;
