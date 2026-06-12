'use client';

import React from 'react';
import { Logo } from './Logo.jsx';

export function Footer({ goto }) {
  return (
    <footer className="relative mt-10 border-t border-ink-200/60 pb-24 dark:border-ink-800/60 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2">
            <Logo/>
            <span className="font-display font-extrabold text-xl">YouHa</span>
          </div>
          <p className="mt-3 text-sm text-ink-500 dark:text-ink-400 max-w-xs">Livraison de repas intelligente, pensée pour les résidences universitaires et les hôpitaux. Fait avec passion.</p>
          {goto && (
            <div className="mt-4 space-y-1.5">
              <div className="text-[11px] uppercase tracking-wider font-bold text-brand-600">🚀 Espace Pro · Démo</div>
              <button onClick={() => goto('admin')} className="cursor-grow block text-sm font-semibold text-ink-700 dark:text-ink-200 hover:text-brand-500 transition">→ Admin Dashboard</button>
              <button onClick={() => goto('delivery')} className="cursor-grow block text-sm font-semibold text-ink-700 dark:text-ink-200 hover:text-brand-500 transition">→ Dashboard Livreur</button>
              <button onClick={() => goto('restaurant-dash')} className="cursor-grow block text-sm font-semibold text-ink-700 dark:text-ink-200 hover:text-brand-500 transition">→ Dashboard Restaurant</button>
            </div>
          )}
        </div>
        <FooterCol title="Produit"     links={['Restaurants','Comment ça marche','Couverture','Carrières']}/>
        <FooterCol title="Entreprise"  links={['À propos','Presse','Blog','Contact']}/>
        <FooterCol title="Légal"       links={['CGU','Confidentialité','Cookies','Mentions légales']}/>
      </div>
      <div className="border-t border-ink-200/60 dark:border-ink-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-wrap items-center justify-between gap-3 text-xs text-ink-500">
          <span>© {new Date().getFullYear()} YouHa. Conçu sur le campus, livré chez vous.</span>
          <span className="inline-flex items-center gap-3">
            <span>Fait avec ❤️ + Next.js + Tailwind</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
export function FooterCol({ title, links }) {
  return (
    <div>
      <h4 className="font-display font-bold mb-3">{title}</h4>
      <ul className="space-y-2">
        {links.map(l => <li key={l}><a className="cursor-grow text-sm text-ink-500 hover:text-brand-500 transition" href="#">{l}</a></li>)}
      </ul>
    </div>
  );
}
