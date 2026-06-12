import { Tabs } from 'expo-router';
import React from 'react';
import { RestaurantOrderAlertPoller } from '../../src/components/OrderAlertPoller';
import { YohaTabBar } from '../../src/components/ui/YohaTabBar';

export default function RestaurantLayout() {
  return (
    <>
    <RestaurantOrderAlertPoller />
    <Tabs tabBar={(props) => <YohaTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Commandes' }} />
      <Tabs.Screen name="stats" options={{ title: 'Stats' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
    </Tabs>
    </>
  );
}
