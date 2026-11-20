/**
 * Live demo client (S7): brings a LiveDemo widget to life. Talks to api/demo.js (the agent runs there; no keys or
 * prompts in the browser), renders replies with sources, cards, approval gates and the conversion card, the trace of
 * what the agent did and why, and the side panels from the signed sandbox state. The phone surface adds a browser
 * voice call (Web Speech API: recognition where the browser has it, speech synthesis for the agent's voice).
 *
 * Analytics (via track(), GA4 only after consent): demo_start, demo_message, demo_gate, demo_complete, demo_cta,
 * demo_busy, demo_voice, demo_reset; the CTA also sends the key event book_call with location "demo-<id>".
 */
import { track, landingText, turnstileBox } from '@/scripts/lead';

type StepKind = 'guard' | 'tool' | 'gate' | 'approved' | 'declined' | 'blocked' | 'done';
interface Step {
  kind: StepKind;
  label: string;
  detail?: string;
  call?: string;
  why?: string;
  id?: string;
  title?: string;
  consent?: boolean;
}
interface Citation {
  n: number;
  id: string;
  title: string;
  text: string;
  source: string;
}
type Card =
  | { type: 'product'; id: string; name: string; price: string; options: string }
  | { type: 'order'; order: string; status: string; items: { name: string; price?: number }[]; note?: string }
  | { type: 'ticket'; title: string; lines: string[] }
  | { type: 'checkout'; ref: string; lines: string[]; total: string; note?: string }
  | { type: 'booking'; url: string }
  | { type: 'draft'; title: string; meta: string[]; body: string }
  | { type: 'kv'; title: string; rows: [string, string, string?][] }
  | { type: 'table'; title: string; columns: string[]; rows: (string | number)[][] }
  | { type: 'chart'; title: string; labels: string[]; values: number[]; target?: number }
  | { type: 'json'; title: string; json: string; valid: boolean }
  | { type: 'sql'; title: string; sql: string }
  | { type: 'mvp'; title: string; problem: string; users: string; now: string[]; later: string[]; plan: [string, string][]; input: Record<string, unknown> };
type Board = { title: string; items: { label: string; value?: string; status?: 'ok' | 'warn' | 'bad' | 'info' }[] }[];
type State = Record<string, any>;
interface ApiReply {
  ok: boolean;
  error?: string;
  reply?: string;
  steps?: Step[];
  cards?: Card[];
  citations?: Citation[];
  state?: State;
  sig?: string;
  session?: string;
  turnsLeft?: number;
  complete?: boolean;
  meta?: { model: string; ms: number };
  board?: Board;
}
interface Msg {
  role: 'user' | 'assistant';
  content: string;
}
interface Saved {
  messages: Msg[];
  state: State;
  sig: string;
  session: string;
  done: boolean;
  open?: boolean;
}

const API = '/api/demo/';
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const LINK = /\[([^\]\n]{1,140})\]\(((?:https:\/\/(?:visionbotix\.com|cal\.com)\/|\/(?![\/\\]))[^\s)]*)\)/g;

/** Safe Markdown subset for agent replies: links (our site and the booking link only), bold, lists, citations. */
function md(text: string, cites: Citation[]): string {
  const inline = (s: string) =>
    esc(s)
      .replace(LINK, (_, t: string, u: string) => `<a href="${u}"${u.startsWith('https://cal.com') ? ' target="_blank" rel="noopener"' : ''}>${t}</a>`)
      .replace(/(^|[\s(])(https:\/\/visionbotix\.com\/[^\s)<]*)/g, (_, pre: string, u: string) => `${pre}<a href="${u}">${u.replace('https://visionbotix.com', '')}</a>`)
      .replace(/\*\*([^*\n]{1,200})\*\*/g, '<strong>$1</strong>')
      .replace(/\[(\d{1,2})\]/g, (m, n: string) => (cites.some((c) => c.n === Number(n)) ? `<button type="button" class="cite" data-cite="${n}" aria-label="Source ${n}">${n}</button>` : m));
  const out: string[] = [];
  let list: 'ul' | 'ol' | null = null;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    const li = line.match(/^(?:[-*•]|(\d+)[.)])\s+(.*)/);
    if (li) {
      const kind = li[1] ? 'ol' : 'ul';
      if (list !== kind) {
        if (list) out.push(`</${list}>`);
        out.push(`<${kind}>`);
        list = kind;
      }
      out.push(`<li>${inline(li[2] ?? '')}</li>`);
      continue;
    }
    if (list) {
      out.push(`</${list}>`);
      list = null;
    }
    if (line) out.push(`<p>${inline(line.replace(/^#+\s*/, ''))}</p>`);
  }
  if (list) out.push(`</${list}>`);
  return out.join('');
}

/** Horizontal bar chart as inline SVG (no chart library), with an optional target line. */
function chart(labels: string[], values: number[], target?: number): string {
  const max = Math.max(...values, target ?? 0) || 1;
  const row = 24;
  const lw = 150;
  const w = 600;
  const h = labels.length * row + 6;
  const x = (v: number) => lw + (v / max) * (w - lw - 56);
  const fmt = (v: number) => (Math.abs(v) >= 1000 ? `${Math.round(v / 100) / 10}k` : String(Math.round(v * 100) / 100));
  const bars = labels
    .map((l, i) => {
      const v = values[i] ?? 0;
      const y = i * row + 3;
      const below = target !== undefined && v < target;
      return `<text x="${lw - 6}" y="${y + 14}" text-anchor="end" class="ch-l">${esc(l.length > 24 ? `${l.slice(0, 23)}…` : l)}</text><rect x="${lw}" y="${y + 3}" width="${Math.max(2, x(v) - lw)}" height="${row - 8}" rx="3" class="ch-b${below ? ' ch-below' : ''}"/><text x="${x(v) + 5}" y="${y + 14}" class="ch-v">${fmt(v)}</text>`;
    })
    .join('');
  const t = target !== undefined ? `<line x1="${x(target)}" x2="${x(target)}" y1="0" y2="${h}" class="ch-t"/>` : '';
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Bar chart: ${esc(labels.map((l, i) => `${l} ${values[i]}`).join(', '))}">${bars}${t}</svg>`;
}

