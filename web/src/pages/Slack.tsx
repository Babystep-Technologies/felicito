import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as motion from 'motion/react-client';
import Reveal from '@/components/Reveal';
import { slackInstallUrl, DEMO_VIDEO_URL, DEMO_VIDEO_POSTER } from '@/lib/slack';
import {
  ArrowDown,
  Slack as SlackIcon,
  Zap,
  Users,
  Image as ImageIcon,
  ShieldCheck,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ColorIconTile from '@/components/ColorIconTile';
import { Bird, Grass, Hills, Sun, WavyEdge } from '@/components/doodles';

import { TILE_COLORS } from '@/components/marketing';

const AddToSlackButton: React.FC = () => (
  <a href={slackInstallUrl()} aria-label="Add Felicito to Slack">
    <img
      alt="Add to Slack"
      height="48"
      width="167"
      className="h-12 w-auto"
      src="https://platform.slack-edge.com/img/add_to_slack.png"
      srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x"
    />
  </a>
);

const features = [
  {
    icon: Zap,
    title: 'Start a card without leaving Slack',
    description:
      'Run /felicito, pick a coworker and an occasion, and Felicito creates the group card for you — no tab-switching, no copy-pasting links.',
  },
  {
    icon: Users,
    title: 'Everyone signs together',
    description:
      'Share the card in the channel so the whole team can add messages before it goes out. No chasing signatures across DMs.',
  },
  {
    icon: ImageIcon,
    title: 'Beautiful cards by default',
    description:
      'First day, farewell, promotion, or work anniversary — each occasion comes with a matching cover so the card looks great instantly.',
  },
  {
    icon: ShieldCheck,
    title: 'Minimal permissions',
    description:
      'Felicito only asks for what the flow needs: the slash command and reading a user’s name to address the card. Nothing else.',
  },
];

const steps = [
  {
    label: 'Add to Slack',
    detail: 'Install Felicito in your workspace with one click — any workspace admin can do it.',
  },
  {
    label: 'Run /felicito',
    detail: 'Choose who the card is for and the occasion. Felicito sets up the card in seconds.',
  },
  {
    label: 'Sign and send',
    detail:
      'Coworkers add their messages and photos, then the finished card lands with the person.',
  },
];

/**
 * Self-hosted demo, poster-first: nothing downloads until someone clicks, and that first
 * click starts playback and hands off to the native controls — same behaviour as the
 * inline demos on the blog.
 */
const DemoVideo: React.FC<{ src: string }> = ({ src }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const start = () => {
    if (playing) return;
    setPlaying(true);
    void videoRef.current?.play();
  };

  return (
    <div
      className="relative aspect-[1728/1080] w-full overflow-hidden rounded-3xl border-2 border-ink bg-ink shadow-pop-lg"
      onClick={start}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full"
        src={src}
        poster={DEMO_VIDEO_POSTER}
        controls={playing}
        playsInline
        preload="none"
        aria-label="Felicito for Slack demo"
      />
      {!playing && (
        <button
          type="button"
          onClick={start}
          aria-label="Play the Felicito for Slack demo"
          className="absolute inset-0 flex items-center justify-center group cursor-pointer"
        >
          <span className="flex size-20 items-center justify-center rounded-full border-2 border-[#1d1b2f] bg-brand-yellow text-[#1d1b2f] shadow-[3px_3px_0_0_#1d1b2f] transition-transform group-hover:scale-110 motion-reduce:transform-none">
            <Play className="size-9 translate-x-0.5 fill-current" />
          </span>
        </button>
      )}
    </div>
  );
};

const DemoPlaceholder: React.FC = () => (
  <div className="relative aspect-video w-full overflow-hidden rounded-3xl border-2 border-ink bg-brand-blue-soft shadow-pop-lg">
    <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center text-[#1d1b2f]">
      <div className="mb-5 flex size-20 items-center justify-center rounded-full border-2 border-[#1d1b2f] bg-brand-yellow">
        <Play className="size-9 translate-x-0.5" />
      </div>
      <p className="text-lg font-semibold">Demo coming soon</p>
      <p className="mt-1 text-sm opacity-75">We’re putting the finishing touches on it.</p>
    </div>
  </div>
);

const DemoSection: React.FC = () => (
  <section id="demo" className="scroll-mt-20 px-4 py-20 sm:py-28">
    <div className="max-w-4xl mx-auto">
      <Reveal>
        <h2 className="mb-4 text-center text-4xl text-foreground md:text-5xl">
          See it in <span className="marker-swipe">action</span>
        </h2>
        <p className="mx-auto mb-12 max-w-2xl text-center text-lg text-muted-foreground">
          Watch how a group card goes from <code className="font-mono">/felicito</code> to signed
          and sent — without anyone leaving Slack.
        </p>
      </Reveal>
      <Reveal>{DEMO_VIDEO_URL ? <DemoVideo src={DEMO_VIDEO_URL} /> : <DemoPlaceholder />}</Reveal>
    </div>
  </section>
);

const Slack: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Felicito for Slack — group cards where your team already works';
    return () => {
      document.title = previousTitle;
    };
  }, []);

  // Scroll to a section when navigated with a hash (e.g. /slack#demo from the nav).
  // Deferred a beat so the scroll runs against the settled layout, not the mid-mount one.
  useEffect(() => {
    if (!location.hash) return;
    const timer = setTimeout(() => {
      document.querySelector(location.hash)?.scrollIntoView({ behavior: 'instant' });
    }, 100);
    return () => clearTimeout(timer);
  }, [location]);

  return (
    // The negative bottom margin tucks the closing hills under the footer's wavy edge.
    <div className="-mb-6 flex w-full flex-col overflow-x-hidden sm:-mb-10">
      {/* Hero */}
      <section className="relative flex min-h-[calc(80svh-4rem)] flex-col items-center justify-center overflow-hidden bg-brand-pink-soft px-4 pt-16 pb-44 text-[#1d1b2f] sm:pb-52">
        <Reveal>
          <div className="max-w-3xl mx-auto text-center relative z-10">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border-2 border-[#1d1b2f] bg-[#fff8ec] px-4 py-1.5 text-sm font-semibold shadow-[2px_2px_0_0_#1d1b2f]">
              <SlackIcon className="w-4 h-4" />
              Felicito for Slack
            </span>
            <h1 className="mb-6 text-5xl leading-[1.05] md:text-7xl">
              Group cards, right where your team <span className="marker-swipe">already works</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg font-medium opacity-85 md:text-xl">
              Celebrate birthdays, farewells, promotions, and work anniversaries with a group card
              your whole team signs — all from a single <code className="font-mono">/felicito</code>{' '}
              command in Slack.
            </p>
          </div>
        </Reveal>

        <motion.div
          className="relative z-10 mt-10 flex flex-col items-center gap-4 sm:flex-row"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, type: 'spring', stiffness: 220, damping: 18 }}
        >
          <AddToSlackButton />
          <Button asChild size="lg" tone="paper">
            <a href="#how-it-works">
              See how it works
              <ArrowDown />
            </a>
          </Button>
        </motion.div>

        <div aria-hidden="true" className="absolute inset-x-0 bottom-0">
          <Bird
            className="animate-float absolute right-[16%] bottom-[60%] w-10 sm:w-14"
            color="var(--color-brand-yellow)"
          />
          <Grass className="absolute bottom-[34%] left-[30%] w-8" />
          <Hills className="h-32 sm:h-44" />
        </div>
      </section>

      {/* Demo video */}
      <DemoSection />

      {/* Feature grid */}
      <section className="text-brand-green">
        <WavyEdge />
        <div className="bg-brand-green px-4 py-20 text-[#1d1b2f] sm:py-24">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <h2 className="mb-14 text-center text-4xl md:text-5xl">
                Everything you need to make someone’s day
              </h2>
            </Reveal>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {features.map((feature, i) => (
                <Reveal key={feature.title} delay={i * 0.06} className="h-full">
                  <div
                    className={`pop-hover h-full border-2 border-[#1d1b2f] bg-[#fff8ec] p-7 shadow-[3px_3px_0_0_#1d1b2f] ${i % 2 ? 'hand-cut-alt' : 'hand-cut'}`}
                  >
                    <ColorIconTile
                      icon={feature.icon}
                      colorVar={TILE_COLORS[i % TILE_COLORS.length]}
                      className="mb-5 size-12"
                    />
                    <h3 className="mb-2 text-2xl">{feature.title}</h3>
                    <p className="leading-relaxed text-[#5f5a6e]">{feature.description}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
        <WavyEdge flip />
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <h2 className="mb-14 text-center text-4xl text-foreground md:text-5xl">
              Three steps from install to celebration
            </h2>
          </Reveal>
          <ol className="relative grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
            {/* A dashed, hand-drawn path linking the three steps on wide screens. */}
            <div
              aria-hidden="true"
              className="absolute top-7 right-[16%] left-[16%] hidden border-t-2 border-dashed border-ink/40 md:block"
            />
            {steps.map((step, index) => (
              <Reveal key={step.label} delay={index * 0.1}>
                <li className="relative text-center">
                  <div
                    className="font-display mx-auto mb-5 flex size-14 items-center justify-center rounded-full border-2 border-[#1d1b2f] text-2xl text-[#1d1b2f] shadow-[3px_3px_0_0_#1d1b2f]"
                    style={{ backgroundColor: TILE_COLORS[(index + 1) % TILE_COLORS.length] }}
                  >
                    {index + 1}
                  </div>
                  <h3 className="mb-2 text-2xl text-foreground">{step.label}</h3>
                  <p className="leading-relaxed text-muted-foreground">{step.detail}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden bg-brand-yellow px-4 pt-20 pb-40 text-[#1d1b2f] sm:pb-52">
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-24 left-[8%] w-20 sm:bottom-32 sm:left-[14%] sm:w-28"
          initial={{ y: 80, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ type: 'spring', stiffness: 60, damping: 14 }}
        >
          <Sun />
        </motion.div>
        <Reveal className="relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-5 text-4xl leading-tight md:text-6xl">
              Add Felicito to your workspace
            </h2>
            <p className="mb-10 text-lg font-medium md:text-xl">
              Free to install. Start celebrating your team in the next minute.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <AddToSlackButton />
              <Button
                size="lg"
                tone="paper"
                className="w-full sm:w-auto"
                onClick={() => navigate('/group-card/new')}
              >
                Try a group card first
              </Button>
            </div>
            <p className="mt-8 text-sm opacity-75">
              By installing you agree to our{' '}
              <a href="/terms" className="underline underline-offset-4">
                Terms
              </a>{' '}
              and{' '}
              <a href="/privacy" className="underline underline-offset-4">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </Reveal>
        <Hills className="absolute inset-x-0 bottom-0 h-28 sm:h-40" />
      </section>
    </div>
  );
};

export default Slack;
