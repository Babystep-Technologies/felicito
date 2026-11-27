import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Reveal from '@/components/Reveal';
import ColorIconTile from '@/components/ColorIconTile';
import { Button } from '@/components/ui/button';
import {
  ClosingCta,
  ColorBand,
  FeatureTile,
  MarketingHero,
  MarketingPage,
  PaperSection,
  SectionHeading,
} from '@/components/marketing';
import {
  CalendarClock,
  Building2,
  Heart,
  ArrowDown,
  ArrowRight,
  Mail,
  Users,
  Send,
} from 'lucide-react';

/**
 * The Business hub. Felicito supports exactly two business use cases, and this page
 * exists to tell them apart:
 *
 *   1. Teams celebrating their own people — an organization whose members share a pool
 *      of credits for cards and invitations.
 *   2. Owners who live on client relationships — a contact book of client occasions
 *      that emails a reminder ahead of the date.
 *
 * Reminders belong to use case 2 only: the user adds the people and dates themselves.
 * An organization has no birthday roster, so nothing on this page may suggest that
 * creating one makes birthdays or work anniversaries surface on their own.
 */

// The two supported paths, rendered side by side so a visitor can self-select.
const paths = [
  {
    id: 'organizations',
    icon: Users,
    eyebrow: 'For teams',
    title: 'An organization for your team',
    summary:
      'Your team already celebrates each other. Create an organization, buy credits once, and let everyone in it use them for cards and invitations.',
    points: [
      'Create an organization and invite your colleagues by email.',
      'Buy credits for the organization and hand them to the people making cards.',
      'Your team’s cards and invitations live together under the organization.',
    ],
    route: '/organizations/new',
    cta: 'Create an organization',
    colorVar: 'var(--color-brand-pink)',
  },
  {
    id: 'clients',
    icon: CalendarClock,
    eyebrow: 'For client relationships',
    title: 'Never forget a client’s occasion',
    summary:
      'If your business runs on relationships, remembering the date is the whole game. Add your clients once and Felicito carries the calendar for you.',
    points: [
      'Add clients to your contact book with their birthdays and milestones.',
      'Felicito emails you a week ahead, with a design already picked out.',
      'One click opens a pre-filled card you can schedule for the day itself.',
    ],
    route: '/client-occasions',
    cta: 'See how client occasions work',
    colorVar: 'var(--color-brand-green)',
  },
];

// True of both paths. No team account, admin console, or automatic roster is claimed
// here, because none of those exist.
const shared = [
  {
    icon: Heart,
    title: 'Cards worth opening',
    description:
      'Animated covers, photos, GIFs, and messages from everyone — closer to a real card than an email with a signature block.',
  },
  {
    icon: Send,
    title: 'Nothing for the recipient to install',
    description:
      'Every card is a link. The person you are celebrating opens it in a browser, with no account and no app.',
  },
  {
    icon: Users,
    title: 'Start free, on your own',
    description:
      'Sign up and send without a sales call or a contract. Felicito is open source, and you can try a card before committing to anything.',
  },
];

const ForBusiness: React.FC = () => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Felicito for Business — organizations & client occasions';
    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <MarketingPage>
      <MarketingHero
        tint="var(--color-brand-blue-soft)"
        eyebrowIcon={Building2}
        eyebrow="Felicito for Business"
        title={
          <>
            The relationships your business runs on,{' '}
            <span className="marker-swipe">remembered</span>
          </>
        }
        subtitle="Two ways businesses use Felicito: an organization where your team shares credits for cards, and a contact book that reminds you before a client’s big day."
        birdColor="var(--color-brand-pink)"
        actions={
          <>
            <Button asChild size="xl" tone="ink" className="w-full sm:w-auto">
              <Link to="/sign_up">
                Get started free
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="xl" tone="paper" className="w-full sm:w-auto">
              <a href="#two-ways">
                See both use cases
                <ArrowDown />
              </a>
            </Button>
          </>
        }
      />

      {/* The two paths — the heart of the page */}
      <PaperSection id="two-ways">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            title="Which one sounds like you?"
            subtitle="Plenty of businesses end up using both. Start wherever the next card is."
          />
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {paths.map((path, i) => (
              <Reveal key={path.id} delay={i * 0.08} className="h-full">
                <div
                  className={`pop-hover flex h-full flex-col border-2 border-[#1d1b2f] p-8 text-[#1d1b2f] shadow-[4px_4px_0_0_#1d1b2f] md:p-10 ${i % 2 ? 'hand-cut-alt' : 'hand-cut'}`}
                  style={{ backgroundColor: path.colorVar }}
                >
                  <ColorIconTile
                    icon={path.icon}
                    colorVar="#fff8ec"
                    className="mb-6 size-14 [&_svg]:size-7"
                  />
                  <span className="mb-2 text-sm font-semibold opacity-80">{path.eyebrow}</span>
                  <h3 className="mb-3 text-3xl">{path.title}</h3>
                  <p className="mb-6 leading-relaxed">{path.summary}</p>
                  <ul className="mb-8 flex flex-col gap-3">
                    {path.points.map(point => (
                      <li key={point} className="flex items-start gap-3">
                        <span
                          aria-hidden="true"
                          className="mt-[0.45em] size-3 shrink-0 rounded-full border-2 border-[#1d1b2f] bg-[#fff8ec]"
                        />
                        <span className="leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild size="lg" tone="ink" className="mt-auto self-start">
                    <Link to={path.route}>
                      {path.cta}
                      <ArrowRight />
                    </Link>
                  </Button>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </PaperSection>

      {/* Honest framing of what remembers what */}
      <ColorBand colorClass="text-brand-yellow">
        <Reveal className="mx-auto max-w-4xl text-center">
          <Mail className="mx-auto mb-6 size-10" />
          <h2 className="mb-6 text-4xl md:text-5xl">
            You add the people. Felicito keeps the dates.
          </h2>
          <p className="mx-auto max-w-3xl text-lg font-medium md:text-xl">
            An organization lets your team share credits and make a card together whenever an
            occasion comes up. The reminders come from your own contact book: add someone once,
            record the date, and Felicito emails you a week before it comes around — so the card
            gets written while there is still time to send it.
          </p>
          <Button asChild size="lg" tone="paper" className="mt-8">
            <Link to="/client-occasions">
              How reminders work
              <ArrowRight />
            </Link>
          </Button>
        </Reveal>
      </ColorBand>

      {/* Shared value */}
      <PaperSection>
        <div className="mx-auto max-w-6xl">
          <SectionHeading title="True either way you use it" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {shared.map((item, i) => (
              <FeatureTile
                key={item.title}
                icon={item.icon}
                title={item.title}
                description={item.description}
                index={i}
              />
            ))}
          </div>
        </div>
      </PaperSection>

      <ClosingCta
        title="Make everyone feel remembered"
        subtitle="Start free today — with an organization for your team, or with the clients you never want to miss."
        actions={
          <>
            <Button asChild size="xl" tone="ink" className="w-full sm:w-auto">
              <Link to="/sign_up">Get started free</Link>
            </Button>
            <Button asChild size="xl" tone="paper" className="w-full sm:w-auto">
              <Link to="/organizations/new">
                <Users />
                Create an organization
              </Link>
            </Button>
          </>
        }
      />
    </MarketingPage>
  );
};

export default ForBusiness;
