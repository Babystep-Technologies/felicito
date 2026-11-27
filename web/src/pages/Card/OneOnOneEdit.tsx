import React, { useEffect, useMemo, useState } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { useNavigate, useParams } from 'react-router-dom';
import { Heart, Upload, X } from 'lucide-react';
import { Toaster, toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Field, FormActions, FormPage, FormSection, SwatchPicker } from '@/components/form/FormKit';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import LoadingScreen from '@/components/Loading';
import ErrorScreen from '@/components/Error';
import CardNotFound from './components/CardNotFound';
import { useAuth } from '@/contexts/AuthContext';
import { captureError, captureInfo } from '@/lib/posthog-capture';
import { uploadGraphQLMutation } from '@/lib/graphql-upload';
import { isEffectSlug, type EffectSlug } from '@/components/effects';
import { StyleType } from '@/types/app';
import CoverImageDialog from './components/CoverImageDialog';
import CardPreview from './components/CardPreview';
import EffectPicker from './components/EffectPicker';
import { productById } from '@/config/products';

const GET_CARD = gql`
  query OneOnOneEditCard($cardId: ID!) {
    card(cardId: $cardId) {
      title
      kind
      occasion
      recipients
      coverImageUrl
      user {
        id
      }
      styles {
        id
        kind
        value
      }
      messages {
        id
        text
        displayName
        user {
          id
        }
      }
    }
  }
`;

const UPDATE_CARD_DOCUMENT = `
  mutation UpdateCard($input: UpdateCardInput!) {
    updateCard(input: $input) {
      success
      errors
    }
  }
`;

const UPDATE_CARD = gql`
  ${UPDATE_CARD_DOCUMENT}
`;

const UPSERT_MESSAGE = gql`
  mutation UpsertMessage($input: UpsertMessageInput!) {
    upsertMessage(input: $input) {
      success
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
    backgroundColorStyles: styles(kind: "background_color", limit: 20) {
      id
      name
      value
    }
    textColorStyles: styles(kind: "text_color", limit: 20) {
      id
      name
      value
    }
    effectStyles: styles(kind: "effect", limit: 20) {
      id
      name
      value
    }
  }
`;

