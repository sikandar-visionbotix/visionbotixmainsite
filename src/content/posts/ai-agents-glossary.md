---
title: 'AI agents glossary: 45 terms explained in plain English'
seo:
  title: 'AI Agents Glossary: 45 Terms in Plain English'
  description: 'An AI agents glossary in plain English: agent, LLM, RAG, MCP, embeddings, guardrails, evals, prompt injection, voice agents and 36 more terms.'
keywords:
  primary: AI agents glossary
  secondary:
    - agentic AI terms
    - AI terms explained
    - what is RAG
    - LLM glossary
    - AI agent terminology
excerpt: 'From agent and LLM to RAG, MCP, guardrails and prompt injection: 45 AI terms in plain English, and the six ideas to understand before you buy.'
summary: >-
  This AI agents glossary explains 45 terms in plain English, from agent and LLM to RAG, MCP, guardrails and prompt
  injection. If you read only six ideas, read these: agents act through tools, MCP connects those tools, RAG grounds
  answers in your data, approvals limit actions, evals measure quality and red teaming finds weaknesses.
format: glossary
pubDate: 2026-11-20
updated: 2026-11-20
author: sikandar-farooq
tags: [ai-explained, ai-agents]
related:
  agents: [ai-knowledge-assistant, mcp-server-development]
  services: [generative-ai-development]
