import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { gql, useQuery, useMutation } from '@apollo/client';
import { CardKind, CardType } from '@/types/app';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import LoadingScreen from '@/components/Loading';
import ErrorScreen from '@/components/Error';
import { Toaster, toast } from 'sonner';
import withAuth from '@/lib/with-auth';
import CardQrCode from '@/pages/Card/components/QrCode';
import ShareDialog from '@/components/ShareDialog';
import { CardsList } from '@/components/Dashboard/CardsList';
import { InvitationsList } from '@/components/Dashboard/InvitationsList';
import { RegistriesList, type DashboardRegistry } from '@/components/Dashboard/RegistriesList';
import {
  DashboardMobileBar,
  DashboardSidebar,
  type SidebarItem,
} from '@/components/Dashboard/DashboardSidebar';
import ProductSection from '@/components/Dashboard/ProductSection';
import CreateProductButton from '@/components/CreateProductButton';
import { Hills, Sun } from '@/components/doodles';
import { productById, products, type ProductId } from '@/config/products';

// `organizationId` is the context: null lists the signed-in user's personal cards,
// an id lists everything that organization owns — including cards other members made.
const GET_USER_CARDS = gql`
  query UserCards($userId: ID!, $organizationId: ID) {
    userCards(userId: $userId, organizationId: $organizationId) {
      externalId
      slug
      title
      kind
      locked
      recipients
      coverImageUrl
      deliverAt
      deliverToEmail
      organization {
        id
        name
      }
      user {
        id
        name
      }
      styles {
        name
        kind
        value
      }
    }
  }
`;

// Registries are personal for now (no organization argument), so the tab is simply absent inside an
// organization rather than showing someone's personal lists under a shared heading.
const GET_MY_REGISTRIES = gql`
  query MyRegistries {
    myRegistries {
      externalId
      title
      occasion
      eventDate
      items {
        id
      }
      insights {
        itemCount
        coveredCount
        purchasedCount
      }
    }
  }
`;

const DELETE_REGISTRY = gql`
  mutation DeleteRegistry($externalId: String!) {
    deleteRegistry(input: { externalId: $externalId }) {
      success
      errors
    }
  }
`;

const GET_USER_INVITATIONS = gql`
  query UserInvitations($userId: ID!, $organizationId: ID) {
    userInvitations(userId: $userId, organizationId: $organizationId) {
      externalId
      slug
      title
      description
      location
      eventDate
      eventTime
      eventTimezone
      coverImageUrl
    }
  }
`;

const DELETE_CARD = gql`
  mutation DeleteCard($input: DeleteCardInput!) {
    deleteCard(input: $input) {
      success
      errors
    }
  }
`;

// Card kinds the dashboard buckets cards into. A kind the API knows about but this list
// doesn't have yet falls back to the first entry, so no card ever goes missing.
const CARD_KINDS: CardKind[] = ['group', 'one_on_one'];

// How many items each product previews in the "All" view before "See all".
const ALL_VIEW_LIMIT = 3;

