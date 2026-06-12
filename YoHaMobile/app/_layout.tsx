import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/inter';
import {
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { PushRegistration } from '../src/components/PushRegistration';
import { AuthProvider } from '../src/contexts/AuthContext';
import { initOrderNotifications } from '../src/lib/orderNotifications';
import { CartProvider } from '../src/contexts/CartContext';
import { ToastProvider } from '../src/contexts/ToastContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  useEffect(() => {
    void initOrderNotifications();
  }, []);

  if (!loaded) {
    return <View style={{ flex: 1, backgroundColor: '#fff7ed' }} />;
  }

  return (
    <AuthProvider>
      <PushRegistration />
      <CartProvider>
        <ToastProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="landing" options={{ animation: 'fade_from_bottom' }} />
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="auth/register" />
          <Stack.Screen name="(client)" />
          <Stack.Screen name="(courier)" />
          <Stack.Screen name="(restaurant)" />
        </Stack>
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}