terms:
  - term: AI agent
    definition: 'An AI system that works toward a goal by choosing its own next steps: it reads a request, picks tools, takes actions such as booking a slot or updating a record, and checks the result. A chatbot answers; an agent gets something done.'
    link: /resources/ai-agent-vs-chatbot/
  - term: Agentic AI
    definition: 'The broader idea of AI that plans and acts over several steps with some autonomy, instead of producing one reply. The label covers anything from a single agent with two tools to several agents running a whole process.'
  - term: AI receptionist
    definition: 'A voice agent that answers a business''s phone calls, handles common questions, books appointments into the calendar and transfers urgent or unusual calls to a person.'
    link: /ai-agents/ai-receptionist/
  - term: AI SDR
    definition: 'An AI sales development rep: an agent that researches target accounts, drafts outreach, handles replies and books meetings for human sales reps, usually with a person approving what gets sent.'
    link: /ai-agents/ai-sdr-agent/
  - term: Approval gate
    definition: 'A point in an agent''s workflow where it must stop and wait for a named person to confirm before it acts, typically before it sends, pays, deletes or changes a record.'
    link: /ai-agents/ai-workflow-automation-agent/
  - term: Audit log
    definition: 'A record of everything an agent did: who asked, what it read, which tools it called, what it changed and when. It lets you check a decision afterward, and regulators and security reviews often ask for it.'
  - term: Chatbot
    definition: 'Software that holds a conversation in text or voice. Classic chatbots follow scripted flows; chatbots built on a language model write free-form answers. A chatbot becomes an agent when it can use tools to act.'
    link: /resources/ai-agent-vs-chatbot/
  - term: Chunking
    definition: 'Splitting long documents into smaller passages before they are indexed, so retrieval can fetch the few paragraphs that answer a question instead of a whole manual. Chunk size and overlap affect answer quality.'
  - term: Citation
    definition: 'A link from an AI answer back to the exact document, page or record it came from, so a person can check the answer in one click instead of trusting it blindly.'
  - term: Context window
    definition: 'The maximum amount of text, measured in tokens, that a model can consider at once: the instructions, the conversation, any retrieved documents and its own reply. Anything outside the window is invisible to the model.'
  - term: Data residency
    definition: 'Where data is physically stored and processed, for example in a UK, EU or US cloud region. Some laws, regulators and contracts require data to stay in a given country or region.'
  - term: Embedding
    definition: 'A list of numbers that represents the meaning of a piece of text, so that texts with similar meaning get similar numbers. Embeddings let a system find relevant passages even when the wording differs from the question.'
  - term: Escalation (handoff)
    definition: 'When an agent passes a conversation or task to a person, with the history attached, because the request is outside its rules, it is unsure, or the customer asks for a human. Good agents hand off early rather than guess.'
  - term: Evals
    definition: 'Repeatable tests for an AI system: a set of real example inputs with expected outcomes, scored automatically or by people. Evals show whether a change to the prompt, model or data made the system better or worse.'
    link: /ai-agents/ai-security-audit/
  - term: Fine-tuning
    definition: 'Training an existing model further on your own examples so it learns a format, tone or narrow task. It mainly changes how the model behaves; it is an unreliable way to teach new facts, so for current facts retrieval (RAG) is usually the better tool.'
    link: /services/generative-ai-development/
  - term: Grounding
    definition: 'Making a model base its answer on supplied sources, such as your documents or database, rather than on what it learned in training. A grounded answer can be traced back to a source.'
  - term: Guardrails
    definition: 'Rules and checks around an AI system that limit what it may say or do: topics it refuses, data it must never reveal, actions that need approval, and filters on what goes in and what comes out.'
  - term: Hallucination
    definition: 'When a model states something false or invented with confidence, such as a policy that does not exist or a made-up citation. Grounding, citations and evals reduce it; nothing removes it entirely.'
  - term: Human in the loop
    definition: 'A design where a person reviews, approves or corrects the AI''s work at defined points instead of letting it act alone. It is the usual setup for anything that touches money, health, legal matters or customers.'
  - term: Inference
    definition: 'Running a trained model to produce an output, which happens every time it answers. Model providers bill inference by the token, so it is one of the running costs of any AI agent.'
  - term: Intent
    definition: 'What a user is trying to achieve with a message, such as "book an appointment" or "cancel my order". An agent detects the intent to decide which workflow, tool or person should handle it.'
  - term: Jailbreak
    definition: 'A prompt written to make a model ignore its safety rules or instructions, for example through role-play or hypotheticals. A jailbreak is a form of prompt injection aimed at the model''s own safety rules; other injections target the application''s instructions and tools.'
    link: /ai-agents/ai-security-audit/
  - term: Large language model (LLM)
    definition: 'A model trained on very large amounts of text to predict the next token, which lets it write, summarize, translate, work through steps and follow instructions. GPT, Claude, Gemini and Llama are families of LLMs.'
  - term: Latency
    definition: 'The delay between a request and the answer. In chat a short wait is fine; in a phone call long pauses make the conversation feel broken, so voice agents are designed around low latency.'
  - term: MCP (Model Context Protocol)
    definition: 'An open standard for connecting AI applications to tools and data. An MCP server exposes a system, such as a CRM or a database, as a set of tools that any compatible AI client, like Claude or ChatGPT, can use.'
    link: /resources/what-is-mcp/
  - term: Memory
    definition: 'How an agent keeps information beyond a single message. Short-term memory is the current conversation; long-term memory is stored facts, such as a customer''s preferences, that it can look up later.'
  - term: Multi-agent system
    definition: 'Several agents with separate roles, such as a researcher, a writer and a checker, working on one task under an orchestrator. More agents add capability, but also cost and new ways to fail.'
  - term: Open-weight model
    definition: 'A model whose trained weights are published, so you can run it on your own servers or in a private cloud. Llama and Mistral are examples. It suits data that must not leave your environment.'
  - term: Orchestration
    definition: 'The logic that coordinates an agent''s steps, or several agents: which tool or agent runs next, how results are passed on, and what happens on errors, retries and timeouts.'
  - term: PII redaction
    definition: 'Detecting and masking personally identifiable information, such as names, phone numbers and ID or card numbers, before text is stored, logged or sent to a model.'
  - term: Planner
    definition: 'The part of an agent that breaks a goal into steps and decides their order, before or while carrying them out. Some agents re-plan after every step based on what they find.'
  - term: Prompt
    definition: 'The input you give a model: the question or instruction, plus any examples and context. Small wording changes can change the output, which is why prompts in production are tested like code.'
  - term: Prompt injection
    definition: 'An attack where text the AI reads, in a chat message, email, web page or document, carries instructions that try to override the system''s own. It is first on the OWASP Top 10 for LLM Applications (2025 edition) and the main risk for agents with tools.'
    link: /ai-agents/ai-security-audit/
  - term: Retrieval-augmented generation (RAG)
    definition: 'A pattern where the system first retrieves relevant passages from your documents or data, then gives them to the model to answer from. Answers stay current and can cite sources without retraining the model.'
    link: /ai-agents/ai-knowledge-assistant/
  - term: Red teaming
    definition: 'Deliberately attacking an AI system the way a real adversary would, with injections, jailbreaks and data-extraction attempts, to find the weaknesses before users or attackers do.'
    link: /ai-agents/ai-security-audit/
  - term: Reranking
    definition: 'A second pass in retrieval that reorders the candidate passages by how well they actually answer the question, so the most useful ones reach the model first.'
  - term: Shadow mode
    definition: 'A launch phase in which the agent works on real cases but does not act on its own: it proposes or logs what it would do, and your team compares that with its own decisions before the agent may act on anything by itself.'
  - term: Speech-to-text (STT)
    definition: 'Converting spoken audio into text, the first step of any voice agent. Accuracy depends on accents, background noise, the quality of the phone line and domain words such as product names.'
  - term: System prompt
    definition: 'The standing instructions an application gives the model before any user message: its role, tone and rules, and what it may and may not do. Users usually cannot see it, and attackers often try to extract it.'
  - term: Text-to-speech (TTS)
    definition: 'Converting text into spoken audio. Modern voices sound natural and can match a language or accent, which matters for agents that talk to customers on the phone.'
  - term: Token
    definition: 'The unit a model reads and writes, roughly a short word or part of a longer one. Context windows, rate limits and model API prices are all measured in tokens.'
  - term: Tool use (function calling)
    definition: 'The ability of a model to use external functions, such as checking a calendar, looking up an order or creating a ticket, by producing a structured request that the application runs and returns the result of.'
  - term: Vector database
    definition: 'A database built to store embeddings and quickly find the ones closest in meaning to a query, even across millions of passages. It is the usual search layer behind RAG.'
  - term: Voice agent
    definition: 'An AI agent you talk to by phone or voice. It combines speech-to-text, a language model with tools and text-to-speech to hold a natural conversation and act on it.'
    link: /services/ai-voice-agents/
  - term: Workflow automation
    definition: 'Software that runs a repeatable business process end to end, such as moving data between email, a CRM and accounting. AI agents extend it to steps that need judgment, like reading a messy email.'
    link: /ai-agents/ai-workflow-automation-agent/
