import { inkStroke, overlapLoop, seeded, smoothClosedPath, wobblyCircle, type Point } from './ink';
import { INK, type DoodleProps } from './shared';

/*
 * One small scene per product, for the marketing tiles, the create picker and empty
 * states. Drawn in the same brush-pen hand as the nature doodles (see ./ink): flat fills,
 * tapered ink outlines, shapes placed by hand and a little uneven, but always smooth.
 *
 *   group card  — friends gathered round one card, each signing it in their own color
 *   1-on-1 card — a note flying from one person straight to another
 *   invitation  — an invitation pulled from its envelope under party bunting
 *   registry    — a wish list, ticked off as gifts are claimed, beside a wrapped gift
 *
 * All paths are computed once at module load.
 */

const PINK = 'var(--color-brand-pink)';
const BLUE = 'var(--color-brand-blue)';
const GREEN = 'var(--color-brand-green)';
const YELLOW = 'var(--color-brand-yellow)';
const PAPER = '#fffdf7';
const SKIN = ['#ffd9bd', '#eab08a', '#b97c58'] as const;
const HAIR = { ink: INK, brown: '#6b4430', ginger: '#c8702e' } as const;

// ------------------------------------------------------------------------------ helpers

/** A filled shape with a hand-inked outline that overlaps a little where it closes. */
const shape = (points: readonly Point[], width = 2.6, seed = 1) => ({
  body: smoothClosedPath(points),
  outline: inkStroke(overlapLoop(points, 2), {
    width,
    taperStart: 0.04,
    taperEnd: 0.06,
    seed,
  }),
});
type Shape = ReturnType<typeof shape>;

/** An open brush stroke. */
const line = (points: readonly Point[], width = 2.4, seed = 1, taperStart = 0.15, taperEnd = 0.3) =>
  inkStroke(points, { width, taperStart, taperEnd, seed });

/** A rectangle with soft corners and slightly uneven sides, as if drawn freehand. */
function softRect(
  x: number,
  y: number,
  w: number,
  h: number,
  { r = 5, jitter = 0.7, seed = 1 } = {}
): Point[] {
  const rand = seeded(seed);
  const j = () => (rand() - 0.5) * 2 * jitter;
  return [
    [x + r, y + j()],
    [x + w / 2 + j(), y + j()],
    [x + w - r, y + j()],
    [x + w + j(), y + r],
    [x + w + j(), y + h / 2 + j()],
    [x + w + j(), y + h - r],
    [x + w - r, y + h + j()],
    [x + w / 2 + j(), y + h + j()],
    [x + r, y + h + j()],
    [x + j(), y + h - r],
    [x + j(), y + h / 2 + j()],
    [x + j(), y + r],
  ];
}

/**
 * A polygon with slightly softened corners: each corner gets two points close beside it,
 * so the smooth curve turns crisply there instead of ballooning into a blob.
 */
function cornered(points: readonly Point[], r = 2.2): Point[] {
  const n = points.length;
  return points.flatMap((p, i) => {
    const toward = (q: Point): Point => {
      const dx = q[0] - p[0];
      const dy = q[1] - p[1];
      const len = Math.hypot(dx, dy) || 1;
      const k = Math.min(r, len / 3) / len;
      return [p[0] + dx * k, p[1] + dy * k];
    };
    return [toward(points[(i - 1 + n) % n]), toward(points[(i + 1) % n])];
  });
}

/** A soft, round heart centred on (cx, cy). */
const heartPoints = (cx: number, cy: number, s = 1): Point[] =>
  (
    [
      [0, -2.6],
      [-2.6, -5.4],
      [-6, -5],
      [-7.2, -1.6],
      [-5.2, 2.4],
      [0, 6.6],
      [5.2, 2.4],
      [7.2, -1.6],
      [6, -5],
      [2.6, -5.4],
    ] as Point[]
  ).map(([x, y]) => [cx + x * s, cy + y * s] as const);

/** A four-point twinkle, drawn as two crossing tapered strokes. */
const twinkle = (cx: number, cy: number, r = 5, seed = 1) => [
  line(
    [
      [cx, cy - r],
      [cx, cy + r],
    ],
    2,
    seed,
    0.45,
    0.45
  ),
  line(
    [
      [cx - r * 0.8, cy],
      [cx + r * 0.8, cy],
    ],
    2,
    seed + 1,
    0.45,
    0.45
  ),
];

