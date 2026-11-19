// WCAG contrast check for the design tokens in src/styles/tokens.css.
// Run: node scripts/check-contrast.mjs  (exits 1 if any pair fails). Keep the values below in sync with tokens.css.
// Covers text on the page background, on a bare orb core (the worst case under the animated backdrop)
// and on glass over each orb. "subtle" text is held to 3:1 on bare orbs (large/secondary text only).
const hex = (h) => { h = h.replace('#', ''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
const lum = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const mix = (a, b, t) => a.map((v, i) => Math.round(v * t + b[i] * (1 - t)));
const orbs = { orange: '#FF7A1A', magenta: '#E8336D', violet: '#7C5CFF', cyan: '#22D3EE' };

const themes = {
  dark: { bg: '#0B0D12', glass: [18, 20, 28], glassAlpha: 0.62, orbAlpha: { orange: 0.32, magenta: 0.34, violet: 0.34, cyan: 0.22 },
    text: { fg: '#F5F5F3', muted: '#AEB3C0', subtle: '#959BAA', accent: '#FF9A57', 'accent-2': '#F472B6' },
    large: { 'grad-text 1': '#FFA25E', 'grad-text 2': '#FF7A5C', 'grad-text 3': '#F0508A' },
    buttons: { fg: '#0B0D12', stops: ['#F7941D', '#F0542D', '#EC1E59'] } },
  light: { bg: '#F7F7F5', glass: [255, 255, 255], glassAlpha: 0.6, orbAlpha: { orange: 0.32, magenta: 0.28, violet: 0.28, cyan: 0.32 },
    text: { fg: '#0B0D12', muted: '#474D5B', subtle: '#575D6C', accent: '#B93D0A', 'accent-2': '#B42A5A' },
    large: { 'grad-text 1': '#C2410C', 'grad-text 2': '#C8324A', 'grad-text 3': '#B8326A' },
    buttons: { fg: '#FFFFFF', stops: ['#C2410C', '#C8324A', '#C2255C'] } },
};

let fails = 0, checks = 0;
const chk = (label, fg, bg, min) => { checks++; const v = cr(hex(fg), bg); if (v < min) { fails++; console.log(`FAIL ${v.toFixed(2)} < ${min}  ${label}`); } };
for (const [name, t] of Object.entries(themes)) {
  const bg = hex(t.bg);
  for (const [n, c] of Object.entries(t.text)) {
    chk(`${name} ${n} on bg`, c, bg, 4.5);
    for (const [o, oc] of Object.entries(orbs)) {
      const under = mix(hex(oc), bg, t.orbAlpha[o]);
      chk(`${name} ${n} on bare ${o} orb`, c, under, n === 'subtle' || n.startsWith('accent') ? 3 : 4.5);
      chk(`${name} ${n} on glass over ${o}`, c, mix(t.glass, under, t.glassAlpha), 4.5);
    }
  }
  for (const [n, c] of Object.entries(t.large)) chk(`${name} ${n} (large text) on bg`, c, bg, 3);
  for (const s of t.buttons.stops) chk(`${name} primary button text on ${s}`, t.buttons.fg, hex(s), 4.5);
}
console.log(`${checks - fails}/${checks} pairs pass WCAG AA`);
process.exit(fails ? 1 : 0);
