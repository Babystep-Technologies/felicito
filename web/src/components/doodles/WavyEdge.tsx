import { cn } from '@/lib/utils';
import type { DoodleProps } from './shared';

/**
 * A hand-cut wavy edge used between sections instead of a straight line. Paints with
 * `currentColor`, so set the color of the section it belongs to via `text-*`.
 * `flip` points the wave downward (for the bottom edge of a section).
 */
const WavyEdge: React.FC<DoodleProps & { flip?: boolean }> = ({ className, flip, ...props }) => (
  <svg
    viewBox="0 0 1440 40"
    preserveAspectRatio="none"
    aria-hidden="true"
    className={cn('block h-6 w-full sm:h-10', flip && 'rotate-180', className)}
    {...props}
  >
    <path
      d="M0 40V22C80 6 150 4 240 18S410 36 520 20 700 2 820 16 1010 38 1130 22 1340 4 1440 18V40Z"
      fill="currentColor"
    />
  </svg>
);

export default WavyEdge;
