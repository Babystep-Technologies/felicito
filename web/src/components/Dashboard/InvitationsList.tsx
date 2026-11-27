import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit2, Eye, Send, RotateCcw, Calendar, MapPin } from 'lucide-react';
import * as motion from 'motion/react-client';
import { isMobile } from '@/lib/utils';
import { format, parse } from 'date-fns';

interface InvitationType {
  externalId: string;
  title: string;
  description?: string;
  location?: string;
  eventDate: string;
  eventTime: string;
  eventTimezone?: string;
  coverImageUrl?: string;
}

// Custom hook to handle image loading state
const useImageLoader = (src: string | null) => {
  const [loading, setLoading] = useState(!!src);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  React.useEffect(() => {
    if (!src) {
      setLoading(false);
      setError(false);
      return;
    }

    setLoading(true);
    setError(false);

    const img = new Image();
    img.onload = () => {
      setLoading(false);
      setError(false);
    };
    img.onerror = () => {
      setLoading(false);
      setError(true);
    };
    img.src = `${src}?retry=${retryKey}`;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, retryKey]);

  const retry = () => {
    setRetryKey(prev => prev + 1);
  };

  return { loading, error, retry };
};

const InvitationWithImageLoader: React.FC<{
  invitation: InvitationType;
  onEdit: (id: string) => void;
  onShare: (id: string) => void;
  onPreview: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenSheet: (id: string) => void;
  openSheetInvitationId: string | null;
  navigate: (path: string) => void;
}> = ({
  invitation,
  onEdit,
  onShare,
  onPreview,
  onDelete,
  onOpenSheet,
  openSheetInvitationId,
  navigate,
}) => {
  const { loading, error, retry } = useImageLoader(invitation.coverImageUrl || null);

  const formatEventDate = () => {
    try {
      const date = parse(invitation.eventDate, 'yyyy-MM-dd', new Date());
      return format(date, 'MMM d, yyyy');
    } catch {
      return invitation.eventDate;
    }
  };

  const formatEventTime = () => {
    const [hours, minutes] = invitation.eventTime.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'pm' : 'am';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes}${period}`;
  };

  if (loading) {
    return (
      <Card
        className="relative min-h-[200px] max-w-[600px] w-full mx-auto overflow-hidden p-0"
        style={{
          aspectRatio: '4/3',
          maxHeight: '25vh',
        }}
      >
        <Skeleton className="w-full h-full bg-gray-200 dark:bg-gray-700" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card
        className="relative min-h-[200px] max-w-[600px] w-full mx-auto overflow-hidden flex items-center justify-center bg-muted"
        style={{
          aspectRatio: '4/3',
          maxHeight: '25vh',
        }}
      >
        <div className="text-center p-4">
          <div className="text-gray-400 mb-3 text-sm">Failed to load background image</div>
          <Button variant="outline" size="sm" onClick={retry} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card
      style={{
        backgroundImage: invitation.coverImageUrl ? `url(${invitation.coverImageUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: invitation.coverImageUrl ? undefined : 'var(--color-brand-green)',
        aspectRatio: '4/3',
        maxHeight: '25vh',
      }}
      className="pop-hover relative min-h-[200px] max-w-[600px] w-full mx-auto overflow-hidden"
    >
      <CardContent
        className="relative z-10 flex flex-col h-full text-white cursor-pointer"
        onClick={() => navigate(`/invitation/${invitation.externalId}`)}
      >
        <div className="bg-card text-foreground text-center px-4 py-3 rounded-xl border-2 border-ink shadow-pop-sm mx-auto w-[85%] max-w-[90%] overflow-hidden">
          <h2 className="font-bold text-lg truncate">{invitation.title}</h2>
          <div className="flex items-center justify-center gap-2 mt-2 text-sm text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span className="truncate">{formatEventDate()}</span>
            <span>•</span>
            <span>{formatEventTime()}</span>
          </div>
          {invitation.location && (
            <div className="flex items-center justify-center gap-1 mt-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{invitation.location}</span>
            </div>
          )}
        </div>

        <div className="mt-auto pt-4 flex justify-end" onClick={e => e.stopPropagation()}>
          {isMobile() ? (
            <>
              <Button
                size="icon"
                className="bg-card text-foreground rounded-full border-2 border-ink shadow-pop-sm hover:bg-muted p-2"
                onClick={() => onOpenSheet(invitation.externalId)}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
              <Sheet
                open={openSheetInvitationId === invitation.externalId}
                onOpenChange={() => onOpenSheet('')}
              >
                <SheetContent side="bottom" className="text-black space-y-4 p-4 pb-12">
                  <motion.div
                    key="mobile-sheet"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{
                      duration: 0.25,
                      ease: 'easeOut',
                    }}
                    className="text-black space-y-4 p-4 pb-12"
                  >
                    <SheetHeader>
                      <SheetTitle>Invitation Options</SheetTitle>
                    </SheetHeader>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => onEdit(invitation.externalId)}
                    >
                      <Edit2 className="w-4 h-4 mr-2" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        onOpenSheet('');
                        onShare(invitation.externalId);
                      }}
                    >
                      <Send className="w-4 h-4 mr-2" /> Share
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => onPreview(invitation.externalId)}
                    >
                      <Eye className="w-4 h-4 mr-2" /> Preview
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-red-600"
                      onClick={() => onDelete(invitation.externalId)}
                    >
                      Delete
                    </Button>
                  </motion.div>
                </SheetContent>
              </Sheet>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  className="bg-card text-foreground rounded-full border-2 border-ink shadow-pop-sm hover:bg-muted p-2"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(invitation.externalId)}>
                  <Edit2 className="w-4 h-4 mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onShare(invitation.externalId)}>
                  <Send className="w-4 h-4 mr-2" /> Share
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPreview(invitation.externalId)}>
                  <Eye className="w-4 h-4 mr-2" /> Preview
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(invitation.externalId)}
                  className="text-red-600"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface InvitationsListProps {
  invitations: InvitationType[];
  onRefetch: () => void;
  onShareClick: (invitationId: string) => void;
  // The "All" view previews only the first few invitations.
  limit?: number;
}

export const InvitationsList: React.FC<InvitationsListProps> = ({
  invitations,
  onShareClick,
  limit,
}) => {
  const navigate = useNavigate();
  const [openSheetInvitationId, setOpenSheetInvitationId] = useState<string | null>(null);

  // The dashboard's ProductSection owns the empty state and the create button.
  if (invitations.length === 0) return null;

  const visibleInvitations = limit ? invitations.slice(0, limit) : invitations;

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {visibleInvitations.map((invitation: InvitationType) => (
          <InvitationWithImageLoader
            key={invitation.externalId}
            invitation={invitation}
            onEdit={id => navigate(`/invitation/${id}/edit`)}
            onShare={onShareClick}
            onPreview={id => navigate(`/invitation/${id}`)}
            onDelete={id => {
              // This will be handled by parent component
              window.dispatchEvent(
                new CustomEvent('deleteInvitation', { detail: { invitationId: id } })
              );
            }}
            onOpenSheet={setOpenSheetInvitationId}
            openSheetInvitationId={openSheetInvitationId}
            navigate={navigate}
          />
        ))}
      </div>
    </div>
  );
};
