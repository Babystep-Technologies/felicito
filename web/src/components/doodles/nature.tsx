import { useTransform } from 'motion/react';
import * as motion from 'motion/react-client';
import { cn } from '@/lib/utils';
import {
  cloudOutline,
  inkStroke,
  overlapLoop,
  smoothClosedPath,
  wobblyCircle,
  type InkOptions,
  type Point,
} from './ink';
import { usePointer } from './pointer';
import { INK, PEN, type DoodleProps } from './shared';

/*
 * Nature doodles, drawn as brush-pen strokes over flat fills (see ./ink). Shapes are
 * placed by hand and deliberately a little uneven — lumpy circles, rays of different
 * lengths, a line that overlaps where it closes — but every curve is smooth.
 *
 * Paths are computed once at module load: they are fixed drawings, not per-render work.
 */

/** A filled ink line. */
const Ink: React.FC<{ d: string; opacity?: number; color?: string }> = ({
  d,
  opacity,
  color = INK,
}) => <path d={d} fill={color} opacity={opacity} />;

const ink = (points: readonly Point[], options?: InkOptions) => inkStroke(points, options);

// ---------------------------------------------------------------------------- Cloud

// Five round lobes of different sizes, the tallest just right of centre, merged into one
// outline with a flat, slightly wavy base.
const CLOUD_OUTLINE: Point[] = cloudOutline(
  [
    [40, 78, 18],
    [68, 60, 24],
    [106, 45, 31],
    [143, 56, 24],
    [171, 74, 18],
    [104, 76, 26],
  ],
  [105, 76],
  95
);

const CLOUD = {
  body: smoothClosedPath(CLOUD_OUTLINE),
  // A flat, slightly darker band along the underside — the shade a painted cloud has.
  shade: smoothClosedPath([
    [10, 82],
    [44, 76],
    [80, 81],
    [116, 77],
    [152, 82],
    [196, 76],
    [200, 110],
    [0, 110],
  ]),
  outline: ink(overlapLoop(CLOUD_OUTLINE, 6), {
    width: 3,
    taperStart: 0.03,
    taperEnd: 0.04,
    seed: 11,
  }),
  // Little contour curls where lobes tuck into each other.
  curls: [
    ink(
      [
        [56, 70],
        [64, 63],
        [74, 62],
      ],
      { width: 2.2, taperStart: 0.4, taperEnd: 0.5, seed: 4 }
    ),
    ink(
      [
        [124, 58],
        [133, 52],
        [143, 53],
      ],
      { width: 2.2, taperStart: 0.4, taperEnd: 0.5, seed: 9 }
    ),
  ],
};

/** A tall, puffy summer cloud. */
export const Cloud: React.FC<DoodleProps> = ({ className, ...props }) => (
  <svg viewBox="0 0 200 110" aria-hidden="true" className={className} {...props}>
    <defs>
      <clipPath id="cloud-body">
        <path d={CLOUD.body} />
      </clipPath>
    </defs>
    <path d={CLOUD.body} fill="#ffffff" />
    <path d={CLOUD.shade} fill="#e4eaf6" clipPath="url(#cloud-body)" />
    <Ink d={CLOUD.outline} />
    {CLOUD.curls.map((d, i) => (
      <Ink key={i} d={d} opacity={0.45} />
    ))}
  </svg>
);

// ---------------------------------------------------------------------------- Hills

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

// ---------------------------------------------------------------------------- Grass

const GRASS_BLADES = [
  ink(
    [
      [9, 30],
      [8, 22],
      [5, 15],
      [1, 10],
    ],
    { width: 3, taperStart: 0, taperEnd: 0.85, seed: 2 }
  ),
  ink(
    [
      [17, 30],
      [17.5, 20],
      [20, 11],
      [24, 3],
    ],
    { width: 3.2, taperStart: 0, taperEnd: 0.85, seed: 5 }
  ),
  ink(
    [
      [26, 30],
      [27.5, 24],
      [31, 18.5],
      [37, 14],
    ],
    { width: 3, taperStart: 0, taperEnd: 0.85, seed: 8 }
  ),
];

/** A little tuft of grass that sways in the wind, and leans toward the pointer. */
export const Grass: React.FC<DoodleProps> = ({ className, ...props }) => {
  const { x } = usePointer();
  const lean = useTransform(x, v => v * 12);
  return (
    <svg
      viewBox="0 0 40 30"
      aria-hidden="true"
      className={cn('animate-sway overflow-visible', className)}
      {...props}
    >
      <motion.g style={{ rotate: lean, originX: 0.5, originY: 1 }}>
        {GRASS_BLADES.map((d, i) => (
          <Ink key={i} d={d} />
        ))}
      </motion.g>
    </svg>
  );
};

