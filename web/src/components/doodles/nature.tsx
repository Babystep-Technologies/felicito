import { cn } from '@/lib/utils';
import { HAND_DRAWN_STYLE, INK, PEN, type DoodleProps } from './shared';

/** A tall, puffy summer cloud. */
export const Cloud: React.FC<DoodleProps> = ({ className, ...props }) => (
  <svg
    viewBox="0 0 200 110"
    aria-hidden="true"
    className={className}
    {...props}
    style={{ ...HAND_DRAWN_STYLE, ...props.style }}
  >
    <path
      d="M34 92C14 92 10 70 28 64C22 42 48 30 64 42C68 18 104 8 118 32C130 20 158 24 160 46C180 44 194 64 182 80C192 88 184 98 170 96L40 96C30 96 28 92 34 92Z"
      fill="#ffffff"
      {...PEN}
      strokeWidth={2.5}
    />
    <path d="M70 70C80 76 92 76 100 70" fill="none" {...PEN} strokeWidth={2} opacity={0.35} />
  </svg>
);

/**
 * Three layers of rolling hills in flat tonal steps (no gradients). Stretches to the
 * width of its container; set the height with `className`.
 */
export const Hills: React.FC<DoodleProps & { back?: string; middle?: string; front?: string }> = ({
  className,
  back = 'var(--color-brand-green-soft)',
  middle = '#8fdcae',
  front = 'var(--color-brand-green)',
  ...props
}) => (
  <svg
    viewBox="0 0 1440 220"
    preserveAspectRatio="none"
    aria-hidden="true"
    className={cn('block w-full', className)}
    {...props}
  >
    <path
      d="M0 118C190 44 420 40 610 108S1040 34 1240 86C1340 112 1400 96 1440 78V220H0Z"
      fill={back}
      {...PEN}
      vectorEffect="non-scaling-stroke"
    />
    <path
      d="M0 160C250 92 520 112 760 150S1180 104 1440 138V220H0Z"
      fill={middle}
      {...PEN}
      vectorEffect="non-scaling-stroke"
    />
    <path
      d="M0 198C300 150 640 168 900 194S1300 170 1440 184V220H0Z"
      fill={front}
      {...PEN}
      vectorEffect="non-scaling-stroke"
    />
  </svg>
);

/** A little tuft of grass that sways in the wind. */
export const Grass: React.FC<DoodleProps> = ({ className, ...props }) => (
  <svg viewBox="0 0 40 30" aria-hidden="true" className={cn('animate-sway', className)} {...props}>
    <path
      d="M8 30C8 20 5 14 2 10M18 30C18 18 20 10 24 4M28 30C29 22 33 17 38 14"
      fill="none"
      {...PEN}
      strokeWidth={2.5}
    />
  </svg>
);

export const Leaf: React.FC<DoodleProps> = ({ className, ...props }) => (
  <svg
    viewBox="0 0 48 48"
    aria-hidden="true"
    className={className}
    {...props}
    style={{ ...HAND_DRAWN_STYLE, ...props.style }}
  >
    <path
      d="M8 40C6 20 20 6 42 6C42 28 28 42 8 40Z"
      fill="var(--color-brand-green)"
      {...PEN}
      strokeWidth={2.5}
    />
    <path d="M8 40L30 18" fill="none" {...PEN} strokeWidth={2} />
  </svg>
);

export const Sun: React.FC<DoodleProps> = ({ className, ...props }) => (
  <svg
    viewBox="0 0 120 120"
    aria-hidden="true"
    className={className}
    {...props}
    style={{ ...HAND_DRAWN_STYLE, ...props.style }}
  >
    <g {...PEN} strokeWidth={3.5}>
      <path d="M60 8V20M60 100V112M8 60H20M100 60H112M23 23L32 32M88 88L97 97M23 97L32 88M88 32L97 23" />
    </g>
    <circle cx="60" cy="60" r="28" fill="var(--color-brand-yellow)" {...PEN} />
    <path d="M48 64C52 70 68 70 72 64" fill="none" {...PEN} strokeWidth={2.5} />
    <circle cx="50" cy="54" r="2.5" fill={INK} />
    <circle cx="70" cy="54" r="2.5" fill={INK} />
  </svg>
);

export const PaperPlane: React.FC<DoodleProps> = ({ className, ...props }) => (
  <svg
    viewBox="0 0 64 48"
    aria-hidden="true"
    className={className}
    {...props}
    style={{ ...HAND_DRAWN_STYLE, ...props.style }}
  >
    <path d="M4 22L60 4L42 44L30 30Z" fill="#ffffff" {...PEN} strokeWidth={2.5} />
    <path d="M60 4L30 30L26 42L22 32" fill="none" {...PEN} strokeWidth={2.5} />
  </svg>
);

/** A small round bird — the quiet resident of our hills. */
export const Bird: React.FC<DoodleProps & { color?: string }> = ({
  className,
  color = 'var(--color-brand-blue)',
  ...props
}) => (
  <svg
    viewBox="0 0 56 48"
    aria-hidden="true"
    className={className}
    {...props}
    style={{ ...HAND_DRAWN_STYLE, ...props.style }}
  >
    <path
      d="M12 30C12 16 22 8 32 10C42 12 46 22 44 30C42 38 34 42 26 42C18 42 12 38 12 30Z"
      fill={color}
      {...PEN}
      strokeWidth={2.5}
    />
    <path d="M44 20L52 22L44 25" fill="var(--color-brand-yellow)" {...PEN} strokeWidth={2} />
    <circle cx="36" cy="19" r="2.2" fill={INK} />
    <path d="M18 28C22 32 28 32 32 28" fill="none" {...PEN} strokeWidth={2} />
    <path d="M24 42V47M32 42V47" {...PEN} strokeWidth={2} />
  </svg>
);

/** A tiny four-petal flower, used as a separator. */
export const Blossom: React.FC<DoodleProps & { color?: string }> = ({
  className,
  color = 'var(--color-brand-pink)',
  ...props
}) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...props}>
    <g fill={color} stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="6" r="4" />
      <circle cx="18" cy="12" r="4" />
      <circle cx="12" cy="18" r="4" />
      <circle cx="6" cy="12" r="4" />
    </g>
    <circle
      cx="12"
      cy="12"
      r="3"
      fill="var(--color-brand-yellow)"
      stroke="currentColor"
      strokeWidth={1.5}
    />
  </svg>
);
