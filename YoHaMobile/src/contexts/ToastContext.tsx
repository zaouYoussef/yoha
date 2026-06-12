import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brand, ink, radius, shadows } from '../theme';
import { fonts } from '../theme/fonts';

type Toast = { id: number; title: string; desc?: string; emoji?: string };

type ToastContextValue = {
  showToast: (title: string, desc?: string, emoji?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<Toast | null>(null);
  const idRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((title: string, desc?: string, emoji?: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const id = ++idRef.current;
    setToast({ id, title, desc, emoji });
    timerRef.current = setTimeout(() => setToast(null), 3800);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <View style={[styles.wrap, { top: insets.top + 8 }]}>
          <Pressable onPress={() => setToast(null)} style={[styles.card, shadows.card]}>
            {toast.emoji ? <Text style={styles.emoji}>{toast.emoji}</Text> : null}
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{toast.title}</Text>
              {toast.desc ? <Text style={styles.desc}>{toast.desc}</Text> : null}
            </View>
          </Pressable>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, zIndex: 999 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: ink[100],
  },
  emoji: { fontSize: 28 },
  title: { fontFamily: fonts.bold, fontSize: 15, color: ink[900] },
  desc: { marginTop: 2, fontFamily: fonts.medium, fontSize: 13, color: ink[500], lineHeight: 18 },
});
