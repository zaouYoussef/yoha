import {
  Archivo_400Regular,
  Archivo_500Medium,
  Archivo_600SemiBold,
  Archivo_700Bold,
} from '@expo-google-fonts/archivo';
import {
  BigShouldersDisplay_700Bold,
  BigShouldersDisplay_800ExtraBold,
  BigShouldersDisplay_900Black,
} from '@expo-google-fonts/big-shoulders-display';
import { DMMono_400Regular, DMMono_500Medium } from '@expo-google-fonts/dm-mono';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { View } from 'react-native';

import { PushRegistration } from '../src/components/PushRegistration';
import { AuthProvider } from '../src/contexts/AuthContext';
import { CartProvider } from '../src/contexts/CartContext';
import { ToastProvider } from '../src/contexts/ToastContext';
import { initOrderNotifications } from '../src/lib/orderNotifications';
import { surface } from '../src/theme';

SplashScreen.preventAutoHideAsync();

/**
 * Trois familles, trois rôles, jamais mélangés :
 * Big Shoulders pour les titres (condensé, éditorial), Archivo pour la lecture,
 * DM Mono pour tout ce qui est un nombre — prix, minutes, quantités —
 * afin que les colonnes s'alignent au pixel.
 */
export default function RootLayout() {
  const [loaded] = useFonts({
    BigShouldersDisplay_700Bold,
    BigShouldersDisplay_800ExtraBold,
    BigShouldersDisplay_900Black,
    Archivo_400Regular,
    Archivo_500Medium,
    Archivo_600SemiBold,
    Archivo_700Bold,
    DMMono_400Regular,
    DMMono_500Medium,
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  useEffect(() => {
    void initOrderNotifications();
  }, []);

  /* Le fond de chargement est déjà le fond de l'app : aucun flash blanc. */
  if (!loaded) {
    return <View style={{ flex: 1, backgroundColor: surface.void }} />;
  }

  return (
    <AuthProvider>
      <PushRegistration />
      <CartProvider>
        <ToastProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'fade',
              contentStyle: { backgroundColor: surface.void },
            }}
          >
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
