import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { products } from '@/config/products';
import ProductVignette from '@/components/ProductVignette';

interface IntentPickerDialogProps {
  // The single CTA button that opens the picker.
  children: React.ReactNode;
  // When set, carried into the chosen create flow as ?occasion= so the moment is
  // pre-selected (the create flows match it against the card occasion vocabulary).
  occasion?: string;
}

// One strong call to action that opens a lightweight chooser: the user picks the
// moment they have in mind (framed by intent) and lands in the matching create flow.
export const IntentPickerDialog: React.FC<IntentPickerDialogProps> = ({ children, occasion }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handlePick = (route: string) => {
    setOpen(false);
    navigate(occasion ? `${route}?occasion=${encodeURIComponent(occasion)}` : route);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-paper sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-3xl">What are we making?</DialogTitle>
          <DialogDescription className="text-base">
            Pick the moment you have in mind and we&apos;ll set you up with the right thing.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 grid grid-cols-2 gap-3">
          {products.map((product, i) => (
            <button
              key={product.id}
              onClick={() => handlePick(product.route)}
              className={`pop-hover animate-pop-in group flex flex-col items-start gap-1 border-2 border-ink p-3 text-left text-[#1d1b2f] shadow-pop ${i % 2 ? 'hand-cut-alt' : 'hand-cut'}`}
              style={{ backgroundColor: product.colorVar, animationDelay: `${i * 60}ms` }}
            >
              <span className="flex w-full justify-center rounded-xl border-2 border-ink bg-[#fff8ec] py-1">
                <ProductVignette
                  product={product.id}
                  className="h-16 w-auto transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105 motion-reduce:transform-none sm:h-20"
                />
              </span>
              <span className="mt-1 font-display text-base leading-tight sm:text-lg">
                {product.intent}
              </span>
              <span className="flex items-center gap-1 text-xs font-semibold opacity-80">
                {product.label}
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
