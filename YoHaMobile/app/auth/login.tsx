import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { roleHome, useAuth } from '../../src/contexts/AuthContext';
import { line, radius, surface, text as palette } from '../../src/theme';
import { fonts } from '../../src/theme/fonts';
import { Screen, ScreenHeader } from '../../src/components/yoha/Screen';
import { Body, Display, Label } from '../../src/components/yoha/Type';
import { Hairline } from '../../src/components/yoha/Atoms';
import { EmberField } from '../../src/components/yoha/Motion';
import { EmberButton } from '../../src/components/yoha/EmberButton';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = email.trim().length > 3 && password.length >= 4;

  const submit = async () => {
    if (!ready || busy) return;
    setBusy(true);
    setError(null);
    try {
      const user = await login(email.trim(), password);
      router.replace(roleHome(user?.role) as never);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connexion impossible.');
      setBusy(false);
    }
  };

  return (
    <Screen>
      <EmberField count={10} height={360} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScreenHeader title="Connexion" onBack={() => router.replace('/landing')} />

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 32 }}
        >
          <Body tone="fog" style={{ maxWidth: 300 }}>
            Retrouve tes adresses, ton historique et ta carte fidélité.
          </Body>

          <Label tone="ember" style={{ marginTop: 30 }}>
            E-mail
          </Label>
          <Field
            value={email}
            onChangeText={setEmail}
            placeholder="toi@exemple.ma"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <Label tone="ember" style={{ marginTop: 20 }}>
            Mot de passe
          </Label>
          <Field
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            autoComplete="password"
          />

          {error ? (
            <Body size="caption" tone="ember" style={{ marginTop: 16 }}>
              {error}
            </Body>
          ) : null}

          <View style={{ marginTop: 28 }}>
            <EmberButton
              label={busy ? 'Connexion…' : 'Entrer'}
              loading={busy}
              disabled={!ready}
              onPress={submit}
            />
          </View>

          <Hairline style={{ marginVertical: 28 }} />

          <Body size="small" tone="fog" style={{ textAlign: 'center' }}>
            Pas encore de compte ?{' '}
            <Body
              size="small"
              tone="ember"
              weight="semibold"
              suppressHighlighting
              onPress={() => router.push('/auth/register')}
            >
              Créer un compte
            </Body>
          </Body>

          <Body
            size="caption"
            tone="dim"
            suppressHighlighting
            onPress={() => router.replace('/(client)')}
            style={{ textAlign: 'center', marginTop: 18, paddingVertical: 8 }}
          >
            Continuer sans compte →
          </Body>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

export function Field(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      placeholderTextColor={palette.dim}
      {...props}
      style={{
        marginTop: 10,
        backgroundColor: surface.soot,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: line.hair,
        borderRadius: radius.lg,
        paddingHorizontal: 16,
        paddingVertical: 15,
        color: palette.bone,
        fontFamily: fonts.body,
        fontSize: 15,
      }}
    />
  );
}
