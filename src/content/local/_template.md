---
# Service × country page (S11, D75). Copy to src/content/local/<location>/<agent>.md. Check: node scripts/check-local.mjs <location>/<agent>
# Rules: spelling follows the location (uk/australia/pakistan = UK spelling); no prices or money amounts (computed);
# no percentages or statistics; no client names, testimonials, certifications, partnerships or "X-compliant" claims;
# no em-dashes; every rule has an official source URL that you opened, also listed in `sources`.
location: uk
agent: ai-receptionist
seo:
  title: AI Receptionist UK for Clinics and Firms # ≤ 46 chars, contains keywords.primary
  description: 70–155 chars, answer-first.
keywords:
  primary: AI receptionist UK
  secondary: [AI receptionist for dental practices UK]
summary: >-
  45–60 words, answer-first: what it is, who it is for in this country, what is local about it, price pointer ("prices below in pounds").
updated: 2026-11-20
h1: 20–80 chars
tagline: 30–110 chars, card line
local: # 3–4: the local situation (why businesses here want it)
  - title: ≤ 60
    body: 80–320
scenarios: # 3–5 local use cases; industry = an industries/ slug where one fits
  - who: Dental practices
    industry: dental-clinics
    body: 80–300
rules: # 3–5: what the rule requires + what we put in place; source = official page you opened
  - name: ≤ 60
    body: 80–360
    source: https://…
setup: # 3–5: numbers, WhatsApp account, voices/accents, languages, hours/holidays
  - title: ≤ 60
    body: 60–300
systems: # 2–5 kinds, 1–6 names each (capability claims: "we connect", never "partner")
  - kind: Practice software
    names: [Example One, Example Two]
sources: # 3–12, every page opened
  - title: ≤ 120
    url: https://…
faq: # 5–8, no price question (generated)
  - q: …?
    a: …
---
