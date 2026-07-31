import React, { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { STATIC_STORES } from '../../../src/data/staticStores';
import { storeEtaMin, storeHook, storeToRestaurant } from '../../../src/lib/staticStore';
import { Screen, ScreenHeader } from '../../../src/components/yoha/Screen';
import { VendorCard } from '../../../src/components/yoha/Cards';
import { StickyCartBar } from '../../../src/components/yoha/StickyCartBar';
import { Rise } from '../../../src/components/yoha/Motion';
import { Body, Display } from '../../../src/components/yoha/Type';
import { useLayoutChrome } from '../../../src/lib/layoutChrome';

const CUISINES: Record<string, { label: string; emoji: string }> = {
  pharmacy: { label: 'Pharmacies', emoji: 'ðŸ’Š' },
  parapharmacy: { label: 'Parapharmacies', emoji: 'ðŸŒ¿' },
  dessert: { label: 'PÃ¢tisseries', emoji: 'ðŸ¥' },
  supermarket: { label: 'SupermarchÃ©s', emoji: 'ðŸ›’' },
  shop: { label: 'Magasins', emoji: 'ðŸ›ï¸' },
};

export default function StoresByCuisine() {
  const { cuisine } = useLocalSearchParams<{ cuisine: string }>();
  const { scrollBottomPadding } = useLayoutChrome();

  const stores = useMemo(() => STATIC_STORES.filter((s) => s.cuisine === cuisine), [cuisine]);
  const meta = CUISINES[cuisine ?? ''] ?? null;

  return (
    <Screen>
      <ScreenHeader title={meta?.label ?? 'Stores'} onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: scrollBottomPadding + 16 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Body size="caption" tone="dim">
            {meta?.emoji ?? ''} {stores.length} Ã©tablissement{stores.length > 1 ? 's' : ''} â€” livraison 20 DH
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
                  onPress={() =>
                    router.push({
                      pathname: '/(client)/store/[id]',
                      params: { id: s.id },
                    })
                  }
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
              Aucune enseigne pour cette catÃ©gorie pour le moment.
            </Body>
          </View>
        )}
      </ScrollView>

      <StickyCartBar />
    </Screen>
  );
}
