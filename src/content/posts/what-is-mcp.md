---
title: 'What is MCP (Model Context Protocol)? A plain-English guide'
seo:
  title: 'What Is MCP? Model Context Protocol Explained'
  description: 'What is MCP? A plain-English guide to the Model Context Protocol: how it works, MCP vs APIs, which AI apps support it, and how to use it safely.'
keywords:
  primary: what is MCP
  secondary:
    - Model Context Protocol explained
    - MCP server
    - MCP vs API
    - MCP security
    - MCP vs function calling
excerpt: 'How the Model Context Protocol connects AI apps to your tools and data, who runs it, which apps support it and how to keep it safe.'
summary: >-
  MCP (Model Context Protocol) is an open standard that lets AI apps such as Claude, ChatGPT, Copilot and Cursor
  connect to tools and data in one consistent way. You build an MCP server once in front of a system, and every app
  that supports MCP can use it. Anthropic created it; it now sits in the Linux Foundation's Agentic AI Foundation.
format: explainer
pubDate: 2026-11-20
updated: 2026-11-20
author: sikandar-farooq
tags: [ai-explained, ai-agents]
related:
  agents: [mcp-server-development, ai-security-audit]
  services: [ai-agent-development]
sources:
  - title: Introducing the Model Context Protocol
    publisher: Anthropic (November 25, 2024)
    url: https://www.anthropic.com/news/model-context-protocol
  - title: Donating the Model Context Protocol and establishing the Agentic AI Foundation
    publisher: Anthropic (December 9, 2025)
    url: https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation
  - title: MCP joins the Agentic AI Foundation
    publisher: Model Context Protocol blog (December 9, 2025)
    url: https://blog.modelcontextprotocol.io/posts/2025-12-09-mcp-joins-agentic-ai-foundation/
  - title: Architecture overview
    publisher: modelcontextprotocol.io (checked November 2026)
    url: https://modelcontextprotocol.io/docs/learn/architecture
  - title: Specification (protocol version 2026-07-28)
    publisher: modelcontextprotocol.io (checked November 2026)
    url: https://modelcontextprotocol.io/specification/latest
  - title: Security Best Practices
    publisher: modelcontextprotocol.io (checked November 2026)
    url: https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices
  - title: 'LLM01:2025 Prompt Injection'
    publisher: OWASP GenAI Security Project (2025)
    url: https://genai.owasp.org/llmrisk/llm01-prompt-injection/
  - title: Get started with custom connectors using remote MCP
    publisher: Anthropic Help Center (checked November 2026)
    url: https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp
  - title: ChatGPT Developer mode
    publisher: OpenAI for developers (checked November 2026)
    url: https://developers.openai.com/api/docs/guides/developer-mode
  - title: Connectors and MCP servers
    publisher: OpenAI API docs (checked November 2026)
    url: https://developers.openai.com/api/docs/guides/tools-connectors-mcp
  - title: Extend your agent with Model Context Protocol
    publisher: Microsoft Learn (August 2026)
    url: https://learn.microsoft.com/en-us/microsoft-copilot-studio/agent-extend-action-mcp
  - title: Add and manage MCP servers in VS Code
    publisher: Visual Studio Code docs (November 2026)
    url: https://code.visualstudio.com/docs/copilot/customization/mcp-servers
  - title: Model Context Protocol (MCP)
    publisher: Cursor Docs (checked November 2026)
    url: https://cursor.com/docs/context/mcp
  - title: MCP servers with Gemini CLI
    publisher: Gemini CLI docs (checked November 2026)
    url: https://geminicli.com/docs/tools/mcp-server/
