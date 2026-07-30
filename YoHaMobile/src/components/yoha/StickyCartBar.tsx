import React from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';
import { accent, radius, text as palette } from '../../theme';
import { fonts } from '../../theme/fonts';
import { useCart } from '../../contexts/CartContext';
import { useLayoutChrome } from '../../lib/layoutChrome';
import { EmberButton } from './EmberButton';
import { Pop } from './Motion';
import { Body } from './Type';

/**
 * Barre panier flottante.
 *
 * Visible sur tous les écrans de navigation dès qu'il y a un article :
 * la sortie vers le paiement n'est jamais à plus d'un tap. Elle rebondit
 * à chaque ajout (`triggerTime`) pour confirmer le geste sans toast.
 */
export function StickyCartBar() {
  const { count, subtotal, triggerTime } = useCart();
  const { cartBarBottom } = useLayoutChrome();

  if (!count) return null;

  return (
    <View
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: cartBarBottom,
      }}
    >
      <Pop trigger={triggerTime}>
        <EmberButton
          label="Voir le panier"
          price={subtotal}
          onPress={() => router.push('/(client)/cart')}
          leading={
            <View
              style={{
                minWidth: 24,
                height: 24,
                paddingHorizontal: 6,
                borderRadius: radius.full,
                backgroundColor: 'rgba(10,8,6,0.22)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Body
                size="caption"
                style={{ fontFamily: fonts.monoMedium, color: palette.onEmber }}
              >
                {count}
              </Body>
            </View>
          }
        />
      </Pop>
    </View>
  );
}

export const CART_ACCENT = accent.ember;
