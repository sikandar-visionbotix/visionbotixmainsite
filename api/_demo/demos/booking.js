/**
 * Booking demo (S7): speed to lead for Cedar & Stone Renovations, a fictional remodeling firm in Austin, Texas.
 * The visitor submits a sample web-form lead; the agent texts back within seconds, qualifies (homeowner, timeline,
 * budget), books a free in-home estimate on the sample calendar, schedules reminders and keeps the CRM record current.
 * Booking outside the service area needs a person's approval. "STOP" opts the lead out. Goal: a visit booked.
 */
import { str, makeCalendar, findDay, findSlot, localToday, code } from './util.js';

const PROJECTS = ['Kitchen remodel', 'Bathroom remodel', 'Basement finishing', 'Home addition', 'Something else'];
const BUDGETS = ['Under $15k', '$15k–$40k', '$40k–$80k', '$80k+', 'Not sure yet'];
const inArea = (zip) => /^78[67]\d\d$/.test(zip);

export default {
  id: 'booking',
  maxTokens: 220,
  rules: `You are the AI booking assistant of Cedar & Stone Renovations, a remodeling company in Austin, Texas. You text new leads by SMS within seconds of their web enquiry. Messages are short (under 300 characters), friendly and plain text, no markdown, at most one question per message.
Goal: qualify the lead and book a free in-home estimate visit.
- First message: say hi by first name, say you're Cedar & Stone's AI assistant, mention their project, ask one qualifying question.
- Every time the lead tells you something new, call update_lead BEFORE you reply, with: homeowner (yes/no), timeline (when they want to start), budget, scope notes, and a score: hot (owner, starting within 3 months, budget fits), warm, or cold.
- Typical starting budgets (only quote these, never a firm price): kitchen remodel from $25k, bathroom from $12k, basement from $30k, home addition from $60k. Exact prices come after the visit.
- To book: check_calendar, offer two times, then book_site_visit once they pick. Reminders are scheduled automatically.
- Service area: Austin ZIP codes 786xx and 787xx. Outside it, a person must approve the booking: book_site_visit still works but waits for approval.
- If they are not ready (starting more than 12 months out) or not a fit, use mark_not_a_fit with the reason and leave the door open.
- If they reply STOP or ask not to be contacted: mark_not_a_fit with reason "opted out" and confirm they won't get more texts.
- If they want to talk to a person or ask something you can't answer, use handoff.`,
  facts(state) {
    const l = state.lead;
    const lead = l ? `Lead in CRM: ${l.name}, ${l.project}, ZIP ${l.zip}${inArea(l.zip) ? ' (in area)' : ' (OUTSIDE service area)'}, budget ${l.budget}, stage ${l.stage}${l.homeowner ? `, homeowner ${l.homeowner}` : ''}${l.timeline ? `, timeline ${l.timeline}` : ''}${l.score ? `, score ${l.score}` : ''}. Their note: "${l.message}".` : 'No lead yet.';
    const visit = state.visit ? `Visit booked: ${state.visit.label} ${state.visit.time} with ${state.visit.with}.` : 'No visit booked.';
    return `Sandbox clock: ${state.calendar[0].label} (${state.calendar[0].date}), early morning. Estimators: Maria and Dev. Visits take about an hour.\n${lead}\n${visit}`;
  },
  onEvent(ev, state) {
    if (ev?.type !== 'new_lead' || state.lead) return null;
    const f = ev.lead ?? {};
    const name = str(f.name, 40) || 'Sam';
    const lead = {
      name,
      phone: (str(f.phone, 20).replace(/\D/g, '') || '5125550147').replace(/\d(?=\d{4})/g, '•'),
      project: PROJECTS.includes(f.project) ? f.project : PROJECTS[0],
      zip: /^\d{5}$/.test(str(f.zip, 5)) ? str(f.zip, 5) : '78704',
      budget: BUDGETS.includes(f.budget) ? f.budget : BUDGETS[4],
      message: str(f.message, 240),
      stage: 'New',
      source: 'Website form',
    };
    state.lead = lead;
    return {
      message: `(New website enquiry, not typed by the lead) Name: ${lead.name}. Project: ${lead.project}. ZIP: ${lead.zip}. Budget: ${lead.budget}. Note: "${lead.message || 'none'}". Send the first text now.`,
      steps: [
        { kind: 'tool', label: 'CRM record created', call: 'crm.create_lead(website form)', detail: `${lead.name} · ${lead.project} · ZIP ${lead.zip}`, why: 'Every new enquiry is logged before anything else.' },
        { kind: 'guard', label: 'Speed to lead', detail: 'The agent starts the moment the form arrives, day or night.' },
      ],
    };
  },
  tools: [
    {
      name: 'update_lead',
      description: 'Updates the CRM record with what you learned.',
      parameters: {
        type: 'object',
        properties: {
          homeowner: { type: 'string', enum: ['yes', 'no', 'unknown'] },
          timeline: { type: 'string', description: 'e.g. "within 3 months"' },
          budget: { type: 'string' },
          notes: { type: 'string' },
          score: { type: 'string', enum: ['hot', 'warm', 'cold'] },
        },
      },
      run(a, s) {
        if (!s.lead) return { result: { error: 'No lead yet' }, error: true, label: 'CRM', detail: 'No lead' };
        const changed = [];
        for (const k of ['homeowner', 'timeline', 'budget', 'notes', 'score']) {
          const v = str(a[k], k === 'notes' ? 200 : 40);
          if (v && v !== 'unknown') {
            s.lead[k] = v;
            changed.push(`${k}: ${v}`);
          }
        }
        if (s.lead.stage === 'New') s.lead.stage = 'Qualifying';
        return { result: { saved: true }, label: 'CRM updated', detail: changed.join(' · ') || 'no change' };
      },
    },
    {
      name: 'check_calendar',
      description: 'Free estimate-visit times on a day.',
      parameters: { type: 'object', properties: { day: { type: 'string', description: '"tomorrow", a weekday, or YYYY-MM-DD' } } },
      run(a, s) {
        const day = findDay(s.calendar, a.day || 'tomorrow') ?? s.calendar[1];
        const free = day.slots.slice(0, 4);
        return { result: { day: day.label, slots: free.map((x) => ({ slot_id: x.id, time: x.time, estimator: x.with })) }, label: 'Calendar checked', detail: `${day.label}: ${free.map((x) => x.time).join(', ') || 'full'}` };
      },
    },
    {
      name: 'book_site_visit',
      description: 'Books the free in-home estimate. Outside the service area it waits for approval.',
      parameters: { type: 'object', properties: { slot_id: { type: 'string' } }, required: ['slot_id'] },
      run(a, s) {
        if (!s.lead) return { result: { error: 'No lead yet' }, error: true, label: 'Booking refused', detail: 'No lead' };
        if (s.visit) return { result: { error: `Already booked: ${s.visit.label} ${s.visit.time}` }, error: true, label: 'Booking refused', detail: 'Visit already booked' };
        const hit = findSlot(s.calendar, a.slot_id);
        if (!hit) return { result: { error: 'Slot not free; check the calendar again.' }, error: true, label: 'Booking refused', detail: 'Slot not free' };
        if (!inArea(s.lead.zip)) {
          return {
            result: { status: 'pending_approval', note: 'Outside the usual service area: a project manager confirms shortly.' },
            gate: { title: `Book ${hit.day.label} ${hit.slot.time} outside the service area`, detail: `ZIP ${s.lead.zip} is outside Austin (786xx/787xx). Approve the trip for this ${s.lead.project.toLowerCase()}?` },
          };
        }
        return book(s, hit);
      },
    },
    {
      name: 'mark_not_a_fit',
      description: 'Closes the lead politely (not ready, not a fit, or opted out).',
      parameters: { type: 'object', properties: { reason: { type: 'string' } }, required: ['reason'] },
      run(a, s) {
        if (!s.lead) return { result: { error: 'No lead' }, error: true, label: 'CRM', detail: 'No lead' };
        const reason = str(a.reason, 80);
        const optOut = /opt|stop|unsub/i.test(reason);
        s.lead.stage = optOut ? 'Opted out' : 'Nurture';
        s.reminders = optOut ? [] : [{ when: 'in 3 months', text: 'Friendly check-in text' }];
        return { result: { saved: true, stage: s.lead.stage }, label: optOut ? 'Opted out: no more texts' : 'Moved to nurture', detail: reason };
      },
    },
    {
      name: 'handoff',
      description: 'Asks a project manager to call the lead.',
      parameters: { type: 'object', properties: { summary: { type: 'string' } }, required: ['summary'] },
      run(a, s) {
        s.handoff = true;
        if (s.lead) s.lead.stage = 'Call requested';
        return { result: { done: true, when: 'a project manager calls within 2 business hours' }, label: 'Project manager asked to call', detail: str(a.summary, 140) };
      },
    },
  ],
  init(ctx = {}) {
    return {
      calendar: makeCalendar({ from: localToday(ctx.tz), days: 5, open: (wd) => (wd === 0 ? null : wd === 6 ? [9, 13] : [8, 17]), step: 60, people: ['Maria', 'Dev'], busy: 0.55, seed: 'cedar' }),
      lead: null,
      visit: null,
      reminders: [],
    };
  },
  async approve(g, s) {
    const hit = findSlot(s.calendar, g.args.slot_id);
    if (!hit) return { note: 'The slot was taken meanwhile. Apologise and offer other times.' };
    const out = book(s, hit);
    return { note: `A project manager approved the out-of-area visit: booked ${hit.day.label} ${hit.slot.time} with ${hit.slot.with}. Confirm it to the lead.`, step: { label: out.label, detail: out.detail } };
  },
  decline() {
    return { note: 'A project manager declined the out-of-area visit. Apologise, explain the service area, and offer a call with a project manager instead.' };
  },
  complete: (s) => !!s.visit,
  doneText: (s) => `Lead qualified and booked: ${s.visit.label} ${s.visit.time}, reminders scheduled`,
};

function book(s, hit) {
  hit.day.slots = hit.day.slots.filter((x) => x.id !== hit.slot.id);
  s.visit = { code: code('EV', 200 + 1), date: hit.day.date, label: hit.day.label, time: hit.slot.time, with: hit.slot.with };
  s.lead.stage = 'Visit booked';
  s.reminders = [
    { when: '24 hours before', text: 'Reminder text with the estimator’s name' },
    { when: '2 hours before', text: 'On-the-way text with a reschedule link' },
  ];
  return {
    result: { booked: true, when: `${hit.day.label} ${hit.slot.time}`, estimator: hit.slot.with, reminders: '24 h and 2 h before, by text' },
    label: 'Estimate visit booked',
    detail: `${hit.day.label} ${hit.slot.time} with ${hit.slot.with} · 2 reminders scheduled`,
  };
}
