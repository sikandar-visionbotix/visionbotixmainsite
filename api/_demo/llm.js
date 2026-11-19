/**
 * Provider-agnostic chat client for the live demos (S7, D25/D53/D59). Speaks the OpenAI-compatible Chat Completions
 * API, which Groq, Google Gemini, OpenAI, OpenRouter and most hosts implement. The model chain can span providers, so
 * free tiers stack: when one model is rate-limited, the next one answers. Env only, no code change:
 *
 *   LLM_CHAIN      e.g. "groq:openai/gpt-oss-120b,gemini:gemini-flash-latest" (provider:model, tried in order).
 *                  Default: every provider below that has a key, in the order of the Keys line.
 *   LLM_PROVIDER + LLM_MODEL   older single-provider form, still honoured when LLM_CHAIN is empty
 *   LLM_BASE_URL + LLM_API_KEY  a "custom" OpenAI-compatible endpoint (e.g. the local mock)
 *   Keys: GROQ_API_KEY, CEREBRAS_API_KEY, GEMINI_API_KEY, OPENROUTER_API_KEY, MISTRAL_API_KEY (default chain order), OPENAI_API_KEY
 *
 * Keys stay on the server. Nothing here logs prompts or replies.
 */
const PROVIDERS = {
  groq: {
    base: 'https://api.groq.com/openai/v1',
    keyEnv: 'GROQ_API_KEY',
    // Groq no longer serves Llama chat models (checked 2026-11-20, D53): open-weight gpt-oss-120b first (best tool
    // calling), then Qwen and gpt-oss-20b, which have their own free-tier quotas.
    models: ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-20b'],
    // Llama Prompt Guard 2: a small classifier that scores how likely a message is a prompt injection (0–1).
    guard: 'meta-llama/llama-prompt-guard-2-86m',
  },
  // Google's OpenAI-compatible endpoint (D59): the overflow when Groq's free tier is busy.
  // Auto-updating aliases ("-latest"), so a retired model never breaks the demos.
  gemini: { base: 'https://generativelanguage.googleapis.com/v1beta/openai', keyEnv: 'GEMINI_API_KEY', models: ['gemini-flash-lite-latest', 'gemini-3.5-flash-lite'] },
  // More free tiers that join the chain as soon as their key is set in Vercel (D59).
  cerebras: { base: 'https://api.cerebras.ai/v1', keyEnv: 'CEREBRAS_API_KEY', models: ['gpt-oss-120b', 'qwen-3.8-27b'] },
  openrouter: { base: 'https://openrouter.ai/api/v1', keyEnv: 'OPENROUTER_API_KEY', models: ['google/gemma-4-31b-it:free', 'nvidia/nemotron-3-ultra-550b-a55b:free'] },
  mistral: { base: 'https://api.mistral.ai/v1', keyEnv: 'MISTRAL_API_KEY', models: ['mistral-small-latest'] },
  openai: { base: 'https://api.openai.com/v1', keyEnv: 'OPENAI_API_KEY', models: ['gpt-4.1-mini'] },
  custom: { base: '', keyEnv: 'LLM_API_KEY', models: ['default'] },
};

const DEFAULT_CHAIN = [
  'groq:openai/gpt-oss-120b', // ~1 s
  'cerebras:gpt-oss-120b', // ~1.7 s
  'gemini:gemini-flash-lite-latest', // ~2 s
  'gemini:gemini-3.5-flash-lite',
  'groq:qwen/qwen3.8-27b',
  'cerebras:qwen-3.8-27b', // ~5 s
  'groq:openai/gpt-oss-20b',
  'mistral:mistral-small-latest',
  'openrouter:google/gemma-4-31b-it:free', // shared free pool, often busy
  'openrouter:nvidia/nemotron-3-ultra-550b-a55b:free', // ~6 s, weaker at tool calls
];
const keyFor = (name) => (name === 'custom' ? process.env.LLM_API_KEY : process.env[PROVIDERS[name].keyEnv]) || '';
const baseFor = (name) => (name === 'custom' || (process.env.LLM_BASE_URL && name === (process.env.LLM_PROVIDER || '').toLowerCase()) ? process.env.LLM_BASE_URL || '' : PROVIDERS[name].base).replace(/\/$/, '');

