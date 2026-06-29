'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Log exception safely to console
    console.error('Unhandled global runtime error:', error);
  }, [error]);

  return (
    <html lang="fr">
      <body className="font-sans min-h-screen bg-ink-50 dark:bg-ink-950 text-ink-900 dark:text-ink-50 flex flex-col items-center justify-center p-6 text-center">
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
        <h2 className="text-3xl font-bold tracking-tight text-ink-900 dark:text-ink-50 sm:text-4xl">
          Une erreur système est survenue !
        </h2>
        <p className="mt-4 max-w-md text-base text-ink-500 dark:text-ink-400">
          Une erreur critique s'est produite au niveau de l'application globale. Les détails techniques ont été masqués par mesure de sécurité.
        </p>
        <div className="mt-8">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-full bg-brand-500 hover:bg-brand-600 px-8 py-3 text-sm font-semibold text-white shadow-glow hover:shadow-glow-lg transition duration-200"
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
