import { Building2, CalendarClock, Users, type LucideIcon } from 'lucide-react';

// Business-audience entries shown in the "Business" nav dropdown (desktop + mobile).
// Parallel to `products` for the Personal menu — copy and routes live here, not in JSX.
//
// Felicito serves two business use cases and the menu is shaped around them: an
// organization whose members share a pool of credits, and a contact book that reminds an
// owner before a client's occasion. Reminders belong to the second one only — an
// organization stores no dates, so no description here may imply it remembers anything.
export interface BusinessLink {
  id: string;
  label: string;
  description: string;
  route: string;
  icon: LucideIcon;
  // Solid fill for the icon tile, matching the ProductMenu tile treatment.
  colorVar: string;
}

export const businessLinks: BusinessLink[] = [
  {
    id: 'organizations',
    label: 'Organizations',
    description: 'One pool of credits your whole team can use for cards and invitations.',
    route: '/organizations/new',
    icon: Users,
    colorVar: 'var(--color-brand-pink)',
  },
  {
    id: 'client-occasions',
    label: 'Client occasions',
    description: 'Keep your clients’ dates and get an email a week before each one.',
    route: '/client-occasions',
    icon: CalendarClock,
    colorVar: 'var(--color-brand-green)',
  },
  {
    id: 'for-business',
    label: 'Felicito for Business',
    description: 'Both use cases, and which one fits your business.',
    route: '/for-business',
    icon: Building2,
    colorVar: 'var(--color-brand-blue)',
  },
];
