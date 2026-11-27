import React, { useState, useEffect, useMemo } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Toaster, toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { APP_TOKEN_KEY } from '@/lib/constants';
import { isInsufficientCreditsError, INSUFFICIENT_CREDITS_REDIRECT } from '@/lib/credits';
import { StyleType } from '@/types/app';
import { productById } from '@/config/products';
import { X, Upload, Users, Palette, Settings2 } from 'lucide-react';
import {
  AddRowButton,
  ChoiceChips,
  Field,
  FormActions,
  FormPage,
  FormSection,
  SwatchPicker,
  SwitchRow,
} from '@/components/form/FormKit';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import CoverImageDialog from './components/CoverImageDialog';
import ImageWithSkeleton from '@/components/ImageWithSkeleton';
import { captureError, captureInfo } from '@/lib/posthog-capture';

const CREATE_CARD = gql`
  mutation CreateCard($input: CreateCardInput!) {
    createCard(input: $input) {
      card {
        externalId
        title
      }
      errors
    }
  }
`;

const GET_OCCASIONS = gql`
  query GetOccasions {
    cardOccasions
  }
`;

const GET_STYLES = gql`
  query GetStyles {
    backgroundColorStyles: styles(kind: "background_color") {
      id
      name
      value
    }
    textColorStyles: styles(kind: "text_color") {
      id
      name
      value
    }
    coverStyles: styles(kind: "cover", limit: 4) {
      id
      name
      value
    }
  }
`;

