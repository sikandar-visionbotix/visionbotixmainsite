---
# Copy to <slug>.md → /industries/<slug>/. Schema: src/content.config.ts → industries. Check with
# `node scripts/check-industries.mjs <slug>`. Reference file: dental-clinics.md.
# Rules: US English; no prices, percentages, statistics, clients, testimonials or certification claims; no em-dashes.
# The price FAQ is generated from pricing.ts (do not add one). Compliance = rules the buyer works under + what we put in place.
name: Dental clinics            # = catalogue.ts name
who: dental clinics             # plural noun phrase used in "AI agents for <who>"
tagline: 30–90 chars, card line on the hub.
h1: 20–80 chars, outcome-led.
icon: stethoscope               # = catalogue.ts icon
order: 20
updated: 2026-11-20
seo:
  title: ≤ 46 chars, contains keywords.primary
  description: 70–155 chars.
keywords: { primary: AI receptionist for dental offices, secondary: [] }
summary: >-
  45–60 word answer-first intro.
bestFor: [3–6 chips, ≤ 40 chars]
problem: [3–4 sentences ≥ 30 chars]
agents: [lead agent first, 2–4 agent slugs]
bundle: clinic-front-desk       # optional; all its agents must be in `agents`
useCases: [{ title: '', body: '', agent: ai-receptionist }]   # 4–6
dayInLife: [{ time: '07:40', step: '30–220 chars', agent: ai-receptionist }]   # 4–7
compliance: [{ name: HIPAA, region: US, body: '40–280 chars' }]   # 2–5
controls: [3–5 lines, 20–200 chars]
systems: [4–14 systems, text only]
services: [1–4 service slugs]
products: []                    # own product slugs, optional
relatedIndustries: []           # ≤ 4 industry slugs
faq: [5–8 { q, a }]
---
Optional Markdown body: one H2 + a comparison table.
