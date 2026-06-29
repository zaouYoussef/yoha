'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log exception safely to console
    console.error('Unhandled runtime error in page:', error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-24 text-center animate-fade-in">
      <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-brand-50 text-brand-500 dark:bg-brand-950/20 dark:text-brand-400 shadow-glow">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="h-12 w-12 animate-pulse-slow"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      </div>
      <h2 className="text-3xl font-display font-bold tracking-tight text-ink-900 dark:text-ink-50 sm:text-4xl">
        Une erreur est survenue !
      </h2>
      <p className="mt-4 max-w-md text-base text-ink-500 dark:text-ink-400">
        Une erreur inattendue s'est produite lors du rendu de la page. Les détails techniques ont été masqués par mesure de sécurité.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={() => reset()}
          className="inline-flex items-center justify-center rounded-full bg-brand-500 hover:bg-brand-600 px-8 py-3 text-sm font-semibold text-white shadow-glow hover:shadow-glow-lg transition duration-200"
        >
          Réessayer
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 px-8 py-3 text-sm font-semibold text-ink-700 dark:text-ink-300 shadow-sm hover:bg-ink-50 dark:hover:bg-ink-800 transition duration-200"
        >
          Retourner à l'accueil
        </Link>
      </div>
    </div>
  );
}
