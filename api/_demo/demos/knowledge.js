/**
 * Knowledge demo (S7): a private "company brain" for Fernhill Logistics, a fictional freight company. Answers only
 * from the sample handbook and policies, with numbered citations, and says "I don't know" when the sources don't
 * cover it. Role-based access: manager-only sections are filtered out of an employee's search before the model
 * sees them (the trace shows what was withheld). Goal: two cited answers.
 */
import { str, code } from './util.js';
import { index } from '../retrieve.js';

const DOCS = [
  { id: 'HB-2.1', doc: 'Employee Handbook', title: 'Annual leave', text: 'Full-time staff get 25 days of paid annual leave plus public holidays. The leave year runs January to December. Up to 5 unused days carry over to the next year and must be used by 31 March. Book leave in the HR portal at least 2 weeks ahead for anything longer than 3 days; your manager approves it.' },
  { id: 'HB-2.2', doc: 'Employee Handbook', title: 'Sick leave', text: 'Tell your manager before your shift starts if you are ill. Up to 7 calendar days can be self-certified in the HR portal; after that we need a doctor’s note. Sick pay is full pay for up to 20 working days in a rolling 12 months.' },
  { id: 'HB-2.3', doc: 'Employee Handbook', title: 'Parental leave', text: 'Birth parents get 26 weeks of leave, the first 16 at full pay. Partners and adoptive second parents get 6 weeks at full pay. Tell HR at least 15 weeks before the due date. Phased returns of up to 4 weeks are available.' },
  { id: 'HB-2.4', doc: 'Employee Handbook', title: 'Remote and hybrid work', text: 'Office roles are hybrid: at least 2 days a week in the office, with Tuesday as the team day. Depot and driver roles are on-site. Working abroad is allowed for up to 20 days a year with HR approval because of tax and insurance rules.' },
  { id: 'HB-3.1', doc: 'Travel & Expenses Policy', title: 'Expense limits', text: 'Meals while travelling: up to $45 per day. Hotels: up to $180 per night ($250 in New York, London and San Francisco). Mileage in a personal car: $0.67 per mile. Alcohol is not reimbursed. Claims over $500 need a director’s approval.' },
  { id: 'HB-3.2', doc: 'Travel & Expenses Policy', title: 'Submitting expenses', text: 'Submit expenses in the finance app within 30 days with a photo of each receipt. Approved claims are paid with the next payroll. Lost receipts need a short written explanation and are capped at $50.' },
  { id: 'HB-3.3', doc: 'Travel & Expenses Policy', title: 'Booking travel', text: 'Book flights and hotels through the travel desk, not personally. Economy class for flights under 6 hours; premium economy for longer flights. Book at least 14 days ahead where you can.' },
  { id: 'HB-4.1', doc: 'IT Security Policy', title: 'Passwords and sign-in', text: 'Use the company password manager for every work password. Multi-factor authentication is required on email, the HR portal and the dispatch system. Never share sign-in codes, including with IT: IT will never ask for them.' },
  { id: 'HB-4.2', doc: 'IT Security Policy', title: 'Phishing and incidents', text: 'Report suspicious emails with the "Report phishing" button. If you clicked a link or entered a password, call the IT hotline on extension 4400 straight away, day or night. Lost laptops or phones must be reported within 1 hour.' },
  { id: 'HB-4.3', doc: 'IT Security Policy', title: 'Using AI tools', text: 'Use only the approved company AI assistant for work. Do not paste customer data, contracts or pricing into public AI tools. AI output must be checked by a person before it is sent to a customer.' },
  { id: 'HB-5.1', doc: 'Employee Handbook', title: 'Benefits', text: 'Benefits include private health insurance (staff plus family), a 6% matched pension contribution, life cover at 4 times salary, an employee assistance programme and a $500 yearly learning budget.' },
  { id: 'HB-5.2', doc: 'Employee Handbook', title: 'Payroll', text: 'Salaries are paid on the 25th of each month, or the working day before if the 25th falls on a weekend or holiday. Payslips are in the HR portal. Overtime for depot staff is paid at 1.5 times the hourly rate.' },
  { id: 'HB-6.1', doc: 'Employee Handbook', title: 'Code of conduct and gifts', text: 'Gifts or hospitality from customers or suppliers worth more than $50 must be declared in the gifts register. Cash gifts are never accepted. Conflicts of interest must be declared to your manager.' },
  { id: 'HB-6.2', doc: 'Employee Handbook', title: 'Speaking up', text: 'Concerns about safety, fraud or misconduct can be raised with your manager, HR, or anonymously through the independent speak-up line. Retaliation against anyone who raises a concern in good faith is a disciplinary offence.' },
  { id: 'MG-1.1', doc: 'Manager Guide', title: 'Salary bands and pay reviews', manager: true, text: 'Pay reviews happen every April. Increases within the band need the manager and HR business partner; increases above the band midpoint need a director. Salary bands are in the confidential HR workbook, never shared with staff.' },
  { id: 'MG-1.2', doc: 'Manager Guide', title: 'Hiring approvals', manager: true, text: 'New roles need a headcount request approved by finance. Backfills for leavers can be approved by the department director. Offers above the band midpoint need HR sign-off.' },
  { id: 'MG-1.3', doc: 'Manager Guide', title: 'Performance and disciplinary steps', manager: true, text: 'Start with an informal conversation and written notes. A formal performance plan lasts 6 to 12 weeks with fortnightly check-ins. Any disciplinary hearing needs HR present and 48 hours’ written notice.' },
];
const search = index(DOCS);

