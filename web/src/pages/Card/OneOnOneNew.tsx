import React, { useEffect, useMemo, useRef, useState } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { GET_THANK_YOUS, SET_THANK_YOU_SENT } from '@/components/Registry/ThankYouList';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { Check, Copy, Heart, Mail, Send, Upload, X } from 'lucide-react';
import { Toaster, toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  ChoiceChips,
  Field,
  FormActions,
  FormPage,
  FormSection,
  SwatchPicker,
} from '@/components/form/FormKit';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { captureError, captureInfo } from '@/lib/posthog-capture';
import { isInsufficientCreditsError, INSUFFICIENT_CREDITS_REDIRECT } from '@/lib/credits';
import { uploadGraphQLMutation } from '@/lib/graphql-upload';
import { isEffectSlug, type EffectSlug } from '@/components/effects';
import { StyleType } from '@/types/app';
import { detectTimezone, formatInTimezone, zonedWallTimeToUtcISO } from '@/lib/timezone';
import CoverImageDialog from './components/CoverImageDialog';
import CardPreview from './components/CardPreview';
import EffectPicker from './components/EffectPicker';
import SchedulePicker from './components/SchedulePicker';
import { productById } from '@/config/products';

const CREATE_ONE_ON_ONE_CARD_DOCUMENT = `
  mutation CreateOneOnOneCard($input: CreateOneOnOneCardInput!) {
    createOneOnOneCard(input: $input) {
      card {
        externalId
        title
      }
      errors
    }
  }
`;

const CREATE_ONE_ON_ONE_CARD = gql`
  ${CREATE_ONE_ON_ONE_CARD_DOCUMENT}
`;

const DELIVER_CARD = gql`
  mutation DeliverCard($input: DeliverCardInput!) {
    deliverCard(input: $input) {
      card {
        externalId
      }
      errors
    }
  }
`;