/** @returns {{ provider: string, model: string, base: string, key: string }[]} */
function chainFromEnv() {
  const parse = (list, fallback) =>
    list
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
      .map((x) => {
        const [p, ...m] = x.includes(':') && PROVIDERS[x.split(':')[0]] ? x.split(':') : [fallback, x];
        return { provider: p, model: m.join(':') };
      });
  let chain = [];
  if (process.env.LLM_CHAIN) chain = parse(process.env.LLM_CHAIN, 'groq');
  else if (process.env.LLM_PROVIDER || process.env.LLM_MODEL) {
    const p = PROVIDERS[(process.env.LLM_PROVIDER || 'groq').toLowerCase()] ? (process.env.LLM_PROVIDER || 'groq').toLowerCase() : 'custom';
    chain = process.env.LLM_MODEL ? parse(process.env.LLM_MODEL, p) : PROVIDERS[p].models.map((model) => ({ provider: p, model }));
  } else {
    // Benchmarked 2026-11-20 on the demos (D59): fast and reliable first, slower or flakier free pools last.
    // Entries whose provider has no key are skipped.
    chain = DEFAULT_CHAIN.map((x) => {
      const [provider, ...m] = x.split(':');
      return { provider, model: m.join(':') };
    }).filter((c) => keyFor(c.provider));
  }
  return chain.map((c) => ({ ...c, base: baseFor(c.provider), key: keyFor(c.provider) })).filter((c) => c.base && c.key);
}

export function llmConfig() {
  const chain = chainFromEnv();
  const guardModel = process.env.LLM_GUARD_MODEL ?? (keyFor('groq') ? PROVIDERS.groq.guard : '');
  return {
    chain,
    providers: [...new Set(chain.map((c) => c.provider))],
    models: chain.map((c) => `${c.provider}:${c.model}`),
    guard: guardModel ? { model: guardModel, base: PROVIDERS.groq.base, key: keyFor('groq') } : null,
  };
}

/** Provider-specific request fields (reasoning, token limit name, parallel tool calls). */
function bodyFor(c, maxTokens) {
  if (c.provider === 'gemini') return { max_tokens: maxTokens + 800, reasoning_effort: 'low' }; // keep thinking short
  if (c.provider === 'mistral') return { max_tokens: maxTokens };
  const reasoning = /gpt-oss/.test(c.model) ? { reasoning_effort: 'low', ...(c.provider === 'groq' ? { include_reasoning: false } : {}) } : /qwen3/.test(c.model) ? { reasoning_effort: 'none' } : {};
  return { max_completion_tokens: maxTokens + (/gpt-oss/.test(c.model) ? 500 : 0), ...reasoning };
}

export class LlmError extends Error {
  /** @param {string} message @param {number} status @param {boolean} [limited] the provider's rate limit or quota */
  constructor(message, status, limited = false) {
    super(message);
    this.status = status;
    this.limited = limited;
  }
}

// A model that just hit its rate limit is skipped for a minute on this instance, so the next turn starts on one that works.
const coolDown = new Map();

/**
 * One chat completion with tool support. Tries each model of the chain until one answers.
 * @param {{ messages: object[], tools?: object[], maxTokens?: number, temperature?: number, toolChoice?: string }} o
 * @returns {Promise<{ message: { content: string|null, tool_calls?: object[] }, usage: { prompt_tokens?: number, completion_tokens?: number, total_tokens?: number }, model: string }>}
 */
