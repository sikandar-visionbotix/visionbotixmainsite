---
location: saudi-arabia
agent: whatsapp-ai-agent
seo:
  title: WhatsApp AI Agent Saudi Arabia for Salla & Zid
  description: A WhatsApp AI agent for Saudi stores and service brands that replies in Arabic, tracks Salla and Zid orders and sends offers only with PDPL consent.
keywords:
  primary: WhatsApp AI agent Saudi Arabia
  secondary: [WhatsApp chatbot Saudi Arabia, Arabic WhatsApp chatbot KSA, WhatsApp bot for Salla stores, WhatsApp chatbot Riyadh]
summary: >-
  Our WhatsApp Agent answers Saudi shoppers and clients on WhatsApp in Arabic or English, day and night, with live
  order status from Salla, Zid or Shopify and your courier. It confirms cash-on-delivery orders and the National
  Address, sends offers only to opted-in customers, in line with the PDPL, and can keep data in the
  Kingdom. Prices below in riyals.
updated: 2026-11-20
h1: A WhatsApp AI agent for Saudi stores and service brands, Arabic first
tagline: Arabic-first WhatsApp replies, Salla and Zid order status, COD checks and offers sent only with consent.
local:
  - title: Arabic first, in the customer's own dialect
    body: Saudi customers usually write in Arabic, often in Najdi or Hejazi dialect, and many send voice notes instead of typing. An agent that only handles English, or answers in stiff formal Arabic, sounds foreign to them, so tone matters as much as accuracy.
  - title: Stores built on Salla and Zid
    body: Many Saudi online stores run on Salla or Zid rather than Shopify, and book shipping through the platform. The agent reads products, orders and tracking from your store platform, so its answer about an order matches what your team sees in the admin.
  - title: National Address and cash on delivery
    body: Saudi couriers deliver to the National Address, and cash on delivery is still widely offered next to mada cards and pay-later options. We set the agent up to confirm each COD order on WhatsApp and ask for the National Address short code before dispatch, so your courier is not left guessing.
  - title: A Sunday to Thursday week with busy weekends
    body: Most companies work Sunday to Thursday, but shoppers keep messaging on Friday and Saturday and late into Ramadan nights. The agent answers at those hours, and chats that need a person wait in your inbox for the next shift.
scenarios:
  - who: Salla and Zid stores
    industry: ecommerce
    body: A shopper in Jeddah sends a voice note asking whether an oud perfume set is in stock and when it would arrive. The agent replies in Arabic text with stock and courier timing, sends the product link, then confirms the COD order and asks for her National Address short code.
  - who: Real estate offices
    industry: real-estate
    body: Listing enquiries arrive on WhatsApp from portals and ads. The agent answers in Arabic or English from your listings, asks for the district, unit type and move-in date, books a viewing with the right broker and logs the lead in your CRM.
  - who: Schools and training centers
    industry: education
    body: Parents ask about registration dates, transport and school tours, mostly in the evening. The agent answers from your approved handbook, books tour slots and hands enrollment decisions and fee questions it cannot answer to your admissions office.
  - who: Restaurants and cafes
    industry: hospitality
    body: In Ramadan, guests ask about iftar and suhoor bookings and late opening hours. The agent answers from your menu and hours, takes table requests into your booking calendar and passes group and event bookings to your manager.
rules:
  - name: WhatsApp Business Messaging Policy
    body: WhatsApp lets a business message people only after they have shared their number and opted in, requires it to respect every request to stop, and asks for a clear route to a person when chats are automated. We record each customer's opt-in, stop at the first opt-out and offer a hand-off to staff in every chat.
    source: https://whatsappbusiness.com/policy/
  - name: 24-hour window and approved templates
    body: A customer's message opens a 24-hour customer service window for free-form replies. Outside it, a business can only send approved template messages, grouped as marketing, utility or authentication. We write order updates and cart reminders as Arabic and English templates and submit them to Meta for approval.
    source: https://developers.facebook.com/docs/whatsapp/pricing
  - name: PDPL Article 25, consent for advertising
    body: Article 25 of the Personal Data Protection Law bars using a person's own means of communication, including postal and electronic addresses, to send advertising without their prior consent, and requires a clear way to stop receiving it. We apply this to WhatsApp offers, with a stored opt-in per customer and an easy opt-out in every offer.
    source: https://sdaia.gov.sa/en/SDAIA/about/Documents/PersonalDataProtectionLaw.pdf
  - name: PDPL Article 29, transfers outside the Kingdom
    body: Article 29 allows personal data to leave the Kingdom only for listed purposes, with protection at least equal to the PDPL and no more data than needed. Where your policy requires it, chat history and logs stay in an in-Kingdom cloud region, and our team builds on test data.
    source: https://sdaia.gov.sa/en/SDAIA/about/Documents/PersonalDataProtectionLaw.pdf
  - name: E-Commerce Law rules for electronic ads
    body: Under the E-Commerce Law rules, an electronic ad must make clear it is an ad, describe the product, give the seller's name and contact details and offer a way to ask for ads to stop. Our offer templates carry each of these in Arabic and English, and a stop request ends further offers.
    source: https://mc.gov.sa/en/guides/Documents/MerchantGuide.pdf
