/*
 * Geometry for hand-drawn doodles.
 *
 * Doodles are drawn the way a person draws with a brush pen: a few hand-placed points
 * joined by smooth curves, with a stroke that swells and tapers. That gives an imperfect,
 * human line that is still smooth at any size, unlike a displacement filter, which breaks
 * thin strokes into choppy fragments.
 *
 * Everything here is deterministic (seeded), so a doodle looks the same on every render.
 */

export type Point = readonly [number, number];

/** A small seeded PRNG (mulberry32), so "random" wobble is stable across renders. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const fmt = (n: number) => Math.round(n * 100) / 100;

/**
 * A smooth closed shape through `points` (a Catmull-Rom spline as cubic Béziers). Used for
 * fills: the curve passes through every point, so placing points by hand stays intuitive.
 */
export function smoothClosedPath(points: readonly Point[]): string {
  const n = points.length;
  const at = (i: number) => points[((i % n) + n) % n];
  let d = `M${fmt(at(0)[0])} ${fmt(at(0)[1])}`;
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${fmt(c1[0])} ${fmt(c1[1])} ${fmt(c2[0])} ${fmt(c2[1])} ${fmt(p2[0])} ${fmt(p2[1])}`;
  }
  return `${d}Z`;
}

/** Samples an open Catmull-Rom spline through `points` into a dense polyline. */
function sampleSpline(points: readonly Point[], perSegment = 14): Point[] {
  if (points.length < 2) return [...points];
  const n = points.length;
  const at = (i: number) => points[Math.max(0, Math.min(n - 1, i))];
  const out: Point[] = [];
  for (let i = 0; i < n - 1; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    for (let s = 0; s < perSegment; s++) {
      const t = s / perSegment;
      const t2 = t * t;
      const t3 = t2 * t;
      const coord = (k: 0 | 1) =>
        0.5 *
        (2 * p1[k] +
          (-p0[k] + p2[k]) * t +
          (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 +
          (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
      out.push([coord(0), coord(1)]);
    }
  }
  out.push(points[n - 1]);
  return out;
}

export interface InkOptions {
  /** Full stroke width at its widest. */
  width?: number;
  /** Fraction of the length over which the line swells in from a point. */
  taperStart?: number;
  /** Fraction of the length over which the line thins out to a point. */
  taperEnd?: number;
  /** How much the width breathes along the stroke (0 = even pressure). */
  pressure?: number;
  seed?: number;
}

/**
 * A brush-pen stroke along a smooth curve through `points`, returned as a filled outline.
 * Render it with `fill` set to the ink color and no `stroke`.
 */
export function inkStroke(points: readonly Point[], options: InkOptions = {}): string {
  const { width = 3, taperStart = 0.15, taperEnd = 0.25, pressure = 0.18, seed = 1 } = options;
  const samples = sampleSpline(points);
  if (samples.length < 2) return '';

  // Cumulative length, so tapering follows distance rather than point spacing.
  const lengths = [0];
  for (let i = 1; i < samples.length; i++) {
    const [ax, ay] = samples[i - 1];
    const [bx, by] = samples[i];
    lengths.push(lengths[i - 1] + Math.hypot(bx - ax, by - ay));
  }
  const total = lengths[lengths.length - 1] || 1;

  // Pressure varies slowly: two low-frequency waves with a seeded phase.
  const rand = seeded(seed);
  const phaseA = rand() * Math.PI * 2;
  const phaseB = rand() * Math.PI * 2;
  const ease = (x: number) => Math.sin((Math.min(1, Math.max(0, x)) * Math.PI) / 2);

  const left: Point[] = [];
  const right: Point[] = [];
  for (let i = 0; i < samples.length; i++) {
    const t = lengths[i] / total;
    const swell =
      (taperStart > 0 ? ease(t / taperStart) : 1) * (taperEnd > 0 ? ease((1 - t) / taperEnd) : 1);
    const breathe =
      1 + pressure * (0.6 * Math.sin(t * 5.1 + phaseA) + 0.4 * Math.sin(t * 11.3 + phaseB));
    const half = Math.max(0.25, (width / 2) * swell * breathe);

    const prev = samples[Math.max(0, i - 1)];
    const next = samples[Math.min(samples.length - 1, i + 1)];
    const dx = next[0] - prev[0];
    const dy = next[1] - prev[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const [x, y] = samples[i];
    left.push([x + nx * half, y + ny * half]);
    right.push([x - nx * half, y - ny * half]);
  }

  // Walk down one side and back up the other, smoothing through midpoints so the outline
  // never shows the sampling as facets.
  const outline = [...left, ...right.reverse()];
  const mid = (a: Point, b: Point) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let d = `M${fmt(outline[0][0])} ${fmt(outline[0][1])}`;
  for (let i = 1; i < outline.length - 1; i++) {
    const [mx, my] = mid(outline[i], outline[i + 1]);
    d += `Q${fmt(outline[i][0])} ${fmt(outline[i][1])} ${fmt(mx)} ${fmt(my)}`;
  }
  const last = outline[outline.length - 1];
  return `${d}L${fmt(last[0])} ${fmt(last[1])}Z`;
}

/**
 * The points of a closed shape traced as an open pen stroke that overlaps where it began,
 * the way a person closes a loop by hand.
 */
export function overlapLoop(points: readonly Point[], overlap = 2): Point[] {
  return [...points, ...points.slice(0, overlap)];
}

/** Points around a slightly lumpy circle: a radius that breathes with the angle. */
export function wobblyCircle(
  cx: number,
  cy: number,
  r: number,
  { count = 14, wobble = 1.2, seed = 3, start = 0 } = {}
): Point[] {
  const rand = seeded(seed);
  const phase2 = rand() * Math.PI * 2;
  const phase3 = rand() * Math.PI * 2;
  return Array.from({ length: count }, (_, i) => {
    const a = start + (i / count) * Math.PI * 2;
    const rr = r + wobble * (Math.sin(2 * a + phase2) + 0.6 * Math.sin(3 * a + phase3));
    return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)] as const;
  });
}

/**
 * The outline of a cloud built from overlapping round lobes over a flat (slightly wavy)
 * base. The top is traced radially from `center`, so lobes merge into soft notches rather
 * than pinched knobs; the base is laid down separately so it stays clean.
 */
export function cloudOutline(
  lobes: readonly (readonly [number, number, number])[],
  center: Point,
  baseY: number,
  count = 64
): Point[] {
  const [cx, cy] = center;
  const reachAt = (a: number) => {
    const ux = Math.cos(a);
    const uy = Math.sin(a);
    let reach = 0;
    for (const [px, py, r] of lobes) {
      const dx = px - cx;
      const dy = py - cy;
      const along = ux * dx + uy * dy;
      const disc = along * along - (dx * dx + dy * dy) + r * r;
      if (disc >= 0) reach = Math.max(reach, along + Math.sqrt(disc));
    }
    return [cx + ux * reach, cy + uy * reach] as const;
  };

  // The top: sweep left -> over the top -> right (SVG angles PI..2PI), keeping only what
  // sits above the base.
  const top: Point[] = [];
  for (let i = 0; i <= count; i++) {
    const point = reachAt(Math.PI + (i / count) * Math.PI);
    if (point[1] < baseY - 2) top.push(point);
  }
  const left = top[0][0];
  const right = top[top.length - 1][0];

  // The base: right -> left, evenly spaced, with a gentle undulation.
  // The ends tuck in and up a little so the base meets the lobes in a soft curve, not a
  // corner.
  const steps = 7;
  const base: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = right - 3 - (right - left - 6) * t;
    const lift = (i === 0 || i === steps ? 2.5 : 0) + (i === 1 || i === steps - 1 ? 0.4 : 0);
    base.push([x, baseY - lift + 1.3 * Math.sin(x * 0.05 + 0.8)]);
  }
  return [...top, ...base];
}