// ---------------------------------------------------------------------------- Leaf

const LEAF_SHAPE: Point[] = [
  [8, 40],
  [7, 27],
  [14, 15],
  [27, 8],
  [42, 6],
  [40, 21],
  [33, 33],
  [21, 40],
];
const LEAF = {
  body: smoothClosedPath(LEAF_SHAPE),
  outline: ink(overlapLoop(LEAF_SHAPE, 2), { width: 2.6, taperStart: 0.04, taperEnd: 0.06 }),
  vein: ink(
    [
      [8, 40],
      [19, 28],
      [31, 17],
    ],
    { width: 2, taperStart: 0.1, taperEnd: 0.6, seed: 3 }
  ),
};

export const Leaf: React.FC<DoodleProps> = ({ className, ...props }) => (
  <svg viewBox="0 0 48 48" aria-hidden="true" className={className} {...props}>
    <path d={LEAF.body} fill="var(--color-brand-green)" />
    <Ink d={LEAF.outline} />
    <Ink d={LEAF.vein} />
  </svg>
);

// ---------------------------------------------------------------------------- Sun

const SUN_BODY = wobblyCircle(60, 60, 27, { count: 16, wobble: 1.1, seed: 21 });

// Nine rays at uneven angles and lengths, each with a slight bow, so the sun reads as
// drawn rather than stamped.
const SUN_RAYS = [
  { angle: -92, inner: 36, outer: 54, bow: 1.2 },
  { angle: -48, inner: 37, outer: 51, bow: -1 },
  { angle: -8, inner: 36, outer: 55, bow: 1.4 },
  { angle: 34, inner: 37, outer: 52, bow: -1.2 },
  { angle: 75, inner: 36, outer: 54, bow: 1 },
  { angle: 118, inner: 37, outer: 50, bow: -1.4 },
  { angle: 156, inner: 36, outer: 54, bow: 1.1 },
  { angle: 196, inner: 37, outer: 52, bow: -0.9 },
  { angle: 232, inner: 36, outer: 55, bow: 1.3 },
].map(({ angle, inner, outer, bow }) => {
  const a = (angle * Math.PI) / 180;
  const at = (r: number, offset = 0): Point => [
    60 + r * Math.cos(a) - offset * Math.sin(a),
    60 + r * Math.sin(a) + offset * Math.cos(a),
  ];
  // A plain round-capped line with a slight bow: at this length a tapered brush stroke
  // reads as a comma.
  const [x0, y0] = at(inner);
  const [qx, qy] = at((inner + outer) / 2, bow * 2);
  const [x1, y1] = at(outer);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)}Q${qx.toFixed(2)} ${qy.toFixed(2)} ${x1.toFixed(2)} ${y1.toFixed(2)}`;
});

const SUN = {
  body: smoothClosedPath(SUN_BODY),
  outline: ink(overlapLoop(SUN_BODY, 3), {
    width: 3.2,
    taperStart: 0.04,
    taperEnd: 0.06,
    seed: 22,
  }),
  // A soft painted highlight on the upper left.
  glint: ink(
    [
      [43, 52],
      [46, 45],
      [52, 40],
    ],
    { width: 3, taperStart: 0.3, taperEnd: 0.5, seed: 7 }
  ),
  smile: ink(
    [
      [49, 64],
      [54.5, 69.5],
      [62, 71],
      [70.5, 65.5],
    ],
    { width: 2.8, taperStart: 0.2, taperEnd: 0.3, seed: 12 }
  ),
};

/** The sun. Its rays turn and its eyes follow the pointer inside a PointerScene. */
export const Sun: React.FC<DoodleProps> = ({ className, ...props }) => {
  const { x, y } = usePointer();
  const spin = useTransform(x, v => v * 14);
  const lookX = useTransform(x, v => v * 1.6);
  const lookY = useTransform(y, v => v * 1.2);
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" className={className} {...props}>
      <motion.g style={{ rotate: spin, originX: 0.5, originY: 0.5 }}>
        {SUN_RAYS.map((d, i) => (
          <path key={i} d={d} fill="none" {...PEN} strokeWidth={3.4} />
        ))}
      </motion.g>
      <path d={SUN.body} fill="var(--color-brand-yellow)" />
      <Ink d={SUN.glint} color="#ffffff" opacity={0.6} />
      <Ink d={SUN.outline} />
      <ellipse cx="45.5" cy="63.5" rx="4" ry="2.6" fill="var(--color-brand-pink)" opacity={0.5} />
      <ellipse cx="75" cy="62.5" rx="4" ry="2.6" fill="var(--color-brand-pink)" opacity={0.5} />
      <motion.g style={{ x: lookX, y: lookY }}>
        <ellipse cx="51" cy="54.5" rx="2.5" ry="3.1" fill={INK} />
        <ellipse cx="69.5" cy="54" rx="2.3" ry="3" fill={INK} />
      </motion.g>
      <Ink d={SUN.smile} />
    </svg>
  );
};

// ---------------------------------------------------------------------------- Paper plane

export const PaperPlane: React.FC<DoodleProps> = ({ className, ...props }) => (
  <svg viewBox="0 0 64 48" aria-hidden="true" className={className} {...props}>
    <path d="M4 22L60 4L42 44L30 30Z" fill="#ffffff" {...PEN} strokeWidth={2.5} />
    <path d="M60 4L30 30L26 42L22 32" fill="none" {...PEN} strokeWidth={2.5} />
  </svg>
);

// ---------------------------------------------------------------------------- Bird

const BIRD_BODY: Point[] = [
  [12.5, 32],
  [13, 23],
  [19, 14.5],
  [29, 10],
  [39, 12],
  [45, 20],
  [45.5, 29],
  [41, 37.5],
  [31, 42],
  [20.5, 41],
  [14.5, 37.5],
];
const BIRD_WING: Point[] = [
  [17, 28],
  [23, 23.5],
  [31, 24.5],
  [33, 29],
  [27, 33.5],
  [20, 33],
];
const BIRD = {
  body: smoothClosedPath(BIRD_BODY),
  outline: ink(overlapLoop(BIRD_BODY, 3), {
    width: 2.6,
    taperStart: 0.04,
    taperEnd: 0.06,
    seed: 41,
  }),
  wing: smoothClosedPath(BIRD_WING),
  wingEdge: ink(overlapLoop(BIRD_WING, 2), {
    width: 1.6,
    taperStart: 0.1,
    taperEnd: 0.2,
    seed: 42,
  }),
  tail: ink(
    [
      [13.5, 30],
      [7, 26.5],
      [4.5, 29],
    ],
    { width: 2.4, taperStart: 0.1, taperEnd: 0.6, seed: 43 }
  ),
  beak: smoothClosedPath([
    [44, 19.5],
    [51.5, 21.8],
    [44.5, 25],
  ]),
  legs: [
    ink(
      [
        [25, 41.5],
        [24.4, 46.5],
      ],
      { width: 2, taperStart: 0, taperEnd: 0.3, seed: 44 }
    ),
    ink(
      [
        [32, 41.5],
        [32.8, 46.5],
      ],
      { width: 2, taperStart: 0, taperEnd: 0.3, seed: 45 }
    ),
  ],
};

/**
 * A small round bird — the quiet resident of our hills. Inside a PointerScene it watches
 * the pointer, and it hops if you hover it.
 */
export const Bird: React.FC<DoodleProps & { color?: string }> = ({
  className,
  color = 'var(--color-brand-blue)',
  style,
}) => {
  const { x, y } = usePointer();
  const lookX = useTransform(x, v => v * 1.4);
  const lookY = useTransform(y, v => v * 1);
  const tilt = useTransform(x, v => v * 6);
  // The wrapper takes the caller's classes (position, size, `animate-float`), so a CSS
  // float animation and the hover hop each own a different element's transform.
  return (
    <span aria-hidden="true" className={cn('block', className)} style={style}>
      <motion.svg
        viewBox="0 0 56 48"
        className="block w-full overflow-visible"
        whileHover={{ y: -7 }}
        transition={{ type: 'spring', stiffness: 500, damping: 12 }}
      >
        <motion.g style={{ rotate: tilt, originX: 0.5, originY: 1 }}>
          <Ink d={BIRD.tail} />
          <path d={BIRD.body} fill={color} />
          <path d={BIRD.wing} fill="#ffffff" opacity={0.35} />
          <Ink d={BIRD.wingEdge} opacity={0.55} />
          <Ink d={BIRD.outline} />
          <path
            d={BIRD.beak}
            fill="var(--color-brand-yellow)"
            stroke={INK}
            strokeWidth={1.8}
            strokeLinejoin="round"
          />
          <ellipse
            cx="40"
            cy="26"
            rx="2.4"
            ry="1.6"
            fill="var(--color-brand-pink)"
            opacity={0.55}
          />
          <motion.g style={{ x: lookX, y: lookY }}>
            <ellipse cx="36" cy="19" rx="2.3" ry="2.6" fill={INK} />
            <circle cx="36.8" cy="18.1" r="0.7" fill="#ffffff" />
          </motion.g>
        </motion.g>
        {BIRD.legs.map((d, i) => (
          <Ink key={i} d={d} />
        ))}
      </motion.svg>
    </span>
  );
};

// ---------------------------------------------------------------------------- Blossom

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
