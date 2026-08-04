import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MenuCategory, MenuItem } from '../../lib/api';
import { MenuItemCard } from '../ui/MenuItemCard';
import { brand, ink } from '../../theme';
import { fonts } from '../../theme/fonts';

const CUISINE_EMOJI: Record<string, string> = {
  pizza: '🍕', tacos: '🌮', kebab: '🥙', sushi: '🍣', burger: '🍔',
  healthy: '🥗', asian: '🥢', dessert: '🍰', drinks: '🥤',
  pharmacy: '💊', parapharmacy: '🌿', supermarket: '🛒', shop: '🛍️', medical: '⚕️',
  patisserie: '🥐',
};

type Props = {
  category: MenuCategory;
  onItemPress: (item: MenuItem) => void;
  onItemAdd: (item: MenuItem) => void;
  orderingDisabled?: boolean;
  cuisine?: string;
};

export function MenuCategorySection({ category, onItemPress, onItemAdd, orderingDisabled = false, cuisine }: Props) {
  const count = category.items?.length ?? 0;
  const emoji = CUISINE_EMOJI[cuisine || ''] || '';

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {emoji ? `${emoji} ${category.name}` : category.name}
          <Text style={styles.countInline}>
            {`  ${count} plat${count > 1 ? 's' : ''}`}
          </Text>
        </Text>
        <View style={styles.underline} />
      </View>

      {(category.items || []).map((item) => (
        <MenuItemCard
          key={item.id}
          item={item}
          onPress={() => onItemPress(item)}
          onAdd={() => onItemAdd(item)}
          orderingDisabled={orderingDisabled}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 8 },
  header: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: { fontFamily: fonts.display, fontSize: 22, color: ink[900], letterSpacing: -0.5 },
  countInline: { fontFamily: fonts.medium, fontSize: 12, color: ink[500] },
  underline: {
    marginTop: 8,
    height: 4,
    width: 40,
    borderRadius: 999,
    backgroundColor: brand[500],
  },
});