/** The ground everything stands on: one long, gently uneven brush line. */
const ground = (y: number, seed: number, from = 8, to = 152) =>
  line(
    [
      [from, y + 0.6],
      [from + (to - from) * 0.3, y - 0.5],
      [from + (to - from) * 0.65, y + 0.5],
      [to, y - 0.3],
    ],
    2.6,
    seed,
    0.08,
    0.12
  );

const Ink: React.FC<{ d: string; opacity?: number; color?: string }> = ({
  d,
  opacity,
  color = INK,
}) => <path d={d} fill={color} opacity={opacity} />;

const Fill: React.FC<{ s: Shape; fill: string }> = ({ s, fill }) => (
  <>
    <path d={s.body} fill={fill} />
    <Ink d={s.outline} />
  </>
);

const Frame: React.FC<DoodleProps & { children: React.ReactNode }> = ({
  className,
  children,
  ...props
}) => (
  <svg viewBox="0 0 160 140" aria-hidden="true" className={className} {...props}>
    {children}
  </svg>
);

// ------------------------------------------------------------------------------ people

/*
 * A little person: a soft bell-shaped body, a round head, a few strands of character in
 * the hair, dot eyes and rosy cheeks. Arms are drawn separately so each scene can pose
 * them. Coordinates are absolute; `base` is where their feet meet the ground.
 */
type HairStyle = 'bob' | 'short' | 'bun';
interface PersonSpec {
  x: number;
  base: number;
  scale?: number;
  shirt: string;
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  /** Turns the face a little toward a side (-1 left, 1 right). */
  face?: number;
  /** Arms as absolute points from the shoulder out to the hand. */
  arms?: Point[][];
  mouth?: 'smile' | 'open';
  seed: number;
}

const HAIR_SHAPES: Record<HairStyle, Point[]> = {
  bob: [
    [-10.8, -26],
    [-11.4, -34],
    [-7.8, -41.6],
    [0, -43.8],
    [7.8, -41.6],
    [11.4, -34],
    [10.8, -26],
    [8, -27.5],
    [7.4, -34.5],
    [2, -36.4],
    [-4.5, -35.4],
    [-8, -28],
  ],
  short: [
    [-9.8, -30],
    [-9.8, -36.5],
    [-5.4, -42],
    [1, -43.4],
    [7, -41.4],
    [10.2, -36],
    [9.8, -30.5],
    [7.6, -34.6],
    [2.5, -36.2],
    [-3, -35.6],
    [-7.4, -33],
  ],
  bun: [
    [-10, -29.5],
    [-10, -36.5],
    [-5.6, -42],
    [0.6, -43.4],
    [6.6, -41.8],
    [10.2, -36.4],
    [10, -29.5],
    [7.2, -34.8],
    [1, -36.6],
    [-6, -35],
  ],
};

const BODY: Point[] = [
  [-12, 0],
  [-11.2, -9.5],
  [-8.4, -18.5],
  [-3.4, -22.6],
  [3.4, -22.6],
  [8.4, -18.5],
  [11.2, -9.5],
  [12, 0],
  [4, 1],
  [-4, 1],
];

