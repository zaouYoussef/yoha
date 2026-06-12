import { Tabs } from 'expo-router';
import React from 'react';
import { YohaTabBar } from '../../src/components/ui/YohaTabBar';

export default function CourierLayout() {
  return (
    <Tabs tabBar={(props) => <YohaTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Disponibles' }} />
      <Tabs.Screen name="mine" options={{ title: 'Mes courses' }} />
      <Tabs.Screen name="history" options={{ title: 'Historique' }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}
