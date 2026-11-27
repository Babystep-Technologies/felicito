import React from 'react';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { products } from '@/config/products';
import ColorIconTile from '@/components/ColorIconTile';

export const ProductMenu: React.FC = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1 rounded-full px-3 py-1.5 font-medium text-base text-foreground/80 outline-none transition hover:bg-muted hover:text-foreground data-[state=open]:bg-muted">
        Personal
        <ChevronDown className="w-4 h-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[360px] p-3" align="start">
        <div className="flex flex-col gap-1">
          {products.map(product => (
            <DropdownMenuItem key={product.id} asChild className="p-0 focus:bg-transparent">
              <Link
                to={product.route}
                className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-[var(--hover-tint)] cursor-pointer"
                style={{ ['--hover-tint' as string]: product.softColorVar }}
              >
                <ColorIconTile icon={product.icon} colorVar={product.colorVar} />
                <div>
                  <div className="text-sm font-semibold text-foreground">{product.label}</div>
                  <div className="mt-0.5 text-xs leading-snug text-muted-foreground">
                    {product.description}
                  </div>
                </div>
              </Link>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
