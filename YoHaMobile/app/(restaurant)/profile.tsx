import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { RestoDashShell } from '../../src/components/restaurant-dash/RestoDashShell';
import { RestoOpeningHoursEditor } from '../../src/components/restaurant-dash/RestoOpeningHoursEditor';
import { YohaButton } from '../../src/components/ui/YohaButton';
import { useRestaurantMe } from '../../src/hooks/useRestaurantMe';
import { restaurantsApi } from '../../src/lib/api';
import {
  normalizeOpeningHours,
  type OpeningHoursMap,
} from '../../src/lib/openingHours';
import { brand, ink, radius, shadows } from '../../src/theme';
import { fonts } from '../../src/theme/fonts';

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || '—'}</Text>
    </View>
  );
}

export default function RestaurantProfile() {
  const { restaurant, loading, error, refresh } = useRestaurantMe();
  const [refreshing, setRefreshing] = useState(false);
  const [hours, setHours] = useState<OpeningHoursMap>(() => normalizeOpeningHours(undefined));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (restaurant?.openingHours) {
      setHours(normalizeOpeningHours(restaurant.openingHours));
    }
  }, [restaurant]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const saveHours = async () => {
    setSaving(true);
    setMsg('');
    try {
      await restaurantsApi.updateMe({ opening_hours: normalizeOpeningHours(hours) });
      await refresh();
      setMsg('Horaires enregistrés.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Erreur lors de l’enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  if (restaurant === undefined || loading) {
    return (
      <RestoDashShell title="Mon établissement">
        <ActivityIndicator color={brand[500]} style={{ marginTop: 40 }} />
      </RestoDashShell>
    );
  }

  if (restaurant === null) {
    return (
      <RestoDashShell title="Mon établissement">
        <View style={styles.emptyBox}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Text style={styles.emptyTitle}>Aucun établissement lié</Text>
          <Text style={styles.emptySub}>
            Créez votre restaurant sur le site web YouHa pour le gérer ici.
          </Text>
        </View>
      </RestoDashShell>
    );
  }

  return (
    <RestoDashShell title="Mon établissement" subtitle={restaurant.name}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={brand[500]} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoBanner}>
          <Text style={styles.infoText}>
            Nom, description et photos se modifient sur le site web. Les horaires ci-dessous sont
            synchronisés avec le dashboard web.
          </Text>
        </View>

        <View style={[styles.card, shadows.card]}>
          <ReadOnlyField label="Nom" value={String(restaurant.name || '')} />
          <ReadOnlyField label="Cuisine" value={String(restaurant.cuisine || '')} />
          <ReadOnlyField label="Description" value={String(restaurant.description || '')} />
          <ReadOnlyField label="Promo (badge)" value={String(restaurant.promo || '')} />
          <ReadOnlyField label="WhatsApp / téléphone" value={String(restaurant.phone || '')} />
        </View>

        <View style={[styles.card, shadows.card, { marginTop: 14 }]}>
          <Text style={styles.sectionTitle}>Horaires d&apos;ouverture</Text>
          <Text style={styles.sectionSub}>
            Les clients voient « Fermé » en dehors de ces plages (app et site).
          </Text>
          <RestoOpeningHoursEditor value={hours} onChange={setHours} disabled={saving} />
          {msg ? (
            <Text style={[styles.msg, msg.includes('Erreur') ? styles.msgErr : styles.msgOk]}>
              {msg}
            </Text>
          ) : null}
          <YohaButton
            title={saving ? 'Enregistrement…' : 'Enregistrer les horaires'}
            onPress={saveHours}
            loading={saving}
            style={{ marginTop: 14 }}
          />
        </View>
      </ScrollView>
    </RestoDashShell>
  );
}

const styles = StyleSheet.create({
  infoBanner: {
    marginBottom: 14,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: 'rgba(14,165,233,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(14,165,233,0.2)',
  },
  infoText: { fontSize: 12, fontFamily: fonts.medium, color: '#0369a1', lineHeight: 18 },
  card: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: ink[100],
  },
  field: { marginTop: 14 },
  label: { fontSize: 11, fontFamily: fonts.bold, color: ink[400], textTransform: 'uppercase', letterSpacing: 0.4 },
  value: { marginTop: 4, fontSize: 16, fontFamily: fonts.medium, color: ink[800], lineHeight: 22 },
  sectionTitle: { fontSize: 16, fontFamily: fonts.bold, color: ink[900] },
  sectionSub: { marginTop: 4, marginBottom: 12, fontSize: 12, fontFamily: fonts.medium, color: ink[500], lineHeight: 18 },
  msg: { marginTop: 12, fontSize: 13, fontFamily: fonts.medium, textAlign: 'center' },
  msgOk: { color: '#059669' },
  msgErr: { color: '#ef4444' },
  emptyBox: {
    marginTop: 24,
    padding: 20,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: ink[200],
    backgroundColor: '#fff',
  },
  emptyTitle: { fontSize: 18, fontFamily: fonts.bold, color: ink[900], textAlign: 'center' },
  emptySub: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: fonts.medium,
    color: ink[500],
    textAlign: 'center',
    lineHeight: 22,
  },
  error: { color: '#ef4444', marginBottom: 12, fontFamily: fonts.medium, textAlign: 'center' },
});
