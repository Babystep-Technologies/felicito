'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye, PenLine, Settings2 } from 'lucide-react';
import { Field, FormActions, FormPage, FormSection } from '@/components/form/FormKit';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { gql, useQuery, useMutation } from '@apollo/client';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoadingScreen from '@/components/Loading';
import ErrorScreen from '@/components/Error';
import getCroppedImg from '@/lib/crop-image';
import { Toaster, toast } from 'sonner';
import { StyleType, UserMessageType, GuestMessageType } from '@/types/app';
import { Area } from 'react-easy-crop';
import GuestEntry from './components/GuestEntry';
import MessageImageField from './components/MessageImageField';
import EditCardSettings from './components/EditCardSettings';
import CardOneOnOneEdit from './OneOnOneEdit';
import { APP_TOKEN_KEY } from '@/lib/constants';
import { getGuestMessageIdKey } from '@/lib/utils';
import { productById } from '@/config/products';

const GET_CARD_KIND = gql`
  query CardKind($cardId: ID!) {
    card(cardId: $cardId) {
      kind
    }
  }
`;

const GET_CARD = gql`
  query Card($cardId: ID!) {
    card(cardId: $cardId) {
      title
      slug
      user {
        id
      }
      occasion
      contributorPrompt
      registry {
        externalId
      }
      recipients
      maxMessages
      requireLoginToContribute
      styles {
        id
        kind
        value
      }
      coverImageUrl
      messages {
        id
        title
        text
        imageUrl
        displayName
        user {
          id
        }
      }
      guestMessages {
        id
        name
        title
        text
        imageUrl
      }
    }
  }
`;

const UPDATE_CARD = gql`
  mutation UpdateCard($input: UpdateCardInput!) {
    updateCard(input: $input) {
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
  }
`;

interface CardInput {
  cardId: string | undefined;
  title: string;
  text?: string;
  file?: File;
  imageUrl?: string | null;
  userId?: string;
  guestName?: string;
  displayName?: string;
}