setup:
  - title: Your number and display name
    body: We register your number on the WhatsApp Business Platform, complete Meta business verification with your commercial registration details and submit a display name that matches your brand, which Meta reviews against its display-name guidelines.
  - title: Saudi dialect, Modern Standard Arabic and English
    body: The agent replies in the customer's language and answers voice notes in text. We test it on real Arabic messages and voice notes from your chats, set replies to Saudi phrasing or Modern Standard Arabic as you prefer, and review them with your team before launch.
  - title: Right-to-left replies and templates
    body: Arabic replies, product cards and templates are written and tested right to left, with prices, order numbers and dates kept readable inside the Arabic text. Each template is submitted in Arabic and English, so customers get the language they chose.
  - title: Ramadan, Eid and the weekend
    body: In Ramadan, working hours for Muslim staff are capped at six hours a day, so we move hand-off times and delivery cut-offs to your Ramadan shift. On Friday, Saturday and Eid the agent keeps answering and tells customers when your team is back.
  - title: Where chat data lives
    body: Chat history, logs and order lookups can run in an in-Kingdom cloud region or on your own servers. Messages still pass through Meta's WhatsApp infrastructure, so we help you cover it in your privacy notice, and your DPO signs off the setup.
systems:
  - kind: Store platforms
    names: [Salla, Zid, Shopify, WooCommerce, Magento]
  - kind: Couriers
    names: [SMSA Express, Aramex, Naqel Express]
  - kind: CRMs and booking calendars
    names: [HubSpot, Zoho CRM, Google Sheets, Google Calendar]
sources:
  - title: WhatsApp Business Messaging Policy
    url: https://whatsappbusiness.com/policy/
  - title: Meta for Developers, WhatsApp Business Platform pricing and customer service window
    url: https://developers.facebook.com/docs/whatsapp/pricing
  - title: Meta for Developers, WhatsApp display names
    url: https://developers.facebook.com/documentation/business-messaging/whatsapp/display-names
  - title: SDAIA, Personal Data Protection Law (English text)
    url: https://sdaia.gov.sa/en/SDAIA/about/Documents/PersonalDataProtectionLaw.pdf
  - title: Ministry of Commerce, The Trader's Guide (E-Commerce Law obligations)
    url: https://mc.gov.sa/en/guides/Documents/MerchantGuide.pdf
  - title: Ministry of Human Resources and Social Development, Actual working hours (Article 98)
    url: https://www.hrsd.gov.sa/en/knowledge-centre/articles/312
faq:
  - q: Can it reply in Saudi dialect?
    a: Yes. It replies in Arabic to messages and voice notes in Saudi dialect, and we set the replies to Saudi phrasing or Modern Standard Arabic as you prefer. We test it on real messages from your chats and review the Arabic replies with your team before launch. Answers come only from your catalog and policies.
  - q: Does it work with Salla and Zid?
    a: Yes. Salla and Zid are among the store platforms the agent connects to, alongside Shopify and WooCommerce. It reads products, stock, orders and tracking, so its answers match your store admin, and order changes beyond the limits you set wait for staff approval.
  - q: Can customers pay with mada, Tabby or Tamara in the chat?
    a: Not inside WhatsApp itself. The agent sends a link to your store's checkout, where customers pay with mada, a card, Tabby, Tamara or cash on delivery, as your store allows. Payment details never pass through the agent; it only sees from the order in your store whether it has been paid.
  - q: Where is the data stored?
    a: Chat history, logs and order lookups can run in an in-Kingdom cloud region or on your own servers. Messages pass through Meta's WhatsApp servers on the way, which your privacy notice should mention. Our engineers work on test data and sign SDAIA's standard contractual clauses before seeing live records.
  - q: Can we send offers to all our customers on WhatsApp?
    a: Only to customers who agreed to receive them. Article 25 of the PDPL requires prior consent for advertising and a clear way to stop it, so offers go out as Meta-approved marketing templates to opted-in customers, each with an easy opt-out, and anyone who opts out is not messaged again.
  - q: Does it keep working on Fridays, Saturdays and in Ramadan?
    a: Yes. The agent runs every day, including the weekend, Ramadan nights and Eid. We switch it to your Ramadan hours and delivery cut-offs, add iftar and suhoor timings for restaurants, and chats that need a person wait in your inbox until your team is back.
  - q: Does it understand voice notes?
    a: Yes. Customers can send a voice note in Arabic or English, and the agent answers in text. If it is unsure what was said, it asks the customer to confirm or hands the chat to your team with the recording attached.
---
