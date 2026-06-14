import { Tabs } from 'expo-router';
import React from 'react';
import { ClientOrderAlertPoller } from '../../src/components/OrderAlertPoller';
import { YohaTabBar } from '../../src/components/ui/YohaTabBar';
import { useCart } from '../../src/contexts/CartContext';
import { FoodExplosion } from '../../src/components/animations/FoodExplosion';

export default function ClientLayout() {
  const { triggerTime } = useCart();

  return (
    <>
      <ClientOrderAlertPoller />
      <Tabs
        tabBar={(props) => <YohaTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Découvrir' }} />
        <Tabs.Screen name="cart" options={{ title: 'Panier' }} />
        <Tabs.Screen name="orders" options={{ title: 'Commandes' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
        <Tabs.Screen name="restaurant/[slug]" options={{ href: null }} />
        <Tabs.Screen name="checkout" options={{ href: null }} />
        <Tabs.Screen name="order/[id]" options={{ href: null }} />
      </Tabs>
      <FoodExplosion triggerTime={triggerTime} />
    </>
  );
}
