import React, { useCallback, useMemo, useState } from 'react';
import { Linking, RefreshControl, ScrollView, View } from 'react-native';
import { copyText } from '../../src/lib/copyText';
import { ordersApi, type Order } from '../../src/lib/api';

import { useCourierMe } from '../../src/hooks/useCourierMe';
import { useOrders } from '../../src/hooks/useOrders';
import { useLayoutChrome } from '../../src/lib/layoutChrome';
import { buildOrderCopyText, whatsAppUrl } from '../../src/lib/courierOrder';
import { orderFoodTotal, sortOrdersNewest } from '../../src/lib/restaurantOrder';
import { accent } from '../../src/theme';
import { Screen } from '../../src/components/yoha/Screen';
import { Body, Display, Money } from '../../src/components/yoha/Type';
import { Pill, Skeleton, StepBar } from '../../src/components/yoha/Atoms';
import { Rise } from '../../src/components/yoha/Motion';
import { EmberButton } from '../../src/components/yoha/EmberButton';
import {
  OpsAction,
  OpsCard,
  OpsEmpty,
  OpsField,
  OpsHeader,
  OpsItems,
} from '../../src/components/yoha/Ops';

/**
 * Le livreur n'a qu'une question en tête : « je fais quoi maintenant ? ».
 * Chaque carte n'expose donc qu'une seule action suivante, en gros.
 */
const NEXT: Record<string, { label: string; status: string; hint: string; step: number }> = {
  placed: {
    label: 'Je suis au restaurant',
    status: 'pickup_confirmed',
    hint: 'Direction la cuisine.',
    step: 0,
  },
  pickup_confirmed: {
    label: 'Commande récupérée',
    status: 'delivering',
    hint: 'Attends que la cuisine te tende le sac.',
    step: 1,
  },
  preparing: {
    label: 'Commande récupérée',
    status: 'delivering',
    hint: 'Le sac est prêt au comptoir.',
    step: 1,
  },
  delivering: {
    label: 'Livré au client',
    status: 'delivered',
    hint: 'Encaisse puis valide.',
    step: 2,
  },
};

export default function CourierMine() {
  const { courier } = useCourierMe();
  const { orders, loading, refresh } = useOrders(8000);
  const { scrollBottomPadding } = useLayoutChrome();
  const [busy, setBusy] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const mine = useMemo(() => {
    const id = String(courier?.id ?? '');
    if (!id) return [];
    return sortOrdersNewest(
      orders.filter(
        (o) =>
          String(o.courierId ?? '') === id && o.status !== 'delivered' && o.status !== 'cancelled',
      ),
    );
  }, [orders, courier]);

  const advance = useCallback(
    async (order: Order) => {
      const next = NEXT[order.status];
      if (!next) return;
      setBusy(order.id);
      try {
        await ordersApi.updateStatus(order.id, next.status);
        await refresh();
      } finally {
        setBusy(null);
      }
    },
    [refresh],
  );

  const copy = useCallback(async (order: Order) => {
    await copyText(buildOrderCopyText(order));
    setCopied(order.id);
    setTimeout(() => setCopied(null), 1600);
  }, []);


  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: scrollBottomPadding }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={accent.violet}
            onRefresh={async () => {
              setRefreshing(true);
              await refresh();
              setRefreshing(false);
            }}
          />
        }
      >
        <OpsHeader
          kicker="En main"
          title="Mes courses"
          live={mine.length ? `${mine.length} active` : undefined}
          tone="violet"
        />

        {loading && !orders.length ? (
          <View style={{ padding: 18, gap: 12 }}>
            <Skeleton height={180} />
          </View>
        ) : !mine.length ? (
          <OpsEmpty
            title="Guidon libre"
            line="Aucune course en main. Passe sur « À prendre » : les cuisines lancent en continu."
          />
        ) : (
          <View style={{ paddingHorizontal: 18, gap: 12, marginTop: 20 }}>
            {mine.map((o, i) => (
              <Rise key={o.id} delay={i * 55}>
                <ActiveMission
                  order={o}
                  busy={busy === o.id}
                  copied={copied === o.id}
                  onAdvance={() => void advance(o)}
                  onCopy={() => void copy(o)}
                />
              </Rise>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function ActiveMission({
  order,
  busy,
  copied,
  onAdvance,
  onCopy,
}: {
  order: Order;
  busy: boolean;
  copied: boolean;
  onAdvance: () => void;
  onCopy: () => void;
}) {
  const next = NEXT[order.status];
  const wa = whatsAppUrl(order.customer?.phone, buildOrderCopyText(order));

  return (
    <OpsCard accented tone="violet">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Pill tone="mint">{`#${order.id}`}</Pill>
        <View style={{ flex: 1 }} />
        <Money value={orderFoodTotal(order)} size={14} tone="fog" />
      </View>

      <Display size="h3" style={{ marginTop: 10 }} numberOfLines={1}>
        {order.restaurantName ?? 'Restaurant'}
      </Display>

      <View style={{ marginTop: 12, width: 120 }}>
        <StepBar total={3} current={next?.step ?? 2} tone="violet" />
      </View>

      <Body size="caption" tone="dim" style={{ marginTop: 8 }}>
        {next?.hint ?? 'Course terminée.'}
      </Body>

      <OpsField label="Client" value={order.customer?.name} />
      <OpsField label="Adresse" value={order.customer?.address} />
      <OpsField label="Tél" value={order.customer?.phone} />

      <OpsItems items={order.items} />

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
        <OpsAction
          label="Appeler"
          glyph="phone"
          disabled={!order.customer?.phone}
          onPress={() => void Linking.openURL(`tel:${order.customer?.phone}`)}
        />
        <OpsAction
          label="WhatsApp"
          glyph="chat"
          tone="mint"
          disabled={!wa}
          onPress={() => wa && void Linking.openURL(wa)}
        />
        <OpsAction label={copied ? 'Copié' : 'Copier'} glyph="copy" onPress={onCopy} />
      </View>

      {next ? (
        <View style={{ marginTop: 10 }}>
          <EmberButton
            label={busy ? 'Envoi.' : next.label}
            loading={busy}
            disabled={busy}
            tone="violet"
            onPress={onAdvance}
          />
        </View>
      ) : null}
    </OpsCard>
  );
}
