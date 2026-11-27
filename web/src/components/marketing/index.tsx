import type { LucideIcon } from 'lucide-react';
import * as motion from 'motion/react-client';
import Reveal from '@/components/Reveal';
import ColorIconTile from '@/components/ColorIconTile';
import { Bird, Grass, Hills, Sun, WavyEdge } from '@/components/doodles';
import { cn } from '@/lib/utils';

/*
 * Shared building blocks for the marketing pages (For Business, Client occasions),
 * so they share one look with the home page: solid color blocks, ink outlines, hard
 * shadows, hills along the bottom, and springy reveals. Text on these blocks is always the
 * fixed ink color, since the backgrounds are light brand colors in both themes.
 */

// The logo's four colors, cycled across tiles and numbered steps.
export const TILE_COLORS = [
  'var(--color-brand-blue)',
  'var(--color-brand-pink)',
  'var(--color-brand-green)',
  'var(--color-brand-yellow)',
];

const INK_TEXT = 'text-[#1d1b2f]';

/** The page wrapper. Tucks the closing hills under the footer's wavy edge. */
export const MarketingPage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="-mb-6 flex w-full flex-col overflow-x-hidden sm:-mb-10">{children}</div>
);

interface MarketingHeroProps {
  // Soft brand tint behind the hero, e.g. `var(--color-brand-pink-soft)`.
  tint: string;
  eyebrowIcon: LucideIcon;
  eyebrow: string;
  title: React.ReactNode;
  subtitle: React.ReactNode;
  // Buttons under the subtitle.
  actions: React.ReactNode;
  birdColor?: string;
}

export const MarketingHero: React.FC<MarketingHeroProps> = ({
  tint,
  eyebrowIcon: EyebrowIcon,
  eyebrow,
  title,
  subtitle,
  actions,
  birdColor = 'var(--color-brand-yellow)',
}) => (
  <section
    className={cn(
      'relative flex min-h-[calc(80svh-4rem)] flex-col items-center justify-center overflow-hidden px-4 pt-16 pb-44 text-center sm:pb-52',
      INK_TEXT
    )}
    style={{ backgroundColor: tint }}
  >
    <Reveal className="relative z-10 mx-auto max-w-3xl">
      <span className="mb-6 inline-flex items-center gap-2 rounded-full border-2 border-[#1d1b2f] bg-[#fff8ec] px-4 py-1.5 text-sm font-semibold shadow-[2px_2px_0_0_#1d1b2f]">
        <EyebrowIcon className="size-4" />
        {eyebrow}
      </span>
      <h1 className="mb-6 text-5xl leading-[1.05] md:text-7xl">{title}</h1>
      <p className="mx-auto max-w-2xl text-lg font-medium opacity-85 md:text-xl">{subtitle}</p>
    </Reveal>

    <motion.div
      className="relative z-10 mt-10 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, type: 'spring', stiffness: 220, damping: 18 }}
    >
      {actions}
    </motion.div>

    <div aria-hidden="true" className="absolute inset-x-0 bottom-0">
      <Bird
        className="animate-float absolute right-[16%] bottom-[60%] w-10 sm:w-14"
        color={birdColor}
      />
      <Grass className="absolute bottom-[34%] left-[30%] w-8" />
      <Hills className="h-32 sm:h-44" />
    </div>
  </section>
);

/** A centered section heading with an optional lead paragraph. */
export const SectionHeading: React.FC<{
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, className }) => (
  <Reveal className={cn('mx-auto mb-14 max-w-3xl text-center', className)}>
    <h2 className="text-4xl md:text-5xl">{title}</h2>
    {subtitle && <p className="mt-4 text-lg opacity-80 md:text-xl">{subtitle}</p>}
  </Reveal>
);

/** A plain paper section (inherits the page background). */
export const PaperSection: React.FC<{
  id?: string;
  className?: string;
  children: React.ReactNode;
}> = ({ id, className, children }) => (
  <section id={id} className={cn('scroll-mt-20 px-4 py-20 text-foreground sm:py-28', className)}>
    {children}
  </section>
);

/** A solid brand-color band with hand-cut wavy top and bottom edges. */
export const ColorBand: React.FC<{
  // A Tailwind text color class naming the band color, e.g. `text-brand-green`.
  colorClass: string;
  id?: string;
  children: React.ReactNode;
}> = ({ colorClass, id, children }) => (
  <section id={id} className={cn('scroll-mt-20', colorClass)}>
    <WavyEdge />
    <div className={cn('bg-current px-4 py-16 sm:py-20')}>
      <div className={INK_TEXT}>{children}</div>
    </div>
    <WavyEdge flip />
  </section>
);

/** A paper tile with a colored icon, title and description. */
export const FeatureTile: React.FC<{
  icon: LucideIcon;
  title: string;
  description: React.ReactNode;
  index: number;
  // Optional numbered badge (for "how it works" steps).
  step?: number;
}> = ({ icon, title, description, index, step }) => (
  <Reveal delay={(index % 4) * 0.06} className="h-full">
    <div
      className={cn(
        'pop-hover h-full border-2 border-[#1d1b2f] bg-[#fff8ec] p-7 shadow-[3px_3px_0_0_#1d1b2f]',
        INK_TEXT,
        index % 2 ? 'hand-cut-alt' : 'hand-cut'
      )}
    >
      <div className="mb-5 flex items-center gap-3">
        <ColorIconTile
          icon={icon}
          colorVar={TILE_COLORS[index % TILE_COLORS.length]}
          className="size-12"
        />
        {step !== undefined && (
          <span className="font-display text-3xl text-[#1d1b2f]/30">{step}</span>
        )}
      </div>
      <h3 className="mb-2 text-2xl">{title}</h3>
      <p className="leading-relaxed text-[#5f5a6e]">{description}</p>
    </div>
  </Reveal>
);

/** A row of check-style bullet points in the brand colors. */
export const DotList: React.FC<{ items: React.ReactNode[]; className?: string }> = ({
  items,
  className,
}) => (
  <ul className={cn('flex flex-col gap-3', className)}>
    {items.map((item, i) => (
      <li key={i} className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-[0.45em] size-3 shrink-0 rounded-full border-2 border-[#1d1b2f]"
          style={{ backgroundColor: TILE_COLORS[i % TILE_COLORS.length] }}
        />
        <span className="leading-relaxed">{item}</span>
      </li>
    ))}
  </ul>
);

/** The closing call to action: a warm yellow block with the sun rising over the hills. */
export const ClosingCta: React.FC<{
  title: React.ReactNode;
  subtitle: React.ReactNode;
  actions: React.ReactNode;
  footnote?: React.ReactNode;
}> = ({ title, subtitle, actions, footnote }) => (
  <section
    className={cn(
      'relative overflow-hidden bg-brand-yellow px-4 pt-20 pb-40 text-center sm:pb-52',
      INK_TEXT
    )}
  >
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
    <Reveal className="relative z-10 mx-auto max-w-3xl">
      <h2 className="mb-5 text-4xl leading-tight md:text-6xl">{title}</h2>
      <p className="mb-10 text-lg font-medium md:text-xl">{subtitle}</p>
      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">{actions}</div>
      {footnote && <p className="mt-8 text-sm opacity-75">{footnote}</p>}
    </Reveal>
    <Hills className="absolute inset-x-0 bottom-0 h-28 sm:h-40" />
  </section>
);
