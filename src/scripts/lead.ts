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

/**
 * A Turnstile widget outside a form (S7 live demos, S11 checker): rendered into `box` on first use, invisible unless
 * Cloudflare needs an interaction (a tick box). token() resolves '' when there is no key, it fails, or Cloudflare is
 * waiting for that tick (`needsTick`); callers then show a prompt and `waitTick()` for the visitor (S12).
 * While the tick box is shown, `box` carries the class `ts-tick`.
 */
export function turnstileBox(key: string | undefined, box: HTMLElement, action: string) {
  let widget: string | undefined;
  let started = false;
  let needsTick = false;
  const waiters = new Set<(t: string) => void>();
  const settle = (t: string) => {
    waiters.forEach((w) => w(t));
    waiters.clear();
  };
  const start = () => {
    if (!key || started) return;
    started = true;
    loadTurnstile()
      .then(() => {
        widget = window.turnstile!.render(box, {
          sitekey: key,
          action,
          appearance: 'interaction-only',
          theme: document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
          callback: (t: string) => {
            needsTick = false;
            box.classList.remove('ts-tick');
            settle(t);
          },
          'before-interactive-callback': () => {
            needsTick = true;
            box.classList.add('ts-tick');
          },
          'after-interactive-callback': () => box.classList.remove('ts-tick'),
        });
      })
      .catch(() => {});
  };
  /** True while Cloudflare shows the tick box and no token has arrived. */
  const ticking = () => needsTick && !window.turnstile?.getResponse(widget);
  const token = async (): Promise<string> => {
    if (!key) return '';
    start();
    for (let i = 0; i < 75; i++) {
      const t = window.turnstile?.getResponse(widget);
      if (t) return t;
      // No point waiting the full 15 s once Cloudflare asks for a tick: let the caller prompt for it.
      if (needsTick && i >= 5) return '';
      await new Promise((r) => setTimeout(r, 200));
    }
    return '';
  };
  /** Resolves with the token once the visitor completes the tick box ('' after `ms`). */
  const waitTick = (ms = 180_000): Promise<string> => {
    const t = window.turnstile?.getResponse(widget);
    if (t) return Promise.resolve(t);
    return new Promise((resolve) => {
      const done = (v: string) => {
        clearTimeout(timer);
        waiters.delete(done);
        resolve(v);
      };
      const timer = setTimeout(() => done(''), ms);
      waiters.add(done);
    });
  };
  /** token(), or, when Cloudflare asks for a tick: `onTick()` (show a prompt), then wait for it (see LeadForm). */
  const tokenOrTick = async (onTick: () => void): Promise<string> => {
    const t = await token();
    if (t || !ticking()) return t;
    onTick();
    box.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    return waitTick();
  };
  const reset = () => {
    needsTick = false;
    box.classList.remove('ts-tick');
    if (widget !== undefined) window.turnstile?.reset(widget);
  };
  return {
    start,
    get needsTick() {
      return ticking();
    },
    token,
    waitTick,
    tokenOrTick,
    reset,
  };
}

export interface LeadForm {
  /** Resolves with the Turnstile token ('' when Turnstile is off or failed to load: the server decides). */
  token(): Promise<string>;
  /**
   * Like token(), but when Cloudflare shows its tick box it calls `onTick` (show a prompt) and waits for the visitor
   * to tick it, then resolves with that token (S12). Use this on submit so a visitor who must tick never hits an error.
   */
  tokenOrTick(onTick: () => void): Promise<string>;
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

  // The widget lives in the form's [data-ts-slot] (or at the end of the form); same helper as the demos (S12).
  const box = document.createElement('div');
  box.className = 'ts-box';
  (form.querySelector('[data-ts-slot]') ?? form).append(box);
  const ts = turnstileBox(form.dataset.turnstile, box, action);
  form.addEventListener('focusin', ts.start, { once: true });

  return {
    token: ts.token,
    tokenOrTick: ts.tokenOrTick,
    reset: ts.reset,
  };
}
