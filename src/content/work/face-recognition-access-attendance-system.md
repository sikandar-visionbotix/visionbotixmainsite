---
title: Face-recognition entry and attendance system for offices
clientType: A company managing access to its offices
sector: Workplace and physical security
region: Global
kind: [computer-vision, ai, hardware]
ownProduct: false
links: []
art: security
challenge: >-
  Cards and PINs get shared, lost or forgotten, and attendance records based on them are easy to game. The client
  wanted entry tied to the person, with a clear alert when someone unknown tried to get in.
approach: >-
  We built a face-recognition terminal on a Raspberry Pi using FaceNet embeddings, with anti-spoofing so a photo cannot
  open the door. The same check records attendance, unknown faces trigger alerts, and the device keeps working offline.
built:
  - Face recognition with anti-spoofing at the entry point
  - Automatic attendance logging from each recognized entry
  - Alerts for unknown faces and unauthorized entry attempts
  - Offline operation on Raspberry Pi hardware
  - Reporting dashboard for access and attendance
highlights:
  - One check handles both access control and attendance
  - Keeps working through network outages
stack: [Python, OpenCV, FaceNet, Raspberry Pi, Flask]
outcomes: []
services: [computer-vision, iot-embedded, cybersecurity]
featured: false
verified: true
provenance: icasta
order: 50
updated: 2026-11-19
draft: false
seo:
  title: Face Recognition Access Control Case Study
  description: How we built face-recognition office entry and attendance on Raspberry Pi, with anti-spoofing, unknown-face alerts and offline mode.
keywords:
  primary: face recognition access control system
  secondary: [facial recognition attendance system, anti-spoofing face recognition, raspberry pi face recognition]
summary: >-
  A face-recognition entry and attendance system for offices. A Raspberry Pi terminal recognizes staff with
  anti-spoofing checks, logs attendance from each entry, alerts on unknown faces and unauthorized attempts, and keeps
  running offline. Managers review access and attendance in a reporting dashboard.
faq: []
---

Access cards identify a card, not a person. We moved the check to the face: a camera on a Raspberry Pi matches each
person against enrolled staff using FaceNet embeddings, and an anti-spoofing step stops someone holding up a photo.

Every recognized entry doubles as an attendance record, and unknown faces raise an alert straight away. Because
recognition runs on the device, the door and the attendance log keep working when the network does not.
