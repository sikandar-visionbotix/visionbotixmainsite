---
location: usa
agent: ai-receptionist
seo:
  title: AI Receptionist for US Businesses and Clinics
  description: An AI receptionist for US businesses that answers 24/7 in English or Spanish, books into Open Dental, ServiceTitan or Clio, and works under a BAA.
keywords:
  primary: AI receptionist for US businesses
  secondary: [AI receptionist for dental offices, bilingual AI receptionist English Spanish, AI answering service for HVAC and plumbing, AI receptionist for law firms, HIPAA AI receptionist with BAA]
summary: >-
  Our AI receptionist for US businesses answers every call 24/7 in American English or Spanish, books into the
  dental, field-service or legal software you already use and transfers urgent calls. We set it up for US rules: a
  BAA for health data, a recording notice for all-party consent states and registered business texting. Prices
  below in US dollars.
updated: 2026-11-20
h1: An AI receptionist for US businesses, in English and Spanish
tagline: Answers US calls 24/7 in English or Spanish, books into Open Dental or ServiceTitan, with a BAA for clinics.
local:
  - title: Callers ask about insurance before they book
    body: US patients want to know whether you are in network with their dental or medical plan before they commit. The agent answers from the plan list you approve, takes the carrier and member ID for your team to verify, and never promises what a plan will pay.
  - title: Many callers would rather speak Spanish
    body: In many US communities a share of your callers prefer Spanish. The agent greets in English, switches to Spanish when the caller does and gives the same approved answers in both, so nobody waits for a bilingual team member to be free.
  - title: No-heat and no-AC calls do not wait for Monday
    body: HVAC, plumbing and electrical emergencies happen at night and on weekends. The agent books the job in your field-service software, applies your after-hours rules and texts or transfers to the on-call technician for real emergencies, while routine jobs wait for the morning.
  - title: Offices in more than one time zone
    body: Groups with offices in several states need each location answered in its own time zone. The agent keeps separate hours, holidays and calendars per location and routes each caller to the right office based on the number they dialed.
scenarios:
  - who: Dental offices
    industry: dental-clinics
    body: Answers lunchtime and after-hours calls, books new patients into Open Dental or Dentrix, collects the insurance carrier and member ID for your team to verify, and texts the on-call dentist about urgent pain or a knocked-out tooth by your rules.
  - who: Medical practices and med spas
    industry: healthcare
    body: Books, moves and cancels appointments, answers prep, parking and paperwork questions from your approved list, and passes anything clinical, such as symptoms or test results, to staff. Patient data stays in a US region with providers that sign a BAA.
  - who: HVAC, plumbing and electrical companies
    body: Takes service calls day and night, books the visit into ServiceTitan, Jobber or Housecall Pro with the address and the problem described, and texts your on-call technician when a caller reports no heat in winter, a gas smell or a burst pipe.
  - who: Personal injury and immigration law firms
    industry: legal
    body: Answers new inquiries at any hour, collects the names a conflict check needs, books the consultation in Clio or your calendar and never gives legal advice. Callers who sound urgent, such as someone just arrested or injured, go straight to an attorney.
  - who: Property managers
    industry: real-estate
    body: Takes after-hours maintenance calls from tenants, sends floods, lockouts and no-heat calls to the on-call manager at once, logs routine requests for the morning and books showings for prospective renters.
rules:
  - name: HIPAA business associate agreements
    body: Under 45 CFR 164.504(e), a practice needs a written contract with any business associate that handles patient information, covering safeguards, reporting of breaches and subcontractors. We sign a BAA with your practice, use providers that sign one with us and keep PHI out of model training.
    source: https://www.govinfo.gov/content/pkg/CFR-2023-title45-vol2/pdf/CFR-2023-title45-vol2-sec164-504.pdf
  - name: Call recording in all-party consent states
    body: Federal law allows a call to be recorded with one party's consent, but some states go further. Maryland, for example, allows it only when all parties have given prior consent. When you turn recording on, the greeting announces it at the start of every call, before anything else is said.
    source: https://mgaleg.maryland.gov/mgawebsite/Laws/StatuteText?article=gcj&section=10-402&enactments=false
  - name: AI voices on outbound calls (TCPA)
    body: In February 2024 the FCC confirmed that AI-generated voices count as artificial voices under the TCPA, so outbound AI calls need the called party's prior express consent unless an exemption applies. The receptionist answers inbound calls; if you add callbacks or reminder calls, it dials only numbers with consent on record and names your business.
    source: https://docs.fcc.gov/public/attachments/FCC-24-17A1.pdf
  - name: Registered business texting (A2P 10DLC)
    body: US carriers require anyone texting customers from an application over a standard 10-digit number to register under A2P 10DLC. We register your confirmation and reminder texts before go-live, and every message names your business and stops at the first STOP reply.
    source: https://www.twilio.com/docs/messaging/compliance/a2p-10dlc