const CardOneOnOneEdit: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: userLoading } = useAuth();
  const { cardExternalId } = useParams<{ cardExternalId: string }>();

  const [title, setTitle] = useState('');
  const [recipient, setRecipient] = useState('');
  const [text, setText] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [occasion, setOccasion] = useState<string | undefined>(undefined);

  const [coverImage, setCoverImage] = useState<string | Blob | null>(null);
  const [coverDialogOpen, setCoverDialogOpen] = useState(false);

  const [selectedBackgroundColorId, setSelectedBackgroundColorId] = useState<string | null>(null);
  const [selectedTextColorId, setSelectedTextColorId] = useState<string | null>(null);
  const [selectedEffectId, setSelectedEffectId] = useState<string | null>(null);

  // The card's own style values, used as a preview fallback when a style is not
  // among the pickable options (e.g. a custom colour).
  const [cardBackgroundColor, setCardBackgroundColor] = useState<string | null>(null);
  const [cardTextColor, setCardTextColor] = useState<string | null>(null);
  const [cardEffect, setCardEffect] = useState<EffectSlug | null>(null);

  const [saving, setSaving] = useState(false);
  const [prefilled, setPrefilled] = useState(false);

  const [updateCard] = useMutation(UPDATE_CARD);
  const [upsertMessage] = useMutation(UPSERT_MESSAGE);

  const {
    data: cardResult,
    loading: cardLoading,
    error: cardError,
  } = useQuery(GET_CARD, {
    variables: { cardId: cardExternalId },
    fetchPolicy: 'network-only',
  });
  const card = cardResult?.card;

  const { data: occasionsData } = useQuery(GET_OCCASIONS);
  const occasions = useMemo(() => occasionsData?.cardOccasions || [], [occasionsData]);

  const { data: styleData } = useQuery(GET_STYLES);
  const backgroundColorStyles = useMemo(() => styleData?.backgroundColorStyles || [], [styleData]);
  const textColorStyles = useMemo(() => styleData?.textColorStyles || [], [styleData]);
  const effectStyles = useMemo(() => styleData?.effectStyles || [], [styleData]);

  const findValue = (styles: StyleType[], id: string | null) =>
    styles.find((style: StyleType) => style.id === id)?.value;

  const backgroundColor =
    findValue(backgroundColorStyles, selectedBackgroundColorId) || cardBackgroundColor || '#FDFCF9';
  const textColor = findValue(textColorStyles, selectedTextColorId) || cardTextColor || '#1E293B';
  const effectValue = findValue(effectStyles, selectedEffectId);
  const effect: EffectSlug | null = isEffectSlug(effectValue) ? effectValue : cardEffect;

  const isFormValid = title.trim() !== '' && recipient.trim() !== '' && text.trim() !== '';

  const isCreator =
    user?.user_id && card?.user?.id && String(user.user_id) === String(card.user.id);

  // Seed the form from the loaded card exactly once, so later edits are not
  // clobbered by a refetch.
  useEffect(() => {
    if (prefilled || !card) return;

    const styleId = (kind: string) =>
      card.styles?.find((s: StyleType) => s.kind === kind)?.id ?? null;
    const styleVal = (kind: string) =>
      card.styles?.find((s: StyleType) => s.kind === kind)?.value ?? null;

    setTitle(card.title ?? '');
    setRecipient(card.recipients?.[0] ?? '');
    setOccasion(card.occasion ?? undefined);
    setCoverImage(card.coverImageUrl ?? null);

    setSelectedBackgroundColorId(styleId('background_color'));
    setSelectedTextColorId(styleId('text_color'));
    setSelectedEffectId(styleId('effect'));
    setCardBackgroundColor(styleVal('background_color'));
    setCardTextColor(styleVal('text_color'));
    const eff = styleVal('effect');
    setCardEffect(isEffectSlug(eff) ? eff : null);

    const message = card.messages?.[0];
    setText(message?.text ?? '');
    setDisplayName(message?.displayName ?? user?.name ?? '');

    setPrefilled(true);
  }, [card, prefilled, user]);

  const handleSave = async () => {
    if (!isFormValid || !cardExternalId) return;
    setSaving(true);

    const styleIds = [selectedBackgroundColorId, selectedTextColorId, selectedEffectId].filter(
      Boolean
    );

    try {
      // 1. Card-level fields (title, recipient, styles, occasion, cover image).
      let cardErrors: string[] = [];
      if (coverImage instanceof Blob) {
        const json = await uploadGraphQLMutation<{
          updateCard: { success: boolean; errors: string[] };
        }>({
          query: UPDATE_CARD_DOCUMENT,
          input: {
            cardId: cardExternalId,
            title,
            recipients: [recipient],
            styleIds,
            occasion,
            coverImageFile: null,
          },
          filePath: 'variables.input.coverImageFile',
          file: coverImage,
          filename: 'cover.jpg',
        });
        cardErrors = json.errors?.map(e => e.message) ?? json.data?.updateCard.errors ?? [];
      } else {
        const input: Record<string, unknown> = {
          cardId: cardExternalId,
          title,
          recipients: [recipient],
          styleIds,
          occasion,
        };
        if (typeof coverImage === 'string' && coverImage) input.coverImageUrl = coverImage;
        const { data } = await updateCard({ variables: { input } });
        cardErrors = data.updateCard.errors;
      }

      if (cardErrors.length > 0) {
        toast.error(cardErrors.join(', ') || 'Failed to save card');
        captureError('One-on-One Card Update Error', { errors: cardErrors.join(', ') });
        return;
      }

      // 2. The single message body and signature.
      const { data: messageData } = await upsertMessage({
        variables: {
          input: {
            cardId: cardExternalId,
            userId: user?.user_id,
            text,
            displayName: displayName.trim() || undefined,
          },
        },
      });

      const messageErrors: string[] = messageData.upsertMessage.errors;
      if (messageErrors.length > 0) {
        toast.error(messageErrors.join(', ') || 'Failed to save message');
        captureError('One-on-One Message Update Error', { errors: messageErrors.join(', ') });
        return;
      }

      captureInfo('One-on-One Card Updated', { cardId: cardExternalId });
      toast.success('Card saved');
      navigate(`/card/${cardExternalId}/viewable`);
    } catch (err) {
      toast.error('An error occurred while saving. Please try again.');
      captureError('Unknown One-on-One Card Update Error', {
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSaving(false);
    }
  };

  if (cardLoading || userLoading) return <LoadingScreen />;
  if (cardError) return <ErrorScreen />;
  if (!card) return <CardNotFound />;

  if (!isCreator) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <h1 className="mb-3 text-2xl font-semibold">You can&apos;t edit this card</h1>
        <p className="mb-6 text-muted-foreground">
          Only the person who created it can make changes.
        </p>
        <Button onClick={() => navigate(`/card/${cardExternalId}/viewable`)}>View the card</Button>
      </div>
    );
  }

  return (
    <FormPage
      product="one_on_one"
      title="Edit your 1-on-1 card"
      subtitle="Update the design and message, then save."
      aside={
        <div>
          <p className="mb-3 text-center text-sm font-semibold text-muted-foreground">
            Live preview
          </p>
          <CardPreview
            title={title}
            recipient={recipient}
            text={text}
            displayName={displayName}
            coverImage={coverImage}
            backgroundColor={backgroundColor}
            textColor={textColor}
            effect={effect}
          />
          <Button
            variant="outline"
            onClick={() => navigate(`/card/${cardExternalId}/viewable`)}
            className="mt-4 w-full"
          >
            <Heart />
            View the card
          </Button>
        </div>
      }
    >
      <Toaster />

      <FormSection step={1} title="Design">
        <Field label="Cover image" optional>
          {coverImage ? (
            <div className="relative w-full">
              <img
                src={coverImage instanceof Blob ? URL.createObjectURL(coverImage) : coverImage}
                alt="Selected cover"
                className="h-40 w-full rounded-xl border-2 border-ink object-cover"
              />
              <Button
                type="button"
                size="icon"
                tone="paper"
                className="absolute top-3 right-3"
                onClick={() => setCoverImage(null)}
                aria-label="Remove cover image"
              >
                <X />
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCoverDialogOpen(true)}
              className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-ink bg-brand-blue-soft text-[#1d1b2f] transition-transform hover:-translate-y-0.5"
            >
              <Upload className="size-6" />
              <span className="text-sm font-semibold">Add a cover image</span>
            </button>
          )}
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

        <Field label="Effect" hint="Plays when they open the card. Tap again to turn it off.">
          <EffectPicker
            styles={effectStyles}
            selectedId={selectedEffectId}
            onSelect={setSelectedEffectId}
          />
        </Field>
      </FormSection>

      <FormSection step={2} title="Message">
        <Field label="To" htmlFor="recipient" required>
          <Input
            id="recipient"
            placeholder="e.g., Sarah"
            value={recipient}
            onChange={e => setRecipient(e.target.value)}
          />
        </Field>

        <Field label="Occasion" optional>
          <Select value={occasion} onValueChange={setOccasion}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Pick one" />
            </SelectTrigger>
            <SelectContent>
              {occasions.map((name: string) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Card title" htmlFor="title" required>
          <Input
            id="title"
            placeholder="e.g., Happy Birthday Sarah!"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </Field>

        <Field label="Your message" htmlFor="text" required>
          <Textarea
            id="text"
            placeholder="Write something heartfelt…"
            value={text}
            onChange={e => setText(e.target.value)}
            rows={6}
          />
        </Field>

        <Field label="From" htmlFor="displayName" optional>
          <Input
            id="displayName"
            placeholder="How you want to be signed"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
          />
        </Field>
      </FormSection>

      <FormActions>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={() => navigate(`/card/${cardExternalId}/viewable`)}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!isFormValid || saving}
          tone={productById.one_on_one.tone}
          size="lg"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </FormActions>

      <CoverImageDialog
        open={coverDialogOpen}
        onOpenChange={setCoverDialogOpen}
        onSelectCover={cover => {
          setCoverImage(cover);
          setCoverDialogOpen(false);
        }}
      />
    </FormPage>
  );
};

export default CardOneOnOneEdit;
