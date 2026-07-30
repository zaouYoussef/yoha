import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { router } from 'expo-router';

import { roleHome, useAuth } from '../../src/contexts/AuthContext';
import { Screen, ScreenHeader } from '../../src/components/yoha/Screen';
import { Body, Display, Label } from '../../src/components/yoha/Type';
import { Hairline } from '../../src/components/yoha/Atoms';
import { EmberField } from '../../src/components/yoha/Motion';
import { EmberButton } from '../../src/components/yoha/EmberButton';
import { Field } from './login';

export default function Register() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = name.trim().length >= 2 && email.includes('@') && password.length >= 8;

  const submit = async () => {
    if (!ready || busy) return;
    setBusy(true);
    setError(null);
    try {
      const user = await register(email.trim(), password, name.trim());
      router.replace(roleHome(user?.role) as never);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Inscription impossible.');
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
        <ScreenHeader title="Créer" onBack={() => router.back()} />

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 32 }}
        >
          <Body tone="fog" style={{ maxWidth: 300 }}>
            Un compte sert à retrouver tes adresses et à cumuler la fidélité. Tu peux commander
            sans, à tout moment.
          </Body>

          <Label tone="ember" style={{ marginTop: 30 }}>
            Prénom
          </Label>
          <Field value={name} onChangeText={setName} placeholder="Yassine" autoComplete="name" />

          <Label tone="ember" style={{ marginTop: 20 }}>
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
            placeholder="8 caractères minimum"
            secureTextEntry
            autoComplete="new-password"
          />

          {error ? (
            <Body size="caption" tone="ember" style={{ marginTop: 16 }}>
              {error}
            </Body>
          ) : null}

          <View style={{ marginTop: 28 }}>
            <EmberButton
              label={busy ? 'Création…' : 'Créer mon compte'}
              loading={busy}
              disabled={!ready}
              onPress={submit}
            />
          </View>

          <Hairline style={{ marginVertical: 28 }} />

          <Body
            size="caption"
            tone="dim"
            suppressHighlighting
            onPress={() => router.replace('/(client)')}
            style={{ textAlign: 'center', paddingVertical: 8 }}
          >
            Continuer sans compte →
          </Body>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