function makePerson(spec: PersonSpec) {
  const { x, base, scale: s = 1, face = 0, seed } = spec;
  const at = ([px, py]: Point): Point => [x + px * s, base + py * s];
  const head = wobblyCircle(x + face * 0.6 * s, base - 32 * s, 9.6 * s, {
    count: 12,
    wobble: 0.35 * s,
    seed: seed + 1,
  });
  const fx = x + face * 1.8 * s;
  const fy = base - 31 * s;
  return {
    spec,
    body: shape(BODY.map(at), 2.6 * s, seed),
    head: shape(head, 2.4 * s, seed + 2),
    hair: shape(
      HAIR_SHAPES[spec.hairStyle].map(([px, py]) => at([px + face * 0.6, py])),
      2.4 * s,
      seed + 3
    ),
    bun:
      spec.hairStyle === 'bun'
        ? shape(wobblyCircle(x, base - 45 * s, 4.6 * s, { count: 8, wobble: 0.2, seed }))
        : null,
    eyes: [
      [fx - 3.5 * s, fy],
      [fx + 3.5 * s, fy],
    ] as Point[],
    cheeks: [
      [fx - 6.2 * s, fy + 3.6 * s],
      [fx + 6.2 * s, fy + 3.6 * s],
    ] as Point[],
    mouth:
      spec.mouth === 'open'
        ? shape(
            wobblyCircle(fx, fy + 5.2 * s, 1.7 * s, { count: 7, wobble: 0.15, seed }),
            1.2 * s,
            seed
          )
        : line(
            [
              [fx - 2.2 * s, fy + 4.4 * s],
              [fx, fy + 5.6 * s],
              [fx + 2.2 * s, fy + 4.4 * s],
            ],
            1.5 * s,
            seed,
            0.2,
            0.2
          ),
    arms: (spec.arms ?? []).map((points, i) => ({
      points,
      outline: line(points, 7.6 * s, seed + 10 + i, 0, 0),
      sleeve: line(points, 3.8 * s, seed + 20 + i, 0, 0),
      hand: shape(
        wobblyCircle(points[points.length - 1][0], points[points.length - 1][1], 3 * s, {
          count: 8,
          wobble: 0.15,
          seed: seed + i,
        }),
        1.8 * s,
        seed + 30 + i
      ),
    })),
  };
}
type Person = ReturnType<typeof makePerson>;

const PersonFigure: React.FC<{ p: Person; children?: React.ReactNode }> = ({ p, children }) => {
  const { spec } = p;
  const s = spec.scale ?? 1;
  return (
    <g>
      <Fill s={p.body} fill={spec.shirt} />
      {p.bun && <Fill s={p.bun} fill={spec.hair} />}
      <Fill s={p.head} fill={spec.skin} />
      <Fill s={p.hair} fill={spec.hair} />
      {p.cheeks.map(([cx, cy], i) => (
        <ellipse key={i} cx={cx} cy={cy} rx={2.2 * s} ry={1.4 * s} fill={PINK} opacity={0.5} />
      ))}
      {p.eyes.map(([cx, cy], i) => (
        <ellipse key={i} cx={cx} cy={cy} rx={1.25 * s} ry={1.6 * s} fill={INK} />
      ))}
      {spec.mouth === 'open' ? (
        <Fill s={p.mouth as Shape} fill="#c2415f" />
      ) : (
        <Ink d={p.mouth as string} />
      )}
      {children}
      {p.arms.map((arm, i) => (
        <g key={i}>
          <Ink d={arm.outline} />
          <Ink d={arm.sleeve} color={spec.shirt} />
          <Fill s={arm.hand} fill={spec.skin} />
        </g>
      ))}
    </g>
  );
};

/** A pen held in a hand, tip toward (tx, ty). */
const pen = (hx: number, hy: number, tx: number, ty: number, seed: number) =>
  line(
    [
      [hx + (hx - tx) * 0.35, hy + (hy - ty) * 0.35],
      [tx, ty],
    ],
    2.6,
    seed,
    0,
    0.5
  );

// ---------------------------------------------------------------------- Group card

