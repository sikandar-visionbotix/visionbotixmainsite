---
# Copy to <slug>.md (slug = URL: ai-agent-development.md → /services/ai-agent-development/). Files starting with "_" are ignored.
# The finished reference is ai-agent-development.md; match its depth. Schema: src/content.config.ts → services.
# A new service also needs: an entry in src/data/catalogue.ts (menus) and a price in src/data/pricing.ts → servicePrices.
# getServices() (src/lib/services.ts) fails the build if the three disagree.
#
# Rules: US spelling. No prices or "$" in the copy (the page renders the price card, the Offer schema and a "How much
# does it cost?" FAQ from pricing.ts, D27/D32). No statistics, client names, testimonials, awards or certifications
# (CLAUDE.md). No em-dashes. Case studies are picked automatically from src/content/work/ (their `services` field).
# Promises: only the confirmed ones (NDA on request, 100% code and IP, milestone payments, overlap hours + named lead,
# weekly demos, 30-day post-launch support, quote within 24 hours, packaged agents live in ~2 weeks).
name: Example service                # must equal the catalogue name
tagline: One line for cards, 30–90 characters.
h1: An outcome-led H1 of 20 to 80 characters.
pillar: ai                           # ai | software | deeptech (must equal the catalogue)
icon: bot                            # must equal the catalogue icon
order: 999
updated: 2026-11-19
draft: true
seo:
  title: Primary Keyword Services     # ≤ 46 chars, must contain keywords.primary (" | Visionbotix" is appended)
  description: 70–155 chars, answer-first, mentions the outcome and a differentiator (fixed price, you own the code).
keywords:
  primary: primary keyword
  secondary: [variant one, variant two]
summary: >-
  45–60 words, answer-first: what we build, for whom, how, and the terms. AI search quotes this paragraph, so state
  facts plainly.
bestFor: [Audience one, Audience two, Audience three]     # 3–6 chips, ≤ 40 chars each
problem:                               # 3–4 sentences, no invented numbers
  - First pain, in plain words, at least thirty characters.
  - Second pain, in plain words, at least thirty characters.
  - Third pain, in plain words, at least thirty characters.
offerings:                             # 4–8 cards: what we build
  - { title: Offering, body: 'One or two sentences.' }
  - { title: Offering, body: 'One or two sentences.' }
  - { title: Offering, body: 'One or two sentences.' }
  - { title: Offering, body: 'One or two sentences.' }
process:                               # exactly 4 steps; meta = when
  - { title: Step one, body: '…', meta: 'Week 1' }
  - { title: Step two, body: '…', meta: 'Weeks 2–3' }
  - { title: Step three, body: '…', meta: 'Weeks 3–8' }
  - { title: Step four, body: '…', meta: 'Launch' }
timeline: First release in 6–10 weeks  # 8–48 chars
stack: [Tool one, Tool two, Tool three, Tool four]        # 4–16, text only, no partnership claims
quality:                               # 3–5 practices specific to this service
  - A specific quality or security practice, at least twenty characters.
  - Another one.
  - Another one.
engagement: [fixed-scope]              # fixed-scope | monthly-retainer | dedicated-team | audit
includes:                              # 4–8: what the price covers
  - Item one
  - Item two
  - Item three
  - Item four
related:
  agents: [ai-workflow-automation-agent]   # 1–4 agent files
  services: []                             # ≤ 3 other service files (not itself)
  industries: []                           # ≤ 4 catalogue industry slugs
  products: []                             # ≤ 3: wakeel | vx-1-ip-encryptor | threatiq | cyber-range
faq:                                   # 5–8; a price question is generated and inserted second
  - q: Question?
    a: Answer of at least twenty characters.
---

Optional Markdown body: one "X vs Y vs Z" comparison table with an H2 (see ai-agent-development.md). No prices.
