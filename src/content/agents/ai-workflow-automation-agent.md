---
name: Ops Agent
tagline: Automates repetitive work across email, CRM and ERP.
h1: AI workflow automation that takes the busywork off your team.
group: operate
icon: workflow
order: 120
updated: 2026-11-19
seo:
  title: AI Workflow Automation for Email, CRM & ERP
  description: AI workflow automation for the repetitive work across your email, sheets, CRM and ERP, with approval for anything irreversible. Live in about 2 weeks.
keywords:
  primary: AI workflow automation
  secondary: [AI automation agency, n8n automation services, AI back-office automation, business process automation with AI]
summary: >-
  Our Ops Agent is AI workflow automation for the repetitive work between your email, spreadsheets, CRM and ERP. It
  reads emails and documents, updates records, routes requests and chases follow-ups, built on n8n, Make or custom
  code, whichever your team can maintain. Anything irreversible waits for human approval, every run is logged, and it
  goes live in about two weeks.
verbs: [Reads, Routes, Updates, Chases, Reconciles, Logs]
bestFor: [Operations and finance teams, Logistics and distribution firms, Agencies and professional services, E-commerce back offices, Growing teams run on spreadsheets]
problem:
  - Skilled people spend hours every week copying data from emails and PDFs into the CRM, the ERP and a few different spreadsheets.
  - Handoffs between tools depend on someone noticing an email, so orders, invoices and follow-ups wait in an inbox until they do.
  - Copy-paste work creates small errors that surface weeks later as wrong invoices, missed shipments or duplicate records.
  - Rule-based automations break the moment an email arrives in a slightly different format, so the team quietly goes back to doing it by hand.
does:
  - { title: Reads messy inputs, body: 'Emails, attachments, PDFs and form submissions go through an AI step that pulls out the fields your process needs, even when the layout changes.' }
  - { title: Moves data between systems, body: 'Creates and updates records in your CRM, ERP, helpdesk and sheets, so each fact is typed once instead of four times.' }
  - { title: Routes and assigns work, body: 'Sorts requests by type, urgency and customer, then hands each one to the right person or queue with a short summary.' }
  - { title: Chases follow-ups, body: 'Sends reminders for missing documents, unpaid invoices and stalled approvals on the schedule you set, and stops when the reply arrives.' }
  - { title: Asks before it acts, body: 'Payments, deletions, bulk updates and first messages to a customer wait in an approval queue until a named person signs off.' }
  - { title: Logs every run, body: 'Each run records its inputs, decisions and actions, so you can see what happened, retry a failed step or roll a change back.' }
dayInLife:
  - { time: '06:30', step: 'Supplier emails arrived overnight. The agent reads each one, matches it to an open purchase order and updates the ERP.' }
  - { time: '08:15', step: 'A customer emails a new delivery address. The agent updates the CRM and the shipping record and drafts a confirmation for approval.' }
  - { time: '10:40', step: 'An invoice total does not match its purchase order. The agent holds it and sends the gap to finance with both documents attached.' }
  - { time: '13:00', step: 'New leads arrive through the website form. The agent removes a duplicate, fills missing fields and assigns owners by territory.' }
  - { time: '16:20', step: 'A client still has not returned a signed contract. The agent sends a polite second reminder from the account manager''s inbox.' }
  - { time: '17:30', step: 'Your ops lead approves two queued payments and a bulk price update from one screen.' }
  - { time: '08:00', step: 'Next morning, the team reads the run report: what was processed, what is waiting for approval, and what failed and why.' }
useCases:
  - { title: Order and invoice intake, body: 'Reads orders and supplier invoices from email, matches them to purchase orders and posts them to your ERP or accounting system.' }
  - { title: Lead routing and CRM hygiene, body: 'Captures leads from forms and inboxes, merges duplicates, fills missing fields and assigns an owner.' }
  - { title: Customer onboarding, body: 'Collects documents, creates accounts across your tools and sends each welcome step on time.' }
  - { title: Daily reporting and reconciliation, body: 'Pulls numbers from several systems into one sheet each morning and flags anything that does not reconcile.' }
  - { title: Approvals and reminders, body: 'Routes requests for sign-off to the right person and chases them until the decision is made.' }
integrations: [n8n, Make, Zapier, Gmail, Microsoft 365 / Outlook, Google Sheets, Airtable, HubSpot, Salesforce, Zoho CRM, Odoo, NetSuite, QuickBooks Online, Xero, Slack, Microsoft Teams]
controls:
  - Anything irreversible (payments, deletions, bulk updates, first messages to a customer) waits for a named person to approve it.
  - Each workflow runs under its own service account, with only the permissions that workflow needs.
  - You set confidence thresholds, and low-confidence extractions go to a person instead of straight into your systems.
  - Every run is logged with its inputs, decisions and actions, and failed steps can be retried or rolled back.
  - A pause switch stops any single workflow instantly without touching the others.
