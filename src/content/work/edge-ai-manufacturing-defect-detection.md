---
title: Edge AI visual inspection for manufacturing defect detection
clientType: An industrial parts manufacturer
sector: Manufacturing
region: Global
kind: [computer-vision, ai, hardware, iot]
ownProduct: false
links: []
art: vision
challenge: >-
  Checking industrial parts for defects by eye is slow and inconsistent. The factory wanted anomalies caught in real
  time as parts moved through production, without streaming images to the cloud.
approach: >-
  We trained an object-detection model on the factory's own image data and deployed it on a Raspberry Pi with a Pi
  Camera. Inference runs on the device, supervisors get an alert the moment a defect is found, and every flagged part
  is logged with its image.
built:
  - Object-detection model for industrial parts, trained on factory-specific datasets
  - On-device inference on Raspberry Pi with a Pi Camera
  - Real-time defect alerts for line supervisors
  - Inspection-log interface with an image of every defect
highlights:
  - Edge-only processing with no cloud dependency, so images stay on site
  - Every flagged part is stored with its image for later review
stack: [TensorFlow, Python, OpenCV, Raspberry Pi, Flask]
outcomes: []
services: [computer-vision, iot-embedded, ai-automation]
featured: true
verified: true
provenance: icasta
order: 41
updated: 2026-11-19
draft: false
seo:
  title: Edge AI Defect Detection Case Study
  description: How we built a computer-vision defect detector that runs on a Raspberry Pi at the line, alerts supervisors and logs every flagged part.
keywords:
  primary: ai defect detection manufacturing
  secondary: [edge ai visual inspection, computer vision quality control, raspberry pi defect detection]
summary: >-
  A real-time visual inspection system for an industrial parts manufacturer. A computer-vision model trained on the
  factory's own images runs on a Raspberry Pi with a camera at the line, flags defective parts as they pass, alerts
  supervisors and keeps an inspection log with images. No cloud is involved.
faq: []
---

Manual inspection depends on who is on shift. We replaced the first look with an object-detection model trained on
images of the factory's own parts, so it learns what normal and defective look like for that product rather than a
generic dataset.

The model runs entirely on a Raspberry Pi with a Pi Camera at the inspection point. When it spots an anomaly it alerts
a supervisor and saves the image to an inspection log, which gives the quality team a searchable record of every
defect without sending a single frame off site.