class LiveDemo {
  root: HTMLElement;
  id: string;
  surface: string;
  feed: HTMLOListElement;
  input: HTMLTextAreaElement;
  sendBtn: HTMLButtonElement;
  chips: HTMLElement;
  trace: HTMLOListElement;
  count: HTMLElement | null;
  messages: Msg[] = [];
  state: State = {};
  prevState: State = {};
  sig = '';
  session = '';
  busy = false;
  started = false;
  done = false;
  turn = 0;
  steps = 0;
  t0 = 0;
  role = '';
  board: Board | null = null;
  persist: string | null;
  ts: ReturnType<typeof turnstileBox>;
  voice: Voice | null = null;
  ready: Promise<void>;
  leadAt = 0;

  constructor(root: HTMLElement, persist: string | null) {
    this.root = root;
    this.id = root.dataset.liveDemo!;
    this.surface = root.dataset.surface!;
    this.feed = root.querySelector('[data-feed]')!;
    this.input = root.querySelector('[data-input]')!;
    this.sendBtn = root.querySelector('[data-send]')!;
    this.chips = root.querySelector('[data-chips]')!;
    this.trace = root.querySelector('[data-trace]')!;
    this.count = root.querySelector('[data-count]');
    this.persist = persist;
    this.role = root.querySelector<HTMLElement>('[data-role][aria-pressed="true"]')?.dataset.role ?? '';
    this.ts = turnstileBox(root.dataset.turnstile, root.querySelector<HTMLElement>('[data-ts]')!, 'demo');
    this.bind();
    if (this.surface === 'phone') this.voice = new Voice(this);
    this.ready = this.restore() ? Promise.resolve() : this.init();
  }

