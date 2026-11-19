/**
 * Build-time icon registry. Icons are read from npm packages when a page is rendered and inlined as SVG,
 * so no icon JS or sprite request reaches the browser.
 * - UI icons: lucide-static (ISC), stroke style.
 * - Brand marks: simple-icons (CC0), fill style. LinkedIn is not in simple-icons any more (brand request),
 *   so it uses Lucide's former outline glyph, defined inline below.
 * Add a name to the lists below to make it available to <Icon name="…" />.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const UI = [
  'arrow-right', 'arrow-up-right', 'chevron-down', 'chevron-right', 'sun', 'moon', 'menu', 'x', 'phone', 'calendar-check',
  'check', 'sparkles', 'bot', 'shield-check', 'code', 'layers', 'globe', 'mail', 'map-pin', 'message-circle', 'cpu',
  'workflow', 'search', 'megaphone', 'file-text', 'database', 'plug', 'zap', 'rocket', 'clock', 'users', 'building-2',
  'lock', 'eye', 'briefcase', 'monitor-smartphone', 'smartphone', 'server', 'scan-eye', 'graduation-cap', 'stethoscope',
  'scale', 'truck', 'landmark', 'shopping-cart', 'hotel', 'sprout', 'house', 'star', 'quote', 'external-link',
  'palette', 'cloud', 'headset', 'calendar', 'chart-line', 'target', 'brain', 'circle-check', 'info', 'triangle-alert',
  'handshake', 'file-signature', 'key-round', 'badge-check', 'calendar-clock', 'wallet', 'presentation', 'life-buoy',
  'eye-off', 'server-cog', 'timer', 'phone-missed', 'inbox', 'list-checks', 'user-check', 'gauge', 'hand', 'file-lock',
  'fingerprint', 'network', 'radar', 'scroll-text', 'circle-x', 'repeat', 'clipboard-check', 'languages',
  // S3 agent pages and demo scripts
  'phone-call', 'phone-incoming', 'mic', 'send', 'reply', 'receipt', 'file-check', 'table', 'chart-column', 'trending-up',
  'trending-down', 'circle-pause', 'shield-alert', 'terminal', 'bug', 'list-todo', 'refresh-cw', 'pen-line', 'image',
  'mail-check', 'user-plus', 'link', 'search-check', 'message-square-text', 'bell', 'clipboard-list',
  // S5 products, company pages, prompt-first hero
  'cable', 'satellite', 'activity', 'swords', 'gavel', 'hard-drive', 'wifi-off', 'microchip', 'send-horizontal', 'wand-sparkles',
  'arrow-left', 'map', 'heart', 'flask-conical', 'download', 'corner-down-left', 'building', 'scan-search',
  // S6 estimator and exit offer
  'calculator', 'copy', 'rotate-ccw', 'pencil',
  // S7 live demos
  'phone-off', 'mic-off', 'keyboard', 'wrench', 'shopping-bag', 'maximize-2', 'circle-play', 'ban', 'check-check', 'volume-2', 'user-round',
] as const;

// Brand names are prefixed where they would clash with a UI icon ('x' = close, 'brand-x' = X/Twitter).
const BRAND = ['facebook', 'instagram', 'youtube', 'brand-x', 'github', 'whatsapp', 'apple', 'appstore'] as const;

export type UiIcon = (typeof UI)[number];
/** Every valid icon name, for validating content files (src/content.config.ts). */
export const iconNames = [...UI, ...BRAND, 'linkedin'] as const;
export type BrandIcon = (typeof BRAND)[number] | 'linkedin';
export type IconName = UiIcon | BrandIcon;

// Rendering happens at build time from the project root (astro dev/build), so resolve from there.
// (simple-icons does not export its package.json, so require.resolve can't locate it.)
const lucideDir = join(process.cwd(), 'node_modules/lucide-static/icons');
const simpleDir = join(process.cwd(), 'node_modules/simple-icons/icons');

const cache = new Map<IconName, { body: string; kind: 'stroke' | 'fill' }>();

const LINKEDIN =
  '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/>';

/** Returns the inner SVG markup (paths only) and whether it is drawn with stroke or fill. */
export function getIcon(name: IconName): { body: string; kind: 'stroke' | 'fill' } {
  const hit = cache.get(name);
  if (hit) return hit;
  let out: { body: string; kind: 'stroke' | 'fill' };
  if (name === 'linkedin') {
    out = { body: LINKEDIN, kind: 'stroke' };
  } else if ((BRAND as readonly string[]).includes(name)) {
    const raw = readFileSync(join(simpleDir, `${name.replace(/^brand-/, '')}.svg`), 'utf8');
    out = { body: raw.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<title>[\s\S]*?<\/title>/, ''), kind: 'fill' };
  } else {
    const raw = readFileSync(join(lucideDir, `${name}.svg`), 'utf8');
    out = { body: raw.replace(/<!--[\s\S]*?-->/g, '').replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').trim(), kind: 'stroke' };
  }
  cache.set(name, out);
  return out;
}
