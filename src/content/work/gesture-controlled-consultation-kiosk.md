---
title: Touch-free consultation kiosk controlled by hand gestures
clientType: A hair and skin treatment clinic
sector: Health, beauty and wellness
region: Global
kind: [desktop, computer-vision, ai]
year: 2024
ownProduct: false
links: []
art: kiosk
challenge: >-
  The clinic wanted visitors to complete an interactive hair and skin consultation quiz on their own, without touching a
  shared screen, keyboard or mouse, and to get them to the right treatment conversation faster.
approach: >-
  We built a standalone desktop application that runs the quiz and is driven entirely by hand gestures. A computer-vision
  model tracks the visitor's hand through a webcam and turns gestures into pointer movement, clicks and scrolling.
built:
  - Standalone Windows application (Python and Tkinter) that runs the interactive consultation quiz end to end
  - Real-time hand tracking from an ordinary webcam
  - Gesture controls for moving the pointer, clicking and scrolling, so no touch is needed
  - Two builds, one for the laptop's built-in camera and one for an external USB camera
  - Simple installers so clinic staff can set it up without IT support
highlights:
  - Touch-free by design, which is more hygienic in a clinic setting
  - Runs on standard hardware; no special sensors needed
stack: [Python, Tkinter, Computer vision, Webcam hand tracking, Windows desktop]
outcomes: []
services: [computer-vision, custom-software-development]
featured: true
verified: true
provenance: owner
order: 3
updated: 2026-11-19
draft: false
seo:
  title: Gesture-Controlled Kiosk Case Study
  description: 'A touch-free consultation kiosk: a desktop quiz app controlled by hand gestures through webcam computer vision, with pointer, click and scroll.'
keywords:
  primary: gesture control software development
  secondary: [touchless kiosk software, hand tracking app, computer vision kiosk]
summary: >-
  We built a touch-free consultation kiosk for a hair and skin clinic: a standalone desktop app that runs an interactive
  quiz and is controlled entirely by hand gestures. Webcam-based computer vision tracks the visitor's hand and turns it
  into pointer movement, clicks and scrolling, with no touch, keyboard or mouse.
faq: []
---

Shared touchscreens and keyboards are the least hygienic objects in a clinic. Instead of asking visitors to tap, the
kiosk watches for a raised hand: move it to steer the pointer, pinch to click, and swipe to scroll through questions.