const GROUP = (() => {
  // The card stands open like a book: two panels meeting at the fold, their outer
  // edges a touch lower, so it reads as a folded greeting card seen from the front.
  const leftPanel = shape(
    cornered(
      [
        [45, 47],
        [80, 42.5],
        [80, 113],
        [45.6, 110],
      ],
      3
    ),
    2.8,
    3
  );
  const rightPanel = shape(
    cornered(
      [
        [80, 42.5],
        [115, 46.5],
        [114.4, 110.4],
        [80, 113],
      ],
      3
    ),
    2.8,
    4
  );
  const scribble = (from: number, to: number, y: number, seed: number) =>
    line(
      Array.from({ length: Math.round((to - from) / 5) + 1 }, (_, k) => {
        const x = from + k * 5;
        return [x, y + (k % 2 ? -2.6 : 0.4)] as const;
      }),
      2.2,
      seed,
      0.1,
      0.3
    );
  return {
    ground: ground(124, 1),
    leftPanel,
    rightPanel,
    // A soft shadow down the inside of the left panel, by the fold.
    shade: smoothClosedPath(
      cornered([
        [74, 44],
        [79.6, 43],
        [79.6, 112.6],
        [74, 112],
      ])
    ),
    heart: shape(heartPoints(62, 57, 0.85), 2, 6),
    // Everyone's message, each in their own pen, across both panels.
    scribbles: [
      { color: BLUE, d: scribble(52, 72, 71, 7) },
      { color: PINK, d: scribble(52, 67, 84, 9) },
      { color: GREEN, d: scribble(87, 108, 58, 8) },
      { color: '#e0a100', d: scribble(87, 102, 72, 10) },
      { color: BLUE, d: scribble(89, 104, 99, 11) },
    ],
    left: makePerson({
      x: 28,
      base: 124,
      shirt: BLUE,
      skin: SKIN[0],
      hair: HAIR.brown,
      hairStyle: 'bob',
      face: 1,
      seed: 40,
      arms: [
        [
          [33, 106],
          [42, 99],
          [52, 92],
        ],
      ],
    }),
    leftPen: pen(52, 92, 60, 92, 41),
    right: makePerson({
      x: 133,
      base: 124,
      shirt: GREEN,
      skin: SKIN[2],
      hair: HAIR.ink,
      hairStyle: 'short',
      face: -1,
      seed: 50,
      arms: [
        [
          [128, 106],
          [118, 100],
          [109, 96],
        ],
      ],
    }),
    rightPen: pen(109, 96, 100, 101, 51),
    // A third friend peeking over the top of the card, waiting for a turn.
    peek: makePerson({
      x: 96,
      base: 58,
      scale: 0.82,
      shirt: YELLOW,
      skin: SKIN[1],
      hair: HAIR.ginger,
      hairStyle: 'bun',
      mouth: 'open',
      seed: 60,
    }),
    peekHands: [
      shape(wobblyCircle(88, 43.5, 2.6, { count: 8, wobble: 0.15, seed: 61 }), 1.8, 61),
      shape(wobblyCircle(104, 45.4, 2.6, { count: 8, wobble: 0.15, seed: 62 }), 1.8, 62),
    ],
    hearts: [shape(heartPoints(28, 30, 0.75), 1.8, 70), shape(heartPoints(140, 46, 0.6), 1.8, 71)],
    twinkles: [twinkle(44, 18, 4.5, 72), twinkle(124, 22, 4, 74)],
  };
})();

/** Group card: friends gathered round one card, each adding a message in their own color. */
export const GroupCardVignette: React.FC<DoodleProps> = props => (
  <Frame {...props}>
    {/* The peeking friend sits behind the card; only head and fingertips show. */}
    <g clipPath="url(#group-peek)">
      <defs>
        <clipPath id="group-peek">
          <rect x="70" y="4" width="50" height="40" />
        </clipPath>
      </defs>
      <PersonFigure p={GROUP.peek} />
    </g>
    <Fill s={GROUP.rightPanel} fill={PAPER} />
    <Fill s={GROUP.leftPanel} fill={PAPER} />
    <path d={GROUP.shade} fill={INK} opacity={0.05} />
    <Fill s={GROUP.heart} fill={PINK} />
    {GROUP.scribbles.map(({ color, d }, i) => (
      <Ink key={i} d={d} color={color} />
    ))}
    {GROUP.peekHands.map((s, i) => (
      <Fill key={i} s={s} fill={SKIN[1]} />
    ))}
    <PersonFigure p={GROUP.left} />
    <Ink d={GROUP.leftPen} />
    <PersonFigure p={GROUP.right} />
    <Ink d={GROUP.rightPen} />
    {GROUP.hearts.map((s, i) => (
      <Fill key={i} s={s} fill={PINK} />
    ))}
    {GROUP.twinkles.flat().map((d, i) => (
      <Ink key={i} d={d} opacity={0.7} />
    ))}
    <Ink d={GROUP.ground} />
  </Frame>
);

// ---------------------------------------------------------------------- 1-on-1 card