function PageEdit() {
  const { user, loading: userLoading } = useAuth();
  const [guestName, setGuestName] = useState<string | null>(null);
  const { cardExternalId } = useParams();
  const guestMessageIdKey = getGuestMessageIdKey(cardExternalId!);
  const guestMessageId = localStorage.getItem(guestMessageIdKey);
  const {
    data,
    loading: cardLoading,
    error: cardError,
    refetch,
  } = useQuery(GET_CARD, {
    variables: { cardId: cardExternalId },
    // Load card context (title, styles, contributor prompt) once we know who is
    // writing — a logged-in user, a returning guest, or a guest who just entered
    // their name — so the creator's prompt can guide first-time contributors too.
    skip: !user && !guestMessageId && !guestName,
  });

  const { data: occasionsData } = useQuery(GET_OCCASIONS);
  const occasions = occasionsData?.cardOccasions || [];
  const { data: styleData } = useQuery(GET_STYLES);
  const backgroundColorStyles = styleData?.backgroundColorStyles || [];
  const textColorStyles = styleData?.textColorStyles || [];
  const navigate = useNavigate();
  const [updateCard] = useMutation(UPDATE_CARD);

  const cardData = data?.card;
  const isCreator = String(cardData?.user.id) === String(user?.user_id);
  const [submitting, setSubmitting] = useState(false);

  const [cardTitle, setCardTitle] = useState('');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [occasion, setOccasion] = useState<string | undefined>(undefined);
  const [contributorPrompt, setContributorPrompt] = useState('');
  const [messageTitle, setMessageTitle] = useState('');
  const [titleError, setTitleError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [textError, setTextError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [editingSettings, setEditingSettings] = useState(false);

  // image
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [uploadError, setUploadError] = useState('');

  // card styles
  const backgroundColorStyle = cardData?.styles.find(
    (style: StyleType) => style.kind === 'background_color'
  );
  const textColorStyle = cardData?.styles.find((style: StyleType) => style.kind === 'text_color');
  const [selectedBackgroundColorId, setSelectedBackgroundColorId] = useState<string | null>(null);
  const [selectedTextColorId, setSelectedTextColorId] = useState<string | null>(null);

  // Add state for cover image for settings
  const [coverImage, setCoverImage] = useState<string | Blob | null>(null);

  // Card settings
  const [maxMessages, setMaxMessages] = useState<number>(20);
  const [requireLoginToContribute, setRequireLoginToContribute] = useState<boolean>(false);
  const [slug, setSlug] = useState<string>('');
  // '' means no registry linked; sent as-is so saving clears a previously linked one.
  const [registryExternalId, setRegistryExternalId] = useState<string>('');

  // Scroll to top on component mount (especially useful for mobile)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Scroll to top when exiting edit settings mode
  useEffect(() => {
    if (!editingSettings) {
      window.scrollTo(0, 0);
    }
  }, [editingSettings]);

  const validations = { minLength: 10, maxLength: 5000, maxTitleLength: 100 };
  const validateText = useCallback(
    (value: string): string | null => {
      if (value.length < validations.minLength)
        return `Message is too short (minimum ${validations.minLength} characters required)`;
      if (value.length > validations.maxLength)
        return `Message is too long (maximum ${validations.maxLength} characters allowed)`;
      return null;
    },
    [validations.minLength, validations.maxLength]
  );

  const validateTitle = useCallback(
    // A 1-on-1 card's message carries no title, so this can be null.
    (title: string | null | undefined): string | null => {
      // Remove required check:
      if ((title?.length ?? 0) > validations.maxTitleLength)
        return `Message title is too long (maximum ${validations.maxTitleLength} characters allowed)`;
      return null;
    },
    [validations.maxTitleLength]
  );

  useEffect(() => {
    if (cardData) {
      const userMessage = cardData?.messages.find(
        (msg: UserMessageType) => String(msg.user.id) === String(user?.user_id)
      );
      const guestMessage = cardData?.guestMessages?.find(
        (msg: GuestMessageType) => String(msg.id) === String(guestMessageId)
      );
      setSelectedBackgroundColorId(backgroundColorStyle?.id || null);
      setSelectedTextColorId(textColorStyle?.id || null);
      setCardTitle(cardData.title);
      setRecipients(cardData.recipients);
      setContributorPrompt(cardData.contributorPrompt || '');
      setMaxMessages(cardData.maxMessages || 20);
      setRequireLoginToContribute(cardData.requireLoginToContribute || false);
      setSlug(cardData.slug || '');
      setRegistryExternalId(cardData.registry?.externalId || '');
      if (userMessage) {
        setMessageTitle(userMessage.title ?? '');
        setText(userMessage.text);
        setDisplayName(userMessage.displayName || user?.name || '');
        setImageUrl(userMessage.imageUrl || null);
        setImagePreview(userMessage.imageUrl || null);
        setTitleError(validateTitle(userMessage.title));
        setTextError(validateText(userMessage.text));
      } else if (guestMessage) {
        setMessageTitle(guestMessage.title ?? '');
        setText(guestMessage.text ?? '');
        setGuestName(guestMessage.name);
        setImageUrl(guestMessage.imageUrl || null);
        setImagePreview(guestMessage.imageUrl || null);
        setTitleError(validateTitle(guestMessage.title));
        setTextError(validateText(guestMessage.text));
      } else {
        // Set default display name for new messages
        if (user) {
          setDisplayName(user.name || '');
        }
        setTitleError(validateTitle(''));
        setTextError(validateText(''));
      }
      // Always sync coverImage with cardData.coverImageUrl
      setCoverImage(cardData.coverImageUrl ?? null);
    }
  }, [
    cardData,
    validateText,
    validateTitle,
    guestMessageId,
    user,
    backgroundColorStyle?.id,
    textColorStyle?.id,
  ]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setText(value);
    setTextError(validateText(value));
  };

  const handleMessageTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessageTitle(value);
    setTitleError(validateTitle(value));
  };

  const isCardMessageValid =
    !textError &&
    text.length >= validations.minLength &&
    text.length <= validations.maxLength &&
    !titleError &&
    messageTitle.length <= validations.maxTitleLength;

  // Update handleUpdateCard to handle file upload via FormData if coverImage is a Blob
  const handleUpdateCard = async () => {
    const selectedStyleIds = [selectedBackgroundColorId, selectedTextColorId].filter(Boolean);

    if (coverImage instanceof Blob) {
      // Use FormData upload (like CreateCoverStyleSheet)
      const formData = new FormData();
      formData.append(
        'operations',
        JSON.stringify({
          query: `
            mutation UpdateCard($input: UpdateCardInput!) {
              updateCard(input: $input) {
                success
                errors
              }
            }
          `,
          variables: {
            input: {
              cardId: cardExternalId,
              title: cardTitle,
              recipients,
              styleIds: selectedStyleIds,
              occasion,
              contributorPrompt: contributorPrompt.trim(),
              maxMessages,
              requireLoginToContribute,
              slug: slug.trim() || null,
              registryExternalId,
              coverImageFile: null,
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
      if (json.errors || json.data.updateCard.errors.length > 0) {
        toast.error(
          'Upload failed: ' + (json.errors?.[0]?.message ?? json.data.updateCard.errors.join(', '))
        );
        return;
      }
    } else {
      // Use Apollo mutation for URL
      const input: Record<string, unknown> = {
        cardId: cardExternalId,
        title: cardTitle,
        recipients,
        styleIds: selectedStyleIds,
        occasion,
        contributorPrompt: contributorPrompt.trim(),
        maxMessages,
        requireLoginToContribute,
        slug: slug.trim() || null,
        registryExternalId,
      };
      if (typeof coverImage === 'string' && coverImage) {
        input.coverImageUrl = coverImage;
      }
      await updateCard({
        variables: { input },
      });
    }
    setEditingSettings(false);
    refetch();
  };

  const handleUpsertMessage = async () => {
    if (!isCardMessageValid) return;
    setSubmitting(true);

    try {
      let fileToUpload = null;

      if (imageFile && imagePreview && croppedAreaPixels) {
        const croppedBlob = await getCroppedImg(imagePreview, croppedAreaPixels);
        fileToUpload = new File([croppedBlob], imageFile.name, { type: 'image/jpeg' });
      }

      const input: CardInput = {
        cardId: cardExternalId,
        title: messageTitle,
        text,
        file: undefined, // placeholder for file
        imageUrl: !fileToUpload ? imageUrl : null,
      };

      if (user) {
        input.userId = user.user_id;
        input.displayName = displayName;
      } else if (guestName) {
        input.guestName = guestName;
      }

      const formData = new FormData();

      formData.append(
        'operations',
        JSON.stringify({
          operationName: 'UpsertMessage',
          query: `
            mutation UpsertMessage($input: UpsertMessageInput!) {
              upsertMessage(input: $input) {
                success
                errors
                messageId
              }
            }
          `,
          variables: { input },
        })
      );

      formData.append('map', JSON.stringify({ '0': ['variables.input.file'] }));

      if (fileToUpload) {
        formData.append('0', fileToUpload);
      }

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

      if (json.errors || json.data.upsertMessage.errors.length > 0) {
        toast.error(
          'Upload failed: ' +
            (json.errors?.[0]?.message ?? json.data.upsertMessage.errors.join(', '))
        );
        return;
      } else {
        if (!user && json.data.upsertMessage.messageId) {
          localStorage.setItem(guestMessageIdKey, json.data.upsertMessage.messageId);
        }

        toast.success('Message updated successfully');
        navigate(`/card/${cardExternalId}/viewable`);
      }
    } catch (error) {
      console.error(error);
      toast.error('Unexpected error uploading message');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveRecipient = (index: number) => {
    if (recipients.length > 1) {
      const updatedRecipients = recipients.filter((_, i) => i !== index);
      setRecipients(updatedRecipients);
    }
  };

  const handleAddRecipient = () => {
    setRecipients([...recipients, '']);
  };

  const handleRecipientChange = (index: number, value: string) => {
    const updatedRecipients = [...recipients];
    updatedRecipients[index] = value;
    setRecipients(updatedRecipients);
  };

  if (cardLoading || userLoading) return <LoadingScreen />;
  if (cardError) {
    console.log(cardError);
    return <ErrorScreen />;
  }

  // Check if login is required to contribute and user is not logged in and not creator
  if (cardData?.requireLoginToContribute && !user && !isCreator) {
    // Redirect to login with redirect back to edit page
    window.location.href = `/sign_in?redirect=/card/${cardExternalId}/edit`;
    return <LoadingScreen />; // Show loading while redirecting
  }

  if (!user && !guestName) {
    return (
      <GuestEntry
        onContinueAsGuest={name => setGuestName(name)}
        redirectToLogin={`/sign_in?redirect=/card/${cardExternalId}/edit`}
      />
    );
  }

  if (isCreator && editingSettings) {
    return (
      <FormPage
        product="group"
        title="Card settings"
        subtitle="Change who it's for, how it looks, and who can sign."
        headerAction={
          <Button variant="outline" onClick={() => setEditingSettings(false)}>
            <ArrowLeft />
            Back to your message
          </Button>
        }
      >
        <EditCardSettings
          cardTitle={cardTitle}
          occasion={occasion}
          occasions={occasions}
          setOccasion={setOccasion}
          contributorPrompt={contributorPrompt}
          setContributorPrompt={setContributorPrompt}
          setCardTitle={setCardTitle}
          recipients={recipients}
          handleRecipientChange={handleRecipientChange}
          handleRemoveRecipient={handleRemoveRecipient}
          handleAddRecipient={handleAddRecipient}
          backgroundColorStyles={backgroundColorStyles}
          selectedBackgroundColorId={selectedBackgroundColorId}
          setSelectedBackgroundColorId={setSelectedBackgroundColorId}
          textColorStyles={textColorStyles}
          selectedTextColorId={selectedTextColorId}
          setSelectedTextColorId={setSelectedTextColorId}
          handleUpdateCard={handleUpdateCard}
          setEditingSettings={setEditingSettings}
          coverImage={coverImage}
          setCoverImage={setCoverImage}
          cardId={cardExternalId!}
          refetchCard={refetch}
          maxMessages={maxMessages}
          setMaxMessages={setMaxMessages}
          requireLoginToContribute={requireLoginToContribute}
          setRequireLoginToContribute={setRequireLoginToContribute}
          slug={slug}
          setSlug={setSlug}
          registryExternalId={registryExternalId}
          setRegistryExternalId={setRegistryExternalId}
        />
      </FormPage>
    );
  }

  return (
    <FormPage
      product="group"
      title={cardTitle}
      subtitle="Add your message to the card."
      headerAction={
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate(`/card/${cardExternalId}/editable`)}>
            <Eye />
            View card
          </Button>
          {isCreator && (
            <Button variant="outline" onClick={() => setEditingSettings(true)}>
              <Settings2 />
              Card settings
            </Button>
          )}
        </div>
      }
    >
      <Toaster />

      <FormSection title="Your message" icon={PenLine}>
        <Field label="Message title" htmlFor="message-title" optional>
          <Input
            id="message-title"
            value={messageTitle}
            onChange={handleMessageTitleChange}
            placeholder="Give your message a title…"
          />
          {titleError && <p className="text-sm text-destructive">{titleError}</p>}
        </Field>

        {/* Only signed-in contributors choose how their name appears. */}
        {user && (
          <Field label="Display name" htmlFor="display-name">
            <Input
              id="display-name"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="How should your name appear on this message?"
            />
          </Field>
        )}

        <Field label="Your message" htmlFor="message">
          {!isCreator && contributorPrompt.trim() && (
            <div className="rounded-xl border-2 border-ink bg-brand-pink-soft px-4 py-3 text-[#1d1b2f]">
              <p className="text-sm font-semibold">A note from the card creator</p>
              <p className="mt-1 text-sm whitespace-pre-line">{contributorPrompt}</p>
            </div>
          )}
          <Textarea
            id="message"
            value={text}
            onChange={handleTextChange}
            placeholder="Write your heartfelt message here…"
            className="resize-none"
            style={{ height: '35vh' }}
          />
          {textError && <p className="text-sm text-destructive">{textError}</p>}
          <MessageImageField
            imagePreview={imagePreview}
            setImageFile={setImageFile}
            setImageUrl={setImageUrl}
            setImagePreview={setImagePreview}
            setCroppedAreaPixels={setCroppedAreaPixels}
            uploadError={uploadError}
            setUploadError={setUploadError}
            crop={crop}
            setCrop={setCrop}
            zoom={zoom}
            setZoom={setZoom}
          />
        </Field>
      </FormSection>

      <FormActions>
        <Button
          type="submit"
          disabled={!isCardMessageValid || submitting}
          onClick={handleUpsertMessage}
          tone={productById.group.tone}
          size="lg"
        >
          {submitting ? 'Submitting…' : 'Add my message'}
        </Button>
      </FormActions>
    </FormPage>
  );
}

// A 1-on-1 card is a single message with no message wall or contributor
// settings, so it gets its own editor. Dispatch on kind before rendering either.
function CardEdit() {
  const { cardExternalId } = useParams();
  const { data, loading } = useQuery(GET_CARD_KIND, {
    variables: { cardId: cardExternalId },
  });

  if (loading) return <LoadingScreen />;
  if (data?.card?.kind === 'one_on_one') return <CardOneOnOneEdit />;
  return <PageEdit />;
}

export default CardEdit;
