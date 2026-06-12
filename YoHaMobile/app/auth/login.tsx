import { Link, router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthDivider } from '../../src/components/auth/AuthDivider';
import { AuthFormCard } from '../../src/components/auth/AuthFormCard';
import { AuthGuestCta } from '../../src/components/auth/AuthGuestCta';
import { AuthHero } from '../../src/components/auth/AuthHero';
import { AuthScreenShell } from '../../src/components/auth/AuthScreenShell';
import { SocialAuthButtons } from '../../src/components/auth/SocialAuthButtons';
import { YohaButton } from '../../src/components/ui/YohaButton';
import { YohaInput } from '../../src/components/ui/YohaInput';
import { roleHome, useAuth } from '../../src/contexts/AuthContext';
import { brand, ink, radius } from '../../src/theme';
import { fonts } from '../../src/theme/fonts';

export default function LoginScreen() {
  const { login, loginWithGoogle, loginWithApple } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const finishAuth = useCallback((user: { role: string }) => {
    router.replace(roleHome(user.role) as never);
  }, []);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
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
      const user = await loginWithGoogle(idToken);
      finishAuth(user);
    },
    [loginWithGoogle, finishAuth],
  );

  const handleAppleSignIn = useCallback(
    async (identityToken: string, fullName?: { givenName: string; familyName: string }) => {
      setError('');
      const user = await loginWithApple(identityToken, fullName);
      finishAuth(user);
    },
    [loginWithApple, finishAuth],
  );

  return (
    <AuthScreenShell backMode="home" footer={<AuthGuestCta />}>
      <AuthHero mode="login" />

      <AuthFormCard title="Se connecter" subtitle="Accédez à votre espace YouHa">
        <SocialAuthButtons
          disabled={loading}
          onGoogleToken={handleGoogleToken}
          onAppleSignIn={handleAppleSignIn}
          onError={setError}
        />

        <AuthDivider />

        <YohaInput
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="vous@email.ma"
          autoComplete="email"
        />
        <YohaInput
          label="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          autoComplete="password"
        />

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : null}

        <YohaButton title="Se connecter" onPress={handleLogin} loading={loading} />

        <Link href="/auth/register" asChild>
          <Pressable style={styles.switchLink}>
            <Text style={styles.switchText}>
              Pas encore de compte ?{' '}
              <Text style={styles.switchAccent}>S'inscrire gratuitement</Text>
            </Text>
          </Pressable>
        </Link>
      </AuthFormCard>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  errorBox: {
    backgroundColor: '#fef2f2',
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  error: { color: '#dc2626', fontSize: 14, fontFamily: fonts.medium },
  switchLink: { marginTop: 20, alignItems: 'center', paddingVertical: 4 },
  switchText: { fontSize: 14, color: ink[500], fontFamily: fonts.medium },
  switchAccent: { color: brand[600], fontFamily: fonts.bold },
});
