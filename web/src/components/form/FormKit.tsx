import { Plus, type LucideIcon } from 'lucide-react';
import ColorIconTile from '@/components/ColorIconTile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { productById, type ProductId } from '@/config/products';
import { cn } from '@/lib/utils';

/*
 * One layout for every create/edit form (group card, 1-on-1 card, invitation, registry),
 * modelled on the registry form: a left-aligned header with the product's color tile, a
 * readable single column of outlined section cards, settings as "label + hint + switch"
 * rows, and the primary action at the bottom right.
 */

/** The page: product header, then sections. An `aside` (e.g. a live preview) sits beside. */
export const FormPage: React.FC<{
  product: ProductId;
  title: string;
  subtitle?: React.ReactNode;
  /** Shown on the right of the header, e.g. a "View card" button on an edit page. */
  headerAction?: React.ReactNode;
  aside?: React.ReactNode;
  children: React.ReactNode;
}> = ({ product, title, subtitle, headerAction, aside, children }) => {
  const { icon, colorVar } = productById[product];
  return (
    <div
      className={cn('mx-auto w-full px-4 py-8 sm:px-8 sm:py-10', aside ? 'max-w-6xl' : 'max-w-3xl')}
    >
      <header className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-3">
        <ColorIconTile icon={icon} colorVar={colorVar} className="size-12 [&_svg]:size-6" />
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl text-foreground sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
        </div>
        {headerAction}
      </header>
      {aside ? (
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-6">{children}</div>
          <div className="lg:sticky lg:top-24">{aside}</div>
        </div>
      ) : (
        <div className="space-y-6">{children}</div>
      )}
    </div>
  );
};

/** An outlined card holding one group of fields. */
export const FormSection: React.FC<{
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: LucideIcon;
  /** Numbers a section when the form is a sequence (design → message → deliver). */
  step?: number;
  className?: string;
  children: React.ReactNode;
}> = ({ title, description, icon: Icon, step, className, children }) => (
  <Card className={className}>
    {title && (
      <CardHeader>
        <CardTitle className="flex items-center gap-2.5 text-lg">
          {step !== undefined && (
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-brand-yellow text-sm font-bold text-[#1d1b2f]">
              {step}
            </span>
          )}
          {Icon && step === undefined && <Icon className="size-5" />}
          {title}
        </CardTitle>
        {description && <CardDescription className="text-sm">{description}</CardDescription>}
      </CardHeader>
    )}
    <CardContent className={cn('space-y-6', !title && 'pt-6')}>{children}</CardContent>
  </Card>
);

/** A label, an optional hint, and the control. */
export const Field: React.FC<{
  label: React.ReactNode;
  htmlFor?: string;
  hint?: React.ReactNode;
  required?: boolean;
  optional?: boolean;
  /** Something on the right of the label row, e.g. "Add item" buttons. */
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}> = ({ label, htmlFor, hint, required, optional, action, className, children }) => (
  <div className={cn('space-y-2', className)}>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <Label htmlFor={htmlFor} className="text-base font-semibold">
        {label}
        {required && (
          <span aria-hidden="true" className="text-destructive">
            *
          </span>
        )}
        {optional && <span className="font-normal text-muted-foreground">(optional)</span>}
      </Label>
      {action}
    </div>
    {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
    {children}
  </div>
);

/** A setting: label and explanation on the left, a switch on the right. */
export const SwitchRow: React.FC<{
  id: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}> = ({ id, label, description, checked, onCheckedChange, disabled }) => (
  <div className="flex items-center justify-between gap-4">
    <div>
      <Label htmlFor={id} className="text-base font-semibold">
        {label}
      </Label>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
    <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
  </div>
);

/** A row of pill choices where exactly one is selected (e.g. a message limit). */
export function ChoiceChips<T extends string | number>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: T; label: React.ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {options.map(option => {
        const selected = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-full border-2 border-ink px-4 py-1.5 text-sm font-semibold transition-all',
              selected
                ? 'bg-ink text-paper shadow-pop-sm'
                : 'bg-card text-foreground hover:-translate-y-px hover:bg-accent'
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** Adds another row to a repeating list (recipients, items, hosts…). */
export const AddRowButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ onClick, disabled, children }) => (
  <Button type="button" variant="outline" size="sm" onClick={onClick} disabled={disabled}>
    <Plus />
    {children}
  </Button>
);

/** The form's buttons: primary on the right, stacked full-width on phones. */
export const FormActions: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div
    className={cn(
      'flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end [&>*]:w-full sm:[&>*]:w-auto',
      className
    )}
  >
    {children}
  </div>
);

/** A row of color swatches where one is selected. */
export const SwatchPicker: React.FC<{
  swatches: { id: string; name: string; value: string }[];
  selectedId: string | null | undefined;
  onSelect: (id: string) => void;
  ariaLabel: string;
}> = ({ swatches, selectedId, onSelect, ariaLabel }) => (
  <div role="radiogroup" aria-label={ariaLabel} className="flex flex-wrap gap-3">
    {swatches.map(swatch => {
      const selected = swatch.id === selectedId;
      return (
        <button
          key={swatch.id}
          type="button"
          role="radio"
          aria-checked={selected}
          aria-label={swatch.name}
          title={swatch.name}
          onClick={() => onSelect(swatch.id)}
          className={cn(
            'size-10 rounded-full border-2 border-ink transition-transform hover:scale-110',
            selected && 'scale-110 ring-2 ring-ink ring-offset-2 ring-offset-card'
          )}
          style={{ backgroundColor: swatch.value }}
        />
      );
    })}
  </div>
);

/**
 * Classes that make a button look like a text input — for popover triggers such as date
 * and time pickers, and native selects, so they sit in a form like every other field.
 */
export const INPUT_LIKE =
  'flex h-9 w-full items-center gap-2 rounded-lg border-2 border-input bg-card px-3 text-left text-base outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm';
