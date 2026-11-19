/** Registry of live demo agents: S7 (5 agents + the site concierge) and S7b (the other 11). */
import receptionist from './receptionist.js';
import support from './support.js';
import whatsapp from './whatsapp.js';
import booking from './booking.js';
import knowledge from './knowledge.js';
import concierge from './concierge.js';
import sdr from './sdr.js';
import social from './social.js';
import seo from './seo.js';
import ads from './ads.js';
import reputation from './reputation.js';
import document from './document.js';
import ops from './ops.js';
import data from './data.js';
import mcp from './mcp.js';
import guardrail from './guardrail.js';
import mvp from './mvp.js';

export const demos = Object.fromEntries(
  [receptionist, support, whatsapp, booking, knowledge, concierge, sdr, social, seo, ads, reputation, document, ops, data, mcp, guardrail, mvp].map((d) => [d.id, d]),
);
