import { router } from 'expo-router';
import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MeshBackground } from '../MeshBackground';
import { brand } from '../../theme';
import { fonts } from '../../theme/fonts';

type BackMode = 'home' | 'back';

type Props = {
  children: React.ReactNode;
  backMode?: BackMode;
  footer?: React.ReactNode;
  contentStyle?: ViewStyle;
};

export function AuthScreenShell({
  children,
  backMode = 'back',
  footer,
  contentStyle,
}: Props) {
  const insets = useSafeAreaInsets();

  const onBack = () => {
    if (backMode === 'home') {
      router.replace('/landing' as never);
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/auth/login' as never);
  };

  return (
    <MeshBackground variant="auth">
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
            contentStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable onPress={onBack} style={styles.back} hitSlop={12}>
            <Text style={styles.backText}>{backMode === 'home' ? '← Accueil' : '← Retour'}</Text>
          </Pressable>

          {children}

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </MeshBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 22 },
  back: { alignSelf: 'flex-start', marginBottom: 4 },
  backText: { fontFamily: fonts.semibold, color: brand[600], fontSize: 14 },
  footer: { marginTop: 20 },
});