faq:
  - q: Is MCP only for Claude?
    a: 'No. Anthropic created MCP, but it is an open standard, donated to the Agentic AI Foundation under the Linux Foundation, and ChatGPT, Microsoft Copilot Studio, VS Code, Cursor and Gemini CLI can all connect to MCP servers. One well-built server works with all of them.'
  - q: Does MCP replace our APIs?
    a: 'No. An MCP server usually calls your existing API underneath. It adds a layer designed for AI: a short list of clearly described tools, per-user sign-in and a consistent way for any AI app to discover and call them. Your API stays the source of truth.'
  - q: Do I need to be a developer to use MCP?
    a: 'To use one, no. In Claude or ChatGPT you add a connector by pasting the server address and signing in. To build a server that is safe for company data, yes: scopes, OAuth, approvals and logging are engineering work.'
  - q: Can I just use an open-source MCP server from GitHub?
    a: 'For personal experiments, often yes, after reading the code. For company data, check that it supports per-user sign-in, narrow permissions and an audit log, pin the version you reviewed, and run it in a sandbox. Some public servers use one broad token, which most security teams will not accept.'
  - q: How much does a custom MCP server cost?
    a: 'Our MCP Connector costs {{price:mcp-server-development}} as a one-off project, delivered in two to four weeks. You get the source code, OAuth sign-in, approval gates for writes, audit logging and security testing. An optional maintenance plan keeps it current as the specification and AI clients change.'
---

**MCP (Model Context Protocol)** is an open standard that lets AI apps such as Claude, ChatGPT, Microsoft Copilot and Cursor connect to tools and data in one consistent way. Instead of building a separate integration for every AI app and every system, you put an **MCP server** in front of a system once, and every app that supports MCP can use it. Anthropic created it in 2024 and in 2025 donated it to the Agentic AI Foundation, part of the Linux Foundation, while its maintainers still run the protocol.

## What problem does MCP solve?

Before MCP, connecting AI to your systems was an N×M problem. Five AI apps and eight internal systems meant up to forty custom integrations, each with its own auth, its own format and its own bugs. Every new model or app meant doing it again.

