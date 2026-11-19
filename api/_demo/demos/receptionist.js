/**
 * Receptionist demo (S7): a phone call to Harbourside Dental, a fictional clinic. The visitor talks (browser speech
 * recognition) or types; replies are short and spoken aloud. Tools: availability, booking, cancellation (inside 24
 * hours it needs staff approval), urgent escalation, messages. Goal: an appointment booked or an urgent case escalated.
 */
import { str, makeCalendar, findDay, findSlot, localToday, isoDay, code } from './util.js';

const CLINIC = {
  name: 'Harbourside Dental',
  address: '14 Quay Street (fictional)',
  hours: 'Mon–Fri 8:00–18:00, Sat 9:00–13:00, closed Sunday',
  dentists: ['Dr Patel', 'Dr Okafor', 'Dr Lindqvist'],
};
const SERVICES = [
  ['New patient exam and X-rays', '$120', 45],
  ['Check-up and clean', '$95', 30],
  ['Emergency appointment (pain, broken tooth)', '$85 plus any treatment', 30],
  ['Filling', 'from $140', 45],
  ['Teeth whitening', 'from $350', 60],
  ['Invisalign consultation', 'free', 30],
];

export default {
  id: 'receptionist',
  maxTokens: 220,
  rules: `You are the AI phone receptionist of ${CLINIC.name}, a dental clinic. You are on a live voice call, so speak naturally: one to three short sentences, no lists, no markdown, no emojis, no links. Spell out times like "ten fifteen".
Your job: answer questions from the clinic facts below, book, move or cancel appointments, take messages, and send urgent cases to the on-call dentist.
How to work:
- Never invent availability. Call check_availability before offering times, and offer at most two or three.
- Before book_appointment you need the caller's full name, a phone number and the service. Read the details back once and book only after the caller agrees.
- For dental pain, a broken or knocked-out tooth or swelling, offer the earliest emergency slot today and call escalate with urgency "urgent" so the on-call dentist is texted.
- If the caller mentions trouble breathing or swallowing, swelling spreading to the eye or neck, heavy bleeding that won't stop or a head injury: tell them to call emergency services now (911, 999 or 112), then escalate as urgent. Do not book in that case.
- No diagnosis, no medication advice, no prices that are not in the facts. If you don't know, offer to take a message for the team.
- A caller can ask for a person at any time: take a message with escalate (routine) and say the team will call back.
- Cancellations inside 24 hours need staff approval (there is a $40 late fee the team may waive): call cancel_appointment and tell the caller a team member will confirm.
- Stay on clinic topics. Politely decline anything else.`,
  facts(state) {
    const booked = state.bookings.map((b) => `${b.code}: ${b.name}, ${b.service}, ${b.label} ${b.time} with ${b.with}${b.cancelled ? ' (cancelled)' : ''}`);
    return `Clinic facts:
Name: ${CLINIC.name}. Address: ${CLINIC.address}. Free parking behind the building. Hours: ${CLINIC.hours}.
Dentists: ${CLINIC.dentists.join(', ')}.
Services and prices: ${SERVICES.map(([s, p]) => `${s} ${p}`).join('; ')}.
Insurance: we accept Delta Dental, Cigna, Aetna and MetLife and bill them directly; otherwise pay on the day by card. Payment plans for treatment over $500.
Cancellation policy: 24 hours' notice, otherwise a $40 fee.
Sandbox clock: it is 07:58 on ${state.calendar[0].label} (${state.calendar[0].date}), before opening; the caller ID is withheld.
Appointments booked in this call: ${booked.length ? booked.join('; ') : 'none'}.`;
  },
  tools: [
    {
      name: 'check_availability',
      description: 'Free appointment slots on one day. Returns slot ids to book with.',
      parameters: {
        type: 'object',
        properties: {
          day: { type: 'string', description: '"today", "tomorrow", a weekday like "Monday", or YYYY-MM-DD' },
          after: { type: 'string', description: 'Optional earliest time, HH:MM' },
        },
        required: ['day'],
      },
      run(a, s) {
        const day = findDay(s.calendar, a.day);
        if (!day) return { result: { error: `Closed or out of range. Open days: ${s.calendar.map((d) => d.label).join(', ')}` }, error: true, label: 'Calendar', detail: 'No such open day' };
        const after = /^\d{2}:\d{2}$/.test(str(a.after)) ? str(a.after) : '';
        const free = day.slots.filter((x) => !after || x.time >= after).slice(0, 5);
        return {
          result: { day: day.label, slots: free.map((x) => ({ slot_id: x.id, time: x.time, with: x.with })) },
          label: 'Calendar checked',
          detail: free.length ? `${day.label}: ${free.map((x) => x.time).join(', ')} free` : `${day.label}: fully booked`,
        };
      },
    },
    {
      name: 'book_appointment',
      description: 'Books a free slot after the caller confirmed name, phone and service.',
      parameters: {
        type: 'object',
        properties: {
          slot_id: { type: 'string' },
          name: { type: 'string' },
          phone: { type: 'string' },
          service: { type: 'string' },
        },
        required: ['slot_id', 'name', 'phone', 'service'],
      },
      run(a, s) {
        const name = str(a.name, 60);
        const phone = str(a.phone, 30);
        if (name.length < 2 || phone.replace(/\D/g, '').length < 6) return { result: { error: 'Need the caller’s name and a phone number first.' }, error: true, label: 'Booking refused', detail: 'Missing name or phone (tool rule)' };
        const hit = findSlot(s.calendar, a.slot_id);
        if (!hit) return { result: { error: 'That slot is not free. Check availability again.' }, error: true, label: 'Booking refused', detail: 'Slot not free' };
        hit.day.slots = hit.day.slots.filter((x) => x.id !== hit.slot.id);
        const b = { code: code('HD', 100 + s.bookings.length + 1), name, phone: phone.replace(/\d(?=\d{3})/g, '•'), service: str(a.service, 60), date: hit.day.date, label: hit.day.label, time: hit.slot.time, with: hit.slot.with };
        s.bookings.push(b);
        s.log.push({ kind: 'sms', text: `Confirmation texted to ${b.phone}: ${b.service}, ${b.label} ${b.time}` });
        return {
          result: { booked: true, code: b.code, when: `${b.label} ${b.time}`, with: b.with, confirmation_sms: 'sent' },
          label: 'Appointment booked',
          detail: `${b.code} · ${b.label} ${b.time} with ${b.with} · confirmation text sent`,
        };
      },
    },
    {
      name: 'cancel_appointment',
      description: 'Cancels a booking by its code. Inside 24 hours this goes to staff for approval.',
      parameters: { type: 'object', properties: { code: { type: 'string' } }, required: ['code'] },
      run(a, s) {
        const b = s.bookings.find((x) => x.code === str(a.code, 12).toUpperCase() && !x.cancelled);
        if (!b) return { result: { error: 'No active booking with that code in this call.' }, error: true, label: 'Cancel refused', detail: 'Unknown booking code' };
        const soon = b.date <= isoDay(new Date(`${s.calendar[0].date}T12:00:00Z`).getTime() + 86_400_000);
        if (soon) {
          return {
            result: { status: 'pending_staff_approval', note: 'Inside 24 hours: a team member decides on the $40 fee and confirms.' },
            gate: { title: `Cancel ${b.code} inside 24 hours`, detail: `${b.name}, ${b.label} ${b.time}. Policy: $40 late fee. Approve the cancellation (and waive the fee)?` },
          };
        }
        b.cancelled = true;
        return { result: { cancelled: true, code: b.code }, label: 'Appointment cancelled', detail: `${b.code} cancelled, slot released` };
      },
    },
    {
      name: 'escalate',
      description: 'Sends the call to staff: urgent texts the on-call dentist now; routine leaves a callback task.',
      parameters: {
        type: 'object',
        properties: {
          urgency: { type: 'string', enum: ['urgent', 'routine'] },
          summary: { type: 'string', description: 'One line for the staff member' },
        },
        required: ['urgency', 'summary'],
      },
      run(a, s) {
        const urgent = a.urgency === 'urgent';
        s.escalations.push({ urgent, summary: str(a.summary, 200) });
        return {
          result: { done: true, notified: urgent ? 'On-call dentist (text message)' : 'Front desk callback list' },
          label: urgent ? 'On-call dentist alerted' : 'Callback task created',
          detail: str(a.summary, 160),
        };
      },
    },
  ],
  init(ctx = {}) {
    const from = localToday(ctx.tz);
    return {
      calendar: makeCalendar({ from, days: 5, open: (wd) => (wd === 0 ? null : wd === 6 ? [9, 13] : [8, 18]), step: 30, people: CLINIC.dentists, busy: 0.62, seed: 'harbourside' }).map((d, i) =>
        // The emergency slot from the scripted preview stays free today.
        i === 0 && !d.slots.some((x) => x.time === '10:15') ? { ...d, slots: [...d.slots, { id: `${d.date.slice(5)}-1015`, time: '10:15', with: 'Dr Patel' }].sort((x, y) => x.time.localeCompare(y.time)) } : d,
      ),
      bookings: [],
      escalations: [],
      log: [],
    };
  },
  async approve(g, s) {
    const b = s.bookings.find((x) => x.code === g.args.code);
    if (b) b.cancelled = true;
    return { note: `The front desk approved cancelling ${g.args.code} and waived the late fee. Tell the caller it is cancelled and there is no fee.`, step: { label: 'Appointment cancelled', detail: `${g.args.code} cancelled, fee waived` } };
  },
  decline(g) {
    return { note: `The front desk declined cancelling ${g.args.code} without the fee. Tell the caller the appointment stays booked, or they can cancel with the $40 fee, or move it instead.` };
  },
  complete: (s) => s.bookings.some((b) => !b.cancelled) || s.escalations.some((e) => e.urgent),
  doneText: (s) => (s.bookings.length ? `Booked ${s.bookings.at(-1).label} ${s.bookings.at(-1).time} and texted a confirmation` : 'Urgent caller sent to the on-call dentist'),
};
