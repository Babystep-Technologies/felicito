import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

// Felicito's "pop" button: a pill with an ink outline and a hard offset shadow that lifts
// on hover and presses flat on click. Solid variants get the outline + shadow; `ghost`
// and `link` stay flat. `tone` paints a solid brand color (text is always ink, which has
// enough contrast on all four brand colors).
const POP =
  'border-2 border-ink shadow-pop-sm hover:-translate-x-px hover:-translate-y-px hover:shadow-pop active:translate-x-0.5 active:translate-y-0.5 active:shadow-none';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-[transform,box-shadow,background-color,color] duration-150 ease-out disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive motion-reduce:transition-none motion-reduce:hover:translate-0 motion-reduce:active:translate-0",
  {
    variants: {
      variant: {
        default: `bg-ink text-paper ${POP}`,
        destructive: `bg-destructive text-white ${POP}`,
        outline: `bg-card text-foreground hover:bg-muted ${POP}`,
        secondary: `bg-brand-green text-[#1d1b2f] ${POP}`,
        ghost: 'hover:bg-muted hover:text-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      tone: {
        none: '',
        ink: `bg-ink text-paper ${POP}`,
        paper: `bg-card text-foreground hover:bg-muted ${POP}`,
        pink: `bg-brand-pink text-[#1d1b2f] ${POP}`,
        blue: `bg-brand-blue text-[#1d1b2f] ${POP}`,
        green: `bg-brand-green text-[#1d1b2f] ${POP}`,
        yellow: `bg-brand-yellow text-[#1d1b2f] ${POP}`,
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-11 px-6 text-base has-[>svg]:px-5',
        xl: 'h-14 px-8 text-lg has-[>svg]:px-7 [&_svg:not([class*=size-])]:size-5',
        icon: 'size-9',
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      tone: 'none',
      size: 'default',
    },
  }
);

function Button({
  className,
  variant,
  tone,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      // A tone replaces the variant's colors entirely, so drop the variant when one is set.
      className={cn(
        buttonVariants({
          variant: tone && tone !== 'none' ? null : variant,
          tone,
          size,
          className,
        })
      )}
      {...props}
    />
  );
}

export { Button, buttonVariants };
