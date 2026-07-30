import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { brand, ink, radius, shadows } from '../theme';
import { hapticSuccess, hapticSelection } from '../lib/haptics';

const ROULETTE_SUGGESTIONS = [
  { id: '1', title: 'Tacos XL Double Viande 🌮', category: 'tacos', timeOfDay: 'evening', desc: 'Le classique des gardes nocturnes CHU Tanger.' },
  { id: '2', title: 'Pizza Royale Feu de Bois 🍕', category: 'pizza', timeOfDay: 'dinner', desc: 'Pâte fraîche et fromage fondant.' },
  { id: '3', title: 'Burger Smash Bacon Cheese 🍔', category: 'burger', timeOfDay: 'lunch', desc: 'Double steak smashé croustillant.' },
  { id: '4', title: 'Tajine Poulet Citron Confis 🍲', category: 'traditional', timeOfDay: 'lunch', desc: 'Plat chaud réconfortant style maison.' },
  { id: '5', title: 'Sushi Roll Saumon Avocado 🍣', category: 'sushi', timeOfDay: 'dinner', desc: 'Frais, sain et léger pour les pauses révisions.' },
  { id: '6', title: 'Smoothie Vitaminé & Acai 🥤', category: 'healthy', timeOfDay: 'afternoon', desc: 'Coup de boost d\'énergie pour la journée.' },
];

export function CraveRoulette({ onSelectCategory }: { onSelectCategory: (cat: string) => void }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [picked, setPicked] = useState<typeof ROULETTE_SUGGESTIONS[0] | null>(null);
  const [spinning, setSpinning] = useState(false);

  const rotation = useSharedValue(0);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const handleSpin = () => {
    if (spinning) return;
    setSpinning(true);
    hapticSelection();

    // Time-weighted picking
    const hour = new Date().getHours();
    let pool = ROULETTE_SUGGESTIONS;
    if (hour >= 21 || hour < 5) {
      pool = ROULETTE_SUGGESTIONS.filter((s) => s.category === 'tacos' || s.category === 'pizza' || s.category === 'burger');
    }

    const randomIndex = Math.floor(Math.random() * pool.length);
    const chosen = pool[randomIndex] || ROULETTE_SUGGESTIONS[0];

    rotation.value = withSequence(
      withTiming(rotation.value + 1440, { duration: 1500 }),
      withTiming(rotation.value + 1800, { duration: 800 })
    );

    setTimeout(() => {
      setPicked(chosen);
      setSpinning(false);
      hapticSuccess();
    }, 2300);
  };

  return (
    <>
      <Pressable
        onPress={() => {
          setModalVisible(true);
          handleSpin();
        }}
        style={styles.triggerBtn}
      >
        <Text style={styles.triggerEmoji}>🎰</Text>
        <View style={styles.triggerTextWrap}>
          <Text style={styles.triggerTitle}>CraveRoulette IA 🎲</Text>
          <Text style={styles.triggerSub}>Indécis ? Laissez l'IA choisir votre repas du jour</Text>
        </View>
        <Text style={styles.triggerArrow}>➔</Text>
      </Pressable>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalHeaderTitle}>🎰 CraveRoulette IA YoHa</Text>
            <Text style={styles.modalHeaderSub}>Recommandation pondérée par l'heure et la météo</Text>

            <View style={styles.wheelWrap}>
              <Animated.View style={[styles.wheelCircle, spinStyle]}>
                <Text style={styles.wheelCenterEmoji}>🍔🌮🍕🍣</Text>
              </Animated.View>
            </View>

            {spinning ? (
              <Text style={styles.statusText}>L'IA analyse vos envies... 🔮</Text>
            ) : picked ? (
              <View style={styles.resultBox}>
                <Text style={styles.resultTitle}>{picked.title}</Text>
                <Text style={styles.resultDesc}>{picked.desc}</Text>
                <Pressable
                  onPress={() => {
                    setModalVisible(false);
                    onSelectCategory(picked.category);
                  }}
                  style={styles.actionBtn}
                >
                  <Text style={styles.actionBtnText}>Voir les restaurants ({picked.category}) 🚀</Text>
                </Pressable>
              </View>
            ) : null}

            <Pressable onPress={() => setModalVisible(false)} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>Fermer</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  triggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#ffedd5',
    padding: 14,
    borderRadius: radius.xl,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  triggerEmoji: { fontSize: 28, marginRight: 12 },
  triggerTextWrap: { flex: 1 },
  triggerTitle: { fontWeight: '700', fontSize: 14, color: ink[900] },
  triggerSub: { fontSize: 11, color: ink[500], marginTop: 2 },
  triggerArrow: { fontSize: 16, fontWeight: '700', color: brand[500] },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: radius.xl,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },

  modalHeaderTitle: { fontWeight: '800', fontSize: 18, color: ink[900] },
  modalHeaderSub: { fontSize: 12, color: ink[500], marginTop: 4, textAlign: 'center' },
  wheelWrap: { marginVertical: 20, alignItems: 'center', justifyContent: 'center' },

  wheelCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ffedd5',
    borderWidth: 4,
    borderColor: brand[500],
    alignItems: 'center',
    justifyContent: 'center',
  },

  wheelCenterEmoji: { fontSize: 28 },
  statusText: { fontSize: 14, fontWeight: '600', color: brand[500], marginVertical: 10 },
  resultBox: { width: '100%', alignItems: 'center', backgroundColor: '#fff7ed', padding: 16, borderRadius: radius.xl },
  resultTitle: { fontWeight: '800', fontSize: 16, color: ink[900], textAlign: 'center' },
  resultDesc: { fontSize: 12, color: ink[600], marginTop: 4, textAlign: 'center' },
  actionBtn: {
    marginTop: 14,
    backgroundColor: brand[500],
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.lg,
  },
  actionBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  closeBtn: { marginTop: 16, padding: 8 },
  closeBtnText: { color: ink[500], fontWeight: '600', fontSize: 13 },
});