faq:
  - q: Do I need to understand all these terms to buy an AI agent?
    a: 'No. You need the handful in this guide''s six sections: what the agent may do on its own, where its answers come from, which systems it connects to, who approves risky actions, how quality is measured and how it was tested against attacks. A good provider explains the rest as it comes up.'
  - q: Should I use RAG or fine-tuning for my company's data?
    a: 'Usually RAG. It answers from your current documents, cites its sources and updates when a document changes. Fine-tuning helps when you need a fixed format, tone or narrow skill, or a smaller model that is cheaper to run. Many production systems use RAG alone, and some combine the two.'
  - q: Can an AI agent work without sending our data to a model provider?
    a: 'Yes. An open-weight model can run on your own servers or in your private cloud, so prompts and documents never leave your environment. The trade-off is that you run and update the model yourself, and the strongest models are often available only through a provider''s API.'
  - q: How do you stop an AI agent from making things up?
    a: 'You cannot get the risk to zero, but you can make it small and visible: answer only from approved sources, show citations, let the agent say it does not know, hand off to a person when unsure, and run evals on real questions before and after every change.'
  - q: What does MCP change for a business?
    a: 'Instead of building a separate integration for each AI tool, you build one MCP server for a system such as your CRM, and Claude, ChatGPT, Copilot and other clients can all use it. The security work, scopes and audit logs then live in one place.'
---

This glossary explains the words you will hear when you buy, build or evaluate an AI agent, in plain English and without hype. The full A–Z list of terms follows this introduction. If you are short on time, read the six ideas below first: they are the ones that decide whether an agent is useful and safe in a real business.

## How should you use this glossary?

Skim the A–Z list when a proposal, a demo or a vendor call uses a word you do not know. Where one of our pages explains an idea in more depth, the term links to it. The sections below are not definitions; they explain how the terms fit together when you are deciding what to buy.

## What makes an agent different from a chatbot?

A chatbot talks; an agent acts. Once a model can use tools (look up an order, book a slot, update your CRM), it stops being a question-answering widget and becomes something that changes data in your business. That is why every other idea on this page matters. Our [comparison of AI agents and chatbots](/resources/ai-agent-vs-chatbot/) goes deeper, and [AI agent development](/services/ai-agent-development/) shows how we scope one.

## How does an agent connect to your systems?

Through tools, and increasingly through MCP, the open standard that lets one connector serve many AI clients. The questions to ask are which actions the agent may take, as which user, and with what logging. Our [MCP Connector](/ai-agents/mcp-server-development/) builds these servers with scoped access, sign-in through your identity provider and audit logs.

## Where do the agent's answers come from?

From your own data, if it is built well. RAG retrieves the relevant passages from your documents before the model answers, so the answer is grounded and can cite its source. Chunking, embeddings, vector databases and reranking are the parts that decide how good that retrieval is. The [Knowledge Agent](/ai-agents/ai-knowledge-assistant/) is a working example, and you can [try the demo](/demos/knowledge/).

## Who decides when the agent acts?

You do, through guardrails, approval gates and a human in the loop. A sensible launch starts in shadow mode, where the agent's choices are proposed or logged and compared with your team's, then moves to approvals, and only then lets it act alone on low-risk steps. The [Ops Agent](/ai-agents/ai-workflow-automation-agent/) waits for a named person before anything irreversible.

## How do you know it works?

With evals: a fixed set of real examples the system is scored against before launch and after every change of prompt, model or data. Without them, "it looked good in the demo" is the only evidence. Our [generative AI development](/services/generative-ai-development/) work ships an eval suite with every build.

## How do you know it is safe?

By attacking it before someone else does. Prompt injection, jailbreaks and data leakage are the main risks for agents that read outside content and hold tools. Red teaming finds them; guardrails and approval gates contain them. The [Guardrail and Eval Audit](/ai-agents/ai-security-audit/) tests an existing AI app this way.

## What to do next

- Want to see the ideas working? Each packaged agent has a live demo, listed on the [demos page](/demos/).
- Wondering what it costs? Read [how much an AI agent costs](/resources/ai-agent-cost/), or see every price on the [pricing page](/pricing/).
- Not sure where AI fits in your business? Book a free 30-minute call, or start with our [AI Opportunity Audit](/services/ai-consulting/) at {{audit}}.
