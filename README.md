# visionbotix.com

The Visionbotix website: Astro (static output) hosted on Vercel, "Liquid Glass" design system.

> Branch `overhaul` holds the rebuild. `main` still serves the old static site on GitHub Pages (kept in `legacy/`
> here for reference) until launch, when the domain moves to Vercel. Plan and progress: `../overhaul/PLAN.md` and `../overhaul/TRACKER.md` in the workspace.

## Commands

| | |
|---|---|
| `npm install` | install (Node ≥ 22.23.4) |
| `npm run dev` | dev server at http://localhost:4321 |
| `npm run build` | type-check (`astro check`) and build to `dist/` |
| `npm run preview` | serve the build |
| `npm run contrast` | WCAG AA check of the colour tokens (run after changing colours) |

`/styleguide/` (noindex) shows every token, material and component in both themes.

## Map

```
src/
  styles/        tokens.css (colours, type, space, motion; dark + light) · glass.css (4 materials) ·
                 backdrop.css (animated orbs/aurora/grain) · motion.css (reveal, stagger, press) · base.css
  scripts/       runtime.ts: the only always-on JS (theme, parallax, spotlight, reveal, counters, header, menus)
  components/    Backdrop, Header (mega-menus + mobile dock + sheet), Footer, Button, GlassCard, Section, Steps,
                 Stat, Accordion, CtaBand, Breadcrumbs, ThemeToggle, TextReveal, LensFilter, Icon, Logo, Seo, JsonLd
  layouts/       BaseLayout.astro: head, SEO, JSON-LD graph, backdrop, chrome
  lib/           schema.ts (JSON-LD helpers) · icons.ts (build-time Lucide + Simple Icons)
  data/          site.ts (real company facts; TODO(owner) where unconfirmed) · catalogue.ts (agents, services…) ·
  content/       collections (agents, services, industries, locations, work, products, posts, faqs);
                 each folder has a `_template` to copy. Schemas: src/content.config.ts
  pages/         routes
public/          favicon, logo, robots.txt, OG images, truhairandskin/ (unchanged legacy page)
legacy/          the old static site (not deployed)
vercel.json      Vercel build settings, 301 redirects for legacy URLs, cache and security headers
```

## Rules

- Original logo and favicon only. No invented clients, metrics, reviews or testimonials.
- Confidentiality rules for security products: see the workspace `CLAUDE.md`.
- Old URLs (`/ip-encryptor.html`, `/threatiq.html`, `/cyber-range.html`, `/truhairandskin/`) must keep working:
  the first three are 301s in `vercel.json`; `/truhairandskin/` is served unchanged from `public/`.
