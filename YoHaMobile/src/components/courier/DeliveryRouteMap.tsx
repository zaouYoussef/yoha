import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ink, radius } from '../../theme';
import { fonts } from '../../theme/fonts';

/** Carte trajet décorative (statique, comme le site web). */
export function DeliveryRouteMap() {
  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={['#e0f2fe', '#e0e7ff']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.row}>
        <View style={styles.point}>
          <View style={[styles.dot, styles.dotResto]} />
          <Text style={styles.pointLabel}>Resto</Text>
        </View>
        <View style={styles.path}>
          <View style={styles.dashLine} />
          <Text style={styles.scooter}>🛵</Text>
        </View>
        <View style={styles.point}>
          <View style={[styles.dot, styles.dotClient]} />
          <Text style={styles.pointLabel}>Client</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 14,
    height: 112,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ink[200],
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  point: { alignItems: 'center', width: 52 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  dotResto: { backgroundColor: '#ec4899' },
  dotClient: { backgroundColor: '#10b981' },
  pointLabel: {
    marginTop: 4,
    fontSize: 9,
    fontFamily: fonts.bold,
    color: ink[600],
  },
  path: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 40,
  },
  dashLine: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: '50%',
    height: 2,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#f97316',
    opacity: 0.7,
  },
  scooter: { fontSize: 22 },
});
