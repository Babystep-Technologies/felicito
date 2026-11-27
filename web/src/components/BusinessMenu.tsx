import React from 'react';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { businessLinks } from '@/config/businessLinks';
import ColorIconTile from '@/components/ColorIconTile';

export const BusinessMenu: React.FC = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1 rounded-full px-3 py-1.5 font-medium text-base text-foreground/80 outline-none transition hover:bg-muted hover:text-foreground data-[state=open]:bg-muted">
        Business
        <ChevronDown className="w-4 h-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[360px] p-3" align="start">
        <div className="flex flex-col gap-1">
          {businessLinks.map(link => (
            <DropdownMenuItem key={link.id} asChild className="p-0 focus:bg-transparent">
              <Link
                to={link.route}
                className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-muted cursor-pointer"
              >
                <ColorIconTile icon={link.icon} colorVar={link.colorVar} />
                <div>
                  <div className="text-sm font-semibold text-foreground">{link.label}</div>
                  <div className="mt-0.5 text-xs leading-snug text-muted-foreground">
                    {link.description}
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