const TRACK_ONE_ON_ONE_FLOW_START = gql`
  mutation TrackOneOnOneFlowStart {
    trackOneOnOneFlowStart(input: {}) {
      success
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

interface CreatedCard {
  externalId: string;
  title: string;
}

/** Reads naturally for every occasion in `Card::OCCASIONS`, which are all nouns. */
const suggestTitle = (occasion: string | undefined, recipient: string) => {
  const name = recipient.trim();
  if (!name) return '';
  return occasion ? `${occasion} — ${name}` : `For ${name}`;
};

/**
 * Parse a reminder deep-link `deliverAt` param into a schedule date + time. The
 * reminder email (occasion engine) sends the occasion's calendar date as
 * `YYYY-MM-DD`; a full `YYYY-MM-DDTHH:mm` is also accepted. The date is built in
 * local wall time (never `new Date('YYYY-MM-DD')`, which is UTC midnight and can
 * land on the previous day). Date-only links default to 09:00 so scheduling is
 * ready without the user picking a time — but every field stays editable.
 */
const parseDeliverAt = (raw: string | null): { date: Date; time: string } | null => {
  if (!raw) return null;
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (!match) return null;
  const [, year, month, day, hours, minutes] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (Number.isNaN(date.getTime())) return null;
  const time = hours && minutes ? `${hours}:${minutes}` : '09:00';
  return { date, time };
};

const CardOneOnOneNew: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  // A card started from an organization dashboard belongs to that organization. The
  // server re-checks membership; this only supplies the default context.
  const { activeOrganization } = useOrganization();
  const [searchParams] = useSearchParams();

  // One-tap deep link from the occasion reminder email: pre-fill the schedule
  // date/time from `deliverAt`. Computed once — only the initial state matters.
  const presetDeliverAt = useMemo(
    () => parseDeliverAt(searchParams.get('deliverAt')),
    [searchParams]
  );

  // Attribution for the "reminder to card conversion" metric (#30): forwarded
  // as-is to CreateOneOnOneCard's `sourceOccasionId`, which drops it silently
  // if it doesn't resolve to one of the signer's own occasions.
  const sourceOccasionId = searchParams.get('occasionId');

  const [title, setTitle] = useState('');
  const [titleEdited, setTitleEdited] = useState(false);
  const [recipient, setRecipient] = useState(() => searchParams.get('recipient') ?? '');
  const [text, setText] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [occasion, setOccasion] = useState<string | undefined>(undefined);

  const [coverImage, setCoverImage] = useState<string | Blob | null>(null);
  const [coverDialogOpen, setCoverDialogOpen] = useState(false);
  const [signInDialogOpen, setSignInDialogOpen] = useState(false);

  const [selectedBackgroundColorId, setSelectedBackgroundColorId] = useState<string | null>(null);
  const [selectedTextColorId, setSelectedTextColorId] = useState<string | null>(null);
  const [selectedEffectId, setSelectedEffectId] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [createdCard, setCreatedCard] = useState<CreatedCard | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [delivering, setDelivering] = useState(false);
  const [delivered, setDelivered] = useState(false);
  const [scheduled, setScheduled] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const [deliveryMode, setDeliveryMode] = useState<'now' | 'schedule'>(
    presetDeliverAt ? 'schedule' : 'now'
  );
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(presetDeliverAt?.date);
  const [scheduleTime, setScheduleTime] = useState(presetDeliverAt?.time ?? '');
  const [scheduleTimezone, setScheduleTimezone] = useState(() => detectTimezone());

  const [createOneOnOneCard] = useMutation(CREATE_ONE_ON_ONE_CARD);
  const [deliverCard] = useMutation(DELIVER_CARD);
  const [trackOneOnOneFlowStart] = useMutation(TRACK_ONE_ON_ONE_FLOW_START);

  // The denominator of the "creation completion rate" north-star metric
  // (#30) — fired once per mount, only once user auth has resolved, so a
  // signed-out visitor who never gets past the sign-in dialog isn't counted.
  // The ref guards against React StrictMode's double-invoked effects in dev.
  const flowStartTracked = useRef(false);
  useEffect(() => {
    if (!user || flowStartTracked.current) return;
    flowStartTracked.current = true;
    trackOneOnOneFlowStart().catch(() => {
      // Best-effort metric only; a failure here must never block the flow.
    });
  }, [user, trackOneOnOneFlowStart]);

  const { data: occasionsData } = useQuery(GET_OCCASIONS);
  const occasions = useMemo(() => occasionsData?.cardOccasions || [], [occasionsData]);

  const { data: styleData } = useQuery(GET_STYLES);

  // Arriving from a registry's thank-you list: prefill the guest's name and email (read through the
  // owner's own thank-you query, so the email never travels in the URL), and tick them off once the
  // card has gone out.
  const thankYouRegistry = searchParams.get('thankYouRegistry');
  const thankYouClaim = searchParams.get('thankYouClaim');
  const { data: thankYouData } = useQuery(GET_THANK_YOUS, {
    variables: { externalId: thankYouRegistry },
    skip: !thankYouRegistry || !thankYouClaim,
  });
  const [setThankYouSent] = useMutation(SET_THANK_YOU_SENT);
  const thankYouGuest: { guestName: string; guestEmail: string | null } | undefined =
    thankYouData?.registry?.thankYouList?.find((c: { id: string }) => c.id === thankYouClaim);
  useEffect(() => {
    if (!thankYouGuest) return;
    setRecipient(current => current || thankYouGuest.guestName);
    setRecipientEmail(current => current || thankYouGuest.guestEmail || '');
  }, [thankYouGuest]);
  const markThanked = () => {
    if (!thankYouRegistry || !thankYouClaim) return;
    setThankYouSent({
      variables: {
        input: { registryExternalId: thankYouRegistry, reservationId: thankYouClaim, sent: true },
      },
    }).catch(() => {
      // The card went out; the owner can still tick them off by hand.
    });
  };
  const backgroundColorStyles = useMemo(() => styleData?.backgroundColorStyles || [], [styleData]);
  const textColorStyles = useMemo(() => styleData?.textColorStyles || [], [styleData]);
  const effectStyles = useMemo(() => styleData?.effectStyles || [], [styleData]);

  const findValue = (styles: StyleType[], id: string | null) =>
    styles.find((style: StyleType) => style.id === id)?.value;

  const backgroundColor = findValue(backgroundColorStyles, selectedBackgroundColorId) || '#FDFCF9';
  const textColor = findValue(textColorStyles, selectedTextColorId) || '#1E293B';
  const effectValue = findValue(effectStyles, selectedEffectId);
  const effect: EffectSlug | null = isEffectSlug(effectValue) ? effectValue : null;

  const shareUrl = createdCard
    ? `${import.meta.env.VITE_PREVIEW_ENDPOINT}/card/${createdCard.externalId}/viewable`
    : '';

  const isFormValid = title.trim() !== '' && recipient.trim() !== '' && text.trim() !== '';

  useEffect(() => {
    const presetOccasion = searchParams.get('occasion');
    if (presetOccasion && occasions.includes(presetOccasion)) {
      setOccasion(presetOccasion);
    }
  }, [searchParams, occasions]);

  // Default to the first colour of each kind, and to Confetti, so the preview is
  // never blank. Matches pages/Card/New.tsx.
  useEffect(() => {
    if (!selectedBackgroundColorId && backgroundColorStyles.length > 0) {
      setSelectedBackgroundColorId(backgroundColorStyles[0].id);
    }
    if (!selectedTextColorId && textColorStyles.length > 0) {
      setSelectedTextColorId(textColorStyles[0].id);
    }
  }, [backgroundColorStyles, textColorStyles, selectedBackgroundColorId, selectedTextColorId]);

  // Default the effect once styles load. A reminder deep link may pre-select the
  // curated effect via `?effect=<slug>`; otherwise fall back to Confetti so the
  // preview is never blank. Either way it stays editable in the picker.
  const [effectDefaulted, setEffectDefaulted] = useState(false);
  useEffect(() => {
    if (effectDefaulted || effectStyles.length === 0) return;
    const presetEffect = searchParams.get('effect');
    const preset = presetEffect
      ? effectStyles.find((style: StyleType) => style.value === presetEffect)
      : undefined;
    const confetti = effectStyles.find((style: StyleType) => style.value === 'confetti');
    setSelectedEffectId(preset?.id ?? confetti?.id ?? effectStyles[0].id);
    setEffectDefaulted(true);
  }, [effectStyles, effectDefaulted, searchParams]);

  // Keep the title in step with the occasion and recipient until it is hand-edited.
  useEffect(() => {
    if (titleEdited) return;
    setTitle(suggestTitle(occasion, recipient));
  }, [occasion, recipient, titleEdited]);

  const handleCreateCard = async () => {
    if (!isFormValid) return;

    if (!user) {
      setSignInDialogOpen(true);
      return;
    }

    const styleIds = [selectedBackgroundColorId, selectedTextColorId, selectedEffectId].filter(
      Boolean
    );
    const input: Record<string, unknown> = {
      title,
      recipient,
      text,
      styleIds,
      occasion,
      organizationId: activeOrganization?.id ?? null,
    };
    if (displayName.trim()) input.displayName = displayName.trim();
    if (sourceOccasionId) input.sourceOccasionId = sourceOccasionId;

    setCreating(true);

    try {
      let card: CreatedCard | null = null;
      let errors: string[] = [];

      if (coverImage instanceof Blob) {
        const json = await uploadGraphQLMutation<{
          createOneOnOneCard: { card: CreatedCard | null; errors: string[] };
        }>({
          query: CREATE_ONE_ON_ONE_CARD_DOCUMENT,
          input: { ...input, coverImageFile: null },
          filePath: 'variables.input.coverImageFile',
          file: coverImage,
          filename: 'cover.jpg',
        });

        if (json.errors?.length) {
          errors = json.errors.map(error => error.message);
        } else {
          card = json.data?.createOneOnOneCard.card ?? null;
          errors = json.data?.createOneOnOneCard.errors ?? [];
        }
      } else {
        if (typeof coverImage === 'string' && coverImage) input.coverImageUrl = coverImage;
        const { data } = await createOneOnOneCard({ variables: { input } });
        card = data.createOneOnOneCard.card;
        errors = data.createOneOnOneCard.errors;
      }

      if (errors.length === 0 && card) {
        setCreatedCard(card);
        toast.success('Card created! Now send it.');
        captureInfo('One-on-One Card Created', { cardTitle: card.title, cardId: card.externalId });
      } else if (isInsufficientCreditsError(errors)) {
        navigate(INSUFFICIENT_CREDITS_REDIRECT);
      } else {
        toast.error(errors.join(', ') || 'Failed to create card');
        captureError('One-on-One Card Creation Error', { errors: errors.join(', ') });
      }
    } catch (err) {
      toast.error('An error occurred while creating the card. Please try again.');
      captureError('Unknown One-on-One Card Creation Error', {
        error: err instanceof Error ? err.message : String(err),
        userId: user?.user_id || 'unknown',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast.error('Could not copy the link. Select and copy it manually.');
    }
  };

  const isScheduling = deliveryMode === 'schedule';
  const scheduleReady = scheduleDate !== undefined && scheduleTime !== '';
  // UTC instant for the chosen wall-clock time, or null until both date and time
  // are set — an empty time would build an Invalid Date and throw in toISOString.
  const deliverAtIso =
    isScheduling && scheduleReady && scheduleDate
      ? zonedWallTimeToUtcISO(format(scheduleDate, 'yyyy-MM-dd'), scheduleTime, scheduleTimezone)
      : null;
  const scheduleInPast = deliverAtIso !== null && new Date(deliverAtIso).getTime() <= Date.now();
  const canDeliver =
    recipientEmail.trim() !== '' && (!isScheduling || (scheduleReady && !scheduleInPast));

  const handleDeliver = async () => {
    if (!createdCard || !canDeliver) return;
    setDelivering(true);

    try {
      // `cardId` resolves by external_id on the API, not the database id.
      const { data } = await deliverCard({
        variables: {
          input: {
            cardId: createdCard.externalId,
            recipientEmail,
            ...(deliverAtIso ? { deliverAt: deliverAtIso } : {}),
          },
        },
      });

      if (data.deliverCard.errors.length === 0) {
        markThanked();
        if (deliverAtIso) {
          setScheduled(true);
          toast.success(
            `Scheduled for ${recipientEmail} on ${formatInTimezone(deliverAtIso, scheduleTimezone)}`
          );
          captureInfo('One-on-One Card Scheduled', {
            cardId: createdCard.externalId,
            deliverAt: deliverAtIso,
          });
        } else {
          setDelivered(true);
          toast.success(`Sent to ${recipientEmail}`);
          captureInfo('One-on-One Card Delivered', { cardId: createdCard.externalId });
        }
      } else {
        toast.error(data.deliverCard.errors.join(', ') || 'Failed to send card');
        captureError('One-on-One Card Delivery Error', {
          errors: data.deliverCard.errors.join(', '),
        });
      }
    } catch (err) {
      toast.error('An error occurred while sending the card. Please try again.');
      captureError('Unknown One-on-One Card Delivery Error', {
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setDelivering(false);
    }
  };

  return (
    <FormPage
      product="one_on_one"
      title="Send a 1-on-1 card"
      subtitle="Pick a design, write your message, send it. That's it."
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
            onChange={e => {
              setTitleEdited(true);
              setTitle(e.target.value);
            }}
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

      <FormSection
        step={3}
        title="Deliver"
        description={
          createdCard ? undefined : 'Create the card to get a shareable link and send it by email.'
        }
      >
        {!createdCard ? (
          <FormActions>
            <Button type="button" variant="ghost" size="lg" onClick={() => navigate('/')}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateCard}
              disabled={!isFormValid || creating}
              tone={productById.one_on_one.tone}
              size="lg"
            >
              {creating ? 'Creating…' : 'Create card'}
            </Button>
          </FormActions>
        ) : (
          <>
            <Field label="Shareable link">
              <div className="flex gap-2">
                <Input readOnly value={shareUrl} className="text-sm" />
                <Button variant="outline" onClick={handleCopyLink} className="shrink-0">
                  {linkCopied ? <Check /> : <Copy />}
                  {linkCopied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </Field>

            <Field label="Or send by email" htmlFor="recipientEmail">
              <Input
                id="recipientEmail"
                type="email"
                placeholder="sarah@example.com"
                value={recipientEmail}
                onChange={e => {
                  setDelivered(false);
                  setScheduled(false);
                  setRecipientEmail(e.target.value);
                }}
              />
            </Field>

            <ChoiceChips
              ariaLabel="When to send"
              options={[
                { value: 'now' as const, label: 'Send now' },
                { value: 'schedule' as const, label: 'Schedule for a date' },
              ]}
              value={deliveryMode}
              onChange={mode => {
                setDeliveryMode(mode);
                setDelivered(false);
                setScheduled(false);
              }}
            />

            {isScheduling && (
              <div className="space-y-3 rounded-xl border-2 border-ink bg-brand-blue-soft p-4 text-[#1d1b2f]">
                <SchedulePicker
                  date={scheduleDate}
                  time={scheduleTime}
                  timezone={scheduleTimezone}
                  onDateChange={date => {
                    setScheduled(false);
                    setScheduleDate(date);
                  }}
                  onTimeChange={time => {
                    setScheduled(false);
                    setScheduleTime(time);
                  }}
                  onTimezoneChange={tz => {
                    setScheduled(false);
                    setScheduleTimezone(tz);
                  }}
                />
                {deliverAtIso && scheduleReady && (
                  <p className={`text-sm ${scheduleInPast ? 'text-destructive' : ''}`}>
                    {scheduleInPast
                      ? 'Pick a time in the future.'
                      : `Sends ${formatInTimezone(deliverAtIso, scheduleTimezone)}`}
                  </p>
                )}
              </div>
            )}

            <FormActions>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate(`/card/${createdCard.externalId}/viewable`)}
              >
                <Heart />
                View the card
              </Button>
              <Button
                onClick={handleDeliver}
                disabled={!canDeliver || delivering || delivered || scheduled}
                tone={productById.one_on_one.tone}
                size="lg"
              >
                {delivered || scheduled ? <Check /> : isScheduling ? <Send /> : <Mail />}
                {delivering
                  ? isScheduling
                    ? 'Scheduling…'
                    : 'Sending…'
                  : scheduled
                    ? 'Scheduled'
                    : delivered
                      ? 'Sent'
                      : isScheduling
                        ? 'Schedule send'
                        : 'Send'}
              </Button>
            </FormActions>
          </>
        )}
      </FormSection>

      <CoverImageDialog
        open={coverDialogOpen}
        onOpenChange={setCoverDialogOpen}
        onSelectCover={cover => {
          setCoverImage(cover);
          setCoverDialogOpen(false);
        }}
      />

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

export default CardOneOnOneNew;
