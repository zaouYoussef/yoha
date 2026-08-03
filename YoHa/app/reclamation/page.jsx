'use client';

import React from 'react';
import { RequestForm } from '@/components/ui/RequestForm.jsx';

export default function ReclamationPage() {
  return (
    <div className="page-enter relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 mesh-bg opacity-70 pointer-events-none" aria-hidden />
      <div className="yoha-ambient" aria-hidden />
      <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] right-[-8%] w-[18rem] h-[18rem] rounded-full bg-brand-400/25 blur-3xl animate-blob" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[20rem] h-[20rem] rounded-full bg-violet-400/20 blur-3xl animate-blob" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 stagger-children">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 via-pink-500 to-violet-500 text-white grid place-items-center mx-auto text-2xl shadow-glow mb-4">
            ⚠️
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-600 dark:text-brand-400 mb-2">
            Support YoHa
          </p>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight text-ink-900 dark:text-white">
            <span className="bg-gradient-to-r from-brand-500 via-pink-500 to-violet-500 bg-clip-text text-transparent">
              Réclamation
            </span>
          </h1>
          <p className="text-sm text-ink-500 dark:text-ink-400 mt-2 max-w-md mx-auto">
            Un problème avec votre commande, un livreur ou un restaurant&nbsp;? Faites-nous en part.
          </p>
        </div>

        <div className="rounded-[1.75rem] bg-white/90 dark:bg-ink-900/85 border border-ink-200/60 dark:border-ink-800/50 shadow-xl backdrop-blur-xl p-6 sm:p-8 ring-gradient">
          <RequestForm defaultType="complaint" />
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-ink-400">
            Vous pouvez aussi nous écrire à{' '}
            <a href="mailto:yohadelivery@gmail.com" className="text-brand-600 hover:underline font-bold">support@yoha.ma</a>
            {' '}·{' '}
            <a href="/privacy" className="text-ink-400 hover:text-brand-500 underline transition">Politique de confidentialité</a>
          </p>
        </div>
      </div>
    </div>
  );
}
