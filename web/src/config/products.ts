import { Mail, Heart, PartyPopper, Gift, type LucideIcon } from 'lucide-react';

// Everything a person can make on Felicito — collectively, their "creations". This is
// broader than the API's Card::KINDS (group | one_on_one): invitation and registry are
// separate models with their own flows, but all four share one brand identity here.
export type ProductId = 'group' | 'one_on_one' | 'invitation' | 'registry';

// The Button `tone` that paints each product's solid brand color.
export type ProductTone = 'pink' | 'blue' | 'green' | 'yellow';

// The dashboard's `?view=` key for each product's section.
export type DashboardView = 'group' | 'one_on_one' | 'invitations' | 'registries';

export interface Product {
  id: ProductId;
  label: string;
  shortLabel: string;
  // Lowercase noun for running text and the dashboard sidebar, e.g. "group cards".
  noun: string;
  // Action-phrased call to action. One pattern for every product, used by every
  // "create" button in the app (see CreateProductButton).
  createLabel: string;
  // Job-to-be-done phrasing for intent-led marketing CTAs — leads with what the
  // user wants to do rather than the internal product name.
  intent: string;
  route: string;
  icon: LucideIcon;
  description: string;
  // The single authoritative per-product brand color, plus a soft tint for backgrounds.
  colorVar: string;
  softColorVar: string;
  tone: ProductTone;
  dashboardView: DashboardView;
}

// Single source of truth for the per-product identity. Consumed by the marketing home
// page, the header menus, the create picker, the dashboard and the create/edit flows.
// Mapping: group = pink, one_on_one = blue, invitation = green, registry = yellow.
export const products: Product[] = [
  {
    id: 'group',
    label: 'Group Cards',
    shortLabel: 'Group',
    noun: 'group cards',
    createLabel: 'Create a group card',
    intent: 'Get everyone to sign a card',
    route: '/group-card/new',
    icon: Mail,
    description:
      'Collect heartfelt messages, photos & wishes from everyone who cares — all in one keepsake.',
    colorVar: 'var(--color-brand-pink)',
    softColorVar: 'var(--color-brand-pink-soft)',
    tone: 'pink',
    dashboardView: 'group',
  },
  {
    id: 'one_on_one',
    label: '1-on-1 Cards',
    shortLabel: '1-on-1',
    noun: '1-on-1 cards',
    createLabel: 'Create a 1-on-1 card',
    intent: 'Send a heartfelt note to one person',
    route: '/one-on-one-card/new',
    icon: Heart,
    description:
      'Send one person a single heartfelt message that opens with an effect — no group signing needed.',
    colorVar: 'var(--color-brand-blue)',
    softColorVar: 'var(--color-brand-blue-soft)',
    tone: 'blue',
    dashboardView: 'one_on_one',
  },
  {
    id: 'invitation',
    label: 'Invitations',
    shortLabel: 'Invites',
    noun: 'invitations',
    createLabel: 'Create an invitation',
    intent: 'Invite people to an event',
    route: '/invitation/new',
    icon: PartyPopper,
    description:
      'Design animated invites with RSVPs built in, and link your registry so guests know what to bring.',
    colorVar: 'var(--color-brand-green)',
    softColorVar: 'var(--color-brand-green-soft)',
    tone: 'green',
    dashboardView: 'invitations',
  },
  {
    id: 'registry',
    label: 'Registries',
    shortLabel: 'Registry',
    noun: 'registries',
    createLabel: 'Create a registry',
    intent: 'Share what you wish for',
    route: '/registry/new',
    icon: Gift,
    description:
      'Build a wish list for any occasion — birthday, wedding, baby — and share it on its own or link it to your invitation.',
    colorVar: 'var(--color-brand-yellow)',
    softColorVar: 'var(--color-brand-yellow-soft)',
    tone: 'yellow',
    dashboardView: 'registries',
  },
];

export const productById: Record<ProductId, Product> = Object.fromEntries(
  products.map(product => [product.id, product])
) as Record<ProductId, Product>;
