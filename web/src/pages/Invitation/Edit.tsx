import React, { useState, useEffect, useRef } from 'react';
import { gql, useQuery, useMutation, useLazyQuery } from '@apollo/client';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parse } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AddressAutocomplete } from '@/components/ui/address-autocomplete';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Field, FormActions, FormPage, FormSection, INPUT_LIKE } from '@/components/form/FormKit';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Toaster, toast } from 'sonner';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  PartyPopper,
  ListChecks,
  Upload,
  ArrowLeft,
  Wand2,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { APP_TOKEN_KEY } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { detectTimezone } from '@/lib/timezone';
import CoverImageDialog from '../Card/components/CoverImageDialog';
import { OpeningMessageEditor } from './components/OpeningMessageEditor';
import RSVPManagement from './components/RSVPManagement';
import RemindGuests from './components/RemindGuests';
import InvitationRegistryLink from './components/InvitationRegistryLink';
import type { OpeningMessageConfig } from '@/types/openingMessage';
import { productById } from '@/config/products';
import LoadingScreen from '@/components/Loading';

const GET_INVITATION = gql`
  query GetInvitation($externalId: String!) {
    invitation(externalId: $externalId) {
      id
      externalId
      slug
      title
      description
      location
      eventDate
      eventTime
      eventTimezone
      rsvpDeadline
      coverImageUrl
      maxAdditionalGuests
      attire
      customInstructions
      openingMessageConfig {
        templateId
        text {
          title
          subtitle
          transform {
            x
            y
            rotation
            scale
          }
        }
        theme {
          font
          textColor
        }
        background {
          type
          value
          overlayOpacity
          imageTransform {
            x
            y
            scale
            rotation
          }
        }
        animation {
          preset
          durationMs
        }
      }
      rsvps {
        id
        guestName
        guestEmail
        status
        plusOne
        additionalGuestsCount
        plusOneName
        message
        createdAt
      }
      rsvpCounts {
        going
        maybe
        notGoing
        total
        totalAttendees
      }
      nextReminderAt
      registry {
        externalId
        title
      }
    }
  }
`;

const UPDATE_INVITATION = gql`
  mutation UpdateInvitation($input: UpdateInvitationInput!) {
    updateInvitation(input: $input) {
      invitation {
        id
        externalId
        slug
        title
        description
        location
        eventDate
        eventTime
        eventTimezone
        rsvpDeadline
        maxAdditionalGuests
        attire
        customInstructions
      }
      errors
    }
  }
`;

const CHECK_SLUG_AVAILABILITY = gql`
  query CheckSlugAvailability($slug: String!, $type: String!, $currentId: String) {
    checkSlugAvailability(slug: $slug, type: $type, currentId: $currentId)
  }
`;

const InvitationEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [coverDialogOpen, setCoverDialogOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState<Date | undefined>(undefined);
  const [eventTime, setEventTime] = useState('');
  const [eventTimezone, setEventTimezone] = useState(() => detectTimezone());
  const [rsvpDeadline, setRsvpDeadline] = useState<Date | undefined>(undefined);
  const [coverImage, setCoverImage] = useState<string | Blob | null>(null);

  // Special instructions
  const [maxAdditionalGuests, setMaxAdditionalGuests] = useState(0);
  const [attire, setAttire] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [openingMessageConfig, setOpeningMessageConfig] = useState<OpeningMessageConfig | null>(
    null
  );
  const [openingEditorOpen, setOpeningEditorOpen] = useState(false);
  const [slug, setSlug] = useState('');
  const [slugError, setSlugError] = useState<string | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugValid, setSlugValid] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const initialSlugRef = useRef<string>('');

  const { loading, error, data } = useQuery(GET_INVITATION, {
    variables: { externalId: id },
    skip: !id,
  });

  const [updateInvitation] = useMutation(UPDATE_INVITATION);
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
          variables: { slug, type: 'invitation', currentId: id },
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
  }, [slug, id, checkSlugAvailability]);

  useEffect(() => {
    if (data?.invitation) {
      const invitation = data.invitation;
      setTitle(invitation.title || '');
      setDescription(invitation.description || '');
      setLocation(invitation.location || '');
      setEventDate(
        invitation.eventDate ? parse(invitation.eventDate, 'yyyy-MM-dd', new Date()) : undefined
      );
      setEventTime(invitation.eventTime || '');
      setEventTimezone(invitation.eventTimezone || 'America/Los_Angeles');
      setRsvpDeadline(
        invitation.rsvpDeadline
          ? parse(invitation.rsvpDeadline, 'yyyy-MM-dd', new Date())
          : undefined
      );
      setCoverImage(invitation.coverImageUrl || null);
      setMaxAdditionalGuests(invitation.maxAdditionalGuests || 0);
      setAttire(invitation.attire || '');
      setCustomInstructions(invitation.customInstructions || '');
      setSlug(invitation.slug || '');
      initialSlugRef.current = invitation.slug || '';
      // Transform GraphQL response to OpeningMessageConfig format
      if (invitation.openingMessageConfig) {
        const config = invitation.openingMessageConfig;
        setOpeningMessageConfig({
          template_id: config.templateId,
          text: {
            title: config.text.title,
            subtitle: config.text.subtitle,
          },
          theme: config.theme
            ? {
                font: config.theme.font,
                text_color: config.theme.textColor,
              }
            : undefined,
          background: config.background
            ? {
                type: config.background.type,
                value: config.background.value,
                overlay_opacity: config.background.overlayOpacity,
              }
            : undefined,
          animation: config.animation
            ? {
                preset: config.animation.preset,
                duration_ms: config.animation.durationMs,
              }
            : undefined,
        });
      }
    }
  }, [data]);

  useEffect(() => {
    if (error) {
      toast.error('Failed to load invitation');
      navigate('/');
    }
  }, [error, navigate]);

  const handleSave = async () => {
    if (!id) return;

    if (!title.trim() || !eventDate || !eventTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);

    try {
      if (coverImage instanceof Blob) {
        // Use FormData for file upload
        const formData = new FormData();
        formData.append(
          'operations',
          JSON.stringify({
            query: `
              mutation UpdateInvitation($input: UpdateInvitationInput!) {
                updateInvitation(input: $input) {
                  invitation {
                    id
                    externalId
                    slug
                    title
                    description
                    location
                    eventDate
                    eventTime
                    eventTimezone
                    rsvpDeadline
                    maxAdditionalGuests
                    attire
                    customInstructions
                  }
                  errors
                }
              }
            `,
            variables: {
              input: {
                externalId: id,
                title,
                description: description || null,
                location: location || null,
                eventDate: eventDate ? format(eventDate, 'yyyy-MM-dd') : null,
                eventTime,
                eventTimezone: eventTimezone || null,
                rsvpDeadline: rsvpDeadline ? format(rsvpDeadline, 'yyyy-MM-dd') : null,
                coverImageFile: null,
                maxAdditionalGuests,
                attire: attire.trim() || null,
                customInstructions: customInstructions.trim() || null,
                slug: slug.trim() || null,
                openingMessageConfig: openingMessageConfig
                  ? {
                      templateId: openingMessageConfig.template_id,
                      text: {
                        title: openingMessageConfig.text.title,
                        subtitle: openingMessageConfig.text.subtitle,
                      },
                      theme: openingMessageConfig.theme
                        ? {
                            font: openingMessageConfig.theme.font,
                            textColor: openingMessageConfig.theme.text_color,
                          }
                        : undefined,
                      background: openingMessageConfig.background
                        ? {
                            type: openingMessageConfig.background.type,
                            value: openingMessageConfig.background.value,
                            overlayOpacity: openingMessageConfig.background.overlay_opacity,
                          }
                        : undefined,
                      animation: openingMessageConfig.animation
                        ? {
                            preset: openingMessageConfig.animation.preset,
                            durationMs: openingMessageConfig.animation.duration_ms,
                          }
                        : undefined,
                    }
                  : null,
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

        if (json.errors || json.data.updateInvitation.errors.length > 0) {
          toast.error(
            'Update failed: ' +
              (json.errors?.[0]?.message ?? json.data.updateInvitation.errors.join(', '))
          );
        } else {
          toast.success('Invitation updated!');
          setTimeout(() => {
            navigate(`/invitation/${id}`);
          }, 500);
        }
      } else {
        // Use Apollo mutation for URL or no image change
        const { data: updateData } = await updateInvitation({
          variables: {
            input: {
              externalId: id,
              title,
              description: description || null,
              location: location || null,
              eventDate: eventDate ? format(eventDate, 'yyyy-MM-dd') : null,
              eventTime,
              eventTimezone: eventTimezone || null,
              rsvpDeadline: rsvpDeadline ? format(rsvpDeadline, 'yyyy-MM-dd') : null,
              coverImageUrl: typeof coverImage === 'string' ? coverImage : null,
              maxAdditionalGuests,
              attire: attire.trim() || null,
              customInstructions: customInstructions.trim() || null,
              slug: slug.trim() || null,
              openingMessageConfig: openingMessageConfig
                ? {
                    templateId: openingMessageConfig.template_id,
                    text: {
                      title: openingMessageConfig.text.title,
                      subtitle: openingMessageConfig.text.subtitle,
                    },
                    theme: openingMessageConfig.theme
                      ? {
                          font: openingMessageConfig.theme.font,
                          textColor: openingMessageConfig.theme.text_color,
                        }
                      : undefined,
                    background: openingMessageConfig.background
                      ? {
                          type: openingMessageConfig.background.type,
                          value: openingMessageConfig.background.value,
                          overlayOpacity: openingMessageConfig.background.overlay_opacity,
                        }
                      : undefined,
                    animation: openingMessageConfig.animation
                      ? {
                          preset: openingMessageConfig.animation.preset,
                          durationMs: openingMessageConfig.animation.duration_ms,
                        }
                      : undefined,
                  }
                : null,
            },
          },
        });

        if (updateData?.updateInvitation?.errors?.length === 0) {
          toast.success('Invitation updated!');
          setTimeout(() => {
            navigate(`/invitation/${id}`);
          }, 500);
        } else {
          const errors = updateData?.updateInvitation?.errors || ['Unknown error occurred'];
          console.error('Update invitation errors:', errors);
          toast.error(errors.join(', ') || 'Failed to update invitation');
        }
      }
    } catch (error) {
      toast.error('An error occurred while updating the invitation. Please try again.');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <FormPage
      product="invitation"
      title="Edit your invitation"
      subtitle="Make changes to your event details."
      headerAction={
        <Button variant="outline" onClick={() => navigate(`/invitation/${id}`)}>
          <ArrowLeft />
          Back to invitation
        </Button>
      }
    >
      <Toaster />

      <FormSection title="The basics" icon={PartyPopper}>
        <Field label="Event title" htmlFor="title" required>
          <Input
            id="title"
            placeholder="e.g., Summer Pool Party"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </Field>

        <Field label="Cover image">
          {coverImage ? (
            <div className="relative w-full">
              <img
                src={coverImage instanceof Blob ? URL.createObjectURL(coverImage) : coverImage}
                alt="Cover"
                className="h-64 w-full rounded-xl border-2 border-ink object-cover"
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
              className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-ink bg-brand-green-soft text-[#1d1b2f] transition-transform hover:-translate-y-0.5"
            >
              <Upload className="size-6" />
              <span className="text-sm font-semibold">Add a cover image</span>
            </button>
          )}
        </Field>
      </FormSection>

      <FormSection
        title="Opening screen"
        icon={Wand2}
        description="An animated intro your guests see before the invitation opens."
      >
        {openingMessageConfig && (
          <div className="rounded-xl border-2 border-ink bg-brand-green-soft p-4 text-[#1d1b2f]">
            <p className="text-lg font-semibold">&ldquo;{openingMessageConfig.text.title}&rdquo;</p>
            {openingMessageConfig.text.subtitle && (
              <p className="mt-1 text-sm opacity-80">{openingMessageConfig.text.subtitle}</p>
            )}
          </div>
        )}
        <Button type="button" variant="outline" onClick={() => setOpeningEditorOpen(true)}>
          <Wand2 />
          {openingMessageConfig ? 'Edit opening screen' : 'Customize opening screen'}
        </Button>
      </FormSection>

      <FormSection title="When & where" icon={Calendar}>
        {/* Date and Time Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date <span className="text-destructive">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(INPUT_LIKE, !eventDate && 'text-muted-foreground')}
                >
                  <Calendar className="size-4 opacity-60" />
                  {eventDate ? format(eventDate, 'PPP') : <span>Pick a date</span>}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={eventDate}
                  onSelect={setEventDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Time <span className="text-destructive">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(INPUT_LIKE, !eventTime && 'text-muted-foreground')}
                >
                  <Clock className="size-4 opacity-60" />
                  {eventTime ? (
                    (() => {
                      const [hours, minutes] = eventTime.split(':');
                      const hour = parseInt(hours);
                      const period = hour >= 12 ? 'pm' : 'am';
                      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                      return `${displayHour}:${minutes}${period}`;
                    })()
                  ) : (
                    <span>Pick a time</span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[140px] p-0" align="start">
                <div className="max-h-[280px] overflow-y-auto">
                  {Array.from({ length: 96 }, (_, i) => {
                    const totalMinutes = i * 15;
                    const hours = Math.floor(totalMinutes / 60);
                    const minutes = totalMinutes % 60;
                    const period = hours >= 12 ? 'pm' : 'am';
                    const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
                    const militaryTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                    const displayTime = `${displayHour}:${minutes.toString().padStart(2, '0')}${period}`;

                    return (
                      <button
                        key={militaryTime}
                        onClick={() => setEventTime(militaryTime)}
                        className={cn(
                          'w-full px-4 py-3 text-left hover:bg-accent transition-colors border-b last:border-b-0',
                          eventTime === militaryTime && 'bg-accent font-semibold'
                        )}
                      >
                        {displayTime}
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Timezone */}
        <div className="space-y-2">
          <Label htmlFor="timezone" className="text-base font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Timezone
          </Label>
          <select
            id="timezone"
            value={eventTimezone}
            onChange={e => setEventTimezone(e.target.value)}
            className={INPUT_LIKE}
          >
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
            <option value="America/Anchorage">Alaska Time</option>
            <option value="Pacific/Honolulu">Hawaii Time</option>
            <option value="Europe/London">London (GMT)</option>
            <option value="Europe/Paris">Central European Time</option>
            <option value="Asia/Tokyo">Tokyo</option>
            <option value="Asia/Shanghai">Beijing/Shanghai</option>
            <option value="Australia/Sydney">Sydney</option>
            <option value="UTC">UTC</option>
          </select>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location" className="text-base font-semibold flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Location
          </Label>
          <AddressAutocomplete
            id="location"
            placeholder="123 Party Street, Chicago, IL"
            value={location}
            onChange={setLocation}
            className="border-2"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-base font-semibold">
            Description
          </Label>
          <Textarea
            id="description"
            placeholder="Tell your guests what to expect..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            className="border-2 resize-none"
          />
        </div>

        {/* RSVP Deadline */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">RSVP Deadline (Optional)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(INPUT_LIKE, !rsvpDeadline && 'text-muted-foreground')}
              >
                <Calendar className="size-4 opacity-60" />
                {rsvpDeadline ? format(rsvpDeadline, 'PPP') : <span>Pick a deadline</span>}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={rsvpDeadline}
                onSelect={setRsvpDeadline}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </FormSection>

      <FormSection title="Guest details" icon={ListChecks}>
        {/* Additional Guests */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">Additional guests allowed</Label>
          <p className="text-sm text-muted-foreground">
            Set to 0 if guests cannot bring additional people.
          </p>
          <div className="flex items-center gap-3">
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={maxAdditionalGuests}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '');
                setMaxAdditionalGuests(val === '' ? 0 : parseInt(val));
              }}
              className="w-16 text-center"
            />
            <span className="text-sm text-muted-foreground">
              {maxAdditionalGuests === 0
                ? '(no additional guests)'
                : maxAdditionalGuests === 1
                  ? 'guest per RSVP'
                  : 'guests per RSVP'}
            </span>
          </div>
        </div>

        {/* Attire */}
        <div className="space-y-2">
          <Label htmlFor="attire" className="text-base font-semibold">
            Dress Code / Attire
          </Label>
          <Input
            id="attire"
            placeholder="e.g., Casual, Formal, Beach Wear, Costume"
            value={attire}
            onChange={e => setAttire(e.target.value)}
          />
        </div>

        {/* Custom Instructions */}
        <div className="space-y-2">
          <Label htmlFor="customInstructions" className="text-base font-semibold">
            Additional Instructions
          </Label>
          <Textarea
            id="customInstructions"
            placeholder="Any other details guests should know? Parking info, what to bring, etc."
            value={customInstructions}
            onChange={e => setCustomInstructions(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Custom URL Slug */}
        <div className="space-y-2">
          <Label htmlFor="slug" className="text-base font-semibold">
            Custom URL <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <p className="text-sm text-muted-foreground">
            Create a memorable link for sharing (e.g., "emmas-1st-birthday")
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm whitespace-nowrap text-muted-foreground">
              felicito.app/p/invitation/
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
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
              )}
              {!slugChecking && slugError && (
                <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-destructive" />
              )}
              {!slugChecking && slugValid && (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-green" />
              )}
            </div>
          </div>
          {slugError ? (
            <p className="text-xs text-destructive">{slugError}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Only lowercase letters, numbers, and hyphens allowed
            </p>
          )}
        </div>
      </FormSection>

      <FormActions>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={() => navigate(`/invitation/${id}`)}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving || !!slugError || slugChecking}
          tone={productById.invitation.tone}
          size="lg"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </FormActions>

      {id && (
        <InvitationRegistryLink
          invitationExternalId={id}
          registryExternalId={data?.invitation?.registry?.externalId}
          title={data?.invitation?.title}
          eventDate={data?.invitation?.eventDate}
        />
      )}

      {/* RSVP Management Section */}
      {data?.invitation?.rsvps && (
        <div>
          <RSVPManagement
            rsvps={data.invitation.rsvps}
            rsvpCounts={
              data.invitation.rsvpCounts || {
                going: 0,
                maybe: 0,
                notGoing: 0,
                total: 0,
                totalAttendees: 0,
              }
            }
            invitationTitle={title}
          />
        </div>
      )}

      {id && data?.invitation?.rsvpCounts && data.invitation.eventDate && (
        <RemindGuests
          invitationExternalId={id}
          eventDate={data.invitation.eventDate}
          going={data.invitation.rsvpCounts.going}
          maybe={data.invitation.rsvpCounts.maybe}
          nextReminderAt={data.invitation.nextReminderAt}
        />
      )}

      {/* Cover Image Dialog */}
      <CoverImageDialog
        open={coverDialogOpen}
        onOpenChange={setCoverDialogOpen}
        onSelectCover={cover => {
          setCoverImage(cover);
          setCoverDialogOpen(false);
        }}
      />

      {/* Opening Message Editor */}
      <OpeningMessageEditor
        open={openingEditorOpen}
        onOpenChange={setOpeningEditorOpen}
        value={openingMessageConfig}
        onChange={setOpeningMessageConfig}
      />
    </FormPage>
  );
};

export default InvitationEdit;
