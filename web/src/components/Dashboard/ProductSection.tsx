import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ColorIconTile from '@/components/ColorIconTile';
import CreateProductButton from '@/components/CreateProductButton';
import { productById, type ProductId } from '@/config/products';
import EmptyState from './EmptyState';

interface ProductSectionProps {
  product: ProductId;
  count: number;
  emptyTitle: string;
  emptyDescription: string;
  // Set in the "All" view, where each section previews a few items and links to the rest.
  seeAllHref?: string;
  shown?: number;
  children: React.ReactNode;
}

/**
 * One product's block on the dashboard: a heading with the product's color and count,
 * the product's create button, then its list (or the shared empty state).
 */
const ProductSection: React.FC<ProductSectionProps> = ({
  product,
  count,
  emptyTitle,
  emptyDescription,
  seeAllHref,
  shown,
  children,
}) => {
  const { label, icon, colorVar, noun } = productById[product];

  return (
    <section aria-labelledby={`section-${product}`} className="animate-pop-in">
      <div className="mb-5 flex flex-col gap-4 border-b-2 border-dashed border-ink/25 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <ColorIconTile icon={icon} colorVar={colorVar} />
          <h2 id={`section-${product}`} className="text-2xl text-foreground">
            {label}
          </h2>
          {count > 0 && (
            <span className="rounded-full border-2 border-ink bg-card px-2.5 text-sm font-semibold">
              {count}
            </span>
          )}
        </div>
        {count > 0 && <CreateProductButton product={product} fullWidthOnMobile />}
      </div>

      {count === 0 ? (
        <EmptyState product={product} title={emptyTitle} description={emptyDescription} />
      ) : (
        children
      )}

      {seeAllHref && shown !== undefined && count > shown && (
        <Link
          to={seeAllHref}
          className="group mt-5 inline-flex items-center gap-1.5 font-semibold underline decoration-2 underline-offset-4"
          style={{ textDecorationColor: colorVar }}
        >
          See all {count} {noun}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </section>
  );
};

export default ProductSection;
