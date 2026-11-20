---
location: pakistan
agent: whatsapp-ai-agent
seo:
  title: WhatsApp Chatbot Pakistan for Stores & COD
  description: A WhatsApp chatbot for Pakistani businesses that replies in Urdu, Roman Urdu and English, confirms COD orders and tracks TCS, Leopards and PostEx parcels.
keywords:
  primary: WhatsApp chatbot Pakistan
  secondary: [WhatsApp AI agent Pakistan, WhatsApp chatbot in Urdu, WhatsApp automation Pakistan, COD order confirmation WhatsApp, WhatsApp chatbot for online store Pakistan]
summary: >-
  Our WhatsApp chatbot for Pakistani businesses is an AI agent on the official WhatsApp Business Platform. It replies
  in Urdu, Roman Urdu and English, understands voice notes, confirms cash-on-delivery orders before you book the courier
  and shares TCS, Leopards or PostEx tracking. It follows Meta's opt-in and template rules and PECA's unsubscribe duty.
  Prices below are in rupees.
updated: 2026-11-20
h1: A WhatsApp AI agent for Pakistani stores, in Urdu, Roman Urdu and English
tagline: Confirms COD orders, shares courier tracking and replies to voice notes in Urdu, day and night.
local:
  - title: Customers ask on WhatsApp before they buy
    body: 'Shoppers who find you on Instagram, Facebook or your website usually send a WhatsApp message first: is this in stock, does it come in medium, do you deliver to Multan, is COD available? A reply hours later often arrives after they have ordered somewhere else.'
  - title: Cash on delivery means refused parcels
    body: 'Many Pakistani online stores still rely on COD, and a parcel refused at the door means courier return charges and stock stuck in transit. Confirming each order on WhatsApp before you book the courier lets you ship to customers who still want it.'
  - title: Roman Urdu, Urdu script and voice notes
    body: 'Customers write "size M available hai?" in Roman Urdu, type in Urdu script, mix in English or send a voice note. The agent understands all of these and replies in the language and script the customer used, from your approved catalogue and policies.'
  - title: Ramadan, Eid and sale-day peaks
    body: 'Message volume jumps during Ramadan, before Eid and on big sale days, exactly when your team is busiest or on leave. The agent answers every chat, knows your changed timings and courier cut-off dates, and queues anything that needs a person.'
scenarios:
  - who: Clothing and lawn brands
    industry: ecommerce
    body: 'Answers questions on stitched and unstitched suits, sizes, fabric and delivery times from your Shopify or WooCommerce catalogue, confirms COD orders before dispatch and replies to "mera parcel kahan hai?" with live courier tracking.'
  - who: Schools, colleges and academies
    industry: education
    body: 'Answers parents in Urdu and English about admissions, test dates, timings, fee schedule dates and transport, books campus visits, and passes questions about a particular student to the office with the chat attached.'
  - who: Restaurants and home kitchens
    industry: hospitality
    body: 'Shares the menu, delivery areas and timings, takes table bookings and large orders for sehri, iftar or family events, and sends anything unusual, such as a complaint about an order, to the manager on duty.'
  - who: Property dealers and developers
    industry: real-estate
    body: 'Answers enquiries about plots, houses and apartments from your listings, asks about budget band, location and timeline, books site visits in the twin cities or elsewhere, and passes serious buyers to your sales team with the details.'
rules:
  - name: WhatsApp opt-in before you message first
    body: 'Meta lets a business message people on WhatsApp only if they gave their number and opted in to receive messages from that business, and every opt-out request, on or off WhatsApp, must be respected. We add a clear WhatsApp opt-in at checkout and on your forms, record it and stop messaging anyone who opts out.'
    source: https://whatsappbusiness.com/policy/
  - name: The 24-hour customer service window
    body: 'When a customer messages you, a 24-hour customer service window opens and free-form replies are allowed. Once it closes, only template messages can be sent: utility templates for order and delivery updates, marketing templates for promotions. COD confirmations and shipping updates go out as utility templates.'
    source: https://developers.facebook.com/docs/whatsapp/pricing
  - name: Escalation to a person and no card numbers
    body: 'Meta allows automated replies inside the 24-hour window but requires prompt, clear and direct escalation paths, such as a transfer to a human agent. Its policy also bars asking people to share full card numbers. The agent hands any chat to your team on request and never asks for card numbers, wallet PINs or one-time codes.'
    source: https://whatsappbusiness.com/policy/
  - name: Meta's terms on AI providers
    body: 'Meta''s platform terms bar AI providers whose AI is the primary functionality on offer, and bar using WhatsApp data to train or improve AI models, apart from fine-tuning a model for your own use. Your agent is part of your own customer service: it answers only about your business, orders and policies, and your chats are never used to train models.'
    source: https://www.facebook.com/legal/Meta-Terms-for-WhatsApp-Business-Platform
  - name: PECA 2016 spamming offence
    body: 'The Prevention of Electronic Crimes Act 2016 makes spamming an offence, and defines unsolicited information as commercial or marketing messages sent against the recipient''s explicit rejection. Anyone engaged in direct marketing must offer an option to unsubscribe. Every marketing message carries an opt-out, and opted-out numbers are dropped at once.'
    source: https://fia.gov.pk/files/laws/352839075.pdf