export async function chat({ messages, tools, maxTokens = 400, temperature = 0.3, toolChoice, only = '' }) {
  const cfg = llmConfig();
  // Tests on preview deployments can pin one provider (`only`), e.g. to check the Gemini overflow path.
  if (only) {
    const [p, ...m] = only.split(':');
    cfg.chain = m.length && PROVIDERS[p] ? [{ provider: p, model: m.join(':'), base: baseFor(p), key: keyFor(p) }] : cfg.chain.filter((c) => c.provider === only);
  }
  if (!cfg.chain.length) throw new LlmError('LLM not configured', 503);
  const id = (c) => `${c.provider}:${c.model}`;
  let last = new LlmError('no model answered', 502);
  // Two passes: if every model is rate-limited and a provider says a slot frees up within 4 s, wait once and retry.
  for (let pass = 0; pass < 2; pass++) {
    const now = Date.now();
    const chain = cfg.chain.filter((c) => (coolDown.get(id(c)) ?? 0) <= now);
    if (!chain.length) {
      const soonest = Math.min(...cfg.chain.map((c) => coolDown.get(id(c)) ?? now)) - now;
      if (pass === 1 || soonest > 4000) throw new LlmError('all models rate-limited', 429, true);
      await new Promise((r) => setTimeout(r, soonest + 150));
      continue;
    }
    for (const c of chain) {
      const body = { model: c.model, messages, temperature, ...bodyFor(c, maxTokens) };
      if (tools?.length) {
        body.tools = tools;
        body.tool_choice = toolChoice || 'auto';
        if (c.provider === 'groq' || c.provider === 'cerebras' || c.provider === 'openai') body.parallel_tool_calls = false;
      }
      try {
        const r = await fetch(`${c.base}/chat/completions`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${c.key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(c.provider === 'gemini' ? 12000 : 20000),
        });
        if (r.ok) {
          const j = await r.json();
          const message = j.choices?.[0]?.message;
          if (!message) throw new LlmError(`${id(c)}: empty completion`, 502);
          return { message, usage: j.usage ?? {}, model: id(c) };
        }
        const text = await r.text();
        const limited = r.status === 429 || /rate.?limit|quota|tokens per|RESOURCE_EXHAUSTED/i.test(text);
        if (limited) {
          // Free tiers limit tokens or requests per minute/day: skip this model until the provider says it has room.
          const wait = Number(r.headers.get('retry-after')) || Number(text.match(/try again in ([\d.]+)s/i)?.[1]) || Number(text.match(/retry in ([\d.]+)s/i)?.[1]) || 20;
          coolDown.set(id(c), Date.now() + Math.min(300, wait) * 1000);
        }
        // 400 "tool_use_failed" (a malformed tool call), 404 (model retired), 413 (prompt too big for this model's
        // limit), 429 and 5xx: try the next model. Other 4xx (401 bad key…) also move on, but are logged.
        if (r.status >= 500) coolDown.set(id(c), Date.now() + 60_000);
        last = new LlmError(`${id(c)}: ${r.status} ${text.slice(0, 200)}`, r.status, limited);
        console.warn('llm', last.message);
      } catch (e) {
        if (e instanceof LlmError) last = e;
        else {
          last = new LlmError(`${id(c)}: ${e?.name === 'TimeoutError' ? 'timeout' : String(e).slice(0, 120)}`, 504);
          console.warn('llm', last.message);
          coolDown.set(id(c), Date.now() + 60_000); // a slow or overloaded model sits out a minute
        }
      }
    }
    if (!last.limited) break;
  }
  throw last;
}

/**
 * Prompt-injection score for one visitor message (0 = benign, 1 = injection) from the provider's guard model, or
 * null when there is none or it doesn't answer within 2.5 s (the regex rules in guard.js still apply).
 */
export async function guardScore(text) {
  const g = llmConfig().guard;
  if (!g) return null;
  try {
    const r = await fetch(`${g.base}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${g.key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: g.model, messages: [{ role: 'user', content: String(text).slice(0, 2000) }] }),
      signal: AbortSignal.timeout(2500),
    });
    if (!r.ok) return null;
    const n = Number((await r.json()).choices?.[0]?.message?.content);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

/** Model ids each configured provider offers (diagnostics on preview deployments only). */
export async function listModels() {
  const out = {};
  for (const p of llmConfig().providers) {
    try {
      const r = await fetch(`${baseFor(p)}/models`, { headers: { Authorization: `Bearer ${keyFor(p)}` }, signal: AbortSignal.timeout(8000) });
      out[p] = r.ok ? ((await r.json()).data ?? []).map((m) => m.id) : { status: r.status, body: (await r.text()).slice(0, 200) };
    } catch (e) {
      out[p] = String(e).slice(0, 100);
    }
  }
  return out;
}