  // ---------- setup ----------
  bind() {
    const r = this.root;
    r.querySelector<HTMLFormElement>('[data-composer]')!.addEventListener('submit', (e) => {
      e.preventDefault();
      const t = this.input.value.trim();
      if (!t || this.busy) return;
      this.input.value = '';
      void this.send(t);
    });
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        r.querySelector<HTMLFormElement>('[data-composer]')!.requestSubmit();
      }
    });
    this.input.addEventListener('focus', () => this.ts.start(), { once: true });
    r.querySelectorAll<HTMLButtonElement>('[data-starter]').forEach((b) =>
      b.addEventListener('click', () => {
        if (this.surface === 'sms' && !this.state.lead) return this.input.focus();
        void this.send(b.dataset.starter!);
      }),
    );
    r.querySelector('[data-reset]')?.addEventListener('click', () => this.reset());
    r.querySelectorAll<HTMLButtonElement>('[data-role]').forEach((b) =>
      b.addEventListener('click', () => {
        this.role = b.dataset.role!;
        r.querySelectorAll<HTMLButtonElement>('[data-role]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        const group = b.closest<HTMLElement>('[data-role-label]')?.dataset.roleLabel ?? 'Role';
        this.sys(`${esc(group)}: <strong>${esc(b.textContent?.trim() ?? '')}</strong>. The agent's tools use this from your next message.`);
        this.renderPanels();
      }),
    );
    // tabs
    const tabs = Array.from(r.querySelectorAll<HTMLButtonElement>('[data-tab]'));
    const select = (b: HTMLButtonElement) => {
      tabs.forEach((t) => {
        const on = t === b;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        r.querySelector<HTMLElement>(`[data-pane="${t.dataset.tab}"]`)!.hidden = !on;
      });
    };
    tabs.forEach((b, i) => {
      b.addEventListener('click', () => select(b));
      b.addEventListener('keydown', (e) => {
        const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        const n = tabs[(i + d + tabs.length) % tabs.length]!;
        select(n);
        n.focus();
      });
    });
    // citations → open and flash the source
    this.feed.addEventListener('click', (e) => {
      const c = (e.target as HTMLElement).closest<HTMLButtonElement>('.cite');
      if (!c) return;
      const li = c.closest('.m');
      const src = li?.querySelector<HTMLDetailsElement>(`[data-src="${c.dataset.cite}"]`);
      if (!src) return;
      src.open = true;
      src.setAttribute('data-flash', '');
      setTimeout(() => src.removeAttribute('data-flash'), 1200);
      src.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
    // sms: the sample enquiry form starts the conversation
    const lead = r.querySelector<HTMLFormElement>('[data-lead-form]');
    lead?.addEventListener('submit', (e) => {
      e.preventDefault();
      if (this.busy || this.state.lead) return;
      const f = Object.fromEntries(new FormData(lead)) as Record<string, string>;
      this.leadAt = performance.now();
      void this.call('chat', { event: { type: 'new_lead', lead: f } }, { user: null }).then((ok) => {
        if (!ok) return;
        lead.setAttribute('data-sent', '');
        const doneEl = document.createElement('p');
        doneEl.className = 'ld-lead-done';
        doneEl.innerHTML = `${this.icon('check-check')} Enquiry sent · first text in <strong>${((performance.now() - this.leadAt) / 1000).toFixed(1)} s</strong>`;
        lead.append(doneEl);
        this.input.disabled = false;
        this.sendBtn.disabled = false;
        this.input.placeholder = `Reply as ${f.name || 'the lead'}…`;
        this.input.focus();
      });
    });
  }

  async init() {
    const r = await this.post({ demo: this.id, action: 'init', timezone: tz() }).catch(() => null);
    if (r?.ok && r.state) {
      this.state = r.state;
      this.prevState = r.state;
      this.sig = r.sig ?? '';
      this.board = r.board ?? null;
    }
    this.renderPanels();
  }

  restore(): boolean {
    if (!this.persist) return false;
    let s: Saved | null = null;
    try {
      s = JSON.parse(sessionStorage.getItem(this.persist) || 'null');
    } catch {}
    if (!s?.state || !s.messages?.length) return false;
    Object.assign(this, { messages: s.messages, state: s.state, prevState: s.state, sig: s.sig, session: s.session, done: s.done, started: true });
    for (const m of s.messages) m.role === 'user' ? this.bubble('user', m.content) : this.bubble('agent', m.content);
    this.chips.hidden = true;
    this.renderPanels();
    return true;
  }

  save(open?: boolean) {
    if (!this.persist) return;
    try {
      const prev = JSON.parse(sessionStorage.getItem(this.persist) || '{}');
      const s: Saved = { messages: this.messages.slice(-16), state: this.state, sig: this.sig, session: this.session, done: this.done, open: open ?? prev.open };
      sessionStorage.setItem(this.persist, JSON.stringify(s));
    } catch {}
  }

  reset() {
    this.voice?.end(true);
    this.messages = [];
    this.session = '';
    this.done = false;
    this.started = false;
    this.turn = 0;
    this.steps = 0;
    this.ts.reset();
    this.feed.replaceChildren();
    const g = this.root.dataset.greeting;
    if (g) this.bubble('agent', g);
    this.trace.replaceChildren();
    this.root.querySelector<HTMLElement>('[data-trace-empty]')!.hidden = false;
    if (this.count) this.count.textContent = '0';
    this.chips.hidden = false;
    const lead = this.root.querySelector<HTMLFormElement>('[data-lead-form]');
    if (lead) {
      lead.removeAttribute('data-sent');
      lead.querySelector('.ld-lead-done')?.remove();
      this.input.disabled = true;
      this.sendBtn.disabled = true;
    }
    if (this.persist)
      try {
        sessionStorage.removeItem(this.persist);
      } catch {}
    track('demo_reset', { demo: this.id });
    void this.init();
  }

  // ---------- talking to the agent ----------
  async send(text: string) {
    await this.ready;
    this.bubble('user', text);
    this.chips.hidden = true;
    await this.call('chat', { text }, { user: text });
  }

  /** One turn. Returns true when the agent answered. */
  async call(action: 'chat' | 'gate', extra: Record<string, unknown>, o: { user: string | null }, retry = 0): Promise<boolean> {
    await this.ready;
    if (this.busy) return false;
    this.busy = true;
    this.root.setAttribute('data-busy', '');
    this.sendBtn.disabled = true;
    if (!this.started) {
      this.started = true;
      this.t0 = performance.now();
      track('demo_start', { demo: this.id });
    }
    let typing = this.typing();
    this.voice?.thinking();
    let r: ApiReply | null = null;
    let status = 0;
    try {
      let ts = this.session ? '' : await this.ts.token();
      if (!ts && this.ts.needsTick) {
        // Cloudflare wants a tick (S12): ask for it under the composer and carry on by itself once it's done.
        typing.remove();
        this.voice?.idle();
        const note = this.sys('One quick check first: tick the box under the message field and your message goes through.');
        this.root.querySelector<HTMLElement>('[data-ts]')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        track('demo_tick', { demo: this.id });
        ts = await this.ts.waitTick();
        note.remove();
        typing = this.typing();
        this.voice?.thinking();
      }
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          demo: this.id,
          action,
          ...extra,
          state: this.state,
          sig: this.sig,
          session: this.session,
          ts,
          messages: this.messages,
          role: this.role,
          timezone: tz(),
          landing: landingText(),
        }),
      });
      status = res.status;
      r = (await res.json().catch(() => null)) as ApiReply | null;
    } catch {
      r = null;
    }
    typing.remove();
    this.busy = false;
    this.root.removeAttribute('data-busy');
    this.sendBtn.disabled = this.surface === 'sms' && !this.state.lead && !r?.state?.lead;

    if (!r?.ok) {
      const err = r?.error ?? (status ? 'server' : 'network');
      this.voice?.idle();
      if (err === 'session' && !retry) {
        this.session = '';
        this.ts.reset();
        return this.call(action, extra, o, 1);
      }
      if ((err === 'busy' || err === 'busy_ip') && !retry) {
        track('demo_busy', { demo: this.id });
        const wait = err === 'busy_ip' ? 30 : 12;
        const note = this.sys(`Our free demo capacity is busy right now. Trying again in <span data-left>${wait}</span> s…`, true);
        for (let i = wait; i > 0; i--) {
          note.querySelector('[data-left]')!.textContent = String(i);
          await new Promise((res) => setTimeout(res, 1000));
        }
        note.remove();
        return this.call(action, extra, o, 1);
      }
      const msg =
        err === 'busy' || err === 'busy_ip'
          ? `Still busy, sorry. Try again in a minute, or <a href="${this.root.dataset.booking}" target="_blank" rel="noopener">book a call</a> and we'll demo it live.`
          : err === 'session_end'
            ? 'This sandbox session has reached its turn limit.'
            : err === 'verification'
              ? "We couldn't confirm you're human (Cloudflare check)."
              : err === 'network'
                ? 'Connection problem.'
                : 'Something went wrong on our side.';
      const n = this.sys(msg, true);
      if (err === 'session_end') this.linkBtn(n, 'Start over', () => this.reset());
      else if (err !== 'busy' && err !== 'busy_ip') {
        if (err === 'verification') this.ts.reset();
        this.linkBtn(n, 'Try again', () => {
          n.remove();
          void this.call(action, extra, o, 0);
        });
      }
      return false;
    }

    // ---- success ----
    this.turn += 1;
    this.prevState = this.state;
    this.state = r.state ?? this.state;
    this.sig = r.sig ?? this.sig;
    this.session = r.session ?? this.session;
    if (r.board) this.board = r.board;
    if (o.user !== null) this.messages.push({ role: 'user', content: o.user });
    const cites = r.citations ?? [];
    for (const s of r.steps ?? []) this.step(s);
    if (r.meta) this.turnMark(r.meta);
    const reply = r.reply ?? '';
    this.messages.push({ role: 'assistant', content: reply });
    const li = this.bubble('agent', reply, cites);
    if (r.cards?.length) this.cards(r.cards);
    for (const g of (r.steps ?? []).filter((s) => s.kind === 'gate')) this.gate(g);
    if (r.complete && !this.done) {
      this.done = true;
      const d = (r.steps ?? []).find((s) => s.kind === 'done');
      track('demo_complete', { demo: this.id, turns: this.turn, seconds: Math.round((performance.now() - this.t0) / 1000) });
      if (this.id !== 'concierge') this.win(d?.detail ?? 'Goal reached');
    }
    track('demo_message', { demo: this.id, n: this.turn, action });
    this.renderPanels();
    this.save();
    this.voice?.say(reply);
    li.scrollIntoView({ block: 'nearest' });
    if ((r.turnsLeft ?? 99) <= 3 && (r.turnsLeft ?? 0) > 0) this.sys(`${r.turnsLeft} turns left in this sandbox session.`);
    return true;
  }

  async post(body: Record<string, unknown>): Promise<ApiReply> {
    const res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return (await res.json()) as ApiReply;
  }

  // ---------- rendering: conversation ----------
  icon(name: string) {
    return this.root.querySelector<HTMLTemplateElement>(`template[data-icon="${name}"]`)?.innerHTML ?? '';
  }

  /** A Button component clone (scoped styles) with a label and attributes. */
  btn(kind: 'a-primary' | 'a-glass' | 'b-primary' | 'b-glass', label: string, attrs: Record<string, string> = {}) {
    const el = this.root.querySelector<HTMLTemplateElement>(`template[data-tpl="${kind}"]`)!.content.firstElementChild!.cloneNode(true) as HTMLElement;
    el.querySelector('.btn-label')!.textContent = label;
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
  }

  add(li: HTMLElement) {
    this.feed.append(li);
    this.feed.scrollTop = this.feed.scrollHeight;
    return li;
  }

  bubble(who: 'user' | 'agent', text: string, cites: Citation[] = []) {
    const li = document.createElement('li');
    li.className = `m m-${who}`;
    const html = who === 'user' ? `<p>${esc(text)}</p>` : md(text, cites);
    const wa = this.surface === 'whatsapp';
    li.innerHTML = `<div class="bubble">${html}</div>${
      wa || this.surface === 'sms' ? `<span class="m-meta">${now()}${who === 'user' && wa ? this.icon('check-check') : ''}</span>` : ''
    }`;
    if (cites.length) {
      const box = document.createElement('div');
      box.className = 'srcs';
      box.innerHTML = cites
        .map((c) => `<details class="src" data-src="${c.n}"><summary><span class="mono">[${c.n}]</span> ${esc(c.title)} <span class="mono">· ${esc(c.source)}</span></summary><p>${esc(c.text)}</p></details>`)
        .join('');
      li.append(box);
    }
    return this.add(li);
  }

  typing() {
    const li = document.createElement('li');
    li.className = 'm m-agent typing';
    li.setAttribute('aria-label', 'The agent is typing');
    li.innerHTML = '<div class="bubble"><i></i><i></i><i></i></div>';
    return this.add(li);
  }

  sys(html: string, warn = false) {
    const li = document.createElement('li');
    li.className = `m m-sys${warn ? ' m-warn' : ''}`;
    li.innerHTML = `<div class="bubble">${html}</div>`;
    return this.add(li);
  }

  linkBtn(li: HTMLElement, label: string, fn: () => void) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.addEventListener('click', fn, { once: true });
    li.querySelector('.bubble')!.append(' ', b);
  }

  cards(cards: Card[]) {
    const li = document.createElement('li');
    li.className = 'm m-agent';
    const row = document.createElement('div');
    const wide = cards.some((c) => !['product', 'order', 'ticket', 'checkout', 'booking'].includes(c.type));
    row.className = wide ? 'cards-stack' : cards.length > 1 ? 'cards' : '';
    if (wide) li.classList.add('m-wide');
    row.innerHTML = cards.map((c) => this.card(c)).join('');
    li.append(row);
    li.querySelectorAll<HTMLElement>('[data-btn-slot]').forEach((slot) => {
      const a = this.btn('a-primary', 'Book a free strategy call', { href: slot.dataset.btnSlot!, target: '_blank', rel: 'noopener', 'data-event': 'book_call', 'data-event-location': `demo-${this.id}` });
      a.addEventListener('click', () => this.cta('booking'));
      slot.replaceWith(a);
    });
    this.add(li);
    li.querySelectorAll<HTMLElement>('[data-mvp]').forEach((el) => void this.priceMvp(el));
  }

  card(c: Card): string {
    switch (c.type) {
      case 'product':
        return `<div class="card"><p class="card-head">${this.icon('shopping-bag')} ${esc(c.name)}</p><p class="card-row"><span>${esc(c.options)}</span><strong>${esc(c.price)}</strong></p></div>`;
      case 'order':
        return `<div class="card"><p class="card-head">${this.icon('inbox')} Order ${esc(c.order)}</p><p class="card-row"><span>Status</span><strong>${esc(c.status)}</strong></p><ul role="list">${c.items.map((i) => `<li>${esc(i.name)}${i.price ? ` · $${i.price}` : ''}</li>`).join('')}</ul>${c.note ? `<p class="card-row"><span>${esc(c.note)}</span></p>` : ''}</div>`;
      case 'ticket':
        return `<div class="card"><p class="card-head">${this.icon('file-text')} ${esc(c.title)}</p><ul role="list">${c.lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul></div>`;
      case 'checkout':
        return `<div class="card"><p class="card-head">${this.icon('shopping-bag')} Secure checkout · ${esc(c.ref)}</p><ul role="list">${c.lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul><p class="card-row"><span>${esc(c.note ?? '')}</span><strong>${esc(c.total)}</strong></p><p class="card-row"><span class="mono">Sandbox link, no payment taken</span></p></div>`;
      case 'draft':
        return `<div class="card card-wide"><p class="card-head">${this.icon('file-text')} ${esc(c.title)}</p>${c.meta.map((m) => `<p class="card-row"><span>${esc(m)}</span></p>`).join('')}<p class="card-body">${esc(c.body)}</p></div>`;
      case 'kv':
        return `<div class="card card-wide"><p class="card-head">${this.icon('list-checks')} ${esc(c.title)}</p><dl class="kv kv-card">${c.rows.map(([k, v, st]) => `<dt>${esc(k)}</dt><dd data-status="${st ?? ''}">${st === 'ok' ? this.icon('circle-check') : st === 'bad' ? this.icon('circle-x') : st === 'warn' ? this.icon('triangle-alert') : ''}${esc(String(v))}</dd>`).join('')}</dl></div>`;
      case 'table':
        return `<div class="card card-wide"><p class="card-head">${this.icon('table')} ${esc(c.title)}</p><div class="tbl-wrap"><table class="tbl"><thead><tr>${c.columns.map((h) => `<th scope="col">${esc(String(h))}</th>`).join('')}</tr></thead><tbody>${c.rows.map((r) => `<tr>${r.map((v) => `<td>${esc(String(v ?? ''))}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;
      case 'chart':
        return `<div class="card card-wide"><p class="card-head">${this.icon('chart-column')} ${esc(c.title)}</p>${chart(c.labels, c.values, c.target)}</div>`;
      case 'json':
        return `<div class="card card-wide"><p class="card-head">${this.icon(c.valid ? 'circle-check' : 'circle-x')} ${esc(c.title)} <span class="pill">${c.valid ? 'valid' : 'has errors'}</span></p><pre class="code">${esc(c.json)}</pre></div>`;
      case 'sql':
        return `<div class="card card-wide"><p class="card-head">${this.icon('database')} ${esc(c.title)}</p><pre class="code">${esc(c.sql)}</pre></div>`;
      case 'mvp':
        return `<div class="card card-wide" data-mvp='${esc(JSON.stringify(c.input))}'><p class="card-head">${this.icon('sparkles')} ${esc(c.title)}</p>${c.problem ? `<p class="card-row"><span>${esc(c.problem)}${c.users ? ` · for ${esc(c.users)}` : ''}</span></p>` : ''}<h5>In the MVP</h5><ul role="list">${c.now.map((f) => `<li>${this.icon('circle-check')} ${esc(f)}</li>`).join('')}</ul>${c.later.length ? `<h5>Later</h5><ul role="list">${c.later.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}<h5>Plan</h5><dl class="kv">${c.plan.map(([w, t]) => `<dt>${esc(w)}</dt><dd>${esc(t)}</dd>`).join('')}</dl><p class="card-price" data-mvp-price>Pricing it with our estimator…</p></div>`;
      case 'booking':
        return `<div class="card"><p class="card-head">${this.icon('calendar-check')} Pick a time with the team</p><p class="card-row"><span>Free 30-minute strategy call, your details pre-filled.</span></p><span data-btn-slot="${esc(c.url)}"></span></div>`;
    }
  }

  gate(s: Step) {
    const consent = !!s.consent;
    const li = document.createElement('li');
    li.className = 'gate';
    li.innerHTML = `<p class="gate-head">${this.icon('user-check')} ${esc(s.title ?? 'Approval needed')}</p>
      <p class="gate-who">${consent ? 'Nothing is sent until you press Send. Your messages from this chat go with it.' : `Approval gate: in this demo, you are ${esc(this.root.dataset.approver ?? 'the manager')}.`}</p>
      ${s.detail ? `<p class="gate-detail">${esc(s.detail)}</p>` : ''}
      <div class="gate-btns"></div>
      <p class="gate-result" hidden></p>`;
    const decide = async (approve: boolean) => {
      if (this.busy) return;
      li.setAttribute('data-decided', '');
      const res = li.querySelector<HTMLElement>('.gate-result')!;
      res.hidden = false;
      res.textContent = approve ? (consent ? 'Sending…' : 'Approved') : consent ? 'Not sent' : 'Declined';
      track('demo_gate', { demo: this.id, approve });
      const ok = await this.call('gate', { gate: { id: s.id, approve } }, { user: null });
      if (!ok) {
        li.removeAttribute('data-decided');
        res.hidden = true;
      } else if (consent && approve) res.textContent = 'Sent to the team';
    };
    const ok = this.btn('b-primary', consent ? 'Send' : 'Approve', { 'data-ok': '' });
    const no = this.btn('b-glass', consent ? "Don't send" : 'Decline', { 'data-no': '' });
    ok.addEventListener('click', () => void decide(true));
    no.addEventListener('click', () => void decide(false));
    li.querySelector('.gate-btns')!.append(ok, no);
    this.add(li);
  }

  win(detail: string) {
    const name = this.root.dataset.agentName ?? 'agent';
    const price = this.root.dataset.price;
    const tl = this.root.dataset.timeline;
    const book = `${this.root.dataset.booking}?${new URLSearchParams({ notes: `Tried the live ${name} demo on visionbotix.com` })}`;
    const li = document.createElement('li');
    li.className = 'win';
    li.innerHTML = `<p class="win-head">${this.icon('badge-check')} ${esc(detail)}</p>
      <p>That was our <strong>${esc(name)}</strong>, working on sample data. We set it up on your own systems, data and rules${tl ? `: ${esc(tl.toLowerCase())}` : ''}${price ? `, ${esc(price.replace(/^From/, 'from'))}` : ''}.</p>
      <div class="cluster"></div>`;
    const a = this.btn('a-primary', 'Get this agent: book a call', { href: book, target: '_blank', rel: 'noopener', 'data-event': 'book_call', 'data-event-location': `demo-${this.id}` });
    const b = this.btn('a-glass', "See what's included", { href: `/ai-agents/${this.root.dataset.agent ?? ''}/#pricing` });
    a.addEventListener('click', () => this.cta('book'));
    b.addEventListener('click', () => this.cta('pricing'));
    li.querySelector('.cluster')!.append(a, b);
    this.add(li);
  }

  /** Prices an MVP scope with the site's own estimator (same model as /estimate/), loaded only when needed. */
  async priceMvp(el: HTMLElement) {
    const out = el.querySelector<HTMLElement>('[data-mvp-price]')!;
    try {
      const m = await import('@/data/estimator');
      const input = JSON.parse(el.dataset.mvp ?? '{}') as Parameters<typeof m.estimate>[0];
      const e = m.estimate(input);
      out.innerHTML = `<strong>${esc(m.rangeLabel(e))}</strong> · ${esc(e.weeksLabel)} · indicative, a fixed quote follows a call`;
      const a = this.btn('a-glass', 'Open in the estimator', { href: `/estimate/?${m.toQuery(input)}` });
      const b = this.btn('a-primary', 'Book a scoping call', { href: `${this.root.dataset.booking}?${new URLSearchParams({ notes: 'AI MVP scoped with the live demo on visionbotix.com' })}`, target: '_blank', rel: 'noopener', 'data-event': 'book_call', 'data-event-location': `demo-${this.id}` });
      b.addEventListener('click', () => this.cta('book'));
      const row = document.createElement('div');
      row.className = 'cluster';
      row.append(b, a);
      el.append(row);
      track('demo_estimate', { demo: this.id, low: e.low, high: e.high });
    } catch {
      out.textContent = 'Open the estimator to price it.';
    }
  }

  cta(kind: string) {
    track('demo_cta', { demo: this.id, cta: kind, completed: this.done });
  }

  // ---------- rendering: trace ----------
  step(s: Step) {
    this.steps += 1;
    if (this.count) this.count.textContent = String(this.steps);
    this.root.querySelector<HTMLElement>('[data-trace-empty]')!.hidden = true;
    const icon = { guard: 'shield-check', tool: 'wrench', gate: 'user-check', approved: 'circle-check', declined: 'circle-x', blocked: 'ban', done: 'badge-check' }[s.kind] ?? 'sparkles';
    const li = document.createElement('li');
    li.className = 't';
    li.dataset.kind = s.kind;
    if (s.kind === 'guard' && /injection|leak|redacted|reset|blocked/i.test(s.label)) li.setAttribute('data-alert', '');
    const secs = this.t0 ? ((performance.now() - this.t0) / 1000).toFixed(1) : '0.0';
    li.innerHTML = `${this.icon(s.kind === 'guard' && li.hasAttribute('data-alert') ? 'triangle-alert' : icon)}<span class="t-label">${esc(s.kind === 'gate' ? `${s.label}: ${s.title ?? ''}` : s.label)}</span><span class="t-time">+${secs}s</span>${
      s.call ? `<code class="t-call">${esc(s.call)}</code>` : ''
    }${s.detail && s.kind !== 'gate' ? `<span class="t-detail">${esc(s.detail)}</span>` : ''}${s.why ? `<span class="t-why">Why: ${esc(s.why)}</span>` : ''}`;
    this.trace.append(li);
    li.scrollIntoView({ block: 'nearest' });
  }

  turnMark(m: { model: string; ms: number }) {
    const li = document.createElement('li');
    li.className = 't-turn';
    li.textContent = `Turn ${this.turn} · ${(m.ms / 1000).toFixed(1)} s · ${m.model || 'no model call'}`;
    this.trace.append(li);
  }

  // ---------- rendering: panels from the sandbox state ----------
  renderPanels() {
    this.root.querySelectorAll<HTMLElement>('[data-panel]').forEach((el) => {
      const html = this.panel(el.dataset.panel!);
      if (html) el.innerHTML = html;
    });
  }

  panel(kind: string): string {
    const s = this.state;
    const p = this.prevState;
    const li = (icon: string, text: string) => `<li>${this.icon(icon)}<span>${esc(text)}</span></li>`;
    switch (kind) {
      case 'calendar': {
        const cal = (s.calendar ?? []) as { date: string; label: string; slots: { id: string; time: string; with: string }[] }[];
        if (!cal.length) return '';
        const booked = ([...(s.bookings ?? []), ...(s.visit ? [s.visit] : [])] as { date: string; time: string; with: string; name?: string; cancelled?: boolean; code?: string }[]).filter((b) => !b.cancelled);
        const prevBooked = new Set(([...(p.bookings ?? []), ...(p.visit ? [p.visit] : [])] as { code?: string; time: string }[]).map((b) => b.code ?? b.time));
        return `<div class="pn">${cal
          .slice(0, 3)
          .map((d) => {
            const mine = booked.filter((b) => b.date === d.date);
            const slots = [...d.slots.map((x) => ({ ...x, b: false })), ...mine.map((b) => ({ id: b.code ?? '', time: b.time, with: b.with, b: true, isNew: !prevBooked.has(b.code ?? b.time) }))].sort((a, b) => a.time.localeCompare(b.time));
            return `<div class="pn-day"><h4>${esc(d.label)}</h4><div class="pn-slots">${slots
              .slice(0, 14)
              .map((x) => `<span class="slot"${x.b ? ` data-booked${'isNew' in x && x.isNew ? ' data-new' : ''}` : ''} title="${esc(x.with)}">${esc(x.time)}${x.b ? ' · booked' : ''}</span>`)
              .join('')}</div></div>`;
          })
          .join('')}<p class="small muted">Free slots from the sandbox calendar. Bookings made in this demo are highlighted.</p></div>`;
      }
      case 'calls': {
        const items = [
          ...((s.bookings ?? []) as { code: string; label: string; time: string; with: string; cancelled?: boolean; service: string }[]).map((b) => li('calendar-check', `${b.code}: ${b.service}, ${b.label} ${b.time} with ${b.with}${b.cancelled ? ' (cancelled)' : ''}`)),
          ...((s.log ?? []) as { text: string }[]).map((l) => li('check-check', l.text)),
          ...((s.escalations ?? []) as { urgent: boolean; summary: string }[]).map((e) => li(e.urgent ? 'triangle-alert' : 'phone-call', `${e.urgent ? 'On-call dentist alerted' : 'Callback task'}: ${e.summary}`)),
        ];
        return `<div class="pn"><h4>This call</h4>${items.length ? `<ul role="list" class="pn-list">${items.join('')}</ul>` : '<p class="small muted">Bookings, texts and escalations from this call appear here.</p>'}</div>`;
      }
      case 'actions': {
        const acts = (s.actions ?? []) as { text: string }[];
        return `<div class="pn"><h4>Actions in this chat</h4>${acts.length ? `<ul role="list" class="pn-list">${acts.map((a) => li('circle-check', a.text)).join('')}</ul>` : '<p class="small muted">Refunds, returns, cancellations and handoffs appear here.</p>'}<h4>Sample orders</h4><ul role="list" class="pn-list small">${li('inbox', '1042 · alex@example.com · delivered')}${li('inbox', '1057 · sam@example.com · in transit')}${li('inbox', '1063 · jo@example.com · processing')}</ul></div>`;
      }
      case 'basket': {
        const cart = (s.cart ?? []) as { name: string; colour: string; size: string }[];
        return `<div class="pn"><h4>Basket (from yesterday)</h4><ul role="list" class="pn-list">${cart.map((c) => li('shopping-bag', `${c.name}, ${c.colour}, ${c.size}`)).join('')}</ul><dl class="kv"><dt>Discount</dt><dd${s.discount !== p.discount ? ' data-changed' : ''}>${s.discount ? `${esc(String(s.discount))}%` : 'none'}</dd><dt>Checkout links</dt><dd${s.links !== p.links ? ' data-changed' : ''}>${esc(String(s.links ?? 0))}</dd><dt>Sample orders</dt><dd>OL-2231, OL-2198</dd></dl></div>`;
      }
      case 'crm': {
        const l = s.lead as Record<string, string> | null;
        const pl = (p.lead ?? {}) as Record<string, string>;
        const reminders = (s.reminders ?? []) as { when: string; text: string }[];
        if (!l) return '<div class="pn"><h4>CRM record</h4><p class="small muted">Send the enquiry: the record is created the moment it arrives.</p></div>';
        const row = (k: string, label: string, v = l[k]) => (v ? `<dt>${label}</dt><dd${pl[k] !== l[k] ? ' data-changed' : ''}>${esc(String(v))}</dd>` : '');
        return `<div class="pn"><h4>CRM record · ${esc(l.source ?? '')}</h4><dl class="kv">${row('name', 'Name')}${row('phone', 'Mobile')}${row('project', 'Project')}${row('zip', 'ZIP', `${l.zip}${/^78[67]\d\d$/.test(l.zip ?? '') ? ' (in area)' : ' (outside area)'}`)}${row('budget', 'Budget')}${row('homeowner', 'Homeowner')}${row('timeline', 'Timeline')}${row('score', 'Score')}${row('notes', 'Notes')}<dt>Stage</dt><dd${pl.stage !== l.stage ? ' data-changed' : ''}><span class="pill">${esc(l.stage ?? '')}</span></dd></dl>${
          reminders.length ? `<h4>Scheduled texts</h4><ul role="list" class="pn-list">${reminders.map((r) => li('check-check', `${r.when}: ${r.text}`)).join('')}</ul>` : ''
        }</div>`;
      }
      case 'board': {
        if (!this.board) return '';
        const mark = { ok: 'circle-check', warn: 'triangle-alert', bad: 'circle-x', info: 'sparkles' } as const;
        return `<div class="pn">${this.board
          .map(
            (g) =>
              `<h4>${esc(g.title)}</h4><ul role="list" class="pn-list pn-board">${g.items
                .map((it) => `<li data-status="${it.status ?? 'info'}">${this.icon(mark[it.status ?? 'info'])}<span><strong>${esc(it.label)}</strong>${it.value ? ` · ${esc(it.value)}` : ''}</span></li>`)
                .join('')}</ul>`,
          )
          .join('')}</div>`;
      }
      case 'sources': {
        const docs = ['Employee Handbook', 'Travel & Expenses Policy', 'IT Security Policy'];
        return `<div class="pn"><h4>Sources this user can search</h4><ul role="list" class="pn-list">${docs.map((d) => li('file-text', d)).join('')}${this.role === 'manager' ? li('file-text', 'Manager Guide (managers only)') : li('ban', 'Manager Guide: hidden for employees')}</ul><p class="small muted">Access is checked in the search tool, before the model sees any text.</p></div>`;
      }
    }
    return '';
  }
}

/** Browser voice call for the phone surface. Speech recognition where available (Chrome, Edge, Safari), typing otherwise. */
class Voice {
  d: LiveDemo;
  box: HTMLElement;
  status: HTMLElement;
  note: HTMLElement;
  rec: any = null;
  on = false;
  muted = false;
  listening = false;
  timer = 0;
  t = 0;
  voice: SpeechSynthesisVoice | null = null;

  constructor(d: LiveDemo) {
    this.d = d;
    this.box = d.root.querySelector('[data-call]')!;
    this.status = d.root.querySelector('[data-call-status]')!;
    this.note = d.root.querySelector('[data-call-note]')!;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      this.rec = new SR();
      this.rec.lang = 'en-US';
      this.rec.interimResults = false;
      this.rec.maxAlternatives = 1;
      this.rec.onresult = (e: any) => {
        const text = String(e.results?.[0]?.[0]?.transcript ?? '').trim();
        if (text) void this.d.send(text);
      };
      this.rec.onend = () => {
        this.listening = false;
        if (this.on && !this.d.busy && !speechSynthesis.speaking && this.box.dataset.call === 'listening') this.listen();
      };
      this.rec.onerror = (e: any) => {
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          this.rec = null;
          this.note.textContent = 'Microphone blocked, so type your side of the call below. The agent still speaks.';
          this.set('ready');
        }
      };
    }
    const pick = () => {
      const vs = speechSynthesis.getVoices().filter((v) => v.lang.startsWith('en'));
      this.voice = vs.find((v) => /Samantha|Aria|Jenny|Google US English|Natural/i.test(v.name)) ?? vs.find((v) => v.lang === 'en-US') ?? vs[0] ?? null;
    };
    if ('speechSynthesis' in window) {
      pick();
      speechSynthesis.addEventListener?.('voiceschanged', pick);
    }
    d.root.querySelector('[data-call-start]')!.addEventListener('click', () => this.start());
    d.root.querySelector('[data-call-end]')!.addEventListener('click', () => this.end());
    const mic = d.root.querySelector<HTMLButtonElement>('[data-call-mic]')!;
    mic.addEventListener('click', () => {
      this.muted = !this.muted;
      mic.setAttribute('aria-pressed', String(this.muted));
      mic.setAttribute('aria-label', this.muted ? 'Unmute microphone' : 'Mute microphone');
      if (this.muted) this.stopRec();
      else if (!speechSynthesis.speaking && !this.d.busy) this.listen();
      this.set(this.muted ? 'ready' : (this.box.dataset.call as Parameters<Voice['set']>[0]));
    });
    if (!this.rec) this.note.textContent = 'Your browser has no speech recognition, so type your side of the call below. The agent still speaks.';
  }

  set(mode: 'idle' | 'ready' | 'listening' | 'thinking' | 'speaking' | 'ended') {
    this.box.dataset.call = mode;
    const clock = this.on ? `${String(Math.floor(this.t / 60)).padStart(2, '0')}:${String(this.t % 60).padStart(2, '0')}` : '';
    const label = { idle: '', ready: this.muted ? 'muted, type below' : 'your turn, type below', listening: 'listening…', thinking: 'thinking…', speaking: 'speaking', ended: 'call ended' }[mode];
    this.status.textContent = this.on || mode === 'ended' ? `${mode === 'ended' ? 'Call ended' : 'On call'} · ${clock || '00:00'}${label && mode !== 'ended' ? ` · ${label}` : ''}` : '+1 (555) 010-0142 · fictional';
  }

  start() {
    if (this.on) return;
    this.on = true;
    this.t = 0;
    this.timer = window.setInterval(() => {
      this.t += 1;
      this.set(this.box.dataset.call as Parameters<Voice['set']>[0]);
    }, 1000);
    this.d.root.querySelector<HTMLElement>('[data-call-start]')!.hidden = true;
    this.d.root.querySelector<HTMLElement>('[data-call-end]')!.hidden = false;
    this.d.root.querySelector<HTMLElement>('[data-call-mic]')!.hidden = !this.rec;
    track('demo_voice', { demo: this.d.id, mic: !!this.rec });
    this.d.ts.start();
    // Speak right inside the click (mobile Safari only allows speech that starts from a user gesture).
    this.say(this.d.root.dataset.greeting ?? '');
  }

  end(silent = false) {
    if (!this.on) return;
    this.on = false;
    clearInterval(this.timer);
    this.stopRec();
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    this.set('ended');
    const go = this.d.root.querySelector<HTMLElement>('[data-call-start]')!;
    go.hidden = false;
    go.lastChild!.textContent = ' Call again';
    this.d.root.querySelector<HTMLElement>('[data-call-end]')!.hidden = true;
    this.d.root.querySelector<HTMLElement>('[data-call-mic]')!.hidden = true;
    if (!silent) this.d.sys('Call ended. The transcript and the trace stay here.');
  }

  stopRec() {
    if (this.listening)
      try {
        this.rec?.abort();
      } catch {}
    this.listening = false;
  }

  listen() {
    if (!this.on) return;
    if (!this.rec || this.muted) return this.set('ready');
    try {
      this.rec.start();
      this.listening = true;
      this.set('listening');
    } catch {
      this.set('ready');
    }
  }

  thinking() {
    if (!this.on) return;
    this.stopRec();
    this.set('thinking');
  }

  idle() {
    if (this.on) this.listen();
  }

  say(text: string) {
    if (!this.on) return;
    if (!('speechSynthesis' in window) || !text) return this.listen();
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/\[(\d+)\]/g, '').replace(/[*_#]/g, ''));
    if (this.voice) u.voice = this.voice;
    u.rate = 1.04;
    u.onend = () => this.listen();
    u.onerror = () => this.listen();
    this.set('speaking');
    speechSynthesis.speak(u);
  }
}

const tz = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return '';
  }
};

const mounted = new WeakMap<HTMLElement, LiveDemo>();
/** Mounts a LiveDemo widget once. `persist` keeps the conversation across pages (the concierge). */
export function mount(root: HTMLElement, persist: string | null = null) {
  let d = mounted.get(root);
  if (!d) {
    d = new LiveDemo(root, persist);
    mounted.set(root, d);
  }
  return {
    save: (open: boolean) => d!.save(open),
    focus: () => d!.input.focus(),
  };
}
