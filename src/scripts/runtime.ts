/**
 * The site's only always-on script (≈3 KB gzipped). No framework. Each feature is progressive:
 * the page is complete and readable without it.
 *
 * - performance: low-end devices / data saver → html[data-perf="lite"] (static backdrop, no blur)
 * - backdrop: pause while the tab is hidden; pointer parallax on the orbs
 * - spotlight: `.spotlight` elements get --mx/--my from the pointer
 * - reveal: [data-reveal] / [data-stagger] get data-inview when scrolled into view
 * - counters: [data-count] animate up to their value once visible
 * - theme: [data-theme-toggle] switches light/dark and remembers the choice
 * - header: data-scrolled after the top, auto-hides on scroll down (desktop), shows on scroll up
 * - menus: keeps aria-expanded in sync for popover triggers; closes a menu when one of its links is used
 * - lens: Chromium-only SVG refraction on `.lens` (html[data-lens])
 * Ported in spirit from the reference design system's backdrop runtime.
 */

const html = document.documentElement;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');

/* ---------- performance ---------- */
type NavExtra = Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
const nav = navigator as NavExtra;
const forcedPerf = new URLSearchParams(location.search).get('perf');
// Deliberately stricter than the reference design system (≤4): iOS Safari can report 4 cores, and the animated backdrop is a
// brand requirement, so only genuinely weak devices (or data saver) drop to lite. `?perf=lite|full` forces a mode.
const lowEnd =
  (nav.deviceMemory !== undefined && nav.deviceMemory <= 2) ||
  (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency <= 2) ||
  !!nav.connection?.saveData;
if (forcedPerf === 'lite' || (forcedPerf !== 'full' && lowEnd)) html.dataset.perf = 'lite';

/* ---------- lens (Chromium only) ---------- */
const brands = (navigator as Navigator & { userAgentData?: { brands: { brand: string }[] } }).userAgentData?.brands ?? [];
// Desktop only: the displacement filter re-renders every frame while the orbs move behind it, which cost
// ~5 s of main-thread time in Lighthouse's throttled mobile run (S1). Phones keep the plain glass-strong look.
const desktop = finePointer.matches && matchMedia('(min-width: 64rem)').matches;
if (desktop && !reducedMotion.matches && brands.some((b) => b.brand === 'Chromium') && html.dataset.perf !== 'lite' && document.querySelector('.lens')) {
  html.dataset.lens = '';
}

/* ---------- backdrop pause ---------- */
const backdrop = document.querySelector<HTMLElement>('[data-backdrop]');
document.addEventListener('visibilitychange', () => backdrop?.toggleAttribute('data-paused', document.hidden));

/* ---------- pointer: parallax + spotlight ---------- */
if (!reducedMotion.matches && finePointer.matches) {
  let frame = 0;
  let last: PointerEvent | null = null;
  let hovered: HTMLElement | null = null;
  const tick = () => {
    frame = 0;
    const e = last;
    if (!e) return;
    if (backdrop && html.dataset.perf !== 'lite') {
      backdrop.style.setProperty('--bd-px', ((e.clientX / innerWidth) * 2 - 1).toFixed(3));
      backdrop.style.setProperty('--bd-py', ((e.clientY / innerHeight) * 2 - 1).toFixed(3));
    }
    const target = (e.target as Element | null)?.closest?.<HTMLElement>('.spotlight') ?? null;
    if (hovered && hovered !== target) {
      hovered.style.removeProperty('--mx');
      hovered.style.removeProperty('--my');
    }
    hovered = target;
    if (target) {
      const r = target.getBoundingClientRect();
      target.style.setProperty('--mx', `${Math.round(e.clientX - r.left)}px`);
      target.style.setProperty('--my', `${Math.round(e.clientY - r.top)}px`);
    }
  };
  addEventListener(
    'pointermove',
    (e) => {
      last = e;
      if (!frame) frame = requestAnimationFrame(tick);
    },
    { passive: true },
  );
}

/* ---------- counters ---------- */
const countUp = (el: HTMLElement) => {
  const target = Number(el.dataset.count);
  if (!Number.isFinite(target) || reducedMotion.matches) return;
  const decimals = (el.dataset.count?.split('.')[1] ?? '').length;
  const fmt = new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const start = performance.now();
  const dur = 1400;
  const step = (now: number) => {
    const p = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = fmt.format(target * eased);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};

/* ---------- reveal on scroll ---------- */
const revealables = document.querySelectorAll<HTMLElement>('[data-reveal], [data-stagger], [data-count]');
document.querySelectorAll<HTMLElement>('[data-stagger]').forEach((group) => {
  Array.from(group.children).forEach((child, i) => (child as HTMLElement).style.setProperty('--i', String(i)));
});
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        el.setAttribute('data-inview', '');
        if (el.dataset.count !== undefined) countUp(el);
        io.unobserve(el);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );
  revealables.forEach((el) => io.observe(el));
} else {
  revealables.forEach((el) => el.setAttribute('data-inview', ''));
}

/* ---------- theme ---------- */
const THEME_KEY = 'vbx-theme';
const applyTheme = (theme: 'light' | 'dark', persist: boolean) => {
  html.dataset.theme = theme;
  if (persist) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* storage blocked: the choice lasts for this page only */
    }
  }
  document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(theme === 'dark'));
    btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  });
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0b0d12' : '#f7f7f5');
};
applyTheme(html.dataset.theme === 'light' ? 'light' : 'dark', false);
document.addEventListener('click', (e) => {
  const btn = (e.target as Element | null)?.closest?.('[data-theme-toggle]');
  if (btn) applyTheme(html.dataset.theme === 'dark' ? 'light' : 'dark', true);
});
matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(THEME_KEY);
  } catch {
    /* ignore */
  }
  if (!stored) applyTheme(e.matches ? 'light' : 'dark', false);
});

/* ---------- header ---------- */
const header = document.querySelector<HTMLElement>('[data-header]');
if (header) {
  let lastY = scrollY;
  let ticking = false;
  const update = () => {
    ticking = false;
    const y = scrollY;
    header.toggleAttribute('data-scrolled', y > 8);
    const menuOpen = !!document.querySelector('[data-menu]:popover-open');
    const hide = y > 320 && y > lastY + 4 && !menuOpen && !header.matches(':focus-within');
    if (hide) header.setAttribute('data-hidden', '');
    else if (y < lastY - 4 || y < 320) header.removeAttribute('data-hidden');
    lastY = y;
  };
  addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  update();
}

/* ---------- menus (popover API) ---------- */
document.querySelectorAll<HTMLElement>('[data-menu]').forEach((menu) => {
  const triggers = document.querySelectorAll<HTMLElement>(`[popovertarget="${menu.id}"]`);
  menu.addEventListener('toggle', (e) => {
    const open = (e as ToggleEvent).newState === 'open';
    triggers.forEach((t) => t.setAttribute('aria-expanded', String(open)));
    if (menu.dataset.menu === 'sheet') html.toggleAttribute('data-sheet-open', open);
  });
  menu.addEventListener('click', (e) => {
    if ((e.target as Element).closest('a')) menu.hidePopover();
  });
});
