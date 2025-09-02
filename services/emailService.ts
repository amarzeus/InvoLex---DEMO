import { Email } from '../types';
import { MOCK_EMAILS } from '../constants';

// A larger, more varied set of emails to simulate a real Gmail inbox
export const GMAIL_MOCK_EMAILS: Email[] = [
  // A conversation thread
  {
    id: 'gmail-1',
    sender: 'Alice Johnson <alice.j@clientcorp.com>',
    subject: 'Re: Draft Asset Purchase Agreement',
    body: `Hi, thanks for sending this over. I've reviewed the draft and have a few comments on Section 3.2 regarding warranties. Could we schedule a quick call tomorrow to discuss? I'm free between 10 AM and 12 PM. Best, Alice`,
    date: '2024-07-30T14:20:00Z',
    read: false,
  },
  {
    id: 'gmail-2',
    sender: 'You <you@yourfirm.com>',
    subject: 'Re: Draft Asset Purchase Agreement',
    body: `Hi Alice, Absolutely. 10:30 AM tomorrow works for me. I'll send a calendar invite shortly. I'll prepare a summary of the key points for our discussion. Regards,`,
    date: '2024-07-30T15:05:00Z',
    read: true,
  },
  {
    id: 'gmail-3',
    sender: 'Bob Williams | Opposing Counsel <bwilliams@rivalfirm.com>',
    subject: 'FW: Case #12345-A: Plaintiff\'s Response to Interrogatories',
    body: `Please find attached our client's responses to your first set of interrogatories. Let me know if you have any issues with the production. Regards, Bob Williams`,
    date: '2024-07-30T11:55:00Z',
    read: false,
  },
  // An internal email
  {
    id: 'gmail-4',
    sender: 'Senior Partner <spartner@yourfirm.com>',
    subject: 'Acme Corp Merger Strategy',
    body: `Team, let's sync up on the Acme Corp merger tomorrow at 9 AM. I want to finalize our negotiation stance on the liability cap. Please come prepared to discuss the risk analysis I sent out last week.`,
    date: '2024-07-30T16:00:00Z',
    read: true,
  },
  // A non-billable email
  {
    id: 'gmail-5',
    sender: 'Legal Tech Weekly <newsletter@legaltech.com>',
    subject: 'Top 5 AI Tools Transforming Law Firms',
    body: `This week, we dive into the latest AI innovations. From contract analysis to e-discovery, find out which tools are making waves...`,
    date: '2024-07-30T09:00:00Z',
    read: true,
  },
  {
    id: 'gmail-6',
    sender: 'Court Filing System <donotreply@court.gov>',
    subject: 'E-Filing Confirmation: Motion to Compel in Smith v. Johnson',
    body: `Your document, "Motion to Compel Discovery," has been successfully filed in the matter of Smith v. Johnson (Case #54321-B). Transaction ID: 89234710.`,
    date: '2024-07-29T17:30:00Z',
    read: true,
  },
  // Another client email
  {
    id: 'gmail-7',
    sender: 'Charles Davis <cdavis@davisenterprises.com>',
    subject: 'Question about the Williams Estate trust',
    body: `I was reviewing the trust documents you sent over and had a question regarding the distribution schedule for the beneficiaries. Can you clarify the timeline outlined in Article IV? Thanks, Charles`,
    date: '2024-07-29T14:00:00Z',
    read: false,
  },
  ...MOCK_EMAILS.map(e => ({...e, id: e.id.replace('email-', 'gmail-original-')})) // include original mocks
];

// In a real app, this would handle OAuth and API calls to Gmail/Outlook
export const emailService = {
  async fetchEmails(provider: 'mock' | 'gmail' | 'outlook' = 'mock'): Promise<Email[]> {
    console.log(`Fetching emails from provider: ${provider}`);
    if (provider === 'gmail') {
      // Simulate API call delay
      await new Promise(res => setTimeout(res, 500));
      return GMAIL_MOCK_EMAILS;
    }
    // Default to mock emails
    return MOCK_EMAILS;
  },

  async getEmailById(id: string, provider: 'mock' | 'gmail' | 'outlook' = 'mock'): Promise<Email | undefined> {
    const allEmails = provider === 'gmail' ? GMAIL_MOCK_EMAILS : MOCK_EMAILS;
    return allEmails.find(email => email.id === id);
  }
};