const ONE = (() => {
  const plane: Point[] = cornered(
    [
      [90, 58],
      [116, 64],
      [96, 76],
      [97, 67],
    ],
    1.4
  );
  return {
    ground: ground(124, 2),
    sender: makePerson({
      x: 30,
      base: 124,
      shirt: BLUE,
      skin: SKIN[1],
      hair: HAIR.ink,
      hairStyle: 'bun',
      face: 1,
      seed: 80,
      arms: [
        [
          [35, 105],
          [42, 96],
          [46, 86],
        ],
      ],
    }),
    receiver: makePerson({
      x: 132,
      base: 124,
      shirt: PINK,
      skin: SKIN[0],
      hair: HAIR.ginger,
      hairStyle: 'bob',
      face: -1,
      mouth: 'open',
      seed: 90,
      arms: [
        [
          [126, 106],
          [119, 98],
          [116, 88],
        ],
        [
          [138, 106],
          [145, 98],
          [148, 88],
        ],
      ],
    }),
    // The note's flight: up from the sender's hand, one happy loop, then on to the other.
    trail: 'M48 82C50 60 58 44 70 40C82 36 88 48 82 54C76 60 66 50 72 42C78 34 88 44 90 58',
    plane: shape(plane, 2.3, 91),
    underWing: smoothClosedPath(
      cornered(
        [
          [114, 64.6],
          [97.6, 67.4],
          [94.6, 71.4],
        ],
        1
      )
    ),
    planeFold: line(
      [
        [116, 64],
        [97, 67],
        [93, 72],
      ],
      1.8,
      92,
      0.1,
      0.2
    ),
    heart: shape(heartPoints(80, 22, 0.95), 2, 93),
    twinkles: [twinkle(138, 60, 4, 94), twinkle(18, 64, 3.5, 96)],
  };
})();

/** 1-on-1 card: a single note flying from one person straight to another. */
export const OneOnOneVignette: React.FC<DoodleProps> = props => (
  <Frame {...props}>
    <path
      d={ONE.trail}
      fill="none"
      stroke={INK}
      strokeWidth={2}
      strokeLinecap="round"
      strokeDasharray="0.5 6"
      opacity={0.55}
    />
    <Fill s={ONE.heart} fill={BLUE} />
    <PersonFigure p={ONE.sender} />
    <PersonFigure p={ONE.receiver} />
    {/* Nosing down toward the person it's for. */}
    <g transform="translate(2 6) rotate(26 100 66) scale(1.2) translate(-16.7 -11)">
      <Fill s={ONE.plane} fill={PAPER} />
      <path d={ONE.underWing} fill="#dfe7f7" />
      <Ink d={ONE.planeFold} />
    </g>
    {ONE.twinkles.flat().map((d, i) => (
      <Ink key={i} d={d} opacity={0.7} />
    ))}
    <Ink d={ONE.ground} />
  </Frame>
);

// ---------------------------------------------------------------------- Invitation

