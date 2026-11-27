import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Toaster, toast } from 'sonner';
import { StyleType } from '@/types/app';
import {
  X,
  Loader2,
  Users,
  Palette,
  Settings2,
  Upload,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  AddRowButton,
  ChoiceChips,
  Field,
  FormActions,
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
import CoverImageDialog from './CoverImageDialog';
import { useMutation, useLazyQuery, useQuery, gql } from '@apollo/client';

interface EditCardSettingsViewProps {
  cardTitle: string;
  setCardTitle: (val: string) => void;
  occasion: string | undefined;
  occasions: string[];
  setOccasion: (val: string) => void;
  contributorPrompt: string;
  setContributorPrompt: (val: string) => void;
  recipients: string[];
  handleRecipientChange: (index: number, value: string) => void;
  handleRemoveRecipient: (index: number) => void;
  handleAddRecipient: () => void;
  backgroundColorStyles: StyleType[];
  selectedBackgroundColorId: string | null;
  setSelectedBackgroundColorId: (id: string) => void;
  textColorStyles: StyleType[];
  selectedTextColorId: string | null;
  setSelectedTextColorId: (id: string) => void;
  handleUpdateCard: () => Promise<void>;
  setEditingSettings: (val: boolean) => void;
  coverImage: string | Blob | null;
  setCoverImage: (img: string | Blob | null) => void;
  cardId: string;
  refetchCard: () => void;
  maxMessages: number;
  setMaxMessages: (val: number) => void;
  requireLoginToContribute: boolean;
  setRequireLoginToContribute: (val: boolean) => void;
  slug: string;
  setSlug: (val: string) => void;
  registryExternalId: string;
  setRegistryExternalId: (val: string) => void;
}

const GET_MY_REGISTRIES = gql`
  query MyRegistries {
    myRegistries {
      externalId
      title
    }
  }
`;

const REMOVE_CARD_COVER_IMAGE = gql`
  mutation RemoveCardCoverImage($input: RemoveCardCoverImageInput!) {
    removeCardCoverImage(input: $input) {
      success
      errors
    }
  }
`;

const CHECK_SLUG_AVAILABILITY = gql`
  query CheckSlugAvailability($slug: String!, $type: String!, $currentId: String) {
    checkSlugAvailability(slug: $slug, type: $type, currentId: $currentId)
  }
`;

const EditCardSettings: React.FC<EditCardSettingsViewProps & { cardId: string }> = ({
  cardTitle,
  setCardTitle,
  occasion,
  occasions,
  setOccasion,
  contributorPrompt,
  setContributorPrompt,
  recipients,
  handleRecipientChange,
  handleRemoveRecipient,
  handleAddRecipient,
  backgroundColorStyles,
  selectedBackgroundColorId,
  setSelectedBackgroundColorId,
  textColorStyles,
  selectedTextColorId,
  setSelectedTextColorId,
  handleUpdateCard,
  setEditingSettings,
  coverImage,
  setCoverImage,
  cardId,
  refetchCard,
  maxMessages,
  setMaxMessages,
  requireLoginToContribute,
  setRequireLoginToContribute,
  slug,
  setSlug,
  registryExternalId,
  setRegistryExternalId,
}) => {
  const { data: registriesData } = useQuery(GET_MY_REGISTRIES);
  const registries: { externalId: string; title: string }[] = registriesData?.myRegistries ?? [];
  const [coverDialogOpen, setCoverDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugValid, setSlugValid] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const initialSlugRef = useRef(slug);

  const [removeCardCoverImage] = useMutation(REMOVE_CARD_COVER_IMAGE);
  const [checkSlugAvailability] = useLazyQuery(CHECK_SLUG_AVAILABILITY);

  // Check slug availability with debounce
  useEffect(() => {
    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Reset states
    setSlugError(null);
    setSlugValid(false);

    // Don't check if slug is empty or same as initial
    if (!slug || slug === initialSlugRef.current) {
      setSlugChecking(false);
      return;
    }

    // Validate slug format
    if (slug.length < 3) {
      setSlugError('URL must be at least 3 characters');
      return;
    }

    setSlugChecking(true);

    // Debounce the API call
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await checkSlugAvailability({
          variables: { slug, type: 'card', currentId: cardId },
        });

        if (data?.checkSlugAvailability) {
          setSlugValid(true);
          setSlugError(null);
        } else {
          setSlugError('This URL is already taken');
          setSlugValid(false);
        }
      } catch {
        setSlugError('Failed to check availability');
      } finally {
        setSlugChecking(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [slug, cardId, checkSlugAvailability]);

  const handleUpdateCardWithCover = async () => {
    setSaving(true);
    await handleUpdateCard(); // No argument, let parent handle mutation input
    setSaving(false);
  };

  const handleRemoveCoverImage = async () => {
    try {
      setCoverImage(null);
      const { data } = await removeCardCoverImage({ variables: { input: { cardId } } });
      if (data?.removeCardCoverImage?.success) {
        toast.success('Cover image removed successfully');
        refetchCard();
      } else {
        // Optionally show error toast
      }
    } catch {
      // Optionally show error toast
    }
  };

  return (
    <>
      <Toaster />

      <FormSection title="Who's it for?" icon={Users}>
        <Field label="Card title" htmlFor="title" required>
          <Input
            id="title"
            type="text"
            placeholder="e.g., Happy Birthday Sarah!"
            value={cardTitle}
            onChange={e => setCardTitle(e.target.value)}
          />
        </Field>

        <Field label="Recipients" hint="Who is this card for?" required>
          <div className="space-y-2">
            {recipients.map((recipient, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  aria-label={`Recipient ${index + 1}`}
                  placeholder="Recipient name (e.g. John Doe)"
                  value={recipient}
                  onChange={e => handleRecipientChange(index, e.target.value)}
                />
                {recipients.length > 1 && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => handleRemoveRecipient(index)}
                    aria-label={`Remove recipient ${index + 1}`}
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
              {occasions.map(occasion => (
                <SelectItem key={occasion} value={occasion}>
                  {occasion}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </FormSection>

      <FormSection title="Make it beautiful" icon={Palette}>
        <Field label="Cover image" optional>
          {coverImage ? (
            <div className="relative w-full">
              <img
                src={coverImage instanceof Blob ? URL.createObjectURL(coverImage) : coverImage}
                alt="Selected cover"
                className="h-64 w-full rounded-xl border-2 border-ink object-cover"
              />
              <Button
                type="button"
                size="icon"
                tone="paper"
                className="absolute top-3 right-3"
                onClick={handleRemoveCoverImage}
                aria-label="Remove cover image"
              >
                <X />
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCoverDialogOpen(true)}
              className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-ink bg-brand-pink-soft text-[#1d1b2f] transition-transform hover:-translate-y-0.5"
            >
              <Upload className="size-6" />
              <span className="text-sm font-semibold">Add a cover image</span>
            </button>
          )}
          <CoverImageDialog
            open={coverDialogOpen}
            onOpenChange={setCoverDialogOpen}
            onSelectCover={cover => {
              setCoverImage(cover);
              setCoverDialogOpen(false);
            }}
          />
        </Field>

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

        {registries.length > 0 && (
          <Field
            label="Link a registry"
            optional
            hint="People who open this card get a link to the registry. It only shows while the registry is shared."
          >
            <Select
              value={registryExternalId || 'none'}
              onValueChange={val => setRegistryExternalId(val === 'none' ? '' : val)}
            >
              <SelectTrigger className="w-full sm:w-72">
                <SelectValue placeholder="No registry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No registry</SelectItem>
                {registries.map(r => (
                  <SelectItem key={r.externalId} value={r.externalId}>
                    {r.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}

        <Field
          label="Custom URL"
          htmlFor="slug"
          optional
          hint='Create a memorable link for sharing (e.g., "sarahs-birthday").'
        >
          <div className="flex items-center gap-2">
            <span className="text-sm whitespace-nowrap text-muted-foreground">
              felicito.app/p/card/
            </span>
            <div className="relative flex-1">
              <Input
                id="slug"
                type="text"
                placeholder="custom-url-name"
                value={slug}
                onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                aria-invalid={!!slugError || undefined}
                className="pr-10"
              />
              {slugChecking && (
                <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
              {!slugChecking && slugError && (
                <AlertCircle className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-destructive" />
              )}
              {!slugChecking && slugValid && (
                <CheckCircle2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-brand-green" />
              )}
            </div>
          </div>
          {slugError ? (
            <p className="text-xs text-destructive">{slugError}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Only lowercase letters, numbers, and hyphens allowed.
            </p>
          )}
        </Field>
      </FormSection>

      <FormActions>
        <Button type="button" variant="ghost" size="lg" onClick={() => setEditingSettings(false)}>
          Cancel
        </Button>
        <Button
          onClick={handleUpdateCardWithCover}
          disabled={saving || !!slugError || slugChecking}
          tone="pink"
          size="lg"
        >
          {saving && <Loader2 className="animate-spin" />}
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </FormActions>
    </>
  );
};

export default EditCardSettings;
