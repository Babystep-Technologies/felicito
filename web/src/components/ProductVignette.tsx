import type { ProductId } from '@/config/products';
import { CakeVignette, GiftVignette, LetterVignette, PicnicVignette } from '@/components/doodles';

const VIGNETTES: Record<ProductId, React.FC<{ className?: string }>> = {
  group: CakeVignette,
  one_on_one: LetterVignette,
  invitation: PicnicVignette,
  registry: GiftVignette,
};

/** The little everyday scene that stands for a product. */
const ProductVignette: React.FC<{ product: ProductId; className?: string }> = ({
  product,
  className,
}) => {
  const Vignette = VIGNETTES[product];
  return <Vignette className={className} />;
};

export default ProductVignette;
