import React, { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, TextInput, View } from 'react-native';
import { restaurantsApi, type MenuCategory, type MenuItem } from '../../src/lib/api';
import { useRestaurantMe } from '../../src/hooks/useRestaurantMe';
import { useLayoutChrome } from '../../src/lib/layoutChrome';
import { accent, line, radius, surface } from '../../src/theme';
import { Screen } from '../../src/components/yoha/Screen';
import { Body, Display, Label, Money } from '../../src/components/yoha/Type';
import { Chip, Glyph, Hairline, Pill, SectionHeader, Skeleton } from '../../src/components/yoha/Atoms';
import { EmberButton, OutlineButton } from '../../src/components/yoha/EmberButton';
import { OpsCard, OpsEmpty, OpsField, OpsHeader } from '../../src/components/yoha/Ops';
import { Sheet } from '../../src/components/yoha/Sheet';

export default function RestaurantMenu() {
  const { restaurant, loading: loadingResto, error: restoError } = useRestaurantMe();
  const { scrollBottomPadding } = useLayoutChrome();

  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      if (restaurant) {
        const data = await restaurantsApi.get(restaurant.slug);
        setCategories(data.menu ?? []);
      }
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [restaurant]);

  useEffect(() => { void load(); }, [load]);

  const [creatingCat, setCreatingCat] = useState(false);
  const [catName, setCatName] = useState('');

  const [editingItem, setEditingItem] = useState<{ catId: string; catDbId?: number; item?: MenuItem } | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemDesc, setItemDesc] = useState('');

  const createCategory = useCallback(async () => {
    if (!catName.trim()) return;
    setBusy('cat');
    try {
      await restaurantsApi.createCategory({ name: catName.trim() });
      setCatName('');
      setCreatingCat(false);
      await load();
    } finally {
      setBusy(null);
    }
  }, [catName, load]);

  const openItemEditor = useCallback((catId: string, catDbId?: number, item?: MenuItem) => {
    setEditingItem({ catId, catDbId, item });
    setItemName(item?.name ?? '');
    setItemPrice(item ? String(Number(item.price) || 0) : '');
    setItemDesc(item?.desc ?? '');
  }, []);

  const saveItem = useCallback(async () => {
    if (!editingItem || !itemName.trim() || !itemPrice.trim()) return;
    const price = parseFloat(itemPrice.replace(',', '.'));
    if (!Number.isFinite(price) || price <= 0) { Alert.alert('Prix invalide'); return; }
    setBusy('item');
    try {
      const payload = { name: itemName.trim(), price, desc: itemDesc.trim() };
      if (editingItem.item?.dbId) {
        await restaurantsApi.updateMenuItem(editingItem.item.dbId, payload);
      } else if (editingItem.catDbId) {
        await restaurantsApi.createMenuItem(editingItem.catDbId, payload);
      }
      setEditingItem(null);
      await load();
    } finally {
      setBusy(null);
    }
  }, [editingItem, itemName, itemPrice, itemDesc, load]);

  const deleteItem = useCallback(async (dbId: number, name: string) => {
    Alert.alert(`Supprimer ${name} ?`, 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        setBusy(`del-${dbId}`);
        try {
          await restaurantsApi.deleteMenuItem(dbId);
          await load();
        } finally {
          setBusy(null);
        }
      }},
    ]);
  }, [load]);

  if ((loading || loadingResto) && !categories.length) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={{ padding: 18, gap: 12 }}>
          <Skeleton height={60} />
          <Skeleton height={200} />
          <Skeleton height={200} />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: scrollBottomPadding }}
        refreshControl={
          <RefreshControl refreshing={refreshing} tintColor={accent.ember}
            onRefresh={() => { setRefreshing(true); void load(); }}
          />
        }
      >
        <OpsHeader kicker={restaurant?.name ?? 'Cuisine'} title="Carte" />

        {restoError ? (
          <Body size="small" tone="ember" style={{ paddingHorizontal: 18, marginTop: 16 }}>
            {restoError}
          </Body>
        ) : null}

        <View style={{ paddingHorizontal: 18, marginTop: 20, gap: 12 }}>
          {!categories.length ? (
            <OpsEmpty title="Carte vide" line="Ajoute une catégorie, puis des plats." />
          ) : categories.map((cat, ci) => (
            <View key={cat.id || String(ci)}>
              <SectionHeader kicker={cat.name} title="" />
              <OpsCard>
                {cat.items.length === 0 ? (
                  <Body size="caption" tone="dim" style={{ paddingVertical: 8 }}>
                    Aucun plat dans cette catégorie.
                  </Body>
                ) : cat.items.map((item, ii) => (
                  <View key={item.id || String(ii)}>
                    {ii > 0 ? <Hairline style={{ marginVertical: 10 }} /> : null}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Body size="small" weight="semibold" numberOfLines={1}>
                          {item.name}
                        </Body>
                        {item.desc ? (
                          <Body size="caption" tone="dim" numberOfLines={1} style={{ marginTop: 2 }}>
                            {item.desc}
                          </Body>
                        ) : null}
                        <View style={{ marginTop: 4 }}>
                          <Money value={Number(item.price) || 0} size={13} tone="fog" />
                        </View>
                      </View>
                          <Chip label="Modifier" onPress={() => openItemEditor(cat.id, cat.dbId, item)} />
                      {item.dbId ? (
                        <Chip
                          label="✕"
                          active
                          onPress={() => void deleteItem(item.dbId!, item.name)}
                        />
                      ) : null}
                    </View>
                  </View>
                ))}
                <View style={{ marginTop: 12 }}>
                    <OutlineButton
                            label={busy === `add-${cat.id}` ? 'Ajout…' : '+ Ajouter un plat'}
                            onPress={() => { setBusy(`add-${cat.id}`); openItemEditor(cat.id, cat.dbId); setBusy(null); }}
                          />
                </View>
              </OpsCard>
            </View>
          ))}

          <View style={{ marginTop: 8 }}>
            <EmberButton
              label={creatingCat ? 'Créer…' : busy === 'cat' ? 'Création…' : '+ Nouvelle catégorie'}
              loading={busy === 'cat'}
              disabled={busy === 'cat'}
              onPress={() => setCreatingCat(true)}
            />
          </View>
        </View>
      </ScrollView>

      <Sheet visible={creatingCat} onClose={() => { setCreatingCat(false); setCatName(''); }}>
        <View style={{ paddingHorizontal: 18, gap: 14 }}>
          <Display size="h2">Nouvelle catégorie</Display>
          <TextInput
            value={catName}
            onChangeText={setCatName}
            placeholder="Ex: Entrées, Burgers, Boissons…"
            placeholderTextColor={line.strong}
            style={{
              padding: 14, borderRadius: radius.lg, backgroundColor: surface.ash,
              color: '#fff', fontSize: 16, borderWidth: 1, borderColor: line.soft,
            }}
          />
          <EmberButton label="Créer" disabled={!catName.trim() || busy === 'cat'} onPress={() => void createCategory()} />
        </View>
      </Sheet>

      <Sheet visible={!!editingItem} onClose={() => setEditingItem(null)}>
        <View style={{ paddingHorizontal: 18, gap: 14 }}>
          <Display size="h2">{editingItem?.item ? 'Modifier le plat' : 'Nouveau plat'}</Display>
          <TextInput
            value={itemName}
            onChangeText={setItemName}
            placeholder="Nom du plat"
            placeholderTextColor={line.strong}
            style={{
              padding: 14, borderRadius: radius.lg, backgroundColor: surface.ash,
              color: '#fff', fontSize: 16, borderWidth: 1, borderColor: line.soft,
            }}
          />
          <TextInput
            value={itemPrice}
            onChangeText={setItemPrice}
            placeholder="Prix (MAD)"
            placeholderTextColor={line.strong}
            keyboardType="decimal-pad"
            style={{
              padding: 14, borderRadius: radius.lg, backgroundColor: surface.ash,
              color: '#fff', fontSize: 16, borderWidth: 1, borderColor: line.soft,
            }}
          />
          <TextInput
            value={itemDesc}
            onChangeText={setItemDesc}
            placeholder="Description (optionnelle)"
            placeholderTextColor={line.strong}
            multiline
            numberOfLines={3}
            style={{
              padding: 14, borderRadius: radius.lg, backgroundColor: surface.ash,
              color: '#fff', fontSize: 16, borderWidth: 1, borderColor: line.soft,
            }}
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <EmberButton
                label={busy === 'item' ? 'Enregistrement…' : 'Enregistrer'}
                loading={busy === 'item'}
                disabled={busy === 'item' || !itemName.trim() || !itemPrice.trim()}
                onPress={() => void saveItem()}
              />
            </View>
          </View>
        </View>
      </Sheet>
    </Screen>
  );
}
