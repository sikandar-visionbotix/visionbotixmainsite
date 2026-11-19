---
title: Genetic sample collection, pedigree and 3D facial capture platform
clientType: A genetics research programme studying inherited disorders
sector: Healthcare and life-sciences research
region: Global
kind: [ios, computer-vision, saas]
year: 2024
ownProduct: false
links: []
art: health
challenge: >-
  Field teams collecting genetic samples for inherited-disorder research were juggling paper questionnaires, hand-drawn
  family trees and separate photo records. Data arrived late, incomplete and hard to link back to the right family.
approach: >-
  We built one management platform around the collector's day: an iPhone and iPad app that works offline in the field,
  syncs to a central system, and captures every artefact of a sample (questionnaire, pedigree, documents, location and a
  3D facial recording) against a single family record.
built:
  - Collector app for iPhone and iPad with secure sign-in and offline capture that syncs when back online
  - Structured clinical questionnaires per participant and per family
  - Pedigree builder to create and modify multi-generation family trees in the app
  - Family records retrieved and edited by family ID with a passcode
  - Document scanning and file attachments on each sample
  - Geotagging with automatic address lookup from coordinates
  - Companion 3D face-scan app using Apple's TrueDepth camera, with on-screen guidance and a mirror mode
  - Central sample-management back office for coordinators
highlights:
  - Live on the Apple App Store and in continuous use since 2024, with regular releases
  - 3D facial recording runs on iPhone 11 and later and on iPad Pro
  - Built for field conditions; collectors keep working without a connection
stack: [Swift, Apple TrueDepth / ARKit, iOS and iPadOS, REST API, Cloud database]
outcomes: []
services: [mobile-app-development, computer-vision, custom-software-development]
industries: [healthcare]
featured: true
verified: true
provenance: owner
order: 1
updated: 2026-11-19
draft: false
seo:
  title: Genetic Sample Collection App Case Study
  description: An offline-first iOS platform for genetic sample collection with questionnaires, pedigree building and 3D facial capture on the TrueDepth camera.
keywords:
  primary: sample collection app development
  secondary: [genetic research app, pedigree app, 3D face scanning app, TrueDepth app development]
summary: >-
  We built a complete sample-management platform for a genetics research programme: an offline-first iPhone and iPad
  app for questionnaires, pedigree building, document scans and geotagging, plus a companion app that records 3D facial
  models with Apple's TrueDepth camera, all linked to one family record and synced to a central back office.
faq: []
---

Genetic research depends on clean, linked data: who the participant is, how they relate to the rest of the family, what
was observed, and where the sample came from. The programme's collectors work in the field, often without a reliable
connection, so the app had to be fast, forgiving and offline-first.

The result is a single workflow. A collector opens a family, adds members and their questionnaires, draws or updates
the pedigree, scans consent and clinical documents, records a 3D facial model with the TrueDepth camera, and syncs it
all in one go when they are back online.
