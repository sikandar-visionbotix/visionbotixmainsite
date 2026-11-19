/**
 * /locations/ hub copy (S9). Countries come from `src/content/locations/` via getLocations(); overlap hours and local
 * prices are computed in src/lib/locations.ts. Truth rules (CLAUDE.md): one office (Rawalpindi), no virtual addresses
 * abroad, "delivered in" only for owner-confirmed countries (site.deliveredIn), no statistics or client names.
 */
import type { FaqItem } from '@/lib/schema';
import { site } from '@/data/site';
import { locations } from '@/data/catalogue';
import { fxAsOf } from '@/data/pricing';

const names = (xs: readonly string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);

export const locationsHero = {
  title: 'One studio, working in your time zone.',
  accent: 'in your time zone.',
  lead: `Visionbotix builds AI agents, apps and software for clients in ${site.facts.countriesServed} countries from our studio in ${site.address.locality}, Pakistan. Each country page shows the hours we overlap with your working day, our prices in your currency and the rules we design around where you are.`,
  points: ['A shift that overlaps your working day', 'Prices shown in your currency', 'Local rules designed in'],
};

export const locationSteps = [
  { title: 'Call in your hours', body: 'A free 30-minute call at a time that suits you, about the work that takes up most of your week and the rules you operate under.', meta: 'Day 0' },
  { title: 'Fixed quote', body: 'A fixed quote within 24 hours, with the agents or build we recommend, the shift your project runs on and the data route we will use.', meta: 'Day 1' },
  { title: 'Paperwork first', body: 'NDA, data processing terms and any transfer agreement your rules need are signed before we see personal data.', meta: 'Week 1' },
  { title: 'Build in the open', body: 'One named lead, a weekly demo and a shared channel. Your agents go live in about two weeks; custom builds ship by milestone.', meta: 'Week 1+' },
];

export const locationFaqs: FaqItem[] = [
  {
    q: 'Which countries does Visionbotix work with?',
    a: `Clients in ${site.facts.countriesServed} countries so far, including ${names(site.deliveredIn)}. This section has pages for ${names(locations.map((l) => l.name))}, with the hours, prices and rules for each. If your country is not listed, we still work with you: the engineering is the same, only the hours and the paperwork change.`,
  },
  {
    q: 'Do you have offices outside Pakistan?',
    a: `No. Our whole team works from our studio in ${site.address.locality}, Pakistan, and we do not use virtual addresses abroad. Every project runs on a shift that overlaps your working day, with one named lead you can reach the same day and a weekly demo.`,
  },
  {
    q: 'Can I pay in my own currency?',
    a: `Our prices are set in US dollars. Country pages also show them in the local currency at ${fxAsOf} rates, rounded, for orientation. Your fixed quote states the exact amount and the currency you are invoiced in, and projects are paid by milestone.`,
  },
  {
    q: 'How do you handle data protection rules in different countries?',
    a: 'We design each setup around the rules where you are: UK GDPR and the IDTA in the UK, GDPR and standard contractual clauses in the EU, HIPAA for US health data, the Privacy Act in Australia, PIPEDA and Quebec Law 25 in Canada, and the PDPL in the UAE and Saudi Arabia. That means the right hosting region, signed data terms and approvals for sensitive actions. Compliance stays your responsibility, and your compliance lead signs off the setup.',
  },
  {
    q: 'Will the AI agents speak my customers’ language?',
    a: 'Yes. Agents work in English and in the languages your customers use, including Arabic with right-to-left chat, French, German, Urdu and Roman Urdu. We test them on real examples from your business before go-live, and customers can always reach a person.',
  },
];
