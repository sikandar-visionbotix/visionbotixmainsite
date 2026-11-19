/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** GA4 Measurement ID (G-…). Optional; see src/data/site.ts → analytics. */
  readonly PUBLIC_GA4_ID?: string;
  /** Microsoft Clarity project ID. Optional. */
  readonly PUBLIC_CLARITY_ID?: string;
  /** Cloudflare Turnstile site key (public). Pair it with TURNSTILE_SECRET_KEY on the server. */
  readonly PUBLIC_TURNSTILE_SITE_KEY?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
