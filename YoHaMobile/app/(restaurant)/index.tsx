import React, { useCallback, useMemo, useState } from 'react';
import { Linking, RefreshControl, ScrollView, View } from 'react-native';

import { ordersApi, type Order } from '../../src/lib/api';
import { useOrders } from '../../src/hooks/useOrders';
import { useRestaurantMe } from '../../src/hooks/useRestaurantMe';
import { useLayoutChrome } from '../../src/lib/layoutChrome';
import { RESTO_CANCEL_BEFORE, isRestaurantActiveOrder } from '../../src/lib/constants';
import {
  belongsToRestaurant,
  formatOrderWhen,
  orderFoodTotal,
  sortOrdersNewest,
} from '../../src/lib/restaurantOrder';
import { accent } from '../../src/theme';
import { Screen } from '../../src/components/yoha/Screen';
import { Body, Display, Money } from '../../src/components/yoha/Type';
import { Chip, Pill, SectionHeader, Skeleton } from '../../src/components/yoha/Atoms';
import { Rise } from '../../src/components/yoha/Motion';
import { EmberButton } from '../../src/components/yoha/EmberButton';
import { Sheet } from '../../src/components/yoha/Sheet';
import {
  OpsAction,
  OpsCard,
  OpsEmpty,
  OpsField,
  OpsHeader,
  OpsItems,
} from '../../src/components/yoha/Ops';

export default function RestaurantOrders() {
  const { restaurant, loading: loadingResto, error, restoId } = useRestaurantMe();
  const { orders, loading, refresh } = useOrders(8000);
  const { scrollBottomPadding } = useLayoutChrome();

  const [busy, setBusy] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState<Order | null>(null);
  const [reason, setReason] = useState(RESTO_CANCEL_BEFORE[0]);

  const mine = useMemo(
    () => sortOrdersNewest(orders.filter((o) => belongsToRestaurant(o, restoId))),
    [orders, restoId],
  );

  /* Un livreur attend au comptoir : ces commandes passent avant tout. */
  const active = useMemo(() => mine.filter((o) => isRestaurantActiveOrder(o.status)), [mine]);
  const incoming = useMemo(() => mine.filter((o) => o.status === 'placed'), [mine]);
  const done = useMemo(
    () => mine.filter((o) => o.status === 'delivering' || o.status === 'delivered'),
    [mine],
  );

  const markReady = useCallback(
    async (order: Order) => {
      setBusy(order.id);
      try {
        await ordersApi.updateStatus(order.id, 'preparing');
        await refresh();
      } finally {
        setBusy(null);
      }
    },
    [refresh],
  );

  const confirmCancel = useCallback(async () => {
    if (!cancelling) return;
    setBusy(cancelling.id);
    try {
      await ordersApi.updateStatus(cancelling.id, 'cancelled', reason);
      await refresh();
      setCancelling(null);
    } finally {
      setBusy(null);
    }
  }, [cancelling, reason, refresh]);

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: scrollBottomPadding }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={accent.ember}
            onRefresh={async () => {
              setRefreshing(true);
              await refresh();
              setRefreshing(false);
            }}
          />
        }
      >
        <OpsHeader
          kicker={restaurant?.name ?? 'Cuisine'}
          title="Commandes"
          live={active.length ? `${active.length} au comptoir` : 'En service'}
        />

        {error ? (
          <Body size="small" tone="ember" style={{ paddingHorizontal: 18, marginTop: 16 }}>
            {error}
          </Body>
        ) : null}

        {(loading || loadingResto) && !mine.length ? (
          <View style={{ padding: 18, gap: 12 }}>
            <Skeleton height={160} />
            <Skeleton height={160} />
          </View>
        ) : !mine.length ? (
          <OpsEmpty
            title="Comptoir calme"
            line="Aucune commande pour le moment. L'écran se met à jour tout seul dès qu'une arrive."
          />
        ) : (
          <>
            {active.length ? (
              <>
                <SectionHeader kicker="Livreur sur place" title="À préparer" />
                <View style={{ paddingHorizontal: 18, gap: 12 }}>
                  {active.map((o, i) => (
                    <Rise key={o.id} delay={i * 55}>
                      <KitchenCard
                        order={o}
                        busy={busy === o.id}
                        onReady={() => void markReady(o)}
                        onCancel={() => {
                          setReason(RESTO_CANCEL_BEFORE[0]);
                          setCancelling(o);
                        }}
                      />
                    </Rise>
                  ))}
                </View>
              </>
            ) : null}

            {incoming.length ? (
              <>
                <SectionHeader kicker="En attente de livreur" title="Reçues" />
                <View style={{ paddingHorizontal: 18, gap: 12 }}>
                  {incoming.map((o) => (
                    <KitchenCard key={o.id} order={o} waiting />
                  ))}
                </View>
              </>
            ) : null}

            {done.length ? (
              <>
                <SectionHeader kicker="Parties" title="Récupérées" />
                <View style={{ paddingHorizontal: 18, gap: 12 }}>
                  {done.slice(0, 12).map((o) => (
                    <KitchenCard key={o.id} order={o} compact />
                  ))}
                </View>
              </>
            ) : null}
          </>
        )}
      </ScrollView>

      {/* Annuler coûte cher au client : on force à dire pourquoi. */}
      <Sheet visible={!!cancelling} onClose={() => setCancelling(null)}>
        <View style={{ paddingHorizontal: 18, paddingBottom: 8 }}>
          <Display size="h2">Annuler ?</Display>
          <Body size="small" tone="fog" style={{ marginTop: 8 }}>
            Le client est prévenu immédiatement et remboursé. Indique la raison.
          </Body>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 }}>
            {RESTO_CANCEL_BEFORE.map((r) => (
              <Chip key={r} label={r} active={reason === r} onPress={() => setReason(r)} />
            ))}
          </View>
          <View style={{ marginTop: 22 }}>
            <EmberButton
              label={busy ? 'Annulation…' : "Confirmer l'annulation"}
              loading={!!busy}
              disabled={!!busy}
              onPress={() => void confirmCancel()}
            />
          </View>
        </View>
      </Sheet>
    </Screen>
  );
}

