'use client';

import React from 'react';
import { RequestForm } from '@/components/ui/RequestForm.jsx';

export default function ReclamationPage() {
  return (
    <div className="page-enter min-h-screen bg-gradient-to-b from-ink-50 to-white dark:from-ink-950 dark:to-ink-900">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 text-white grid place-items-center mx-auto text-2xl shadow-lg shadow-rose-500/20 mb-4">
            ⚠️
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight text-ink-900 dark:text-white">
            Réclamation
          </h1>
          <p className="text-sm text-ink-500 dark:text-ink-400 mt-2 max-w-md mx-auto">
            Un problème avec votre commande, un livreur ou un restaurant&nbsp;? Faites-nous en part.
          </p>
        </div>

        <div className="rounded-3xl bg-white dark:bg-ink-900/80 border border-ink-200/60 dark:border-ink-800/50 shadow-xl p-6 sm:p-8">
          <RequestForm defaultType="complaint" />
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-ink-400">
            Vous pouvez aussi nous écrire à{' '}
            <a href="mailto:yohadelivery@gmail.com" className="text-brand-600 hover:underline font-bold">support@yoha.ma</a>
            {' '}·{' '}
            <a href="/privacy" className="text-ink-400 hover:text-ink-600 underline">Politique de confidentialité</a>
          </p>
        </div>
      </div>
    </div>
  );
}
