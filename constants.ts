
import { Email } from './types';

export const MOCK_EMAILS: Email[] = [
  {
    id: 'email-1',
    sender: 'John Doe <john.doe@example.com>',
    subject: 'Re: Discovery Request for Case #12345-A',
    body: `Hi team, I've reviewed the discovery documents from opposing counsel. There are a few discrepancies in their production logs that we need to address immediately. I've drafted a letter outlining these issues. Please review and provide feedback by EOD. Thanks, John`,
    date: '2024-07-29T10:00:00Z',
    read: false,
  },
  {
    id: 'email-2',
    sender: 'Samantha Miller <s.miller@acmecorp.com>',
    subject: 'Urgent: Contract Review for Acme Corp Merger',
    body: `Following up on our call, please find attached the final draft of the merger agreement. We need your team to conduct a final review, paying close attention to the indemnification clauses in Section 8.2. We need to finalize this by tomorrow afternoon. Let me know if you have any questions.`,
    date: '2024-07-29T09:30:00Z',
    read: true,
  },
  {
    id: 'email-3',
    sender: 'Opposing Counsel <legal@rivalfirm.com>',
    subject: 'Settlement Offer: Smith v. Johnson',
    body: `Please see the attached settlement offer regarding the Smith v. Johnson matter. My client is prepared to offer $75,000 to resolve all claims. Please discuss with your client and respond with your position by Friday.`,
    date: '2024-07-28T15:45:00Z',
    read: false,
  },
  {
    id: 'email-4',
    sender: 'Court Clerk <clerk@supremecourt.gov>',
    subject: 'Notice of Hearing: Case #54321-B',
    body: `This is to inform you that a pre-trial hearing for case #54321-B has been scheduled for August 15, 2024, at 10:00 AM in Courtroom 4B. Please file your pre-hearing statements no later than August 8, 2024.`,
    date: '2024-07-28T11:20:00Z',
    read: true,
  },
  {
    id: 'email-5',
    sender: 'Expert Witness <expert@consulting.com>',
    subject: 'Preliminary Report for Williams Estate Case',
    body: `I have completed my preliminary analysis and attached my report. My findings generally support our position on the valuation of the assets. I am available to discuss the details at your convenience next week.`,
    date: '2024-07-27T18:00:00Z',
    read: true,
  },
];
