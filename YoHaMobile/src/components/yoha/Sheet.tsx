import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { line, radius, surface } from '../../theme';

const { height: SCREEN_H } = Dimensions.get('window');

/**
 * Feuille montante.
 *
 * Elle ne remplace pas l'écran : on voit encore le contenu derrière,
 * assombri. Le client garde son repère et hésite moins à l'ouvrir.
 */
export function Sheet({
  visible,
  onClose,
  children,
  maxHeightRatio = 0.9,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxHeightRatio?: number;
}) {
  const insets = useSafeAreaInsets();
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(t, {
      toValue: visible ? 1 : 0,
      duration: visible ? 320 : 200,
      easing: visible ? Easing.bezier(0.16, 1, 0.3, 1) : Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [visible, t]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={StyleSheet.absoluteFill}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: t }]}>
          <Pressable
            accessibilityLabel="Fermer"
            onPress={onClose}
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.72)' }]}
          />
        </Animated.View>

        <Animated.View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            maxHeight: SCREEN_H * maxHeightRatio,
            backgroundColor: surface.soot,
            borderTopLeftRadius: radius.xxl,
            borderTopRightRadius: radius.xxl,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderColor: line.soft,
            overflow: 'hidden',
            transform: [
              { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [SCREEN_H, 0] }) },
            ],
          }}
        >
          <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 4 }}>
            <View
              style={{ width: 38, height: 4, borderRadius: 4, backgroundColor: line.strong }}
            />
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 12 }}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
