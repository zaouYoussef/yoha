import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { STATIC_STORES, type StaticStore } from '../../../src/data/staticStores';
import { storeEtaMin, storeHook, storeToRestaurant } from '../../../src/lib/staticStore';
import { apiFetch } from '../../../src/lib/api';
import { Screen, ScreenHeader } from '../../../src/components/yoha/Screen';
import { VendorCard } from '../../../src/components/yoha/Cards';
import { StickyCartBar } from '../../../src/components/yoha/StickyCartBar';
import { Rise } from '../../../src/components/yoha/Motion';
import { Body, Display } from '../../../src/components/yoha/Type';
import { useLayoutChrome } from '../../../src/lib/layoutChrome';

const CUISINES: Record<string, { label: string; emoji: string }> = {
  pharmacy: { label: 'Pharmacies', emoji: '💊' },
  parapharmacy: { label: 'Parapharmacies', emoji: '🌿' },
  dessert: { label: 'Pâtisseries', emoji: '🥐' },
  supermarket: { label: 'Supermarchés', emoji: '🛒' },
  shop: { label: 'Magasins', emoji: '🛍️' },
};

type DutyPharmacy = {
  id?: number;
  slug: string;
  name: string;
  name_ar?: string;
  phone: string;
  address: string;
  address_ar?: string;
  lat: number | null;
  lng: number | null;
  guard: string;
  hours_label: string;
};

const PHARMACY_COVER_POOL = [
  'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=800&auto=format&fit=crop&q=80',
];

function dutyCover(key: string): string {
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PHARMACY_COVER_POOL[h % PHARMACY_COVER_POOL.length];
}

function dutyToStore(p: DutyPharmacy): StaticStore {
  const guard = p.guard === '24h' ? '24h' : p.guard || '24h';
  return {
    id: `duty-${p.slug || String(p.id ?? '')}`,
    name: p.name,
    cuisine: 'pharmacy',
    rating: 4.9,
    reviewsCount: 1,
    distance: p.address?.slice(0, 46) || 'Tanger',
    eta: '30-45 min',
    fee: '20 DH',
    cover: dutyCover(p.slug || String(p.id ?? '')),
    logo: '💊',
    description: p.address || 'Pharmacie de garde',
    tags: [`Garde ${guard}`, 'Pharmacie de garde'],
    isOpen: true,
    isStatic: true,
  };
}

export default function StoresByCuisine() {
  const { cuisine } = useLocalSearchParams<{ cuisine: string }>();
  const { scrollBottomPadding } = useLayoutChrome();
  const [duty, setDuty] = useState<DutyPharmacy[]>([]);

  useEffect(() => {
    if (cuisine !== 'pharmacy') return;
    let cancelled = false;
    apiFetch<DutyPharmacy[]>('/pharmacies/duty/', { auth: false })
      .then((list) => {
        if (!cancelled && Array.isArray(list)) setDuty(list);
      })
      .catch(() => {
        if (!cancelled) setDuty([]);
      });
    return () => {
      cancelled = true;
    };
  }, [cuisine]);

  const stores = useMemo(() => {
    const base = STATIC_STORES.filter((s) => s.cuisine === cuisine);
    return cuisine === 'pharmacy' ? [...base, ...duty.map(dutyToStore)] : base;
  }, [cuisine, duty]);
  const meta = CUISINES[cuisine ?? ''] ?? null;

  const onPress = (s: StaticStore) => {
    if (!s.id.startsWith('duty-')) {
      router.push({
        pathname: '/(client)/store/[id]',
        params: { id: s.id },
      });
      return;
    }
    const slug = s.id.replace(/^duty-/, '');
    const p = duty.find((d) => d.slug === slug) ?? duty.find((d) => d.name === s.name);
    if (!p) return;
    const phone = (p.phone || '').replace(/\s/g, '');
    const maps = p.lat && p.lng ? `https://www.google.com/maps?q=${p.lat},${p.lng}` : null;
    const hoursFr = (p.hours_label || '').split('حراسة')[0].trim();
    const body = [
      p.address || '',
      p.address_ar ? `\n${p.address_ar}` : '',
      p.phone ? `\n${p.phone}` : '',
      hoursFr ? `\n${hoursFr}` : '',
    ].join('');
    const buttons = [
      phone
        ? { text: '📞 Appeler', onPress: () => void Linking.openURL(`tel:${phone}`) }
        : null,
      maps
        ? { text: '🧭 Itinéraire', onPress: () => void Linking.openURL(maps) }
        : null,
      { text: 'Fermer', style: 'cancel' as const },
    ].filter(Boolean) as {
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }[];
    Alert.alert(`${p.name} ${p.guard === '24h' ? '— 24h' : ''}`, body, buttons);
  };

  return (
    <Screen>
      <ScreenHeader title={meta?.label ?? 'Stores'} onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: scrollBottomPadding + 16 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Body size="caption" tone="dim">
            {meta?.emoji ?? ''} {stores.length} établissement{stores.length > 1 ? 's' : ''} — livraison 20 DH
          </Body>
        </View>

        {stores.length ? (
          <View style={{ gap: 14 }}>
            {stores.map((s, i) => (
              <Rise key={s.id} delay={i * 50}>
                <VendorCard
                  restaurant={storeToRestaurant(s)}
                  eta={storeEtaMin(s)}
                  hook={storeHook(s)}
                  onPress={() => onPress(s)}
                />
              </Rise>
            ))}
          </View>
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 46, gap: 10 }}>
            <Display size="h2" tone="fog">
              Rien ici
            </Display>
            <Body size="small" tone="dim" style={{ textAlign: 'center', maxWidth: 250 }}>
              Aucune enseigne pour cette catégorie pour le moment.
            </Body>
          </View>
        )}
      </ScrollView>

      <StickyCartBar />
    </Screen>
  );
}
