import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { occasionLabel } from '@/lib/wishList';

export interface DashboardRegistry {
  externalId: string;
  title: string;
  occasion?: string | null;
  eventDate?: string | null;
  items: { id: string }[];
  insights?: { itemCount: number; coveredCount: number; purchasedCount: number } | null;
}

interface RegistriesListProps {
  registries: DashboardRegistry[];
  onDelete: (externalId: string) => void;
  // The "All" view previews only the first few registries.
  limit?: number;
}

/** The dashboard's registries list (#245): one card per registry, with edit and delete. */
export const RegistriesList: React.FC<RegistriesListProps> = ({ registries, onDelete, limit }) => {
  const navigate = useNavigate();

  // The dashboard's ProductSection owns the empty state and the create button.
  if (registries.length === 0) return null;

  const visibleRegistries = limit ? registries.slice(0, limit) : registries;

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {visibleRegistries.map(registry => {
          const occasion = occasionLabel(registry.occasion);
          return (
            <Card key={registry.externalId} className="pop-hover">
              <CardContent className="flex h-full flex-col gap-3 p-5">
                <div>
                  <h3 className="line-clamp-2 text-xl text-foreground">{registry.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {[
                      occasion,
                      registry.eventDate
                        ? format(parseISO(registry.eventDate), 'MMM d, yyyy')
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'Registry'}
                  </p>
                </div>
                <p className="text-sm text-foreground/80">
                  {registry.items.length === 0
                    ? 'No items yet'
                    : registry.insights
                      ? `${registry.insights.coveredCount} of ${registry.insights.itemCount} covered` +
                        (registry.insights.purchasedCount > 0
                          ? ` · ${registry.insights.purchasedCount} bought`
                          : '')
                      : `${registry.items.length} ${registry.items.length === 1 ? 'item' : 'items'}`}
                </p>
                <div className="mt-auto flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/registry/${registry.externalId}/edit`)}
                  >
                    <Pencil className="mr-1 h-4 w-4" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/registry/${registry.externalId}`}>
                      <Eye className="mr-1 h-4 w-4" /> View
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => onDelete(registry.externalId)}
                  >
                    <Trash2 className="mr-1 h-4 w-4" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
