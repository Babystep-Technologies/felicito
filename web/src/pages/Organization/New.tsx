import { useState } from 'react';
import { gql, useMutation, ApolloError } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { Building2, LoaderCircle, Plus } from 'lucide-react';
import * as motion from 'motion/react-client';
import withAuth from '@/lib/with-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import ColorIconTile from '@/components/ColorIconTile';
import { Bird, Hills } from '@/components/doodles';
import { useOrganization } from '@/contexts/OrganizationContext';

const CREATE_ORGANIZATION = gql`
  mutation CreateOrganization($input: CreateOrganizationInput!) {
    createOrganization(input: $input) {
      organization {
        id
        name
        slug
      }
      errors
    }
  }
`;

const OrganizationNew: React.FC = () => {
  const navigate = useNavigate();
  const { switchOrganization } = useOrganization();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [createOrganization] = useMutation(CREATE_ORGANIZATION);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrors([]);
    setSubmitting(true);

    try {
      const { data } = await createOrganization({
        variables: { input: { name: name.trim(), description: description.trim() || null } },
      });
      const result = data?.createOrganization;

      if (!result?.organization) {
        setErrors(result?.errors?.length ? result.errors : ['Could not create the organization.']);
        return;
      }

      // Creating an organization is how you join one, so land the user inside it rather than
      // leaving them in Personal looking at an organization they can't see.
      await switchOrganization(result.organization.id);
      navigate('/dashboard');
    } catch (error) {
      const err = error as ApolloError;
      setErrors([err.message || 'Unexpected error occurred.']);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative -mb-6 flex min-h-[calc(100svh-4rem)] flex-col items-center overflow-x-hidden px-4 pt-14 pb-40 sm:-mb-10 sm:pt-20">
      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 20 }}
      >
        <div className="mb-8 space-y-3 text-center">
          <div className="flex justify-center">
            <ColorIconTile
              icon={Building2}
              colorVar="var(--color-brand-blue)"
              className="size-14 [&_svg]:size-7"
            />
          </div>
          <h1 className="text-4xl text-foreground">
            Create an <span className="marker-swipe">organization</span>
          </h1>
          <p className="text-muted-foreground">
            Share credits, cards, and branding with your team. You&apos;ll be its first admin.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="hand-cut space-y-5 border-2 border-ink bg-card p-6 shadow-pop sm:p-8"
        >
          <div className="space-y-2">
            <Label htmlFor="organization-name">Name</Label>
            <Input
              id="organization-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Acme Corp"
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="organization-description">Description (optional)</Label>
            <Textarea
              id="organization-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What is this organization for?"
              rows={3}
            />
          </div>

          {errors.length > 0 && (
            <ul className="space-y-1 text-sm font-medium text-destructive">
              {errors.map(error => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          )}

          <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:items-center">
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="lg"
              tone="blue"
              className="sm:ml-auto"
              disabled={submitting || name.trim() === ''}
            >
              {submitting ? <LoaderCircle className="animate-spin" /> : <Plus />}
              {submitting ? 'Creating…' : 'Create organization'}
            </Button>
          </div>
        </form>
      </motion.div>

      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0">
        <Bird
          className="animate-float absolute right-[18%] bottom-[70%] w-10"
          color="var(--color-brand-pink)"
        />
        <Hills className="h-24 sm:h-32" />
      </div>
    </div>
  );
};

export default withAuth(OrganizationNew);
