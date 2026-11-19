/**
 * Build-time index for the prompt-first hero ("Describe what you need", owner request S5, after the Wakeel pattern).
 * The visitor's text is matched in the browser against this list: nothing is sent anywhere until they choose to
 * carry the brief into the contact form. S7 can swap the matcher for the live LLM concierge without changing the UI.
 *
 * Keywords = catalogue names + each page's own SEO keywords + the plain words buyers use (below).
 */
import { getCollection } from 'astro:content';
import { agents, services, industries } from '@/data/catalogue';
import { priceLabel, serviceLabel } from '@/data/pricing';

/** Plain buyer words per slug. Multi-word phrases score higher than single words. */
const words: Record<string, string> = {
  // agents
  'ai-receptionist': 'call calls phone receptionist answer missed calls voicemail after hours front desk appointment clinic dental salon',
  'ai-customer-support-agent': 'support tickets helpdesk customer service customer support faq questions refund returns zendesk intercom live chat',
  'whatsapp-ai-agent': 'whatsapp orders order status cart abandoned cart catalog shop store replies',
  'ai-booking-agent': 'book booking appointments leads lead follow up follow-up speed to lead calendar schedule demo enquiries inquiries',
  'ai-sdr-agent': 'outbound prospect prospecting sdr cold email meetings b2b sales pipeline linkedin outreach',
  'ai-social-media-agent': 'social social media instagram facebook posts content tiktok captions comments schedule posts',
  'ai-seo-agent': 'seo google ranking rank chatgpt ai search blog traffic geo citations perplexity',
  'ai-ads-agent': 'ads meta ads google ads campaigns roas ad spend budget ppc',
  'ai-reputation-agent': 'reviews google reviews reputation ratings review replies',
  'ai-knowledge-assistant': 'documents knowledge policies handbook internal rag search docs company brain sop wiki',
  'ai-document-processing-agent': 'invoice invoices bills contracts pdf pdfs kyc extract forms receipts paperwork documents ocr quickbooks xero accounting',
  'ai-workflow-automation-agent': 'automate automation workflow email crm erp data entry zapier n8n make spreadsheet excel repetitive manual back office quickbooks xero',
  'ai-data-analyst-agent': 'database sql reports reporting dashboard analytics kpi data questions numbers',
  'mcp-server-development': 'mcp claude chatgpt copilot connector connect ai to our systems tools',
  'ai-security-audit': 'jailbreak prompt injection red team llm security guardrails ai safety leak',
  'ai-mvp-development': 'mvp ai product ai startup ai idea ai app prototype',
  // services
  'ai-agent-development': 'custom agent agents agentic multi-agent ai agent',
  'generative-ai-development': 'genai generative llm gpt rag fine-tune fine tuning openai',
  'ai-automation': 'automation agency automate processes',
  'ai-chatbot-development': 'chatbot chat bot website chat',
  'ai-voice-agents': 'voice agent voice ai call center call centre phone agent',
  'ai-consulting': 'strategy where to start roadmap consulting consultant audit advice',
  'custom-software-development': 'software system erp legacy modernize modernise rebuild internal tool portal',
  'web-app-development': 'website web app web portal dashboard landing page web platform',
  'mobile-app-development': 'mobile app ios android app store play store flutter react native iphone app',
  'saas-mvp-development': 'saas subscription platform mvp startup marketplace launch product',
  'ui-ux-design': 'design ux ui redesign figma user experience prototype',
  'cloud-devops': 'cloud aws azure gcp devops ci/cd kubernetes hosting migrate migration servers',
  'dedicated-teams': 'hire developers developer team staff augmentation engineers outsource offshore',
  'computer-vision': 'camera cameras cctv vision detection counting inspection face recognition video image',
  'iot-embedded': 'iot sensors sensor hardware firmware embedded fpga device devices',
  cybersecurity: 'security encryption pentest penetration test network security cyber',
};

/** Signals shown back to the visitor as "Understood as" chips. */
const industryWords: Record<string, string> = {
  healthcare: 'clinic hospital doctor patients healthcare medical',
  'dental-clinics': 'dental dentist dentistry orthodontist',
  'real-estate': 'real estate property properties realtor agents listings',
  ecommerce: 'shop store ecommerce e-commerce shopify orders products',
  legal: 'law firm lawyer legal attorney',
  finance: 'bank finance fintech insurance accounting',
  logistics: 'logistics fleet delivery shipping cargo',
  education: 'school university students education academy',
  hospitality: 'restaurant hotel cafe hospitality bookings',
  agriculture: 'farm farming agriculture livestock',
  'saas-startups': 'saas startup',
  'government-defense': 'government ministry public sector defense',
};

export interface MatchItem {
  /** a = agent, s = service */
  t: 'a' | 's';
  name: string;
  line: string;
  href: string;
  price: string | null;
  kw: string;
}
export interface MatchIndex {
  items: MatchItem[];
  industries: { name: string; kw: string }[];
}

export async function buildMatchIndex(): Promise<MatchIndex> {
  const agentFiles = await getCollection('agents');
  const serviceFiles = await getCollection('services');
  const kwOf = (slug: string, extra: { primary: string; secondary: string[] } | undefined, line = '') =>
    ` ${[words[slug] ?? '', line, extra?.primary ?? '', ...(extra?.secondary ?? [])].join(' ').toLowerCase().replace(/[^a-z0-9/]+/g, ' ')} `;

  const items: MatchItem[] = [
    ...agents.map((a) => ({
      t: 'a' as const,
      name: a.name,
      line: a.line,
      href: `/ai-agents/${a.slug}/`,
      price: priceLabel(a.slug),
      kw: kwOf(a.slug, agentFiles.find((f) => f.id === a.slug)?.data.keywords, a.line),
    })),
    ...services.map((s) => {
      const f = serviceFiles.find((x) => x.id === s.slug);
      return {
        t: 's' as const,
        name: f?.data.name ?? s.name,
        line: f?.data.tagline ?? '',
        href: `/services/${s.slug}/`,
        price: serviceLabel(s.slug),
        kw: kwOf(s.slug, f?.data.keywords, f?.data.tagline),
      };
    }),
  ];
  return {
    items,
    industries: industries.map((i) => ({ name: i.name, kw: industryWords[i.slug] ?? i.name.toLowerCase() })),
  };
}
