import { useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Onglets visibles dans la tab bar client. */
export const CLIENT_TAB_SCREENS = ['index', 'cart', 'orders', 'profile'] as const;

/** Onglets dashboard livreur (comme le site /delivery). */
export const COURIER_TAB_SCREENS = ['index', 'mine', 'history'] as const;

/** Onglets dashboard restaurant (comme le site /restaurant-dash). */
export const RESTAURANT_TAB_SCREENS = ['index', 'stats', 'profile'] as const;

/** Hauteur estimée du corps de la tab bar (padding + barre, hors safe area). */
export const TAB_BAR_BODY_HEIGHT = 88;

/** Hauteur estimée de la StickyCartBar. */
export const CART_BAR_HEIGHT = 78;

/** Espace entre éléments flottants et la tab bar / bord bas. */
export const CHROME_GAP = 12;

export function useTabBarVisible(): boolean {
  const segments = useSegments() as string[];
  const clientIdx = segments.indexOf('(client)');
  if (clientIdx < 0) return false;
  const screen = segments[clientIdx + 1];
  if (!screen) return false;
  return (CLIENT_TAB_SCREENS as readonly string[]).includes(screen);
}

export function useLayoutChrome() {
  const insets = useSafeAreaInsets();
  const tabBarVisible = useTabBarVisible();

  const tabBarHeight = tabBarVisible
    ? TAB_BAR_BODY_HEIGHT + Math.max(insets.bottom, 12)
    : 0;

  const cartBarBottom = tabBarVisible
    ? tabBarHeight + CHROME_GAP
    : Math.max(insets.bottom, 12) + CHROME_GAP;

  const scrollBottomPadding = cartBarBottom + CART_BAR_HEIGHT + CHROME_GAP * 2;

  const footerBottomPadding = tabBarVisible
    ? tabBarHeight + CHROME_GAP
    : Math.max(insets.bottom, 12) + CHROME_GAP;

  return {
    insets,
    tabBarVisible,
    tabBarHeight,
    cartBarBottom,
    scrollBottomPadding,
    footerBottomPadding,
  };
}
