import React, { useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AddressAutocomplete } from '@/components/ui/address-autocomplete';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Field, FormActions, FormPage, FormSection, INPUT_LIKE } from '@/components/form/FormKit';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Toaster, toast } from 'sonner';
import { X, Calendar, Clock, ListChecks, MapPin, PartyPopper, Upload, Wand2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { APP_TOKEN_KEY } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { detectTimezone } from '@/lib/timezone';
import { isInsufficientCreditsError, INSUFFICIENT_CREDITS_REDIRECT } from '@/lib/credits';
import CoverImageDialog from '../Card/components/CoverImageDialog';
import { OpeningMessageEditor } from './components/OpeningMessageEditor';
import type { OpeningMessageConfig } from '@/types/openingMessage';
import { productById } from '@/config/products';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const CREATE_INVITATION = gql`
  mutation CreateInvitation($input: CreateInvitationInput!) {
    createInvitation(input: $input) {
      invitation {
        externalId
        title
      }
      errors
    }
  }
`;

const InvitationNew: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  // An invitation started from an organization dashboard belongs to that organization.
  // The server re-checks membership; this only supplies the default context.
  const { activeOrganization } = useOrganization();
  const [creating, setCreating] = useState(false);
  const [coverDialogOpen, setCoverDialogOpen] = useState(false);
  const [signInDialogOpen, setSignInDialogOpen] = useState(false);

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

  const [createInvitation] = useMutation(CREATE_INVITATION);

  const isFormValid = title.trim() !== '' && eventDate !== undefined && eventTime !== '';

  const handleCreateInvitation = async () => {
    if (!isFormValid) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check if user is logged in
    if (!user) {
      setSignInDialogOpen(true);
      return;
    }

    setCreating(true);

    try {
      if (coverImage instanceof Blob) {
        // Use FormData for file upload
        const formData = new FormData();
        formData.append(
          'operations',
          JSON.stringify({
            query: `
              mutation CreateInvitation($input: CreateInvitationInput!) {
                createInvitation(input: $input) {
                  invitation { externalId title }
                  errors
                }
              }
            `,
            variables: {
              input: {
                title,
                description: description || null,
                location: location || null,
                eventDate: eventDate ? format(eventDate, 'yyyy-MM-dd') : null,
                eventTime,
                eventTimezone: eventTimezone || null,
                rsvpDeadline: rsvpDeadline ? format(rsvpDeadline, 'yyyy-MM-dd') : null,
                coverImageFile: null,
                organizationId: activeOrganization?.id ?? null,
                maxAdditionalGuests,
                attire: attire.trim() || null,
                customInstructions: customInstructions.trim() || null,
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

        if (json.errors || json.data.createInvitation.errors.length > 0) {
          const mutationErrors = json.data?.createInvitation?.errors ?? json.errors ?? [];
          if (isInsufficientCreditsError(mutationErrors)) {
            navigate(INSUFFICIENT_CREDITS_REDIRECT);
            return;
          }
          toast.error(
            'Upload failed: ' +
              (json.errors?.[0]?.message ?? json.data.createInvitation.errors.join(', '))
          );
        } else {
          const externalId = json.data.createInvitation.invitation.externalId;
          toast.success('Invitation created!');
          setTimeout(() => {
            navigate(`/invitation/${externalId}`);
          }, 500);
        }
      } else {
        // Use Apollo mutation for URL or no image
        const { data } = await createInvitation({
          variables: {
            input: {
              title,
              description: description || null,
              location: location || null,
              eventDate: eventDate ? format(eventDate, 'yyyy-MM-dd') : null,
              eventTime,
              eventTimezone: eventTimezone || null,
              rsvpDeadline: rsvpDeadline ? format(rsvpDeadline, 'yyyy-MM-dd') : null,
              coverImageUrl: typeof coverImage === 'string' ? coverImage : null,
              organizationId: activeOrganization?.id ?? null,
              maxAdditionalGuests,
              attire: attire.trim() || null,
              customInstructions: customInstructions.trim() || null,
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

        if (data.createInvitation.errors.length === 0) {
          const externalId = data.createInvitation.invitation.externalId;
          toast.success('Invitation created!');
          setTimeout(() => {
            navigate(`/invitation/${externalId}`);
          }, 500);
        } else if (isInsufficientCreditsError(data.createInvitation.errors)) {
          navigate(INSUFFICIENT_CREDITS_REDIRECT);
        } else {
          toast.error(data.createInvitation.errors.join(', ') || 'Failed to create invitation');
        }
      }
    } catch (error) {
      toast.error('An error occurred while creating the invitation. Please try again.');
      console.error(error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <FormPage
      product="invitation"
      title="Create an invitation"
      subtitle="Design an invitation your friends will love, with RSVPs built in."
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
      </FormSection>

      <p className="text-sm text-muted-foreground">
        Want guests to see gift ideas? After you create the invitation you can link a registry or
        start a new one for it.
      </p>

      <FormActions>
        <Button type="button" variant="ghost" size="lg" onClick={() => navigate('/')}>
          Cancel
        </Button>
        <Button
          onClick={handleCreateInvitation}
          disabled={!isFormValid || creating}
          tone={productById.invitation.tone}
          size="lg"
        >
          {creating ? 'Creating…' : 'Create invitation'}
        </Button>
      </FormActions>

      {/* Cover Image Dialog */}
      <CoverImageDialog
        open={coverDialogOpen}
        onOpenChange={setCoverDialogOpen}
        onSelectCover={cover => {
          setCoverImage(cover);
          setCoverDialogOpen(false);
        }}
      />

      {/* Sign In Dialog */}
      <Dialog open={signInDialogOpen} onOpenChange={setSignInDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign in required</DialogTitle>
            <DialogDescription>
              You need to be signed in to create an invitation. Please sign in or create an account
              to continue.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSignInDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => navigate('/sign_in')}>Sign In</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

export default InvitationNew;
