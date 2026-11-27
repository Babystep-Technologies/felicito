import React from 'react';
import { Link } from 'react-router-dom';
import * as motion from 'motion/react-client';
import {
  ArrowRight,
  Building2,
  CalendarCheck,
  Gift,
  Github,
  Heart,
  Link2,
  Mail,
  PartyPopper,
  QrCode,
  Send,
  Star,
  Users,
} from 'lucide-react';
import { WordRotate } from '@/components/magicui/word-rotate';
import Reveal from '@/components/Reveal';
import Faq from '@/pages/Home/Faq';
import { Button } from '@/components/ui/button';
import { IntentPickerDialog } from '@/components/IntentPickerDialog';
import CreateProductButton from '@/components/CreateProductButton';
import ProductVignette from '@/components/ProductVignette';
import {
  Bird,
  Blossom,
  Grass,
  Hills,
  Leaf,
  Parallax,
  PointerScene,
  Sun,
  TimeOfDaySky,
  WavyEdge,
} from '@/components/doodles';
import { products, type ProductId } from '@/config/products';
import { GITHUB_REPO_URL } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';

type Feature = { icon: typeof Users; text: string };

const featuresByProduct: Record<ProductId, Feature[]> = {
  group: [
    { icon: Users, text: 'No signup needed for contributors' },
    { icon: PartyPopper, text: 'Works for any occasion' },
    { icon: QrCode, text: 'QR code for in-person events' },
  ],
  one_on_one: [
    { icon: Heart, text: 'One heartfelt message, just for them' },
    { icon: Mail, text: 'Opens with a little celebration' },
    { icon: Send, text: 'Share by link or send by email' },
  ],
  invitation: [
    { icon: PartyPopper, text: 'An opening screen guests remember' },
    { icon: CalendarCheck, text: 'RSVPs and add-to-calendar built in' },
    { icon: Gift, text: 'Link your registry so guests know what to bring' },
  ],
  registry: [
    { icon: Link2, text: 'Add gifts from any store — just paste a link' },
    { icon: Gift, text: 'No duplicate gifts, and guests need no account' },
    { icon: Send, text: 'Share it on its own, or link it to your invitation' },
  ],
};

const OPEN_SOURCE_POINTS = [
  {
    title: 'Transparent',
    desc: 'Every line of code is public. See exactly how your data is handled.',
  },
  {
    title: 'Self-hostable',
    desc: 'Run Felicito on your own infrastructure whenever you want.',
  },
  {
    title: 'Community-built',
    desc: 'Made with contributors. Open an issue or a pull request anytime.',
  },
];

// Decorative ribbon of the moments people make things for. Plain words, not links — there
// is no per-occasion page to maintain behind them.
const MOMENTS = [
  'Birthdays',
  'Weddings',
  'Baby showers',
  'Farewells',
  'Graduations',
  'Anniversaries',
  'New jobs',
  'Retirements',
  'Housewarmings',
  'Get well soon',
  'Thank yous',
  'Just because',
];

const BLOSSOM_COLORS = [
  'var(--color-brand-pink)',
  'var(--color-brand-yellow)',
  'var(--color-brand-blue)',
  'var(--color-brand-green)',
];

