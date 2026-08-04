'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { subscribeWebPush, isSubscribed } from '../lib/webPush.js';

const STORAGE_KEY = 'yoha_offer_push_prompt_v1';

function canPromptPush() {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }
  // iOS : push seulement en PWA installée
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
  if (isIos && !isStandalone) return false;
  return true;
}

/**
 * Bannière mobile : active les notifs d'offres (2×/semaine) même si Chrome est fermé.
 */
export function OfferPushPrompt() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!user || user.role !== 'client') return;
      if (!canPromptPush()) return;
      if (Notification.permission === 'denied') return;
      try {
        if (localStorage.getItem(STORAGE_KEY) === 'dismissed') return;
      } catch { /* ignore */ }
      if (Notification.permission === 'granted') {
        const already = await isSubscribed().catch(() => false);
        if (already || cancelled) return;
        // Permission déjà OK mais pas d'abonnement serveur → s'abonner silencieusement
        try {
          await subscribeWebPush();
        } catch { /* ignore */ }
        return;
      }
      if (!cancelled) setVisible(true);
    }
    check();
    return () => { cancelled = true; };
  }, [user]);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    try { localStorage.setItem(STORAGE_KEY, 'dismissed'); } catch { /* ignore */ }
  };

  const enable = async () => {
    setBusy(true);
    try {
      const res = await Notification.requestPermission();
      if (res === 'granted') {
        await subscribeWebPush();
        try { localStorage.setItem(STORAGE_KEY, 'enabled'); } catch { /* ignore */ }
        setVisible(false);
      } else {
        dismiss();
      }
    } catch {
      dismiss();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sm:hidden mx-4 mb-4 rounded-2xl border border-brand-500/25 bg-gradient-to-r from-brand-500/10 via-pink-500/8 to-violet-500/10 px-3.5 py-3 flex items-start gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-bold text-ink-900 dark:text-white leading-snug">
          Offres YoHa 2× / semaine
        </p>
        <p className="mt-0.5 text-[11px] text-ink-500 dark:text-ink-400 leading-relaxed">
          Reçois les promos même si Chrome est fermé (écran éteint OK).
        </p>
      </div>
      <div className="flex flex-col gap-1.5 shrink-0">
        <button
          type="button"
          disabled={busy}
          onClick={enable}
          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-brand-500 to-pink-500 text-white text-[11px] font-extrabold disabled:opacity-60"
        >
          {busy ? '…' : 'Activer'}
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="px-2 py-1 text-[10px] font-semibold text-ink-400"
        >
          Plus tard
        </button>
      </div>
    </div>
  );
}