setup:
  - title: Keep your number or get a local one
    body: Forward your existing line to the agent (all calls, after hours or overflow only) from your carrier or phone system, or we set up a new number with your local area code. A toll-free number works too if your callers are spread across the country.
  - title: American English and Spanish voices
    body: We pick a natural American English voice with you, plus a Spanish voice for callers who prefer it, and test both with sample calls before go-live. The greeting tells callers they are speaking to an AI assistant and that they can ask for a person.
  - title: Federal holidays and hours per location
    body: We load your hours per location and time zone, plus the days you close, such as Thanksgiving, Independence Day and Juneteenth, and any state or local closures you add. Calls on those days are still answered and booked for your next open day.
  - title: Emergencies go to 911 and your on-call staff
    body: The agent never handles a medical or safety emergency. It tells the caller to hang up and dial 911, and urgent cases that are not emergencies, such as dental pain or a burst pipe, go straight to your on-call person by transfer or text.
systems:
  - kind: Dental practice software
    names: [Open Dental, Dentrix]
  - kind: Medical practice software
    names: [athenahealth, DrChrono]
  - kind: Field-service software
    names: [ServiceTitan, Jobber, Housecall Pro]
  - kind: Legal practice software
    names: [Clio]
  - kind: Calendars and CRM
    names: [Google Calendar, Outlook, Calendly, HubSpot, Follow Up Boss]
sources:
  - title: 45 CFR 164.504, business associate contracts (govinfo.gov)
    url: https://www.govinfo.gov/content/pkg/CFR-2023-title45-vol2/pdf/CFR-2023-title45-vol2-sec164-504.pdf
  - title: Maryland Courts and Judicial Proceedings 10-402, interception of communications (Maryland General Assembly)
    url: https://mgaleg.maryland.gov/mgawebsite/Laws/StatuteText?article=gcj&section=10-402&enactments=false
  - title: 18 U.S.C. 2511, interception of communications, one-party consent (govinfo.gov)
    url: https://www.govinfo.gov/content/pkg/USCODE-2023-title18/html/USCODE-2023-title18-partI-chap119-sec2511.htm
  - title: FCC Declaratory Ruling FCC 24-17 on AI-generated voices under the TCPA (February 2024)
    url: https://docs.fcc.gov/public/attachments/FCC-24-17A1.pdf
  - title: What is A2P 10DLC? (Twilio docs, describing the US carrier registration standard)
    url: https://www.twilio.com/docs/messaging/compliance/a2p-10dlc
  - title: Federal holidays (US Office of Personnel Management)
    url: https://www.opm.gov/policy-data-oversight/pay-leave/federal-holidays/
  - title: Open Dental API specification
    url: https://www.opendental.com/site/apispecification.html
  - title: Henry Schein One API Exchange (Dentrix)
    url: https://www.henryscheinone.com/dental-solutions/api-exchange
  - title: Housecall Pro API documentation
    url: https://docs.housecallpro.com/
  - title: Clio developer documentation
    url: https://docs.developers.clio.com/
faq:
  - q: Can it record calls in all-party consent states?
    a: Only with notice, and your lawyer decides whether that is enough. When you turn recording on, the greeting tells every caller that the call is recorded before the conversation starts, so callers in states such as Maryland, which require all parties' consent, know before they speak. If you prefer, recording stays off.
  - q: Will you sign a BAA for our dental office or clinic?
    a: Yes. We sign a Business Associate Agreement with your practice before the agent handles any patient information, run it on providers that sign a BAA with us, keep PHI in a US region and out of model training, and document the data flow for your privacy officer.
  - q: Can it check a patient's insurance eligibility?
    a: Not by itself. It answers in-network questions from the plan list you approve and collects the carrier, member ID and date of birth, then your team or your existing eligibility tool verifies benefits. It never tells a caller what their plan will pay.
  - q: Can it make reminder calls, or does it only answer?
    a: It answers inbound calls by default. Reminders go out by text, and if you also want reminder or callback calls, the agent dials only numbers with consent on record, because the FCC treats AI-generated voices as artificial voices under the TCPA.
  - q: Do we need to register our number to send texts?
    a: Yes, if the confirmations come from a standard local number. US carriers require A2P 10DLC registration for business texting from an application, so we register your brand and message types before go-live. A toll-free number goes through its own verification instead.
  - q: Does it work with ServiceTitan, Jobber or Housecall Pro?
    a: Yes. We connect the agent through the software's API so it can create the customer, book the job with the address and problem, and see your technicians' availability. We test bookings with your dispatcher before go-live.
  - q: Can one agent answer offices in different states?
    a: Yes. Each location gets its own number, time zone, hours, holidays and calendar, and the agent answers with that location's details. Callers who want a different office are transferred or booked there.
---
