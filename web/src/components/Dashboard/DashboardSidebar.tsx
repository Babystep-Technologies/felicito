import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookUser, ChevronDown, LayoutGrid, Plus, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { IntentPickerDialog } from '@/components/IntentPickerDialog';
import { Leaf } from '@/components/doodles';
import { cn } from '@/lib/utils';

export interface SidebarItem {
  view: string;
  label: string;
  count: number;
  // Product color for the dot and the active tint; unset for "All".
  colorVar?: string;
  softColorVar?: string;
}

interface DashboardSidebarProps {
  items: SidebarItem[];
  activeView: string;
  organizationName: string | null;
}

const hrefFor = (view: string) => `/dashboard?view=${view}`;

const NavList: React.FC<DashboardSidebarProps & { onNavigate?: () => void }> = ({
  items,
  activeView,
  onNavigate,
}) => (
  <nav aria-label="Your creations" className="flex flex-col gap-1.5">
    {items.map(item => {
      const active = item.view === activeView;
      return (
        <Link
          key={item.view}
          to={hrefFor(item.view)}
          onClick={onNavigate}
          aria-current={active ? 'page' : undefined}
          className={cn(
            'flex items-center gap-3 rounded-full border-2 px-3 py-2 text-[15px] font-medium transition-[background-color,border-color,box-shadow,transform] duration-150',
            active
              ? 'border-ink shadow-pop-sm'
              : 'border-transparent text-foreground/80 hover:bg-muted hover:text-foreground'
          )}
          style={active ? { backgroundColor: item.softColorVar ?? 'var(--card)' } : undefined}
        >
          {item.colorVar ? (
            <span
              aria-hidden="true"
              className="size-3.5 shrink-0 rounded-full border-2 border-ink"
              style={{ backgroundColor: item.colorVar }}
            />
          ) : (
            <LayoutGrid aria-hidden="true" className="size-4 shrink-0" />
          )}
          <span className="flex-1 truncate">{item.label}</span>
          <span
            className={cn(
              'min-w-6 rounded-full px-1.5 text-center text-xs font-semibold tabular-nums',
              item.count === 0 ? 'text-muted-foreground' : 'bg-card border-[1.5px] border-ink'
            )}
          >
            {item.count}
          </span>
        </Link>
      );
    })}
  </nav>
);

const SecondaryLinks: React.FC<{ onNavigate?: () => void }> = ({ onNavigate }) => (
  <div className="flex flex-col gap-1 border-t-2 border-dashed border-ink/20 pt-4">
    <Link
      to="/contacts"
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-full px-3 py-2 text-[15px] text-foreground/80 transition hover:bg-muted hover:text-foreground"
    >
      <BookUser className="size-4" aria-hidden="true" />
      Contacts
    </Link>
    <Link
      to="/profile"
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-full px-3 py-2 text-[15px] text-foreground/80 transition hover:bg-muted hover:text-foreground"
    >
      <UserRound className="size-4" aria-hidden="true" />
      Profile
    </Link>
  </div>
);

const CreateButton: React.FC<{ className?: string }> = ({ className }) => (
  <IntentPickerDialog>
    <Button type="button" size="lg" className={className}>
      <Plus strokeWidth={3} />
      Create
    </Button>
  </IntentPickerDialog>
);

/** Desktop: a sticky left column. Hidden below `md`, where DashboardMobileBar takes over. */
export const DashboardSidebar: React.FC<DashboardSidebarProps> = props => (
  <aside className="sticky top-24 hidden h-fit w-60 shrink-0 flex-col gap-5 md:flex">
    <CreateButton className="w-full" />
    {props.organizationName && (
      <p className="px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {props.organizationName}
      </p>
    )}
    <NavList {...props} />
    <SecondaryLinks />
    <Leaf className="animate-sway ml-4 w-8 opacity-90" />
  </aside>
);

/** Phones: a sticky bar naming the current section; tapping it opens the same nav. */
export const DashboardMobileBar: React.FC<DashboardSidebarProps> = props => {
  const [open, setOpen] = useState(false);
  const active = props.items.find(item => item.view === props.activeView) ?? props.items[0];

  return (
    <div className="sticky top-16 z-30 -mx-4 mb-4 flex items-center gap-2 border-b-2 border-ink bg-paper px-4 py-2.5 md:hidden">
      <Button
        type="button"
        variant="outline"
        className="flex-1 justify-between"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        <span className="flex items-center gap-2 truncate">
          {active?.colorVar && (
            <span
              aria-hidden="true"
              className="size-3 rounded-full border-2 border-ink"
              style={{ backgroundColor: active.colorVar }}
            />
          )}
          {active?.label}
          <span className="text-muted-foreground">({active?.count ?? 0})</span>
        </span>
        <ChevronDown />
      </Button>
      <CreateButton />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="bg-paper p-5">
          <SheetHeader className="p-0">
            <SheetTitle className="font-display text-2xl">Your creations</SheetTitle>
          </SheetHeader>
          <NavList {...props} onNavigate={() => setOpen(false)} />
          <SecondaryLinks onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
};
