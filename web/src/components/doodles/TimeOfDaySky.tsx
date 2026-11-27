import { cn } from '@/lib/utils';
import { useTimeOfDay, type TimeOfDay } from '@/hooks/useTimeOfDay';
import { Cloud } from './nature';
import { Parallax } from './pointer';

// Flat sky colors (no gradients) that follow the visitor's local time of day.
const SKY: Record<TimeOfDay, { sky: string; text: 'ink' | 'paper' }> = {
  morning: { sky: '#fff0c2', text: 'ink' },
  day: { sky: '#dde9ff', text: 'ink' },
  dusk: { sky: '#ffd9ec', text: 'ink' },
  night: { sky: '#232046', text: 'paper' },
};

const STARS = [
  [8, 18],
  [16, 42],
  [27, 12],
  [38, 30],
  [52, 9],
  [63, 24],
  [74, 14],
  [86, 34],
  [93, 10],
];

/**
 * A full-bleed flat sky with slowly drifting clouds (and a few stars at night).
 * Renders behind its children; the children decide their own layout.
 */
const TimeOfDaySky: React.FC<{ className?: string; children?: React.ReactNode }> = ({
  className,
  children,
}) => {
  const timeOfDay = useTimeOfDay();
  const { sky, text } = SKY[timeOfDay];

  return (
    <div
      data-time-of-day={timeOfDay}
      className={cn(
        'relative overflow-hidden transition-colors duration-1000',
        text === 'paper' ? 'text-[#fff8ec]' : 'text-[#1d1b2f]',
        className
      )}
      style={{ backgroundColor: sky }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {timeOfDay === 'night' &&
          STARS.map(([x, y], i) => (
            <span
              key={i}
              className="animate-float absolute size-1.5 rounded-full bg-[#fff0c2]"
              style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 0.7}s` }}
            />
          ))}
        {/* Each cloud sits on its own parallax layer: near ones (bigger) answer the pointer
            more than far ones, which gives the sky a little depth. */}
        <Parallax depth={0.9} className="absolute inset-0">
          <Cloud
            className="animate-drift absolute top-[8%] left-0 w-40 opacity-95 sm:w-56"
            style={{ ['--drift-duration' as string]: '95s', ['--drift-delay' as string]: '-20s' }}
          />
        </Parallax>
        <Parallax depth={0.45} className="absolute inset-0">
          <Cloud
            className="animate-drift absolute top-[26%] left-0 w-28 opacity-90 sm:w-36"
            style={{ ['--drift-duration' as string]: '120s', ['--drift-delay' as string]: '-75s' }}
          />
        </Parallax>
        <Parallax depth={1.3} className="absolute inset-0">
          <Cloud
            className="animate-drift absolute top-[4%] left-0 hidden w-72 opacity-95 md:block"
            style={{ ['--drift-duration' as string]: '140s', ['--drift-delay' as string]: '-110s' }}
          />
        </Parallax>
      </div>
      <div className="relative">{children}</div>
    </div>
  );
};

export default TimeOfDaySky;
