/**
 * Shared client helpers for lead forms (/contact/ and /estimate/, S6).
 *  - fills the hidden `started` (fill-time spam check), `timezone` and `landing` (first page + referrer, D49) fields
 *  - loads Cloudflare Turnstile lazily (first focus in the form) when the form has data-turnstile="<site key>", and
 *    waits for its token on submit (D48)
 *  - track(): sends a conversion event through Analytics.astro (GA4 only after consent)
 * The visit source comes from the inline script in BaseLayout (sessionStorage "vbx-src"); nothing here stores data.
 */

declare global {
  interface Window {
    vbxSrc?: { ai: string; ref: string; utm: string; land: string };
    turnstile?: {
      render: (el: HTMLElement, o: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      getResponse: (id?: string) => string | undefined;
    };
    __vbxTurnstile?: () => void;
  }
}

export function track(event: string, detail: Record<string, unknown> = {}) {
  window.dispatchEvent(new CustomEvent('vbx:track', { detail: { event, ...detail } }));
}

/** "ChatGPT (chatgpt.com) → /ai-agents/" or "google.com → /pricing/" or "direct → /". */
export function landingText(): string {
  const s = window.vbxSrc;
  if (!s) return '';
  const from = s.ai ? `${s.ai}${s.ref ? ` (${s.ref})` : ''}` : s.ref || (s.utm ? `utm ${s.utm}` : 'direct');
  return `${from} → ${s.land}`.slice(0, 300);
}

let tsLoading: Promise<void> | null = null;
function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  tsLoading ??= new Promise<void>((resolve, reject) => {
    window.__vbxTurnstile = () => resolve();
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__vbxTurnstile';
    s.async = true;
    s.onerror = () => reject(new Error('turnstile'));
    document.head.append(s);
  });
  return tsLoading;
}

export interface LeadForm {
  /** Resolves with the Turnstile token ('' when Turnstile is off or failed to load: the server decides). */
  token(): Promise<string>;
  reset(): void;
}

export function attachLead(form: HTMLFormElement, action: string): LeadForm {
  const set = (name: string, v: string) => {
    let el = form.elements.namedItem(name) as HTMLInputElement | null;
    if (!el) {
      el = Object.assign(document.createElement('input'), { type: 'hidden', name });
      form.append(el);
    }
    el.value = v;
  };
  set('started', String(Date.now()));
  try {
    set('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone);
  } catch {}
  set('landing', landingText());

  const key = form.dataset.turnstile;
  let box: HTMLElement | null = null;
  let widget: string | undefined;
  const start = () => {
    if (!key || box) return;
    box = document.createElement('div');
    box.className = 'ts-box';
    (form.querySelector('[data-ts-slot]') ?? form).append(box);
    loadTurnstile()
      .then(() => {
        widget = window.turnstile!.render(box!, { sitekey: key, action, appearance: 'interaction-only', theme: document.documentElement.dataset.theme === 'light' ? 'light' : 'dark' });
      })
      .catch(() => {});
  };
  form.addEventListener('focusin', start, { once: true });

  return {
    async token() {
      if (!key) return '';
      start();
      // Turnstile usually finishes in the background; give it up to 10 s when someone submits very quickly.
      for (let i = 0; i < 50; i++) {
        const t = window.turnstile?.getResponse(widget);
        if (t) return t;
        await new Promise((r) => setTimeout(r, 200));
      }
      return '';
    },
    reset() {
      if (widget !== undefined) window.turnstile?.reset(widget);
    },
  };
}
