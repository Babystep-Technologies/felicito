import { HAND_DRAWN_STYLE, PEN, type DoodleProps } from './shared';

/*
 * Small "everyday moment" scenes, one per product. They stand in for generic icons on
 * the marketing tiles, the create picker and empty states. Drawn as flat shapes with one
 * ink pen so an illustrator's drawings can replace them 1:1 later (same viewBox/props).
 */

const Frame: React.FC<DoodleProps & { children: React.ReactNode }> = ({
  className,
  children,
  ...props
}) => (
  <svg
    viewBox="0 0 160 120"
    aria-hidden="true"
    className={className}
    {...props}
    style={{ ...HAND_DRAWN_STYLE, ...props.style }}
  >
    {children}
  </svg>
);

/** Group card: a birthday cake on a table, everyone's candle lit. */
export const CakeVignette: React.FC<DoodleProps> = props => (
  <Frame {...props}>
    <path d="M10 104H150" fill="none" {...PEN} />
    <ellipse cx="80" cy="100" rx="50" ry="6" fill="#ffffff" {...PEN} />
    <rect x="42" y="66" width="76" height="32" rx="6" fill="var(--color-brand-pink)" {...PEN} />
    <path
      d="M42 78C52 86 60 72 70 80S88 72 98 80 112 74 118 78"
      fill="none"
      {...PEN}
      strokeWidth={2.5}
    />
    <rect x="54" y="44" width="52" height="24" rx="5" fill="#ffffff" {...PEN} />
    <path d="M58 54H102" fill="none" {...PEN} strokeWidth={2} stroke="var(--color-brand-pink)" />
    {[66, 80, 94].map(x => (
      <g key={x}>
        <path d={`M${x} 44V32`} {...PEN} strokeWidth={4} stroke="var(--color-brand-blue)" />
        <path
          className="animate-float"
          style={{ transformBox: 'fill-box', animationDuration: `${3 + x / 40}s` }}
          d={`M${x} 18C${x + 5} 23 ${x + 4} 29 ${x} 29C${x - 4} 29 ${x - 5} 23 ${x} 18Z`}
          fill="var(--color-brand-yellow)"
          {...PEN}
          strokeWidth={2}
        />
      </g>
    ))}
  </Frame>
);

/** 1-on-1 card: a single letter waiting on the doorstep. */
export const LetterVignette: React.FC<DoodleProps> = props => (
  <Frame {...props}>
    <path d="M14 104H146" fill="none" {...PEN} />
    <rect
      x="26"
      y="94"
      width="108"
      height="10"
      rx="3"
      fill="var(--color-brand-yellow-soft)"
      {...PEN}
    />
    <g transform="rotate(-6 80 66)">
      <rect x="38" y="40" width="84" height="54" rx="6" fill="#ffffff" {...PEN} />
      <path d="M40 44L80 72L120 44" fill="none" {...PEN} />
      <path
        d="M80 64C74 56 64 62 70 70L80 78L90 70C96 62 86 56 80 64Z"
        fill="var(--color-brand-blue)"
        {...PEN}
        strokeWidth={2.5}
      />
    </g>
    <path d="M128 30C132 24 140 26 138 32" fill="none" {...PEN} strokeWidth={2} opacity={0.6} />
    <path d="M22 34C26 28 34 30 32 36" fill="none" {...PEN} strokeWidth={2} opacity={0.6} />
  </Frame>
);

/** Invitation: a picnic blanket laid out, waiting for guests. */
export const PicnicVignette: React.FC<DoodleProps> = props => (
  <Frame {...props}>
    <path d="M40 60L120 60L148 104L12 104Z" fill="var(--color-brand-green)" {...PEN} />
    <path d="M66 60L58 104M94 60L102 104M28 82H132" fill="none" {...PEN} strokeWidth={2.5} />
    <path d="M62 60L54 72L106 72L98 60" fill="#ffffff" opacity={0.35} />
    <path d="M60 52H100L94 76H66Z" fill="var(--color-brand-yellow)" {...PEN} />
    <path d="M66 52C66 36 94 36 94 52" fill="none" {...PEN} />
    <path d="M64 62H96" fill="none" {...PEN} strokeWidth={2} />
    <circle cx="118" cy="88" r="7" fill="var(--color-brand-pink)" {...PEN} strokeWidth={2.5} />
    <path d="M118 81C119 77 122 76 124 76" fill="none" {...PEN} strokeWidth={2} />
  </Frame>
);

/** Registry: a wrapped gift with a big floppy bow. */
export const GiftVignette: React.FC<DoodleProps> = props => (
  <Frame {...props}>
    <path d="M14 106H146" fill="none" {...PEN} />
    <rect x="44" y="58" width="72" height="48" rx="5" fill="var(--color-brand-yellow)" {...PEN} />
    <rect x="38" y="44" width="84" height="18" rx="4" fill="var(--color-brand-yellow)" {...PEN} />
    <path d="M80 44V106" fill="none" {...PEN} strokeWidth={8} stroke="var(--color-brand-pink)" />
    <path
      d="M80 44C70 26 50 26 54 38C57 46 72 46 80 44ZM80 44C90 26 110 26 106 38C103 46 88 46 80 44Z"
      fill="var(--color-brand-pink)"
      {...PEN}
      strokeWidth={2.5}
    />
    <path d="M80 44L72 58M80 44L88 58" fill="none" {...PEN} strokeWidth={2.5} />
  </Frame>
);
