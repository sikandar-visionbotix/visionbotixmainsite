/**
 * robots.txt parsing and matching (S11 AI visibility checker), following RFC 9309 and Google's documented behaviour:
 *  - a crawler obeys the group whose user-agent token matches its own most specifically (case-insensitive), else `*`;
 *    several groups for the same token are merged
 *  - within a group the longest matching rule wins; on a tie `Allow` wins; `*` and `$` wildcards are supported
 *  - no robots.txt (4xx) means everything is allowed; a server error (5xx) or no answer means "assume disallowed"
 */

export function parseRobots(text) {
  const groups = [];
  const sitemaps = [];
  let current = null;
  let lastWasAgent = false;
  for (const raw of String(text).split(/\r?\n|\r/)) {
    const line = raw.replace(/#.*$/, '').trim();
    if (!line) continue;
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const value = m[2].trim();
    if (key === 'user-agent') {
      if (!lastWasAgent || !current) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (key === 'sitemap') {
      if (value) sitemaps.push(value);
      continue;
    }
    if ((key === 'allow' || key === 'disallow') && current) current.rules.push({ allow: key === 'allow', path: value });
  }
  return { groups, sitemaps };
}

/** The rules a crawler with this token obeys, and which group they came from. */
export function rulesFor(parsed, token) {
  const t = token.toLowerCase();
  let best = null;
  let bestLen = -1;
  for (const g of parsed.groups) {
    for (const a of g.agents) {
      if (a === '*') continue;
      // RFC 9309: match the product token, case-insensitively. A group for "googlebot" also covers "googlebot-news".
      if ((t === a || t.startsWith(`${a}-`) || t.startsWith(`${a}/`)) && a.length > bestLen) {
        best = a;
        bestLen = a.length;
      }
    }
  }
  const pick = best ?? '*';
  const rules = parsed.groups.filter((g) => g.agents.includes(pick)).flatMap((g) => g.rules);
  return { group: best ? best : parsed.groups.some((g) => g.agents.includes('*')) ? '*' : null, rules };
}

function toRegex(path) {
  const anchored = path.endsWith('$');
  const body = (anchored ? path.slice(0, -1) : path)
    .split('*')
    .map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*');
  return new RegExp(`^${body}${anchored ? '$' : ''}`);
}

function decodeSafe(p) {
  try {
    return decodeURI(p);
  } catch {
    return p;
  }
}

/** @returns {{ allowed: boolean, rule: string | null }} */
export function isAllowed(rules, path) {
  const p = decodeSafe(path || '/');
  let best = null;
  for (const r of rules) {
    if (!r.path) continue; // "Disallow:" with no path allows everything
    if (!toRegex(decodeSafe(r.path)).test(p)) continue;
    const len = r.path.replace(/[*$]/g, '').length;
    if (!best || len > best.len || (len === best.len && r.allow && !best.allow)) best = { ...r, len };
  }
  if (!best) return { allowed: true, rule: null };
  return { allowed: best.allow, rule: `${best.allow ? 'Allow' : 'Disallow'}: ${best.path}` };
}