setup:
  - title: Your WhatsApp Business Platform account
    body: 'We connect your number to the WhatsApp Business Platform through Meta, complete business verification with your company documents and get your display name approved. The number must be able to receive a verification code by SMS or call.'
  - title: Keep your number or start a new one
    body: 'In most cases your current number can move to the platform, and depending on your setup your team can keep using the WhatsApp Business app on it alongside the agent. If that does not suit, we set up a new number for the agent.'
  - title: Urdu, Roman Urdu and English replies
    body: 'We write and test replies in all three with your team, including common Roman Urdu spellings, local product names and the mixed Urdu and English customers actually type. Voice notes in Urdu are understood, and the agent answers in text.'
  - title: COD confirmation before courier booking
    body: 'When a COD order comes in, the agent sends a confirmation template with the items, address and total. Each reply is logged against the order for your team, so you book the courier only for confirmed orders and call those with no reply.'
  - title: Ramadan, Eid and hand-off to staff
    body: 'We load your Ramadan timings, Eid closure dates and courier cut-offs, and set who receives chats that need a person. Your team answers those from a shared inbox on desktop or phone, and the agent stays quiet until they hand the chat back.'
systems:
  - kind: Online stores
    names: [Shopify, WooCommerce]
  - kind: Couriers
    names: [TCS, Leopards Courier, PostEx]
  - kind: Order sheets and CRM
    names: [Google Sheets, Zoho CRM, HubSpot]
  - kind: Messaging
    names: [WhatsApp Business Platform, Instagram Messaging API]
sources:
  - title: WhatsApp Business Messaging Policy (Meta)
    url: https://whatsappbusiness.com/policy/
  - title: Get opt-in for WhatsApp (Meta for Developers)
    url: https://developers.facebook.com/docs/whatsapp/overview/getting-opt-in
  - title: WhatsApp Business Platform pricing and customer service window (Meta for Developers)
    url: https://developers.facebook.com/docs/whatsapp/pricing
  - title: Meta Terms for WhatsApp Business Platform
    url: https://www.facebook.com/legal/Meta-Terms-for-WhatsApp-Business-Platform
  - title: Prevention of Electronic Crimes Act 2016, Gazette of Pakistan (FIA copy)
    url: https://fia.gov.pk/files/laws/352839075.pdf
faq:
  - q: Is this a WhatsApp chatbot or an AI agent?
    a: Both terms describe it, but it is more than a button menu. It reads free text and voice notes in Urdu, Roman Urdu and English, looks up stock and orders in your store and courier systems, and replies like a member of your team. Answers come only from your approved catalogue and policies.
  - q: Can it confirm cash-on-delivery orders?
    a: Yes. After each COD order, the agent sends a WhatsApp confirmation with the items, address and total, and the customer confirms or cancels in one reply. Each reply is logged against the Shopify or WooCommerce order, or in your order sheet, so your team books the courier only for confirmed orders and calls the unanswered ones.
  - q: Will it understand Roman Urdu and Urdu voice notes?
    a: Yes. It understands Roman Urdu in its many spellings, Urdu script, English and messages that mix them, as well as voice notes in Urdu, and it replies in text in the customer's language. We test the replies with your team before launch.
  - q: Could my number get banned?
    a: The common risk comes from unofficial bulk-sender software and modified WhatsApp apps, which break WhatsApp's terms. We build only on the official WhatsApp Business Platform, message people who opted in, use templates outside the 24-hour window and watch your number's quality rating.
  - q: Can I send offers to my whole contact list?
    a: Only to customers who opted in to hear from your business. Offers go out as marketing templates with an easy opt-out, as Meta's rules and PECA's unsubscribe duty require, and anyone who opts out is not messaged again. Buying number lists or messaging people who never opted in puts your number at risk.
  - q: Which couriers can it track?
    a: TCS, Leopards Courier and PostEx through the API access your merchant account can request, and other couriers whose API or tracking service your account can use. The agent replies with the parcel status and tracking link, and delivery complaints go to your team.
  - q: What happens during Eid holidays when my team is away?
    a: The agent keeps answering product, order and tracking questions every day, tells customers your dispatch dates around Eid, and queues chats that need a person with a clear note of when your team will reply.
---