MCP turns that into N+M. Each system gets one MCP server. Each AI app gets one MCP client. Any client can talk to any server, because they speak the same protocol. When Anthropic announced MCP, it described the goal as replacing "fragmented integrations with a single protocol" ([Anthropic](https://www.anthropic.com/news/model-context-protocol)).

A useful comparison is USB-C: the laptop does not need to know who made the screen, only that both ends follow the same standard. The official specification makes a similar comparison with the Language Server Protocol, which did the same thing for programming languages and code editors ([MCP specification](https://modelcontextprotocol.io/specification/latest)).

## Who created MCP, and who runs it today?

- **Created by Anthropic.** Anthropic announced and open-sourced MCP on November 25, 2024, with a specification, SDKs, local server support in the Claude Desktop apps and an open-source repository of servers ([Anthropic](https://www.anthropic.com/news/model-context-protocol)).
- **Donated to a foundation.** On December 9, 2025, Anthropic donated MCP to the Agentic AI Foundation (AAIF), a directed fund under the Linux Foundation, co-founded by Anthropic, Block and OpenAI with support from Google, Microsoft, AWS, Cloudflare and Bloomberg. In the same announcement Anthropic cited more than 10,000 active public MCP servers and 97M+ monthly SDK downloads across Python and TypeScript ([Anthropic](https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation)).
- **Still run by its maintainers.** The MCP project's own post says the governance model "continues as is": the maintainers still make protocol decisions with community input, and the Linux Foundation "will not dictate the technical direction of MCP" ([MCP blog](https://blog.modelcontextprotocol.io/posts/2025-12-09-mcp-joins-agentic-ai-foundation/)).

For a buyer, this matters because MCP is not one vendor's feature. Servers you build today are not tied to a single AI company.

## How does MCP work?

MCP has three participants ([MCP architecture](https://modelcontextprotocol.io/docs/learn/architecture)):

- **Host:** the AI app the person uses, such as Claude Desktop or VS Code.
- **Client:** a connector inside the host. The host creates one client for each server it connects to.
- **Server:** a program that gives the AI context and capabilities, for example your CRM, ticketing system or database behind a defined set of tools.

A server can offer three kinds of things, called primitives:

| Primitive | What it is | Example |
|---|---|---|
| Tools | Functions the AI model can call to do something | `find_customer`, `create_ticket`, `run_query` |
| Resources | Data the AI app can read for context | A file, a database schema, a record |
| Prompts | Reusable templates that structure a task | "Summarize this account for a renewal call" |

Messages use JSON-RPC 2.0 and travel over one of two transports: **stdio** for a server running on the same machine as the app, and **Streamable HTTP** for a remote server, where MCP recommends OAuth for sign-in ([MCP architecture](https://modelcontextprotocol.io/docs/learn/architecture)). Some clients also still accept the older SSE transport.

A typical exchange: the client asks the server which tools it has (`tools/list`), the host shows those tools to the model, the model decides to call one, and the client sends the call (`tools/call`) and passes the result back to the model. The model never touches your database directly. It only sees the tools the server chooses to expose.

The protocol keeps evolving. The current specification is protocol version 2026-07-28, which made MCP stateless (every request carries what the server needs) and deprecated some older client features such as sampling and roots ([MCP architecture](https://modelcontextprotocol.io/docs/learn/architecture)). If you build a server, build to the current version and plan for updates.

## MCP vs an API vs function calling: what is the difference?

These three are often confused because they work together.

| Compared on | Plain API | Function calling | MCP |
|---|---|---|---|
| What it is | An interface a system offers to other programs | A model feature: the model returns a structured request to call a function you defined | An open protocol between AI apps and servers that expose tools, resources and prompts |
| Who defines the tools | The system's developers | Your app's code, in one provider's format | The MCP server, discovered by any client at runtime |
| Who decides which call to make | Your code, fixed in advance | The model, and your code runs it | The model, and the host runs it through the server |
| Reuse across AI apps | Each app integrates separately | Rebuilt for each app | Built once, works in any MCP client |
| Sign-in and permissions | API keys or OAuth per integration | Whatever your app does | OAuth recommended for remote servers, per user |
| Best for | Fixed integrations and back-end jobs | One app with a handful of tools | Tools that several AI apps or teams should share |

In practice they stack: the model uses function calling to pick an MCP tool, and the MCP server calls your API underneath. MCP does not replace your API. It is the AI-facing layer on top of it.

## Which AI apps support MCP?

Checked against each vendor's own documentation in November 2026:

| AI app | MCP support | Source |
|---|---|---|
| Claude (claude.ai, Desktop, Cowork, mobile) | Custom connectors using remote MCP on Free, Pro, Max, Ultra, Team and Enterprise plans; local servers in Claude Desktop | [Anthropic Help Center](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp) |
| ChatGPT (web) | Custom MCP servers through developer mode, over SSE or streaming HTTP; write actions need confirmation by default | [OpenAI](https://developers.openai.com/api/docs/guides/developer-mode) |
| OpenAI API (Responses API) | Remote MCP servers as a tool; approval required for each call by default | [OpenAI API docs](https://developers.openai.com/api/docs/guides/tools-connectors-mcp) |
| Microsoft Copilot Studio | MCP tools and resources in agents (the docs say these two are currently supported) | [Microsoft Learn](https://learn.microsoft.com/en-us/microsoft-copilot-studio/agent-extend-action-mcp) |
| VS Code (GitHub Copilot) | Local (stdio) and remote (HTTP) MCP servers | [VS Code docs](https://code.visualstudio.com/docs/copilot/customization/mcp-servers) |
| Cursor | stdio, SSE and Streamable HTTP servers | [Cursor Docs](https://cursor.com/docs/context/mcp) |
| Gemini CLI | stdio, SSE and Streamable HTTP servers (the same page notes that unpaid and Google One users moved to Antigravity CLI on June 18, 2026) | [Gemini CLI docs](https://geminicli.com/docs/tools/mcp-server/) |

Plan eligibility and settings change often, especially on ChatGPT, so check the current page for the app your team uses. We test every server against the clients a team actually uses rather than relying on a list like this one.

## What are the security risks of MCP?

MCP gives a model the ability to read your data and take actions, so the risks are real. The specification says plainly that tools "represent arbitrary code execution and must be treated with appropriate caution" ([MCP specification](https://modelcontextprotocol.io/specification/latest)). The four that matter most:

1. **Prompt injection through tool output.** A record, email or web page returned by a tool can contain hidden instructions. OWASP calls this indirect prompt injection: the model accepts input from external sources such as websites or files ([OWASP](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)). OpenAI warns that malicious MCP servers "may include hidden instructions (prompt injections)" ([OpenAI API docs](https://developers.openai.com/api/docs/guides/tools-connectors-mcp)).
2. **Over-broad permissions.** A server that asks for every scope up front (`files:*`, `db:*`, `admin:*`) turns one stolen token into access to everything. The MCP security guide calls this an expanded blast radius and recommends a minimal starting scope with step-up when a privileged action is first needed ([MCP security best practices](https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices)).
3. **Token handling.** Passing a user's token straight through to a downstream API breaks audit trails and lets attackers reuse tokens across services. The same guide is explicit: MCP servers "MUST NOT accept any tokens that were not explicitly issued for the MCP server" ([MCP security best practices](https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices)).
4. **Untrusted servers.** A local MCP server runs code on your machine with the app's privileges, and a remote one sees whatever enters the conversation. Anthropic's help article warns that custom connectors can reach services Anthropic has not verified ([Anthropic Help Center](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp)), and OpenAI notes that servers can change tool behavior unexpectedly ([OpenAI API docs](https://developers.openai.com/api/docs/guides/tools-connectors-mcp)).

## How do you use MCP safely?

None of these risks is a reason to avoid MCP. They are reasons to build and run it properly:

- **Least privilege.** Expose a few clear tools, not your whole API. Each tool reads or writes only what it needs, and each role gets only its tools.
- **Read-only by default.** Start with read tools. Add write tools one at a time, when there is a clear need.
- **Approvals for writes.** Creating, changing, deleting or sending waits for the user or a named approver. The specification says hosts must obtain explicit user consent before invoking any tool ([MCP specification](https://modelcontextprotocol.io/specification/latest)), and OWASP recommends human approval for high-risk actions ([OWASP](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)).
- **Per-user sign-in.** Users sign in through your identity provider with OAuth, so the AI acts as them, with their permissions, never as a shared admin.
- **Audit logs and rate limits.** Every call is logged with the user, inputs and result, and limits stop loops and bulk extraction.
- **Allow-listed servers.** Only approved servers can be connected, pinned to a version someone has reviewed, with local servers sandboxed.
- **Treat tool results as data.** Sanitize what comes back and never let a tool result change the model's instructions.

If you already run an MCP server or an AI agent, our [Guardrail & Eval Audit](/ai-agents/ai-security-audit/) ({{price:ai-security-audit}}, report in about two weeks) tests it for prompt injection, data leakage and tool misuse and gives you a written list of fixes.

## When do you need a custom MCP server, and what does it cost?

You may not need one. If the system you want to connect already has an official MCP server from its vendor, and its permissions fit your rules, use it.

A custom server makes sense when:

- the system is internal (your database, ERP, ticketing or document store) and nobody else will build a server for it;
- you need per-user permissions, approvals and an audit trail that a public server does not offer;
- several AI apps should use the same connection, so building it once saves rebuilding it per app;
- you sell software and want to give your customers an official, secure way to use it from Claude, ChatGPT or Copilot.

Our [MCP Connector](/ai-agents/mcp-server-development/) costs **{{price:mcp-server-development}}** as a one-off project and is delivered in 2–4 weeks. It includes a tool and permission design you approve before the build, a server built to the current specification, OAuth sign-in through your identity provider, approval gates for write actions, rate limits and audit logging, security testing for prompt injection, scope escalation and leakage, deployment to your cloud, the source code and 30 days of support. An optional maintenance plan keeps it current as MCP and the AI clients change.

If the MCP server is one part of a larger agent that plans and acts across your systems, that is [custom AI agent development](/services/ai-agent-development/), quoted at a fixed price from {{project:customAgent}}.

## What should you do next?

- See it working: in our [live MCP demo](/demos/mcp/) an AI assistant calls a fictional company's CRM, tickets and docs through MCP servers. You set the token's scopes yourself, approve any write and watch every call land in the audit log.
- Automating workflows rather than chat? Read [n8n vs custom AI agents](/resources/n8n-vs-custom-ai-agents/), which covers when a workflow tool can expose tools over MCP for you.
- Compare every price on the [pricing page](/pricing/), or book a free 30-minute call with the systems you want to connect and we will tell you whether you need a custom server at all.