function KitchenCard({
  order,
  busy,
  waiting,
  compact,
  onReady,
  onCancel,
}: {
  order: Order;
  busy?: boolean;
  waiting?: boolean;
  compact?: boolean;
  onReady?: () => void;
  onCancel?: () => void;
}) {
  return (
    <OpsCard accented={!waiting && !compact}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Pill tone={compact ? 'dark' : waiting ? 'dark' : 'ember'}>{`#${order.id}`}</Pill>
        <Body size="caption" tone="dim" style={{ flex: 1 }} numberOfLines={1}>
          {formatOrderWhen(order.createdAt)}
        </Body>
        <Money value={orderFoodTotal(order)} size={14} tone="fog" />
      </View>

      <Display size="h3" style={{ marginTop: 10 }} numberOfLines={1}>
        {order.customer?.name || 'Client'}
      </Display>

      {compact ? null : (
        <>
          <OpsField label="Livreur" value={order.courierName} />
          <OpsField label="Note" value={order.restaurantNotes} />
          <OpsItems items={order.items} />
        </>
      )}

      {waiting ? (
        <Body size="caption" tone="dim" style={{ marginTop: 12 }}>
          Un livreur doit d'abord accepter la course. Tu pourras lancer la cuisson ensuite.
        </Body>
      ) : null}

      {onReady ? (
        <>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
            <OpsAction
              label="Appeler le client"
              glyph="phone"
              disabled={!order.customer?.phone}
              onPress={() => void Linking.openURL(`tel:${order.customer?.phone}`)}
            />
            {onCancel ? (
              <OpsAction label="Annuler" glyph="close" tone="ember" onPress={onCancel} />
            ) : null}
          </View>
          <View style={{ marginTop: 10 }}>
            <EmberButton
              label={busy ? 'Envoi…' : 'Prête au comptoir'}
              loading={busy}
              disabled={busy}
              onPress={onReady}
            />
          </View>
        </>
      ) : null}
    </OpsCard>
  );
}
