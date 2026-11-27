import { Grass } from '@/components/doodles';
import CreateProductButton from '@/components/CreateProductButton';
import ProductVignette from '@/components/ProductVignette';
import { productById, type ProductId } from '@/config/products';

interface EmptyStateProps {
  product: ProductId;
  title: string;
  description: string;
}

/**
 * The one empty state for every product: a quiet little scene, a line of copy and the
 * product's create button. Replaces three divergent versions (logo image vs icon, h2 vs h3).
 */
const EmptyState: React.FC<EmptyStateProps> = ({ product, title, description }) => (
  <div className="flex flex-col items-center px-4 py-10 text-center sm:py-14">
    <div
      className="hand-cut relative mb-6 flex w-56 items-end justify-center border-2 border-ink pt-6 shadow-pop"
      style={{ backgroundColor: productById[product].softColorVar }}
    >
      <Grass className="absolute bottom-1 left-3 w-6" />
      <Grass className="absolute right-4 bottom-1 w-5 [animation-delay:-2s]" />
      <ProductVignette product={product} className="animate-float h-28 w-auto" />
    </div>
    <h2 className="text-2xl text-foreground sm:text-3xl">{title}</h2>
    <p className="mt-2 mb-6 max-w-md text-base text-muted-foreground sm:text-lg">{description}</p>
    <CreateProductButton product={product} fullWidthOnMobile />
  </div>
);

export default EmptyState;
