import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/** A solid brand-color square with an ink outline holding an icon. Replaces gradient tiles. */
const ColorIconTile: React.FC<{
  icon: LucideIcon;
  colorVar: string;
  className?: string;
}> = ({ icon: Icon, colorVar, className }) => (
  <div
    className={cn(
      'hand-cut flex size-10 shrink-0 items-center justify-center border-2 border-ink text-[#1d1b2f]',
      className
    )}
    style={{ backgroundColor: colorVar }}
  >
    <Icon className="size-5" strokeWidth={2.25} />
  </div>
);

export default ColorIconTile;
