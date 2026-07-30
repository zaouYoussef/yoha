import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients, ink, radius, shadows } from '../theme';

interface LoyaltyStreakCardProps {
  points?: number;
  streakCount?: number;
  level?: string;
}

export function LoyaltyStreakCard({ points = 120, streakCount = 3, level = 'Argent 🥈' }: LoyaltyStreakCardProps) {
  return (
    <LinearGradient
      colors={gradients.hero}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.topRow}>
        <View>
          <Text style={styles.levelTag}>Programme Fidélité CHU</Text>
          <Text style={styles.levelTitle}>Niveau {level}</Text>
        </View>
        <View style={styles.ptsBadge}>
          <Text style={styles.ptsValue}>{points} Pts</Text>
        </View>
      </View>

      <View style={styles.streakRow}>
        <Text style={styles.streakIcon}>🔥</Text>
        <View style={styles.streakInfo}>
          <Text style={styles.streakTitle}>Série de la semaine : {streakCount} commandes</Text>
          <Text style={styles.streakSub}>Plus que 1 commande pour débloquer votre dessert offert ! 🍰</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },

  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  levelTag: { color: 'rgba(255,255,255,0.8)', fontWeight: '600', fontSize: 11, textTransform: 'uppercase' },
  levelTitle: { color: '#ffffff', fontWeight: '900', fontSize: 18, marginTop: 2 },
  ptsBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  ptsValue: { color: '#ffffff', fontWeight: '800', fontSize: 13 },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 10,
    borderRadius: radius.lg,
  },
  streakIcon: { fontSize: 22, marginRight: 10 },
  streakInfo: { flex: 1 },
  streakTitle: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  streakSub: { color: 'rgba(255,255,255,0.85)', fontSize: 11, marginTop: 2 },
});
