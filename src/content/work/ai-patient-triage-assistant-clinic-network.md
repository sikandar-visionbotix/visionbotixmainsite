---
title: AI patient-intake and triage assistant for a telehealth clinic network
clientType: A telehealth clinic network
sector: Healthcare
region: Global
kind: [web, ai, saas]
ownProduct: false
links: []
art: health
challenge: >-
  Patients describe symptoms in their own words, and every intake had to be read by a clinician before anyone could
  judge how urgent it was or which department should take it. The network needed that first pass done the same way
  every time, before a doctor opened the case.
approach: >-
  We built an LLM intake pipeline with LangChain on OpenAI models. It interprets the patient's description, adapts the
  follow-up questions to the answers, classifies urgency and the probable department, and hands the doctor a ranked
  summary instead of a raw form.
built:
  - Symptom intake with adaptive, dynamic forms that change with each answer
  - LLM symptom interpretation that classifies urgency and the probable department
  - Doctor dashboard with patient history, flags and exportable reports
  - Subscription model so several clinics can run on one platform
highlights:
  - Doctors receive a ranked patient summary rather than a raw intake form
  - Multi-clinic subscription setup on a single codebase
stack: [Next.js, OpenAI, LangChain, Tailwind CSS, MongoDB]
outcomes: []
services: [ai-agent-development, generative-ai-development, saas-mvp-development]
industries: [healthcare]
featured: true
verified: true
provenance: icasta
order: 40
updated: 2026-11-19
draft: false
seo:
  title: AI Patient Triage Assistant Case Study
  description: How we built an LLM patient-intake and triage assistant that classifies urgency and department and gives doctors a ranked summary.
keywords:
  primary: ai patient triage software
  secondary: [ai medical intake assistant, llm healthcare chatbot, telehealth triage system]
summary: >-
  An AI intake and triage assistant for a telehealth clinic network. Patients describe their symptoms, an LLM pipeline
  built with LangChain asks adaptive follow-up questions, classifies urgency and the likely department, and gives
  doctors a ranked summary on a dashboard with history, flags and exportable reports.
faq: []
---

Telehealth intake usually arrives as free text, and someone has to read it before the right doctor sees it. We put an
LLM in that first step: it reads the patient's description, asks the questions a triage nurse would ask next, and
sorts the case by urgency and department.

Doctors open a dashboard where cases are already ranked, with the patient's history and any flags alongside, and can
export a report in one click. The platform runs on a subscription model, so additional clinics join the same system
instead of getting a separate install.
