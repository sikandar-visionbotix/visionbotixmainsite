---
# Copy to <slug>.md → /resources/<slug>/ (S10). Files starting with "_" are ignored.
# Reference post: ai-agent-cost.md. Check before building: node scripts/check-posts.mjs <slug>
#
# Truth rules (src/content.config.ts → posts, CLAUDE.md):
#  - our own prices are tokens, never typed: {{price:ai-receptionist}}, {{project:customAgent}}, {{table:agents}} … (src/lib/tokens.ts);
#  - every other figure (money, %, statistic) sits in the same paragraph / list item / table row as a link to a page you
#    opened, and that page is listed in `sources`. No figures in front matter (they can't carry a link there);
#  - real authors only (src/data/resources.ts); no invented experience, clients or outcomes; US spelling; no em-dashes.
title: The question, in full (20–90 chars)
seo:
  title: 'Keyword First, ≤ 46 chars'
  description: 'Answer-first, 70–155 chars, no tokens.'
keywords:
  primary: the primary keyword
  secondary: [variant one, variant two]
excerpt: 'Card line on the hub, 60–170 chars.'
summary: >-
  40–60 words that answer the title directly. Tokens are fine here, market figures are not.
format: guide # guide | cost-guide | comparison | explainer | glossary (glossary also needs `terms`)
pubDate: 2026-11-20
updated: 2026-11-20
author: sikandar-farooq
tags: [ai-agents] # 1–3 from src/data/resources.ts
featured: false
related: # the money pages this post sells into; each must also be linked in the body
  agents: []
  services: []
  industries: []
  locations: []
sources: [] # - { title, publisher, url }
faq: [] # 3–7 × { q, a }
draft: true
---

Answer-first opening paragraph (2–4 sentences)…

## First question people search