security:
  - Credentials live in an encrypted vault, never inside workflow code or spreadsheets.
  - Self-hosted n8n can run in your own cloud or on-premises, so your data stays in your environment.
  - Data is encrypted in transit and at rest, and AI providers are configured not to train on your data.
  - Personal data can be masked before it reaches a model, and logs follow your retention rules.
setup:
  - { title: Map the process, body: 'A working session with the people who do the job today, to agree which steps to automate and which need a human approval.' }
  - { title: Pick the right tool, body: 'We choose n8n, Make or custom code based on your systems, data rules and who will maintain it, and explain the trade-off in writing.' }
  - { title: Build and test on real cases, body: 'We connect your systems with least-privilege accounts and run the workflow on past cases alongside your team until the output matches.' }
  - { title: Go live with approvals on, body: 'We switch it on with approval gates and alerts, watch the first runs with you and relax a gate only when you are comfortable.' }
timeline: Live in about 2 weeks
includes:
  - Process mapping and a written automation plan
  - Workflow build in n8n, Make or custom code
  - Connections to your email, CRM, ERP and spreadsheets
  - AI extraction and routing steps with confidence thresholds
  - Approval queue, failure alerts and a pause switch
  - Run logs with retry and rollback
  - 'Monthly: hosting, monitoring, weekly tuning and a run report'
demo:
  title: Ops agent
  status: Running · invoice intake
  icon: workflow
  tools:
    - { icon: mail, label: Inbox }
    - { icon: server-cog, label: ERP }
    - { icon: table, label: Sheets }
  lines:
    - { kind: in, who: 'Email · 08:02', text: 'Invoice INV-4471 attached for PO 2210, 40 pallets delivered Tuesday. Payment due in 14 days.' }
    - { kind: sys, icon: file-text, label: extracted, text: 'supplier invoice · PO 2210 · 40 pallets · net 14 days' }
    - { kind: tool, icon: server-cog, calls: ['erp.get_po("2210")', 'erp.get_goods_receipt("2210")'], result: '38 pallets received' }
    - { kind: sys, icon: triangle-alert, label: mismatch, text: 'invoiced 40, received 38 · payment held' }
    - { kind: gate, text: 'Finance approves a query to the supplier before anything is paid or sent.' }
    - { kind: out, text: 'Thanks for INV-4471. Our goods receipt for PO 2210 shows 38 pallets, not 40. Could you send a corrected invoice or proof of delivery?' }
    - { kind: tool, icon: table, calls: ['sheets.append("AP exceptions", row)'], result: 'logged' }
    - { kind: done, text: 'Invoice matched to PO · 2-pallet gap caught · query sent after approval · run logged' }
  caption: Scripted demo · a fictional wholesale distributor
related:
  agents: [ai-document-processing-agent, ai-data-analyst-agent, ai-knowledge-assistant]
  services: [ai-automation, ai-agent-development, custom-software-development]
  industries: [logistics, ecommerce, finance, legal]
faq:
  - q: How is this different from Zapier or a normal automation?
    a: Rule-based automations follow fixed steps and break when an input changes shape. The Ops Agent adds AI steps that read unstructured emails and documents, make routing decisions and draft replies, while the plumbing stays in a proven workflow engine. You get the flexibility of AI with the predictability of a workflow.
  - q: Do you build on n8n, Make or custom code?
    a: Whichever your team can maintain. n8n suits teams that want to self-host and keep data in their own cloud, Make suits teams that want a visual tool with many ready connectors, and custom code suits high volumes or unusual systems. We recommend one in writing after mapping the process.
  - q: What happens if the AI gets something wrong?
    a: Every AI step has a confidence threshold, and anything below it goes to a person instead of into your systems. Irreversible actions always wait for approval, and every run is logged, so a mistake can be traced, fixed and rolled back.
  - q: Can it work with an older ERP that has no modern API?
    a: Often, yes. We can connect through database views, file drops, email or an existing integration layer. If a system has no safe way in, we tell you during mapping instead of building something fragile.
  - q: Who owns the workflows?
    a: You do. Workflows live in your own account or your self-hosted n8n, and each one is documented so your team or another provider can maintain it.
  - q: Which process should we automate first?
    a: Pick one that is frequent, rule-heavy and has a clear owner. Invoice intake, lead routing and customer onboarding are common first choices. We help you choose on the first call and add more once the first workflow is stable.
---

## n8n vs Make vs custom code for AI workflow automation

| Compared on | n8n | Make | Custom code |
|---|---|---|---|
| Where it runs | Their cloud, or self-hosted in your environment | Make's cloud | Your cloud |
| Best for | Data that must stay in your environment | Fast builds with many ready connectors | High volumes, unusual systems, strict performance needs |
| Who can maintain it | A technical ops person | A non-developer after a short handover | A developer |
| AI steps | Built-in AI and agent nodes | AI modules and HTTP calls | Any model or framework |
| Visual editor | Yes | Yes | No, but fully version-controlled |
| Approval gates and logs | Yes, as we configure them | Yes, as we configure them | Yes, as we build them |