const CardNew: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  // A card started from an organization dashboard belongs to that organization. The
  // server re-checks membership; this only supplies the default context.
  const { activeOrganization } = useOrganization();
  const [searchParams] = useSearchParams();

  const [newCard, setNewCard] = useState({ title: '', recipients: [''] });
  const [creating, setCreating] = useState(false);
  const [coverDialogOpen, setCoverDialogOpen] = useState(false);
  const [signInDialogOpen, setSignInDialogOpen] = useState(false);

  const [coverImage, setCoverImage] = useState<string | Blob | null>(null);
  const [selectedBackgroundColorId, setSelectedBackgroundColorId] = useState<string | null>(null);
  const [selectedTextColorId, setSelectedTextColorId] = useState<string | null>(null);

  // Card settings
  const [maxMessages, setMaxMessages] = useState<number>(20);
  const [requireLoginToContribute, setRequireLoginToContribute] = useState<boolean>(false);
  const [contributorPrompt, setContributorPrompt] = useState<string>('');

  const [createCard] = useMutation(CREATE_CARD);

  const { data: occasionsData } = useQuery(GET_OCCASIONS);
  const occasions = useMemo(() => occasionsData?.cardOccasions || [], [occasionsData]);
  const [occasion, setOccasion] = useState<string | undefined>(undefined);

  // Pre-populate occasion from URL parameter
  useEffect(() => {
    const presetOccasion = searchParams.get('occasion');
    if (presetOccasion && occasions.includes(presetOccasion)) {
      setOccasion(presetOccasion);
    }
  }, [searchParams, occasions]);

  const { data: styleData } = useQuery(GET_STYLES);
  const backgroundColorStyles = useMemo(() => styleData?.backgroundColorStyles || [], [styleData]);
  const textColorStyles = useMemo(() => styleData?.textColorStyles || [], [styleData]);
  const coverStyles = useMemo(() => styleData?.coverStyles || [], [styleData]);

  const isFormValid =
    newCard.title.trim() !== '' && newCard.recipients.some(name => name.trim() !== '');

  const handleCreateCard = async () => {
    if (!isFormValid) return;

    // Check if user is logged in
    if (!user) {
      setSignInDialogOpen(true);
      return;
    }

    const styleIds = [selectedBackgroundColorId, selectedTextColorId].filter(Boolean);
    setCreating(true);

    try {
      if (coverImage instanceof Blob) {
        // Use FormData for file upload, matching handleUpdateCard
        const formData = new FormData();
        formData.append(
          'operations',
          JSON.stringify({
            query: `
              mutation CreateCard($input: CreateCardInput!) {
                createCard(input: $input) {
                  card { externalId title }
                  errors
                }
              }
            `,
            variables: {
              input: {
                title: newCard.title,
                recipients: newCard.recipients,
                styleIds,
                occasion,
                contributorPrompt: contributorPrompt.trim() || null,
                maxMessages,
                requireLoginToContribute,
                coverImageFile: null,
                organizationId: activeOrganization?.id ?? null,
              },
            },
          })
        );
        formData.append('map', JSON.stringify({ '0': ['variables.input.coverImageFile'] }));
        formData.append('0', coverImage, 'cover.jpg');
        const token = localStorage.getItem(APP_TOKEN_KEY);
        const res = await fetch(import.meta.env.VITE_GRAPHQL_ENDPOINT, {
          method: 'POST',
          body: formData,
          credentials: 'include',
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
        });
        const json = await res.json();
        if (json.errors || json.data.createCard.errors.length > 0) {
          const mutationErrors = json.data?.createCard?.errors ?? json.errors ?? [];
          if (isInsufficientCreditsError(mutationErrors)) {
            navigate(INSUFFICIENT_CREDITS_REDIRECT);
            return;
          }
          toast.error(
            'Upload failed: ' +
              (json.errors?.[0]?.message ?? json.data.createCard.errors.join(', '))
          );
          captureError('Card Creation Error', {
            errors: json.errors || json.data.createCard.errors,
          });
        } else {
          setNewCard({ title: '', recipients: [''] });
          setCoverImage(null);
          setContributorPrompt('');
          toast.success('Card created successfully!');
          captureInfo('Card Created', {
            cardTitle: json.data.createCard.card.title,
            cardId: json.data.createCard.card.externalId,
          });
          setTimeout(() => {
            navigate(`/card/${json.data.createCard.card.externalId}/edit`);
          }, 500);
        }
      } else {
        // Use Apollo mutation for URL or no image
        const input: Record<string, unknown> = {
          title: newCard.title,
          recipients: newCard.recipients,
          styleIds,
          occasion,
          contributorPrompt: contributorPrompt.trim() || null,
          maxMessages,
          requireLoginToContribute,
          organizationId: activeOrganization?.id ?? null,
        };
        if (typeof coverImage === 'string' && coverImage) {
          input.coverImageUrl = coverImage;
        }
        const { data } = await createCard({
          variables: { input },
        });
        if (data.createCard.errors.length === 0) {
          setNewCard({ title: '', recipients: [''] });
          setCoverImage(null);
          setContributorPrompt('');
          toast.success('Card created successfully!');
          captureInfo('Card Created', {
            cardTitle: data.createCard.card.title,
            cardId: data.createCard.card.externalId,
          });
          setTimeout(() => {
            navigate(`/card/${data.createCard.card.externalId}/edit`);
          }, 500);
        } else {
          if (isInsufficientCreditsError(data.createCard.errors)) {
            navigate(INSUFFICIENT_CREDITS_REDIRECT);
            return;
          }
          toast.error(data.createCard.errors.join(', ') || 'Failed to create card');
          captureError('Card Creation Error', {
            errors: data.createCard.errors,
          });
        }
      }
    } catch (err) {
      toast.error('An error occurred while creating the card. Please try again.');
      captureError('Unknown Card Creation Error', {
        error: err instanceof Error ? err.message : String(err),
        userId: user?.user_id || 'unknown',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleAddRecipient = () =>
    setNewCard({ ...newCard, recipients: [...newCard.recipients, ''] });

  const handleRemoveRecipient = (index: number) => {
    if (newCard.recipients.length > 1) {
      const updated = newCard.recipients.filter((_, i) => i !== index);
      setNewCard({ ...newCard, recipients: updated });
    }
  };

  const handleRecipientChange = (index: number, value: string) => {
    const updated = [...newCard.recipients];
    updated[index] = value;
    setNewCard({ ...newCard, recipients: updated });
  };

  useEffect(() => {
    if (!selectedBackgroundColorId && backgroundColorStyles.length > 0) {
      setSelectedBackgroundColorId(backgroundColorStyles[0].id);
    }

    if (!selectedTextColorId && textColorStyles.length > 0) {
      setSelectedTextColorId(textColorStyles[0].id);
    }
  }, [backgroundColorStyles, textColorStyles, selectedBackgroundColorId, selectedTextColorId]);

  return (
    <FormPage
      product="group"
      title="Create a group card"
      subtitle="Collect heartfelt messages from everyone who cares."
    >
      <Toaster />

      <FormSection title="Who's it for?" icon={Users}>
        <Field label="Card title" htmlFor="title" required>
          <Input
            id="title"
            placeholder="e.g., Happy Birthday Sarah!"
            value={newCard.title}
            onChange={e => setNewCard({ ...newCard, title: e.target.value })}
          />
        </Field>

        <Field label="Recipients" hint="Who is this card for?" required>
          <div className="space-y-2">
            {newCard.recipients.map((recipient, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  aria-label={`Recipient ${i + 1}`}
                  placeholder="Recipient name (e.g. John Doe)"
                  value={recipient}
                  onChange={e => handleRecipientChange(i, e.target.value)}
                />
                {newCard.recipients.length > 1 && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => handleRemoveRecipient(i)}
                    aria-label={`Remove recipient ${i + 1}`}
                  >
                    <X />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <AddRowButton onClick={handleAddRecipient}>Add another recipient</AddRowButton>
        </Field>

        <Field label="Occasion" optional>
          <Select value={occasion} onValueChange={setOccasion}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Pick one" />
            </SelectTrigger>
            <SelectContent>
              {occasions.map((occasion: string) => (
                <SelectItem key={occasion} value={occasion}>
                  {occasion}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </FormSection>

      {/* The background is the first thing anyone sees when the card opens, so it sits
          near the top rather than buried at the bottom of the form. */}
      <FormSection
        title="Make it beautiful"
        icon={Palette}
        description="The background image is the first thing people see when they open your card."
      >
        {coverImage ? (
          <div className="space-y-3">
            <div className="relative w-full">
              <img
                src={coverImage instanceof Blob ? URL.createObjectURL(coverImage) : coverImage}
                alt="Selected background"
                className="h-64 w-full rounded-xl border-2 border-ink object-cover"
              />
              <Button
                type="button"
                size="icon"
                tone="paper"
                className="absolute top-3 right-3"
                onClick={() => setCoverImage(null)}
                aria-label="Remove background image"
              >
                <X />
              </Button>
            </div>
            <Button type="button" variant="outline" onClick={() => setCoverDialogOpen(true)}>
              Choose a different one
            </Button>
          </div>
        ) : (
          <Field label="Background">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {coverStyles.map((style: StyleType, i: number) => (
                <ImageWithSkeleton
                  key={style.id}
                  src={style.value}
                  // Style names are raw upload filenames, useless to a screen reader.
                  alt={`Background option ${i + 1}`}
                  className="aspect-[4/3] cursor-pointer overflow-hidden rounded-lg border-2 border-ink transition-transform hover:-translate-y-0.5"
                  onClick={() => setCoverImage(style.value)}
                />
              ))}
              <button
                type="button"
                onClick={() => setCoverDialogOpen(true)}
                className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-lg border-2 border-ink bg-brand-pink-soft text-[#1d1b2f] transition-transform hover:-translate-y-0.5"
              >
                <Upload className="size-5" />
                <span className="text-xs font-semibold">Use your own</span>
              </button>
            </div>
          </Field>
        )}

        <CoverImageDialog
          open={coverDialogOpen}
          onOpenChange={setCoverDialogOpen}
          onSelectCover={cover => {
            setCoverImage(cover);
            setCoverDialogOpen(false);
          }}
        />

        <Field label="Background color">
          <SwatchPicker
            ariaLabel="Background color"
            swatches={backgroundColorStyles}
            selectedId={selectedBackgroundColorId}
            onSelect={setSelectedBackgroundColorId}
          />
        </Field>

        <Field label="Text color">
          <SwatchPicker
            ariaLabel="Text color"
            swatches={textColorStyles}
            selectedId={selectedTextColorId}
            onSelect={setSelectedTextColorId}
          />
        </Field>
      </FormSection>

      <FormSection title="Settings" icon={Settings2}>
        <Field label="Maximum messages" hint="The most messages this card can receive.">
          <ChoiceChips
            ariaLabel="Maximum messages"
            options={[20, 50, 100, 500, 1000].map(value => ({ value, label: value }))}
            value={maxMessages}
            onChange={setMaxMessages}
          />
        </Field>

        <SwitchRow
          id="requireLoginToContribute"
          label="Require sign-in to contribute"
          description="Only signed-in people can leave messages on this card."
          checked={requireLoginToContribute}
          onCheckedChange={setRequireLoginToContribute}
        />

        <Field
          label="Prompt for contributors"
          htmlFor="contributorPrompt"
          optional
          hint="Give people some context or a question to guide what they write. Shown above the message box."
        >
          <Textarea
            id="contributorPrompt"
            value={contributorPrompt}
            onChange={e => setContributorPrompt(e.target.value.slice(0, 500))}
            placeholder="e.g., It's Sarah's first day at her first job — what career advice would you give her?"
            className="resize-none"
            rows={3}
          />
          <p className="text-right text-xs text-muted-foreground">{contributorPrompt.length}/500</p>
        </Field>
      </FormSection>

      <FormActions>
        <Button type="button" variant="ghost" size="lg" onClick={() => navigate('/')}>
          Cancel
        </Button>
        <Button
          onClick={handleCreateCard}
          disabled={!isFormValid || creating}
          tone={productById.group.tone}
          size="lg"
        >
          {creating ? 'Creating…' : 'Create card'}
        </Button>
      </FormActions>

      <Dialog open={signInDialogOpen} onOpenChange={setSignInDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign in required</DialogTitle>
            <DialogDescription>You need to sign in to create a card.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setSignInDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                const currentUrl = window.location.pathname + window.location.search;
                window.location.href = `/sign_in?redirect=${encodeURIComponent(currentUrl)}`;
              }}
              className="w-full sm:w-auto"
            >
              Sign in
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FormPage>
  );
};

export default CardNew;