// Empty-state copy per product. It takes the active organization's name (null in Personal)
// because an organization dashboard is shared: "you haven't created any" is the wrong
// sentence when the list is the whole team's and a teammate is the one reading it.
const emptyCopy = (
  product: ProductId,
  organizationName: string | null
): { title: string; description: string } => {
  switch (product) {
    case 'group':
      return organizationName
        ? {
            title: `No group cards in ${organizationName} yet`,
            description: `Create the first one — everyone in ${organizationName} will see it here.`,
          }
        : {
            title: 'No group cards yet',
            description: 'Start one, share the link, and let everyone add a message.',
          };
    case 'one_on_one':
      return organizationName
        ? {
            title: `No 1-on-1 cards in ${organizationName} yet`,
            description: `Pick a design, write your message, and send it on behalf of ${organizationName}.`,
          }
        : {
            title: 'No 1-on-1 cards yet',
            description:
              'Pick a design, write your message, and send it — no group signing needed.',
          };
    case 'invitation':
      return organizationName
        ? {
            title: `No invitations in ${organizationName} yet`,
            description: `Plan an event — everyone in ${organizationName} can see it and track RSVPs.`,
          }
        : {
            title: 'No invitations yet',
            description: 'Plan a get-together and keep every RSVP in one place.',
          };
    case 'registry':
      return {
        title: 'No registries yet',
        description:
          "List what you'd love for a birthday, wedding, or any occasion, and let friends and family pick something.",
      };
  }
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { activeOrganization, loading: organizationLoading } = useOrganization();
  // Null is Personal, and the API reads it that way — not "no filter".
  const organizationId = activeOrganization?.id ?? null;
  const organizationName = activeOrganization?.name ?? null;
  // The selected section lives in the URL (?view=) so it survives reloads, can be linked
  // to, and works with back/forward.
  const [searchParams] = useSearchParams();
  const viewParam = searchParams.get('view');
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedItemType, setSelectedItemType] = useState<'card' | 'invitation'>('card');
  const [qrCardId, setQrCardId] = useState<string | null>(null);
  const [deleteCard] = useMutation(DELETE_CARD);
  const [deleteRegistry] = useMutation(DELETE_REGISTRY);
  const [registryToDelete, setRegistryToDelete] = useState<string | null>(null);

  // Wait for the context to resolve before asking: firing early would send
  // organizationId: null and flash the user's personal cards inside an organization.
  const skipQueries = !user?.user_id || organizationLoading;

  const { data, loading, error, refetch } = useQuery(GET_USER_CARDS, {
    variables: { userId: user?.user_id, organizationId },
    skip: skipQueries,
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
  });

  const {
    data: invitationsData,
    loading: invitationsLoading,
    refetch: refetchInvitations,
  } = useQuery(GET_USER_INVITATIONS, {
    variables: { userId: user?.user_id, organizationId },
    skip: skipQueries,
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
  });

  const showRegistryTab = organizationId === null;
  const { data: registriesData, refetch: refetchRegistries } = useQuery(GET_MY_REGISTRIES, {
    skip: skipQueries || !showRegistryTab,
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
  });
  const registries: DashboardRegistry[] = useMemo(
    () => registriesData?.myRegistries ?? [],
    [registriesData]
  );

  const cards: CardType[] = useMemo(() => data?.userCards || [], [data]);
  const invitations = invitationsData?.userInvitations || [];

  const cardsByKind = useMemo(() => {
    const buckets = Object.fromEntries(CARD_KINDS.map(kind => [kind, [] as CardType[]])) as Record<
      string,
      CardType[]
    >;
    cards.forEach(card => {
      const bucket = buckets[card.kind] ?? buckets[CARD_KINDS[0]];
      bucket.push(card);
    });
    return buckets;
  }, [cards]);

  // Listen for delete events from child components
  useEffect(() => {
    const handleDeleteCard = (e: Event) => {
      const customEvent = e as CustomEvent;
      setSelectedCardId(customEvent.detail.cardId);
      setOpenDeleteConfirm(true);
    };

    window.addEventListener('deleteCard', handleDeleteCard);
    return () => window.removeEventListener('deleteCard', handleDeleteCard);
  }, []);

  const confirmDelete = async () => {
    if (selectedCardId) {
      try {
        await deleteCard({ variables: { input: { cardId: selectedCardId } } });
        await refetch();
        toast.success('Card deleted successfully');
      } catch {
        toast.error('Failed to delete card');
      }
      setOpenDeleteConfirm(false);
      setSelectedCardId(null);
    }
  };

  const confirmDeleteRegistry = async () => {
    if (!registryToDelete) return;

    try {
      const result = await deleteRegistry({ variables: { externalId: registryToDelete } });
      const payload = result.data?.deleteRegistry;
      if (payload?.success) {
        await refetchRegistries();
        toast.success('Registry deleted');
      } else {
        toast.error(payload?.errors?.[0] ?? 'Failed to delete registry');
      }
    } catch {
      toast.error('Failed to delete registry');
    }
    setRegistryToDelete(null);
  };

  const handleCardShareClick = (cardId: string) => {
    setSelectedCardId(cardId);
    setSelectedItemType('card');
    setShareDialogOpen(true);
  };

  const handleInvitationShareClick = (invitationId: string) => {
    setSelectedCardId(invitationId);
    setSelectedItemType('invitation');
    setShareDialogOpen(true);
  };

  if (organizationLoading || (loading && invitationsLoading)) return <LoadingScreen />;
  if (error) return <ErrorScreen />;

  // Registries are personal-only, so they drop out of an organization's dashboard.
  const visibleProducts = products.filter(product => product.id !== 'registry' || showRegistryTab);
  const countFor: Record<ProductId, number> = {
    group: cardsByKind.group.length,
    one_on_one: cardsByKind.one_on_one.length,
    invitation: invitations.length,
    registry: showRegistryTab ? registries.length : 0,
  };
  const totalCount = visibleProducts.reduce((sum, product) => sum + countFor[product.id], 0);
  const populated = visibleProducts.filter(product => countFor[product.id] > 0);

  // Default view: "All" once there's more than one kind of thing to show; otherwise open
  // straight onto the one product the user actually uses. An explicit ?view= always wins.
  const validViews: string[] = ['all', ...visibleProducts.map(product => product.dashboardView)];
  const defaultView = populated.length === 1 ? populated[0].dashboardView : ('all' as const);
  const activeView = viewParam && validViews.includes(viewParam) ? viewParam : defaultView;

  const sidebarItems: SidebarItem[] = [
    { view: 'all', label: 'All', count: totalCount },
    ...visibleProducts.map(product => ({
      view: product.dashboardView,
      label: product.label,
      count: countFor[product.id],
      colorVar: product.colorVar,
      softColorVar: product.softColorVar,
    })),
  ];

  const renderList = (product: ProductId, limit?: number) => {
    switch (product) {
      case 'group':
      case 'one_on_one':
        return (
          <CardsList
            cards={cardsByKind[product]}
            onRefetch={refetch}
            onShareClick={handleCardShareClick}
            onQrClick={setQrCardId}
            limit={limit}
            currentUserId={user?.user_id ?? null}
          />
        );
      case 'invitation':
        return (
          <InvitationsList
            invitations={invitations}
            onRefetch={refetchInvitations}
            onShareClick={handleInvitationShareClick}
            limit={limit}
          />
        );
      case 'registry':
        return (
          <RegistriesList registries={registries} onDelete={setRegistryToDelete} limit={limit} />
        );
    }
  };

  const renderSection = (product: ProductId, preview: boolean) => {
    const { dashboardView } = productById[product];
    const { title, description } = emptyCopy(product, organizationName);
    return (
      <ProductSection
        key={product}
        product={product}
        count={countFor[product]}
        emptyTitle={title}
        emptyDescription={description}
        seeAllHref={preview ? `/dashboard?view=${dashboardView}` : undefined}
        shown={preview ? ALL_VIEW_LIMIT : undefined}
      >
        {renderList(product, preview ? ALL_VIEW_LIMIT : undefined)}
      </ProductSection>
    );
  };

  const activeProduct = visibleProducts.find(product => product.dashboardView === activeView);

  return (
    <div className="flex flex-col flex-grow min-h-[calc(100vh-4rem)]">
      <Toaster />

      {totalCount === 0 ? (
        <div className="relative flex flex-grow flex-col items-center overflow-hidden px-4 pt-12 pb-40 text-center sm:pt-16">
          <Sun className="animate-float mb-4 w-20 sm:w-24" />
          <h1 className="text-4xl text-foreground sm:text-5xl">
            {organizationName ? (
              `Nothing in ${organizationName} yet`
            ) : (
              <>
                Welcome to <span className="marker-swipe">Felicito</span>
              </>
            )}
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            {organizationName
              ? `Make something — everyone in ${organizationName} will see it here.`
              : 'What are we celebrating? Pick a place to start.'}
          </p>
          <div className="relative z-10 mt-8 grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
            {visibleProducts.map(product => (
              <CreateProductButton
                key={product.id}
                product={product.id}
                className="w-full justify-start"
              />
            ))}
          </div>
          <Hills className="absolute inset-x-0 bottom-0 h-28 sm:h-36" />
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-7xl gap-10 px-4 py-6 sm:px-6 md:py-10">
          <DashboardSidebar
            items={sidebarItems}
            activeView={activeView}
            organizationName={organizationName}
          />

          <div className="min-w-0 flex-1">
            <DashboardMobileBar
              items={sidebarItems}
              activeView={activeView}
              organizationName={organizationName}
            />

            <header className="mb-8">
              <h1 className="text-3xl text-foreground sm:text-4xl">
                {organizationName ? `${organizationName} creations` : 'Your creations'}
              </h1>
              {organizationName && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Shared with everyone in {organizationName}.
                </p>
              )}
            </header>

            {activeProduct ? (
              renderSection(activeProduct.id, false)
            ) : (
              <div className="flex flex-col gap-14">
                {populated.map(product => renderSection(product.id, true))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Registry delete confirmation: its own copy, since guests' claims go with it. */}
      <Dialog open={!!registryToDelete} onOpenChange={open => !open && setRegistryToDelete(null)}>
        <DialogContent className="p-6 w-96">
          <DialogHeader>
            <DialogTitle>Delete this registry?</DialogTitle>
          </DialogHeader>
          <p>
            Its items, cash options, and anything guests have already claimed go with it. This
            action cannot be undone.
          </p>
          <div className="flex justify-end space-x-4 mt-4">
            <Button variant="outline" onClick={() => setRegistryToDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteRegistry}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <ShareDialog
        open={shareDialogOpen && !!selectedCardId}
        onOpenChange={setShareDialogOpen}
        cardId={selectedCardId || ''}
        slug={
          selectedItemType === 'card'
            ? data?.userCards?.find((c: { externalId: string }) => c.externalId === selectedCardId)
                ?.slug
            : invitationsData?.userInvitations?.find(
                (i: { externalId: string }) => i.externalId === selectedCardId
              )?.slug
        }
        type={selectedItemType}
        isOneOnOne={
          selectedItemType === 'card' &&
          data?.userCards?.find((c: { externalId: string }) => c.externalId === selectedCardId)
            ?.kind === 'one_on_one'
        }
      />

      {/* QR Code Dialog */}
      {qrCardId && (
        <CardQrCode cardExternalId={qrCardId} open={true} onClose={() => setQrCardId(null)} />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteConfirm} onOpenChange={setOpenDeleteConfirm}>
        <DialogContent className="p-6 w-96">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this card? This action cannot be undone.</p>
          <div className="flex justify-end space-x-4 mt-4">
            <Button variant="outline" onClick={() => setOpenDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default withAuth(Dashboard);
