---
# Copy to <slug>.md (slug = URL, e.g. ai-receptionist.md → /ai-agents/ai-receptionist/). Files starting with "_" are ignored.
# Schema: src/content.config.ts → agents. Write unique copy per agent; no invented metrics or clients.
name: Receptionist Agent
tagline: Answers every call 24/7 and books straight into your calendar.
group: answer            # answer | sell | market | operate | secure-build
icon: headset            # any name from src/lib/icons.ts
order: 10
updated: 2026-11-19
draft: true
seo:
  title: AI Receptionist for Clinics and Small Businesses   # ≤ 60 chars with " | Visionbotix"
  description: An AI receptionist that answers every call 24/7, books appointments into your calendar and escalates urgent calls. Live in about two weeks.
keywords:
  primary: AI receptionist
  secondary: [AI voice receptionist, AI answering service, virtual receptionist AI]
summary: >-
  40–60 words, answer-first: what it is, who it is for, what it does, how fast it goes live. This paragraph is
  what Google and AI assistants quote, so state facts plainly.
verbs: [Answers, Qualifies, Books, Escalates]
dayInLife:
  - { time: '07:58', step: 'A patient calls before opening; the agent answers in your clinic’s voice.' }
useCases:
  - { title: After-hours calls, body: '…' }
integrations: [Google Calendar, Microsoft 365, Twilio]
controls: [Human handoff on request, Approval before refunds or cancellations]
security: [Call recordings stay in your region, Data encrypted at rest and in transit]
setup:
  - { title: We plug in, body: '…' }
  - { title: We train it on your business, body: '…' }
  - { title: We test with you, body: '…' }
  - { title: You go live, body: '…' }
timeline: Live in about 2 weeks
priceFrom: null          # TODO(owner): { setup: 2500, monthly: 500, currency: USD } once approved
related:
  agents: [ai-booking-agent]
  services: [ai-voice-agents]
  industries: [dental-clinics]
faq:
  - q: How is an AI receptionist different from an answering service?
    a: …
---

Optional long-form body (Markdown). Rendered below the structured sections.
