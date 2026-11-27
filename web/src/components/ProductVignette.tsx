import type { ProductId } from '@/config/products';
import {
  GroupCardVignette,
  InvitationVignette,
  OneOnOneVignette,
  RegistryVignette,
} from '@/components/doodles';

const VIGNETTES: Record<ProductId, React.FC<{ className?: string }>> = {
  group: GroupCardVignette,
  one_on_one: OneOnOneVignette,
  invitation: InvitationVignette,
  registry: RegistryVignette,
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
