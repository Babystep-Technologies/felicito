import type { SVGProps } from 'react';

export type DoodleProps = SVGProps<SVGSVGElement> & { className?: string };

// The ink color doodles are drawn in. Fixed rather than `var(--ink)`: illustrations sit on
// light, solid tiles in both themes, so their outlines must not flip to cream in dark mode.
export const INK = '#1d1b2f';

// Common stroke settings so every doodle shares one "pen".
export const PEN = {
  stroke: INK,
  strokeWidth: 3,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const HAND_DRAWN_STYLE = { filter: 'url(#hand-drawn)' };
