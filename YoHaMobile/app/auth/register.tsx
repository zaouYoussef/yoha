import { Link, router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthDivider } from '../../src/components/auth/AuthDivider';
import { AuthFormCard } from '../../src/components/auth/AuthFormCard';
import { AuthHero } from '../../src/components/auth/AuthHero';
import { AuthScreenShell } from '../../src/components/auth/AuthScreenShell';
import { SocialAuthButtons } from '../../src/components/auth/SocialAuthButtons';
import { YohaButton } from '../../src/components/ui/YohaButton';
import { YohaInput } from '../../src/components/ui/YohaInput';
import { roleHome, useAuth } from '../../src/contexts/AuthContext';
import { brand, ink, radius } from '../../src/theme';
import { fonts } from '../../src/theme/fonts';

export default function RegisterScreen() {
  const { register, loginWithGoogle } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const finishAuth = useCallback((user: { role: string } | null) => {
    if (!user) {
      setError('Profil utilisateur invalide');
      return;
    }
    router.replace(roleHome(user.role) as never);
  }, []);

  const handleRegister = async () => {
    setError('');
    setLoading(true);
    try {
      const user = await register(email.trim(), password, displayName.trim());
      finishAuth(user);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Inscription impossible');
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
    <AuthScreenShell
      backMode="back"
      footer={
        <Text style={styles.legal}>
          En créant un compte, vous acceptez nos conditions d'utilisation et notre politique de
          confidentialité.
        </Text>
      }
    >
      <AuthHero mode="register" />

      <AuthFormCard
        title="Votre profil"
        subtitle="Quelques infos pour personnaliser vos commandes"
      >
        <SocialAuthButtons
          disabled={loading}
          onGoogleToken={handleGoogleToken}
          onError={setError}
        />

        <AuthDivider label="ou avec votre e-mail" />

        <YohaInput
          label="Nom affiché"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Prénom Nom"
          autoCapitalize="words"
          autoComplete="name"
        />
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
          placeholder="10 caractères minimum"
          autoComplete="new-password"
        />

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : null}

        <YohaButton title="Créer mon compte" onPress={handleRegister} loading={loading} />

        <Link href="/auth/login" asChild>
          <Pressable style={styles.switchLink}>
            <Text style={styles.switchText}>
              Déjà membre ? <Text style={styles.switchAccent}>Se connecter</Text>
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
  legal: {
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 16,
    color: ink[400],
    fontFamily: fonts.medium,
    paddingHorizontal: 12,
  },
});
