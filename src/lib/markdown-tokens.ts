/**
 * Markdown plugin (S10) for Astro 7's Sätteri processor: fills price tokens like {{price:ai-receptionist}} in text,
 * table cells and link text from src/data/pricing.ts, and turns a paragraph that is only a block token
 * ({{table:agents}}) into the generated HTML table (see src/lib/tokens.ts). Runs on every Markdown collection; text
 * without tokens is untouched. Unknown tokens throw, so the build fails instead of shipping "{{…}}".
 */
import { fillTokens, blockToken, BLOCK_RE } from './tokens';

export const priceTokens = {
  name: 'vbx-price-tokens',
  paragraph(node: { children?: { type: string; value?: string }[] }) {
    const only = node.children?.length === 1 && node.children[0]!.type === 'text' ? node.children[0]!.value?.trim().match(BLOCK_RE) : null;
    if (only) return { type: 'html' as const, value: blockToken(only[1]!) };
    return undefined;
  },
  text(node: { value: string }) {
    // Block tokens are left for the paragraph visitor.
    if (node.value.includes('{{') && !BLOCK_RE.test(node.value.trim())) return { type: 'text' as const, value: fillTokens(node.value) };
    return undefined;
  },
};
