import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Image } from 'expo-image';

import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { roleHome, useAuth } from '../../src/contexts/AuthContext';
import { brand, gradients, ink, radius, shadows } from '../../src/theme';
import { SocialAuthButtons } from '../../src/components/auth/SocialAuthButtons';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login, loginWithGoogle } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [loginId, setLoginId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const finishAuth = useCallback((user: { role: string } | null) => {
    if (!user) {
      setError('Profil utilisateur invalide');
      return;
    }
    router.replace(roleHome(user.role) as never);
  }, []);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const user = await login(loginId.trim(), password);
      finishAuth(user);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connexion impossible');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleToken = useCallback(
    async (idToken: string) => {
      setError('');
      try {
        const user = await loginWithGoogle(idToken);
        finishAuth(user);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Connexion Google impossible');
      }
    },
    [loginWithGoogle, finishAuth],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Back Button */}
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Retour</Text>
        </Pressable>

        {/* Hero Brand Title */}
        <View style={styles.heroHeader}>
          <Image source={require('../../assets/images/logo.png')} style={{ width: 54, height: 54, borderRadius: 14, marginBottom: 8 }} contentFit="contain" />
          <Text style={styles.heroTitle}>Livraison Express CHU & Tanger</Text>
          <Text style={styles.heroSub}>Connectez-vous pour accéder à vos commandes et avantages</Text>
        </View>


        {/* Card Form */}
        <View style={styles.card}>
          {/* Segmented Tab Switcher */}
          <View style={styles.tabBar}>
            <Pressable
              onPress={() => { setTab('login'); setError(''); }}
              style={[styles.tabBtn, tab === 'login' && styles.tabBtnActive]}
            >
              <Text style={[styles.tabText, tab === 'login' && styles.tabTextActive]}>Connexion</Text>
            </Pressable>
            <Pressable
              onPress={() => { setTab('register'); router.push('/auth/register'); }}
              style={[styles.tabBtn, tab === 'register' && styles.tabBtnActive]}
            >
              <Text style={[styles.tabText, tab === 'register' && styles.tabTextActive]}>Créer un compte</Text>
            </Pressable>
          </View>

          {/* Google Auth Button */}
          <SocialAuthButtons
            disabled={loading}
            onGoogleToken={handleGoogleToken}
            onError={setError}
          />

          <View style={styles.dividerWrap}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou avec e-mail</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Form Fields */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>E-mail ou nom d'utilisateur</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.inputIcon}>📧</Text>
              <TextInput
                style={styles.input}
                value={loginId}
                onChangeText={setLoginId}
                autoCapitalize="none"
                placeholder="vous@email.ma"
                placeholderTextColor={ink[400]}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Mot de passe</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor={ink[400]}
              />
            </View>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Pressable onPress={handleLogin} disabled={loading} style={styles.submitBtnWrap}>
            <LinearGradient colors={gradients.cta} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitBtn}>
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitBtnText}>Se connecter ➔</Text>
              )}
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingRight: 10,
    marginTop: 10,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: ink[600],
  },
  heroHeader: {
    alignItems: 'center',
    marginVertical: 20,
  },
  logoBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 10,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 13,
    fontWeight: '600',
    color: ink[500],
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: ink[500],
  },
  tabTextActive: {
    color: brand[600],
    fontWeight: '900',
  },
  dividerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '700',
    color: ink[400],
    marginHorizontal: 10,
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    height: 48,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    marginBottom: 14,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#dc2626',
    textAlign: 'center',
  },
  submitBtnWrap: {
    marginTop: 6,
    borderRadius: 18,
    overflow: 'hidden',
  },
  submitBtn: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#ffffff',
  },
});
