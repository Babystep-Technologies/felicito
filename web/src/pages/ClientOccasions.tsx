import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Reveal from '@/components/Reveal';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  ClosingCta,
  ColorBand,
  DotList,
  FeatureTile,
  MarketingHero,
  MarketingPage,
  PaperSection,
  SectionHeading,
} from '@/components/marketing';
import {
  CalendarClock,
  UserPlus,
  Mail,
  Send,
  NotebookPen,
  Repeat,
  ArrowDown,
  ArrowRight,
} from 'lucide-react';

/**
 * Marketing page for Felicito's second business use case: an owner whose business runs
 * on client relationships keeps their clients' occasions here so a card never gets
 * missed. Public on purpose — the feature itself lives behind auth at `/contacts`, so
 * without this page a prospect has no way to discover it.
 *
 * Every claim below maps to shipped behaviour: `Contact` (name, email, phone,
 * relationship, notes), `Occasion` (kind, date, recurring), `OccasionReminderJob`
 * (daily, `REMINDER_LEAD_DAYS = 7`, idempotent per occurrence) and
 * `OccasionReminderMailer` (design suggestion + deep link into the pre-filled 1-on-1
 * create flow with `deliverAt` set to the occasion's date). Do not add capabilities
 * here that the occasion book does not have.
 */

const steps = [
  {
    icon: UserPlus,
    label: 'Add your clients',
    detail:
      'Name, email, phone, how you know them, and any notes worth remembering before you write the next card.',
  },
  {
    icon: CalendarClock,
    label: 'Record their occasions',
    detail:
      'Birthdays, anniversaries, a closing date, a new job — mark the ones that come around every year and Felicito rolls them forward on its own.',
  },
  {
    icon: Mail,
    label: 'Get the nudge a week out',
    detail:
      'Felicito emails you seven days before the date, names the client and the occasion, and suggests a design to match.',
  },
  {
    icon: Send,
    label: 'Send in about a minute',
    detail:
      'The email links straight into a card with the recipient, occasion, and design already filled in — write your note and schedule it to land on the day.',
  },
];

const details = [
  {
    icon: Repeat,
    title: 'Annual dates roll forward',
    description:
      'Mark a birthday or work anniversary as recurring once. Felicito tracks the next occurrence every year after that, and never reminds you twice for the same one.',
  },
  {
    icon: NotebookPen,
    title: 'Notes that make the card personal',
    description:
      'Keep the details that turn a generic greeting into something they remember — the dog’s name, the house they just bought, the daughter starting college.',
  },
  {
    icon: CalendarClock,
    title: 'See what is coming up',
    description:
      'Your contact book lists the occasions on the horizon, so you can look ahead instead of waiting to be told.',
  },
];

const ClientOccasions: React.FC = () => {
  const { user } = useAuth();

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Client occasions — never forget a client’s birthday | Felicito';
    return () => {
      document.title = previousTitle;
    };
  }, []);

  const primaryCta = user
    ? { label: 'Open your contact book', route: '/contacts' }
    : { label: 'Get started free', route: '/sign_up' };

  return (
    <MarketingPage>
      <MarketingHero
        tint="var(--color-brand-green-soft)"
        eyebrowIcon={CalendarClock}
        eyebrow="Client occasions"
        title={
          <>
            Never forget a client’s <span className="marker-swipe">big day</span> again
          </>
        }
        subtitle="Add the clients you care about keeping, record their birthdays and milestones, and Felicito emails you a week ahead — with the card already half-written."
        actions={
          <>
            <Button asChild size="xl" tone="ink" className="w-full sm:w-auto">
              <Link to={primaryCta.route}>
                {primaryCta.label}
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="xl" tone="paper" className="w-full sm:w-auto">
              <a href="#how-it-works">
                See how it works
                <ArrowDown />
              </a>
            </Button>
          </>
        }
      />

      {/* The problem */}
      <PaperSection>
        <Reveal className="mx-auto max-w-3xl text-center">
          <h2 className="mb-6 text-4xl md:text-5xl">
            You <span className="marker-swipe">meant</span> to send something
          </h2>
          <p className="text-lg text-muted-foreground md:text-xl">
            Realtors, stylists, advisors, dentists, consultants — the work is repeat business, and
            repeat business is a relationship. Everyone intends to send the birthday card. It slips
            because nothing reminds you until you see the date go by. Felicito is the thing that
            reminds you, early enough to actually do something about it.
          </p>
        </Reveal>
      </PaperSection>

      {/* How it works */}
      <ColorBand colorClass="text-brand-green" id="how-it-works">
        <div className="mx-auto max-w-6xl">
          <SectionHeading title="Set it up once, then just answer the email" />
          <ol className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <li key={step.label} className="h-full">
                <FeatureTile
                  icon={step.icon}
                  title={step.label}
                  description={step.detail}
                  index={index}
                  step={index + 1}
                />
              </li>
            ))}
          </ol>
        </div>
      </ColorBand>

      {/* What the reminder actually does */}
      <PaperSection>
        <div className="mx-auto max-w-5xl">
          <SectionHeading
            title="The reminder does most of the work"
            subtitle="It is not a calendar alert that leaves you staring at a blank page. The email arrives seven days out and carries everything the card needs."
          />
          <Reveal>
            <div className="hand-cut border-2 border-[#1d1b2f] bg-[#fff8ec] p-8 text-[#1d1b2f] shadow-[4px_4px_0_0_#1d1b2f] md:p-12">
              <DotList
                className="gap-5 text-lg"
                items={[
                  'Who it is for and which occasion is coming up.',
                  'A design suggestion chosen to fit the occasion.',
                  'A link that opens the card with the recipient, occasion, and design pre-filled.',
                  'A send date already set to the day itself, so you can write it now and forget it.',
                ]}
              />
              <p className="mt-8 text-sm leading-relaxed text-[#5f5a6e]">
                Everything is pre-filled, and everything stays editable — change the design, the
                message, or the send date before it goes out.
              </p>
            </div>
          </Reveal>
        </div>
      </PaperSection>

      {/* Details */}
      <PaperSection className="pt-0 sm:pt-0">
        <div className="mx-auto max-w-6xl">
          <SectionHeading title="Built for a book of clients you keep for years" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {details.map((detail, i) => (
              <FeatureTile
                key={detail.title}
                icon={detail.icon}
                title={detail.title}
                description={detail.description}
                index={i + 1}
              />
            ))}
          </div>
        </div>
      </PaperSection>

      <ClosingCta
        title="Be the one who remembered"
        subtitle="Add your first few clients today. The next birthday will find you instead of the other way around."
        actions={
          <>
            <Button asChild size="xl" tone="ink" className="w-full sm:w-auto">
              <Link to={primaryCta.route}>{primaryCta.label}</Link>
            </Button>
            <Button asChild size="xl" tone="paper" className="w-full sm:w-auto">
              <Link to="/for-business">Felicito for Business</Link>
            </Button>
          </>
        }
      />
    </MarketingPage>
  );
};

export default ClientOccasions;