const INVITE = (() => {
  // Bunting: a sagging string with little pennants hanging from it.
  const stringAt = (x: number) => 18 + 12 * Math.sin(((x - 6) / 148) * Math.PI);
  const flagColors = [PINK, YELLOW, BLUE, GREEN, PINK, YELLOW, BLUE];
  const flags = flagColors.map((color, i) => {
    const x = 16 + i * 21;
    const y0 = stringAt(x);
    const y1 = stringAt(x + 12);
    return {
      color,
      s: shape(
        cornered(
          [
            [x, y0 + 0.5],
            [x + 12, y1 + 0.5],
            [x + 6.4 + (i % 2 ? 0.6 : -0.6), (y0 + y1) / 2 + 13],
          ],
          1.6
        ),
        2,
        100 + i
      ),
    };
  });
  return {
    ground: ground(126, 3),
    string: line(
      Array.from({ length: 9 }, (_, i) => {
        const x = 6 + i * 18.5;
        return [x, stringAt(x)] as const;
      }),
      2,
      99,
      0.05,
      0.05
    ),
    flags,
    // The envelope's back and its open flap, folded up behind the card.
    back: shape(softRect(32, 76, 96, 48, { r: 4, seed: 110 }), 2.6, 110),
    flap: shape(
      cornered([
        [33, 78],
        [80, 50],
        [127, 78],
      ]),
      2.6,
      111
    ),
    card: shape(softRect(44, 44, 72, 62, { r: 4, seed: 112 }), 2.6, 112),
    // On the card: a headline flourish, a date, and a couple of lines of detail.
    headline: line(
      [
        [58, 56],
        [64, 53],
        [70, 57],
        [76, 53],
        [82, 57],
        [88, 53],
        [94, 56],
        [102, 54],
      ],
      2.4,
      113,
      0.1,
      0.2
    ),
    date: shape(softRect(57, 63, 16, 15, { r: 2.5, jitter: 0.4, seed: 114 }), 2, 114),
    dateTop: line(
      [
        [57.5, 67.5],
        [72.5, 67.5],
      ],
      1.8,
      115,
      0,
      0
    ),
    details: [
      line(
        [
          [79, 67],
          [104, 66],
        ],
        2,
        116,
        0.1,
        0.3
      ),
      line(
        [
          [79, 74],
          [97, 74.5],
        ],
        2,
        117,
        0.1,
        0.3
      ),
    ],
    // The front pocket of the envelope, with its folded seams and a wax seal.
    pocket: shape(
      cornered(
        [
          [32, 82],
          [80, 106],
          [128, 82],
          [128.4, 123.6],
          [31.6, 124],
        ],
        3
      ),
      2.6,
      118
    ),
    seal: shape(wobblyCircle(80, 104, 7, { count: 10, wobble: 0.5, seed: 119 }), 2.2, 119),
    sealHeart: shape(heartPoints(80, 104, 0.48), 1.2, 120),
    confetti: [
      {
        d: line(
          [
            [20, 60],
            [23, 55],
          ],
          2.6,
          121,
          0,
          0
        ),
        color: PINK,
      },
      {
        d: line(
          [
            [140, 56],
            [146, 59],
          ],
          2.6,
          122,
          0,
          0
        ),
        color: BLUE,
      },
      {
        d: line(
          [
            [18, 96],
            [24, 98],
          ],
          2.6,
          123,
          0,
          0
        ),
        color: YELLOW,
      },
      {
        d: line(
          [
            [142, 98],
            [139, 104],
          ],
          2.6,
          124,
          0,
          0
        ),
        color: GREEN,
      },
    ],
    twinkles: [twinkle(138, 76, 4, 125), twinkle(22, 78, 3.5, 127)],
  };
})();

/** Invitation: an invitation pulled from its envelope, under a string of party bunting. */
export const InvitationVignette: React.FC<DoodleProps> = props => (
  <Frame {...props}>
    <Ink d={INVITE.string} />
    {INVITE.flags.map(({ color, s }, i) => (
      <Fill key={i} s={s} fill={color} />
    ))}
    <Fill s={INVITE.back} fill={GREEN} />
    <Fill s={INVITE.flap} fill="#17a35a" />
    <Fill s={INVITE.card} fill={PAPER} />
    <Ink d={INVITE.headline} color={GREEN} />
    <Fill s={INVITE.date} fill="#ffffff" />
    <path d="M57.5 64.5H72.5V67.5H57.5Z" fill={PINK} />
    <Ink d={INVITE.dateTop} />
    <circle cx="65" cy="72.5" r="2" fill={INK} />
    {INVITE.details.map((d, i) => (
      <Ink key={i} d={d} opacity={0.45} />
    ))}
    <Fill s={INVITE.pocket} fill={GREEN} />
    <Fill s={INVITE.seal} fill={PINK} />
    <Fill s={INVITE.sealHeart} fill="#ffffff" />
    {INVITE.confetti.map(({ d, color }, i) => (
      <Ink key={i} d={d} color={color} />
    ))}
    {INVITE.twinkles.flat().map((d, i) => (
      <Ink key={i} d={d} opacity={0.7} />
    ))}
    <Ink d={INVITE.ground} />
  </Frame>
);

// ---------------------------------------------------------------------- Registry

