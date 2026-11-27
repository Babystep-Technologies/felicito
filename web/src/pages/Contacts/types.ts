// Shapes the Contacts page and its components share. These mirror the GraphQL documents
// in `Index.tsx`; there is no codegen in this repo, so they are maintained by hand.

export type Occasion = {
  id: string;
  kind: string;
  occursOn: string;
  recurring: boolean;
  nextOccurrence: string;
  // Days before the occasion that its reminder email goes out; null means off.
  reminderLeadDays: number | null;
};

/** A list as it appears in the sidebar — counts only, never its members. */
export type ContactListSummary = {
  id: string;
  name: string;
  contactsCount: number;
};

export type Contact = {
  id: string;
  name: string;
  email: string | null;
  relationship: string | null;
  phone: string | null;
  notes: string | null;
  occasions: Occasion[];
  // Membership is read off the contact rather than off the list, so filtering the table by
  // list never has to ask for a list's `contacts`.
  contactLists: { id: string; name: string }[];
};

export type UpcomingOccasion = Occasion & {
  contact: { id: string; name: string };
};