export default {
  id: 'knowledge',
  roles: ['employee', 'manager'],
  maxTokens: 330,
  rules: `You are Fernhill Logistics' internal knowledge assistant for staff. Answer questions about company policies.
- Always call search_handbook first. Answer ONLY from the passages it returns, and cite each fact like [1] right after the sentence that uses it.
- If the passages don't answer the question, say "I couldn't find that in the handbook" and offer ask_hr. Never fill gaps from general knowledge, never guess numbers.
- If the search says some sections were withheld for the user's role, say that part is restricted to managers, without describing what it contains.
- Be concise: two to four sentences, or a short list when there are steps.`,
  facts(state) {
    return `Signed-in user role: ${state.role}. Sources available: Employee Handbook, Travel & Expenses Policy, IT Security Policy${state.role === 'manager' ? ', Manager Guide' : ''}.`;
  },
  tools: [
    {
      name: 'search_handbook',
      description: 'Searches company policies the user may see. Returns numbered passages to cite.',
      parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
      run(a, s, ctx) {
        const q = str(a.query, 200);
        const all = search(q, 4);
        const ok = all.filter((d) => !d.manager || s.role === 'manager').slice(0, 3);
        const withheld = all.filter((d) => d.manager && s.role !== 'manager').length;
        const citations = ok.map((d) => ({ n: (ctx.cite = (ctx.cite ?? 0) + 1), id: d.id, title: d.title, text: d.text, source: `${d.doc} §${d.id.slice(3)}` }));
        if (citations.length) s.answers += 1;
        return {
          result: {
            passages: citations.map((c) => ({ n: c.n, source: c.source, title: c.title, text: c.text })),
            restricted:
              withheld && !citations.length
                ? 'The answer is in a section restricted to managers. Tell the user this topic is restricted to managers and suggest asking their manager or HR. Do not open a ticket unless they ask.'
                : withheld
                  ? `${withheld} related section(s) are restricted to managers; mention that if relevant.`
                  : undefined,
          },
          label: 'Handbook searched',
          detail: [citations.map((c) => `[${c.n}] ${c.id} ${c.title}`).join(' · ') || 'No passage found', withheld ? `${withheld} manager-only section${withheld > 1 ? 's' : ''} withheld (access control)` : ''].filter(Boolean).join(' · '),
          citations,
        };
      },
    },
    {
      name: 'ask_hr',
      description: 'Opens an HR question ticket when the handbook has no answer.',
      parameters: { type: 'object', properties: { question: { type: 'string' } }, required: ['question'] },
      run(a, s) {
        s.tickets += 1;
        const t = code('HR', 300 + s.tickets);
        return { result: { ticket: t, reply: 'HR replies within 2 working days' }, label: 'HR ticket opened', detail: `${t} · ${str(a.question, 120)}` };
      },
    },
  ],
  init: () => ({ role: 'employee', answers: 0, tickets: 0 }),
  async approve() {
    return { note: '' };
  },
  decline() {
    return { note: '' };
  },
  complete: (s) => s.answers >= 2 || s.tickets > 0,
  doneText: () => 'Questions answered from company sources, with citations and access control',
};