const Home: React.FC = () => {
  const { user } = useAuth();

  // Only dangle "free" at signed-out visitors; it reads oddly once they have an account.
  const createCtaLabel = user ? 'Start creating' : 'Start creating — free';

  return (
    // The negative bottom margin tucks the closing hills under the footer's wavy edge, so
    // the scene runs straight into it with no strip of page background between.
    <PointerScene>
      <div className="-mb-6 flex w-full flex-col overflow-x-hidden sm:-mb-10">
        {/* Hero: a flat sky that follows the visitor's time of day, over rolling hills. */}
        <TimeOfDaySky className="min-h-[calc(88svh-4rem)]">
          <section className="relative flex min-h-[calc(88svh-4rem)] flex-col items-center justify-center px-4 pt-16 pb-48 text-center sm:pb-56">
            <Reveal>
              <p className="mx-auto mb-6 inline-flex flex-wrap items-center justify-center gap-x-2 rounded-full border-2 border-ink bg-card px-4 py-1.5 text-sm font-semibold text-foreground shadow-pop-sm">
                {products.map((product, i) => (
                  <span key={product.id} className="inline-flex items-center gap-1.5">
                    {i > 0 && <span aria-hidden="true">·</span>}
                    <span
                      aria-hidden="true"
                      className="size-2.5 rounded-full border-[1.5px] border-ink"
                      style={{ backgroundColor: product.colorVar }}
                    />
                    {product.label}
                  </span>
                ))}
              </p>
              <h1 className="mx-auto max-w-4xl text-5xl leading-[1.05] sm:text-6xl md:text-7xl">
                Make life&apos;s little moments <span className="marker-swipe">feel big</span>
              </h1>
              <WordRotate
                className="mt-5 text-xl font-semibold underline decoration-4 underline-offset-8 sm:text-2xl"
                words={products.map(product => product.intent)}
                colors={[
                  'decoration-brand-pink',
                  'decoration-brand-blue',
                  'decoration-brand-green',
                  'decoration-brand-yellow',
                ]}
              />
              <p className="mx-auto mt-4 max-w-2xl text-lg opacity-80 sm:text-xl">
                Cards everyone signs, notes for one special person, invitations with RSVPs, and wish
                lists for any occasion.
              </p>
            </Reveal>

            <motion.div
              className="relative z-10 mt-9 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, type: 'spring', stiffness: 220, damping: 18 }}
            >
              <IntentPickerDialog>
                <Button size="xl" className="group relative w-full sm:w-auto">
                  {createCtaLabel}
                  <ArrowRight className="transition-transform group-hover:translate-x-1" />
                  {/* A couple of leaves blow off the button on hover. */}
                  <Leaf className="pointer-events-none absolute -top-2 right-2 w-5 opacity-0 transition-all duration-700 ease-out group-hover:translate-x-14 group-hover:-translate-y-8 group-hover:rotate-90 group-hover:opacity-100 motion-reduce:hidden" />
                  <Leaf className="pointer-events-none absolute right-8 -bottom-2 w-4 opacity-0 transition-all delay-100 duration-700 ease-out group-hover:translate-x-20 group-hover:-translate-y-4 group-hover:-rotate-45 group-hover:opacity-100 motion-reduce:hidden" />
                </Button>
              </IntentPickerDialog>
              <Button asChild size="xl" variant="outline" className="w-full sm:w-auto">
                <a href="#what-are-we-making">See what you can make</a>
              </Button>
            </motion.div>

            <div aria-hidden="true" className="absolute inset-x-0 bottom-0">
              <Parallax depth={0.5} className="absolute bottom-[62%] left-[14%] w-10 sm:w-14">
                <Bird className="animate-float w-full" />
              </Parallax>
              <Grass className="absolute bottom-[30%] left-[38%] w-8" />
              <Grass className="absolute right-[22%] bottom-[44%] w-7 [animation-delay:-2.5s]" />
              <Hills className="h-36 sm:h-48" />
            </div>
          </section>
        </TimeOfDaySky>

        {/* Moments ribbon: a slow marquee of occasions on an ink band. */}
        <div
          aria-hidden="true"
          className="overflow-hidden border-y-2 border-ink bg-ink py-3 text-paper motion-reduce:overflow-x-auto"
        >
          <div className="animate-marquee flex w-max items-center">
            {[0, 1].map(copy => (
              <ul key={copy} className="flex items-center">
                {MOMENTS.map((moment, i) => (
                  <li key={moment} className="flex items-center">
                    <span className="font-display px-5 text-lg whitespace-nowrap">{moment}</span>
                    <Blossom
                      className="size-4 text-paper"
                      color={BLOSSOM_COLORS[i % BLOSSOM_COLORS.length]}
                    />
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>

        {/* Products: four solid blocks, one per thing you can make. */}
        <section id="what-are-we-making" className="scroll-mt-20 px-4 py-20 sm:py-28">
          <Reveal className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl sm:text-5xl md:text-6xl">What are we making?</h2>
            <p className="mt-4 text-lg text-muted-foreground sm:text-xl">
              Start with the moment you have in mind.
            </p>
          </Reveal>

          <div className="mx-auto mt-14 grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
            {products.map((product, i) => (
              <Reveal key={product.id} delay={i * 0.08}>
                <article
                  className={`pop-hover group flex h-full flex-col gap-5 border-2 border-ink p-6 text-[#1d1b2f] shadow-pop sm:flex-row sm:p-7 ${
                    i % 2 ? 'hand-cut-alt hover:rotate-[0.6deg]' : 'hand-cut hover:-rotate-[0.6deg]'
                  }`}
                  style={{ backgroundColor: product.colorVar }}
                >
                  <div className="flex shrink-0 items-center justify-center rounded-2xl border-2 border-ink bg-[#fff8ec] p-3 sm:size-40 sm:self-center">
                    <ProductVignette
                      product={product.id}
                      className="h-24 w-auto transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-2 motion-reduce:transform-none"
                    />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="text-xs font-bold tracking-widest uppercase opacity-75">
                      {product.label}
                    </span>
                    <h3 className="mt-1 text-2xl leading-tight sm:text-3xl">{product.intent}</h3>
                    <ul className="mt-4 mb-6 space-y-2">
                      {featuresByProduct[product.id].map(feature => (
                        <li key={feature.text} className="flex items-center gap-2.5 font-medium">
                          <feature.icon className="size-4 shrink-0" strokeWidth={2.5} />
                          {feature.text}
                        </li>
                      ))}
                    </ul>
                    <CreateProductButton
                      product={product.id}
                      tone="ink"
                      className="mt-auto w-fit"
                    />
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Open source: a solid blue block with hand-cut edges. */}
        <section className="text-brand-blue">
          <WavyEdge />
          <div className="bg-brand-blue px-4 py-16 text-[#1d1b2f] sm:py-24">
            <Reveal className="mx-auto max-w-5xl text-center">
              <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl border-2 border-ink bg-[#fff8ec] shadow-pop">
                <Github className="size-8" />
              </div>
              <h2 className="text-4xl sm:text-5xl md:text-6xl">Built in the open</h2>
              <p className="mx-auto mt-5 max-w-2xl text-lg font-medium sm:text-xl">
                Felicito is fully open source. Read the code, self-host it, or pitch in — no
                lock-in, no hidden data practices, no paywalls.
              </p>

              <div className="mt-12 grid grid-cols-1 gap-5 text-left sm:grid-cols-3">
                {OPEN_SOURCE_POINTS.map((item, i) => (
                  <div
                    key={item.title}
                    className={`border-2 border-ink bg-[#fff8ec] p-6 shadow-pop ${i % 2 ? 'hand-cut-alt' : 'hand-cut'}`}
                  >
                    <h3 className="text-xl">{item.title}</h3>
                    <p className="mt-2 leading-relaxed text-[#5f5a6e]">{item.desc}</p>
                  </div>
                ))}
              </div>

              <Button asChild size="xl" tone="paper" className="mt-12">
                <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer">
                  <Star className="fill-brand-yellow" />
                  Star us on GitHub
                </a>
              </Button>
            </Reveal>
          </div>
          <WavyEdge flip />
        </section>

        {/* FAQ */}
        <section className="px-4 py-8">
          <Reveal>
            <Faq />
          </Reveal>
        </section>

        {/* Business handoff band */}
        <section className="border-y-2 border-ink bg-brand-green px-4 py-12 text-[#1d1b2f]">
          <Reveal>
            <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
              <div className="flex items-center gap-4">
                <div className="hand-cut flex size-12 shrink-0 items-center justify-center border-2 border-ink bg-[#fff8ec]">
                  <Building2 className="size-6" />
                </div>
                <div>
                  <h3 className="text-2xl">Using Felicito for your business?</h3>
                  <p className="mt-1 font-medium opacity-85">
                    Group cards your team signs in Slack, and reminders before your clients&apos;
                    big days.
                  </p>
                </div>
              </div>
              <Button asChild size="lg" tone="ink" className="group">
                <Link to="/for-business">
                  Felicito for Business
                  <ArrowRight className="transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </Reveal>
        </section>

        {/* Final CTA: a warm yellow evening with the sun coming up over the hills. */}
        <section className="relative overflow-hidden bg-brand-yellow px-4 pt-20 pb-44 text-center text-[#1d1b2f] sm:pb-56">
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute right-[8%] bottom-24 w-24 sm:right-[14%] sm:bottom-32 sm:w-32"
            initial={{ y: 80, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ type: 'spring', stiffness: 60, damping: 14 }}
          >
            <Sun />
          </motion.div>
          <Reveal className="relative z-10 mx-auto max-w-3xl">
            <h2 className="text-4xl leading-tight sm:text-5xl md:text-6xl">
              Let&apos;s get the party started
            </h2>
            <p className="mt-5 text-lg font-medium sm:text-xl">
              5 free credits to start. Open source. No credit card required.
            </p>
            <IntentPickerDialog>
              <Button size="xl" className="group mt-9 w-full sm:w-auto">
                {createCtaLabel}
                <ArrowRight className="transition-transform group-hover:translate-x-1" />
              </Button>
            </IntentPickerDialog>
          </Reveal>
          <Hills className="absolute inset-x-0 bottom-0 h-32 sm:h-44" />
        </section>
      </div>
    </PointerScene>
  );
};

export default Home;
