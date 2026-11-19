// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';

/** @param {string} file */
const geist = (file) => `./node_modules/@fontsource-variable/${file}`;

// https://docs.astro.build/en/reference/configuration-reference/
// Hosting: Vercel (decision D16). Static output; redirects and headers live in vercel.json.
export default defineConfig({
  site: 'https://visionbotix.com',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  integrations: [
    sitemap({
      // Internal or utility pages never go in the sitemap.
      filter: (page) => !/\/(styleguide|404)\/?$/.test(page),
    }),
  ],
  // Decision D9: Geist (UI, body and display) + Geist Mono (labels, numbers, the agent console). Self-hosted.
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Geist',
      cssVariable: '--font-geist',
      fallbacks: ['system-ui', 'sans-serif'],
      options: {
        variants: [
          { src: [geist('geist/files/geist-latin-wght-normal.woff2')], weight: '100 900', style: 'normal' },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'Geist Mono',
      cssVariable: '--font-geist-mono',
      fallbacks: ['ui-monospace', 'monospace'],
      options: {
        variants: [
          { src: [geist('geist-mono/files/geist-mono-latin-wght-normal.woff2')], weight: '100 900', style: 'normal' },
        ],
      },
    },
  ],
});
