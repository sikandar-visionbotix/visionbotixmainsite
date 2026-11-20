/**
 * AI crawlers the checker reports on (S11). Plain JS so the Vercel Function and the Astro page (static crawler table)
 * share one list. `kind`: "search" = fetches or indexes pages for AI search answers and citations; "user" = fetches a
 * page when a person asks the assistant about it (several vendors say robots.txt may not apply to these); "training" =
 * collects data or controls use for model training (blocking it does not remove you from the vendor's AI answers).
 * Every row was checked against the vendor's own page (`doc`) on 2026-11-20. Re-check every few months: vendors add
 * and rename crawlers (S11 found OpenAI's docs moved and ChatGPT-User no longer promising to follow robots.txt).
 * `core`: blocking it fails the check (the main AI search crawlers); other search/user crawlers only warn.
 */
export const CRAWLERS_AS_OF = 'November 2026';

const OPENAI = 'https://developers.openai.com/api/docs/bots';
const ANTHROPIC = 'https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler';
const PERPLEXITY = 'https://docs.perplexity.ai/guides/bots';
const GOOGLE = 'https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers';
const APPLE = 'https://support.apple.com/en-us/119829';
const META = 'https://developers.facebook.com/docs/sharing/webmasters/web-crawlers';
const AMAZON = 'https://developer.amazon.com/amazonbot';

/** @type {{ token: string, vendor: string, product: string, kind: 'search' | 'user' | 'training', core?: boolean, note: string, doc: string }[]} */
export const BOTS = [
  { token: 'OAI-SearchBot', vendor: 'OpenAI', product: 'ChatGPT search', kind: 'search', core: true, note: 'Surfaces sites in ChatGPT search. OpenAI: sites that block it are not shown in ChatGPT search answers.', doc: OPENAI },
  { token: 'ChatGPT-User', vendor: 'OpenAI', product: 'ChatGPT', kind: 'user', note: 'Opens a page when a ChatGPT user asks. OpenAI says robots.txt may not apply, and it does not decide search inclusion.', doc: OPENAI },
  { token: 'GPTBot', vendor: 'OpenAI', product: 'Model training', kind: 'training', note: 'Blocking it says your content should not be used to train OpenAI’s models. It does not affect ChatGPT search.', doc: OPENAI },
  { token: 'Claude-SearchBot', vendor: 'Anthropic', product: 'Claude search', kind: 'search', core: true, note: 'Indexes pages for search in Claude. Blocking it may reduce your visibility in Claude’s answers.', doc: ANTHROPIC },
  { token: 'Claude-User', vendor: 'Anthropic', product: 'Claude', kind: 'user', note: 'Fetches a page when a Claude user asks about it. Anthropic says its bots honour robots.txt.', doc: ANTHROPIC },
  { token: 'ClaudeBot', vendor: 'Anthropic', product: 'Model training', kind: 'training', note: 'Blocking it excludes your future pages from Anthropic’s training data.', doc: ANTHROPIC },
  { token: 'PerplexityBot', vendor: 'Perplexity', product: 'Perplexity search', kind: 'search', core: true, note: 'Surfaces and links sites in Perplexity answers; Perplexity says it is not used to train AI models.', doc: PERPLEXITY },
  { token: 'Perplexity-User', vendor: 'Perplexity', product: 'Perplexity', kind: 'user', note: 'Fetches a page a user asks about. Perplexity says it generally ignores robots.txt.', doc: PERPLEXITY },
  { token: 'Googlebot', vendor: 'Google', product: 'Google Search, AI Overviews and AI Mode', kind: 'search', core: true, note: 'Google’s search crawler. Google: robots.txt rules for Googlebot are the control for Search, including its AI features.', doc: GOOGLE },
  { token: 'Google-Extended', vendor: 'Google', product: 'Gemini training and grounding', kind: 'training', note: 'A control token, not a crawler: whether Gemini may train on or ground answers with your pages. It does not affect Google Search.', doc: GOOGLE },
  { token: 'Bingbot', vendor: 'Microsoft', product: 'Bing and Copilot', kind: 'search', core: true, note: 'Bing’s crawler. Microsoft says Copilot sends search queries to Bing for web answers.', doc: 'https://learn.microsoft.com/en-us/copilot/plan/manage-public-web-access' },
  { token: 'Applebot', vendor: 'Apple', product: 'Siri, Spotlight and Safari', kind: 'search', note: 'Powers search in Siri, Spotlight and Safari, and may render JavaScript. Apple may also use what it crawls for training.', doc: APPLE },
  { token: 'Applebot-Extended', vendor: 'Apple', product: 'Apple model training', kind: 'training', note: 'Does not crawl. Blocking it opts pages Applebot crawled out of Apple’s model training, without affecting search.', doc: APPLE },
  { token: 'DuckAssistBot', vendor: 'DuckDuckGo', product: 'DuckDuckGo AI answers', kind: 'search', note: 'Fetches pages in real time for DuckDuckGo’s AI-assisted answers; not used to train models.', doc: 'https://duckduckgo.com/duckduckgo-help-pages/results/duckassistbot' },
  { token: 'Amzn-SearchBot', vendor: 'Amazon', product: 'Alexa and Amazon search', kind: 'search', note: 'Search crawler for Amazon experiences such as Alexa; Amazon says it is not used for training.', doc: AMAZON },
  { token: 'Amazonbot', vendor: 'Amazon', product: 'Amazon services and training', kind: 'training', note: 'Amazon’s general crawler; Amazon says it may be used to train its AI models.', doc: AMAZON },
  { token: 'meta-webindexer', vendor: 'Meta', product: 'Meta AI search', kind: 'search', note: 'Crawls to improve Meta AI’s search results.', doc: META },
  { token: 'meta-externalagent', vendor: 'Meta', product: 'Model training', kind: 'training', note: 'Crawls for uses such as training Meta’s AI models.', doc: META },
  { token: 'MistralAI-User', vendor: 'Mistral', product: 'Le Chat', kind: 'user', note: 'Fetches pages when a Mistral user asks; robots.txt governs which sites it may fetch.', doc: 'https://docs.mistral.ai/robots' },
  { token: 'CCBot', vendor: 'Common Crawl', product: 'Open web archive', kind: 'training', note: 'Builds the free Common Crawl web archive, which many AI training datasets draw on.', doc: 'https://commoncrawl.org/ccbot' },
];
