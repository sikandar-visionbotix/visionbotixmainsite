/**
 * Shared copy for the live demo lab (S7): the "how it works" steps and the FAQ answers every demo page and the /demos/
 * hub use. Facts here must match api/demo.js and api/_demo/* (session limits, guard model, logging).
 */
import type { FaqItem } from '@/lib/schema';
import type { LiveDemoConfig } from '@/data/demos';

export const platformSteps = [
  {
    title: 'Checked before the model sees it',
    body: 'A one-time Cloudflare human check, rate limits, a length cap, card numbers and keys removed, and Llama Prompt Guard scoring the message for prompt injection.',
  },
  {
    title: 'The agent picks its tools',
    body: 'A large language model reads the conversation and decides which of its allow-listed tools to call: calendar, orders, catalog, CRM or documents. It must give a reason for each call.',
  },
  {
    title: 'Rules run in code',
    body: 'Each tool checks its own rules (identity, limits, stock, access rights) on fictional sample data. Anything over a limit stops at an approval gate for a person.',
  },
  {
    title: 'Checked on the way out',
    body: 'The reply is screened for leaked instructions before you see it, and every step lands in the trace beside the conversation.',
  },
];

export function demoFaqs(demo: LiveDemoConfig): FaqItem[] {
  const out: FaqItem[] = [
    {
      q: 'What happens to what I type?',
      a: 'It is sent to our server and an AI provider (Groq, or a backup such as Cerebras or Google Gemini) to generate the reply, and a short log of each turn is kept by our host for a few days to stop abuse and improve the demos. It is not used to train models. Please use made-up details: this is a sandbox. See the <a href="/privacy/#live-ai-demos">privacy policy</a>.',
    },
    {
      q: 'Why do some actions wait for approval?',
      a: `Because that is how we build agents for real businesses: the agent handles the routine work, and anything risky (a big refund, a discount, an exception to a rule) waits for a person. In this demo, you are ${demo.approver}, so you decide.`,
    },
    {
      q: 'Can I try to break it?',
      a: 'Please do. Ask it to ignore its instructions, reveal its prompt or bend a rule. The trace shows the guardrails at work: the injection classifier, the tools that refuse, and the output check.',
    },
  ];
  if (demo.surface === 'phone') {
    out.push({
      q: 'Which browsers support the voice call?',
      a: 'Speaking works in Chrome, Edge and Safari, which have built-in speech recognition (Chrome sends the audio to Google to transcribe it). In other browsers you type your side and still hear the agent. Real phone calls use a phone number and a dedicated voice stack instead.',
    });
  }
  return out;
}

export const hubFaqs: FaqItem[] = [
  {
    q: 'Are these demos real AI agents?',
    a: 'Yes. Each reply comes live from a large language model (by default the open-weight gpt-oss-120b, served by Groq or Cerebras, with Google Gemini as a backup) that chooses and calls real tools. Only the businesses and their data are fictional, so nothing you do has consequences.',
  },
  {
    q: 'Which model do your production agents use?',
    a: 'The one that fits the job and your data rules: Claude, GPT, Gemini, open-weight models such as gpt-oss or Llama, or a model running on your own servers. Our agent platform is provider-agnostic, so switching is a configuration change.',
  },
  {
    q: 'What stops an agent from doing something it should not?',
    a: 'Four layers: checks on every incoming message (including a prompt-injection classifier), tools that enforce their own rules in code, approval gates for risky actions, and a check on every reply. Every step is logged in an audit trail, which the demos show as the trace.',
  },
  {
    q: 'What happens to what I type in a demo?',
    a: 'It is processed to answer you and kept briefly in our host’s logs to stop abuse and improve the demos, never used for training. Use made-up details. Details are in the <a href="/privacy/#live-ai-demos">privacy policy</a>.',
  },
  {
    q: 'Is there a demo for every agent?',
    a: 'Yes. All 16 packaged agents have a live demo, from the voice receptionist to the MCP connector and the prompt-injection challenge, plus the site concierge in the corner of every page.',
  },
];
