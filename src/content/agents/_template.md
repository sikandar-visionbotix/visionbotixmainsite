---
# Copy to <slug>.md (slug = URL: ai-receptionist.md → /ai-agents/ai-receptionist/). Files starting with "_" are ignored.
# The finished reference is ai-receptionist.md; match its depth. Schema: src/content.config.ts → agents.
# A new agent also needs: an entry in src/data/catalogue.ts (menus) and a price in src/data/pricing.ts.
# getAgents() (src/lib/agents.ts) fails the build if the three disagree.
#
# Rules: US spelling. No prices in the copy (the page renders them, the Offer schema and a "How much does it cost?" FAQ
# from pricing.ts, D27). No statistics, clients, testimonials or certifications (CLAUDE.md). Icons: names in src/lib/icons.ts.
name: Example Agent                 # must equal the catalogue name
tagline: One line for cards.        # ≤ 90 chars; mirror `line` in catalogue.ts
h1: An AI example agent that does the job.   # 20–80 chars, contains keywords.primary
group: answer                       # answer | sell | market | operate | secure-build (must equal the catalogue)
icon: bot
order: 999
updated: 2026-11-19
draft: true
seo:
  title: Primary Keyword for Audience        # ≤ 46 chars (" | Visionbotix" is appended; total ≤ 60)
  description: 70–155 chars, answer-first, mentions the outcome and "live in about 2 weeks" where true.
keywords:
  primary: AI example agent
  secondary: [variant one, variant two]
summary: >-
  45–60 words, answer-first: what it is, who it is for, what it does, how fast it goes live. AI search quotes this
  paragraph, so state facts plainly.
verbs: [Answers, Books, Escalates]   # 3–6 single words
bestFor: [Audience one, Audience two, Audience three]   # 3–6
problem:                              # 3–4 sentences, no invented numbers
  - First pain, in plain words, at least thirty characters.
  - Second pain, in plain words, at least thirty characters.
  - Third pain, in plain words, at least thirty characters.
does:                                 # 4–6
  - { title: Capability, body: 'What it does and why it matters.' }
  - { title: Capability, body: 'What it does and why it matters.' }
  - { title: Capability, body: 'What it does and why it matters.' }
  - { title: Capability, body: 'What it does and why it matters.' }
dayInLife:                            # 4–7; project offers use 'Day 1', 'Week 2'… as a delivery timeline
  - { time: '07:58', step: 'What happens.' }
  - { time: '12:40', step: 'What happens.' }
  - { time: '19:30', step: 'What happens.' }
  - { time: '08:00', step: 'What happens.' }
useCases:                             # 3–6
  - { title: Use case, body: '…' }
  - { title: Use case, body: '…' }
  - { title: Use case, body: '…' }
integrations: [Tool one, Tool two, Tool three, Tool four]   # ≥ 4, real products with public APIs
controls: [Human approval for …, Handoff to a person …, Only approved facts …]   # ≥ 3
security: [Encrypted in transit and at rest …, Region of your choice …, Role-based access and audit log …]   # ≥ 3
setup:                                # exactly 4
  - { title: Step one, body: '…' }
  - { title: Step two, body: '…' }
  - { title: Step three, body: '…' }
  - { title: Step four, body: '…' }
timeline: Live in about 2 weeks
includes:                             # 4–8; monthly agents end with the "Monthly: …" line
  - Item
  - Item
  - Item
  - 'Monthly: hosting, monitoring, weekly tuning and a report'
demo:                                 # scripted "See it work" preview (D19); 5–9 lines; done line last
  title: Example agent                # ≤ 32
  status: Live · after hours          # ≤ 32
  icon: bot
  tools:                              # 1–3, label ≤ 14
    - { icon: calendar, label: Calendar }
  lines:
    - { kind: in, who: 'WhatsApp · 21:47', text: 'Customer message (≤ 140).' }
    - { kind: sys, icon: sparkles, label: intent, text: 'what the agent understood (≤ 90)' }
    - { kind: tool, icon: calendar-clock, calls: ['calendar.find_slots("Sat AM")'], result: '09:30, 11:00' }
    - { kind: out, text: 'Agent reply (≤ 160).' }
    - { kind: gate, text: 'Waiting for approval … approved by a person (≤ 110).' }
    - { kind: done, text: 'Closing summary (≤ 110).' }
  caption: Scripted demo · a fictional business type   # must start with "Scripted demo · "
related:
  agents: [ai-booking-agent]          # ≤ 3 agent slugs
  services: [ai-agent-development]    # ≤ 3 service files from src/content/services/
  industries: [healthcare]            # ≤ 4 industry slugs from catalogue.ts
faq:                                  # 5–7 real objections; no pricing question (it is generated)
  - q: A real buyer question?
    a: Two to four sentences.
---

Optional Markdown body: one short "X vs Y" comparison table (≤ 8 rows), rendered above the FAQ.