const REGISTRY = (() => {
  const rows = [52, 68, 84, 100];
  return {
    ground: ground(124, 4),
    list: shape(softRect(24, 22, 62, 96, { r: 4, seed: 130 }), 2.6, 130),
    // A strip of washi tape holding the list up.
    tape: shape(softRect(43, 16, 24, 10, { r: 1.5, jitter: 0.4, seed: 131 }), 1.6, 131),
    title: line(
      [
        [34, 36],
        [40, 33],
        [46, 37],
        [52, 33],
        [58, 36],
      ],
      2.4,
      132,
      0.1,
      0.2
    ),
    titleHeart: shape(heartPoints(68, 34.5, 0.6), 1.6, 133),
    rows: rows.map((y, i) => ({
      box: shape(softRect(32, y - 5, 10, 10, { r: 2, jitter: 0.35, seed: 140 + i }), 1.8, 140 + i),
      text: line(
        [
          [47, y + 0.4],
          [62 + (i % 2) * 8, y - 0.4],
          [72 - (i % 3) * 4, y + 0.2],
        ],
        2,
        150 + i,
        0.1,
        0.35
      ),
      // The first two are already claimed.
      tick:
        i < 2
          ? line(
              [
                [32.5, y - 1],
                [36.5, y + 3.5],
                [45, y - 8],
              ],
              2.6,
              160 + i,
              0.1,
              0.3
            )
          : null,
    })),
    box: shape(softRect(86, 82, 50, 42, { r: 3, seed: 170 }), 2.6, 170),
    lid: shape(softRect(82, 72, 58, 14, { r: 3, seed: 171 }), 2.6, 171),
    bow: [
      shape(
        [
          [111, 72],
          [100, 58],
          [94, 62],
          [96, 70],
        ],
        2.2,
        172
      ),
      shape(
        [
          [111, 72],
          [122, 58],
          [128, 62],
          [126, 70],
        ],
        2.2,
        173
      ),
    ],
    knot: shape(wobblyCircle(111, 72, 3.6, { count: 8, wobble: 0.2, seed: 174 }), 1.8, 174),
    // A gift tag with a heart, tied on with a little string.
    tagString: line(
      [
        [131, 84],
        [139, 88],
        [143, 97.5],
      ],
      1.6,
      175,
      0,
      0.1
    ),
    tag: shape(
      cornered(
        [
          [143, 93],
          [149, 99],
          [149, 115],
          [137, 115],
          [137, 99],
        ],
        1.8
      ),
      1.8,
      176
    ),
    tagHeart: shape(heartPoints(143, 107.5, 0.5), 1.1, 177),
    twinkles: [twinkle(102, 30, 4.5, 178), twinkle(146, 46, 3.5, 180)],
  };
})();

/** Registry: a wish list ticked off as friends claim gifts, beside a wrapped present. */
export const RegistryVignette: React.FC<DoodleProps> = props => (
  <Frame {...props}>
    <g transform="rotate(-4 55 70)">
      <Fill s={REGISTRY.list} fill={PAPER} />
      <Fill s={REGISTRY.tape} fill={PINK} />
      <Ink d={REGISTRY.title} color="#d99a00" />
      <Fill s={REGISTRY.titleHeart} fill={PINK} />
      {REGISTRY.rows.map((row, i) => (
        <g key={i}>
          <Fill s={row.box} fill="#ffffff" />
          <Ink d={row.text} opacity={row.tick ? 0.3 : 0.55} />
          {row.tick && <Ink d={row.tick} color={GREEN} />}
        </g>
      ))}
    </g>
    <Fill s={REGISTRY.box} fill={YELLOW} />
    <path d="M106 85H116V123.4H106Z" fill={PINK} />
    <Ink
      d={line(
        [
          [106, 85],
          [106, 123],
        ],
        1.6,
        181,
        0,
        0
      )}
    />
    <Ink
      d={line(
        [
          [116, 85],
          [116, 123],
        ],
        1.6,
        182,
        0,
        0
      )}
    />
    <Fill s={REGISTRY.lid} fill={YELLOW} />
    <path d="M105 72.6H117V85.4H105Z" fill={PINK} />
    <Ink
      d={line(
        [
          [105, 73],
          [105, 85],
        ],
        1.6,
        183,
        0,
        0
      )}
    />
    <Ink
      d={line(
        [
          [117, 73],
          [117, 85],
        ],
        1.6,
        184,
        0,
        0
      )}
    />
    {REGISTRY.bow.map((s, i) => (
      <Fill key={i} s={s} fill={PINK} />
    ))}
    <Fill s={REGISTRY.knot} fill={PINK} />
    <Ink d={REGISTRY.tagString} />
    <Fill s={REGISTRY.tag} fill={PAPER} />
    <circle cx="143" cy="98.6" r="1.5" fill={INK} />
    <Fill s={REGISTRY.tagHeart} fill={PINK} />
    {REGISTRY.twinkles.flat().map((d, i) => (
      <Ink key={i} d={d} opacity={0.7} />
    ))}
    <Ink d={REGISTRY.ground} />
  </Frame>
);
