import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Restaurant } from '../../lib/api';
import { brand, ink, radius } from '../../theme';
import { fonts } from '../../theme/fonts';
import { CompactRestaurantCard } from './CompactRestaurantCard';

export const TrendingCarousel = React.memo(function TrendingCarousel({ restaurants, title = 'Tendances' }: { restaurants: Restaurant[]; title?: string }) {
  if (!restaurants.length) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>🔥 {title}</Text>
          <Text style={styles.sub}>Top campus · mis à jour en direct</Text>
        </View>
        <LinearGradient colors={[brand[400], '#ec4899']} style={styles.badge} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Text style={styles.badgeText}>HOT</Text>
        </LinearGradient>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        decelerationRate="fast"
        snapToInterval={292}
      >
        {restaurants.slice(0, 1).map((r) => (
          <CompactRestaurantCard
            key={r.slug}
            restaurant={r}
            wide
            rank={1}
            onPress={() => router.push(`/(client)/restaurant/${r.slug}` as never)}
          />
        ))}
        {restaurants.slice(1, 6).map((r, i) => (
          <CompactRestaurantCard
            key={r.slug}
            restaurant={r}
            rank={i + 2}
            onPress={() => router.push(`/(client)/restaurant/${r.slug}` as never)}
          />
        ))}
      </ScrollView>
    </View>
  );
}, (prev, next) => {
  if (prev.title !== next.title) return false;
  if (prev.restaurants.length !== next.restaurants.length) return false;
  return prev.restaurants.every((r, idx) => r.slug === next.restaurants[idx].slug);
});

const styles = StyleSheet.create({
  wrap: { marginBottom: 20 },
  head: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginBottom: 14, marginTop: 8 },
  title: { fontFamily: fonts.display, fontSize: 24, color: ink[900], letterSpacing: -0.6 },
  sub: { fontFamily: fonts.medium, fontSize: 13, color: ink[500], marginTop: 4 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full, marginBottom: 4 },
  badgeText: { fontFamily: fonts.extrabold, fontSize: 11, color: '#fff', letterSpacing: 1 },
  row: { paddingRight: 20, paddingBottom: 4 },
});
