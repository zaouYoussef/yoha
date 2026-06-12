import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MenuCategory, MenuItem } from '../../lib/api';
import { MenuItemCard } from '../ui/MenuItemCard';
import { brand, ink, radius } from '../../theme';
import { fonts } from '../../theme/fonts';

type Props = {
  category: MenuCategory;
  onItemPress: (item: MenuItem) => void;
  onItemAdd: (item: MenuItem) => void;
  orderingDisabled?: boolean;
};

export function MenuCategorySection({ category, onItemPress, onItemAdd, orderingDisabled = false }: Props) {
  const count = category.items?.length ?? 0;

  return (
    <View style={styles.wrap}>
      <LinearGradient colors={[brand[50], '#fff', '#fff']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <View>
          <Text style={styles.title}>{category.name}</Text>
          <Text style={styles.sub}>{count} plat{count > 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{count}</Text>
        </View>
      </LinearGradient>

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radius.xl,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: brand[100],
  },
  title: { fontFamily: fonts.display, fontSize: 22, color: ink[900], letterSpacing: -0.5 },
  sub: { fontFamily: fonts.medium, fontSize: 12, color: ink[500], marginTop: 2 },
  countBadge: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: brand[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { fontFamily: fonts.extrabold, fontSize: 14, color: brand[700] },
});
