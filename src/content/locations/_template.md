---
# Copy uk.md (the reference page) to <slug>.md → /locations/<slug>/, and add the slug to `locations` in src/data/catalogue.ts.
# Unique, localised substance only: no doorway pages (PLAN §6.2). Check before building:
#   node scripts/check-locations.mjs <slug>
# Rules:
#  - No prices or money amounts: the page converts pricing.ts into the local currency (approximate, dated).
#  - zones = main cities with their UTC offset in the season with the LEAST overlap; shift = our PKT hours. The page
#    computes the overlap; any "N hours of overlap" in the copy must match it (the checker verifies).
#  - "Delivered for clients in X" only if X is in site.deliveredInCodes (owner-confirmed).
#  - No offices abroad: we work from Rawalpindi. Compliance = the rule + what we put in place, never "compliant"/"certified".
#  - spelling: uk on UK, AU and PK pages (D65), us elsewhere; the checker enforces it.
draft: true
---
