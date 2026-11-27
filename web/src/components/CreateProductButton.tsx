import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { productById, type ProductId } from '@/config/products';
import { cn } from '@/lib/utils';

interface CreateProductButtonProps {
  product: ProductId;
  size?: 'default' | 'lg' | 'xl';
  // Override the product color, e.g. `ink` when the button sits on the product's own color.
  tone?: 'ink' | 'paper';
  // Stretch to the container on phones (the dashboard), auto width from `sm` up.
  fullWidthOnMobile?: boolean;
  className?: string;
}

/**
 * The one "create" button for every product, everywhere in the app: same shape, same
 * wording pattern ("Create a …"), same icon — only the product's color changes.
 */
const CreateProductButton: React.FC<CreateProductButtonProps> = ({
  product,
  size = 'lg',
  tone: toneOverride,
  fullWidthOnMobile = false,
  className,
}) => {
  const { route, tone, createLabel } = productById[product];

  return (
    <Button
      asChild
      tone={toneOverride ?? tone}
      size={size}
      className={cn(fullWidthOnMobile && 'w-full sm:w-auto', className)}
    >
      <Link to={route}>
        <Plus strokeWidth={3} />
        {createLabel}
      </Link>
    </Button>
  );
};

export default CreateProductButton;
