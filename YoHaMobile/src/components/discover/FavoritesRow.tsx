import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Restaurant } from '../../lib/api';
import { ink } from '../../theme';
import { fonts } from '../../theme/fonts';
import { CompactRestaurantCard } from './CompactRestaurantCard';

export function FavoritesRow({ restaurants }: { restaurants: Restaurant[] }) {
  if (!restaurants.length) return null;

  return (
    <View>
      <View style={styles.head}>
        <Text style={styles.title}>❤️ Tes favoris</Text>
        <Text style={styles.sub}>Retrouve tes adresses préférées</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {restaurants.map((r) => (
          <CompactRestaurantCard
            key={r.slug}
            restaurant={r}
            onPress={() => router.push(`/(client)/restaurant/${r.slug}` as never)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { marginBottom: 14, marginTop: 4 },
  title: { fontFamily: fonts.display, fontSize: 22, color: ink[900], letterSpacing: -0.5 },
  sub: { fontFamily: fonts.medium, fontSize: 13, color: ink[500], marginTop: 4 },
  row: { paddingRight: 20, paddingBottom: 4 },
});
