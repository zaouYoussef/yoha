'use client';

import React, { useState } from 'react';
import { userRequestsApi } from '@/lib/api.js';

function RequestForm() {
  const [form, setForm] = useState({ request_type: 'deletion', email: '', display_name: '', message: '' });
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await userRequestsApi.create(form);
      setSent(true);
    } catch { alert('Erreur lors de l\'envoi.'); }
    setBusy(false);
  };

  if (sent) return (
    <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4 text-center">
      <span className="text-2xl">✅</span>
      <p className="font-bold text-emerald-700 dark:text-emerald-300 mt-1">Demande envoyée</p>
      <p className="text-sm text-emerald-600 dark:text-emerald-400">Nous vous répondrons dans les plus brefs délais.</p>
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="text-xs font-bold text-ink-400 uppercase tracking-wider">Type</label>
        <select value={form.request_type} onChange={(e) => setForm({ ...form, request_type: e.target.value })}
          className="mt-1 w-full px-3 py-2 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm">
          <option value="deletion">Suppression de mon compte</option>
          <option value="complaint">Réclamation</option>
          <option value="other">Autre demande</option>
        </select>
      </div>
      <div>
        <label className="text-xs font-bold text-ink-400 uppercase tracking-wider">Email *</label>
        <input required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="mt-1 w-full px-3 py-2 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm" />
      </div>
      <div>
        <label className="text-xs font-bold text-ink-400 uppercase tracking-wider">Nom (optionnel)</label>
        <input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })}
          className="mt-1 w-full px-3 py-2 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm" />
      </div>
      <div>
        <label className="text-xs font-bold text-ink-400 uppercase tracking-wider">Message</label>
        <textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="mt-1 w-full px-3 py-2 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm resize-none" />
      </div>
      <button type="submit" disabled={busy}
        className="w-full py-2.5 rounded-xl bg-brand-500 text-white font-black text-sm hover:bg-brand-600 transition-colors disabled:opacity-50">
        {busy ? 'Envoi…' : 'Envoyer la demande'}
      </button>
    </form>
  );
}

export default function PrivacyPage() {
  return (
    <div className="page-enter max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
      <div className="rounded-3xl bg-white dark:bg-ink-900/80 border border-ink-200/60 dark:border-ink-800/50 shadow-lg p-6 sm:p-10">
        <h1 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight text-ink-900 dark:text-white mb-2">
          Politique de Confidentialité
        </h1>
        <p className="text-sm text-ink-400 mb-8">Dernière mise à jour : juillet 2026</p>

        <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none space-y-6 text-ink-700 dark:text-ink-300 leading-relaxed">
          <p><strong>YoHa</strong> est une plateforme de livraison de repas destinée aux étudiants, professionnels de santé et personnels hospitaliers à Tanger, Maroc. Votre vie privée est importante pour nous.</p>

          <section>
            <h2 className="text-lg font-bold text-ink-900 dark:text-white mt-8 mb-3">1. Qui sommes-nous ?</h2>
            <p>YoHa met en relation des restaurants partenaires et des livreurs pour livrer vos plats rapidement sur les campus universitaires, hôpitaux et résidences étudiantes de Tanger.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink-900 dark:text-white mt-8 mb-3">2. Informations que nous collectons</h2>
            <p>Selon votre utilisation de YoHa, nous pouvons collecter :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Nom et prénom</li>
              <li>Adresse e-mail</li>
              <li>Numéro de téléphone</li>
              <li>Adresse de livraison</li>
              <li>Position GPS (uniquement nécessaire à la livraison)</li>
              <li>Historique des commandes</li>
              <li>Jeton de notification push (pour les mises à jour de commande)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink-900 dark:text-white mt-8 mb-3">3. Utilisation de vos informations</h2>
            <p>Nous utilisons vos informations pour :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Traiter et livrer vos commandes</li>
              <li>Vous notifier de l'avancement de votre commande</li>
              <li>Assurer le support client</li>
              <li>Améliorer nos services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink-900 dark:text-white mt-8 mb-3">4. Partage de vos informations</h2>
            <p>YoHa peut partager des informations limitées avec :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Nos livreurs partenaires (pour effectuer la livraison)</li>
              <li>Nos restaurants partenaires (pour préparer votre commande)</li>
            </ul>
            <p className="mt-3">Nous ne vendons jamais vos données personnelles à des tiers.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink-900 dark:text-white mt-8 mb-3">5. Sécurité des données</h2>
            <p>Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos informations contre tout accès non autorisé, divulgation, altération ou destruction.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink-900 dark:text-white mt-8 mb-3">6. Conservation des données</h2>
            <p>Nous conservons vos informations uniquement le temps nécessaire à la fourniture de nos services, au respect de nos obligations légales, à la résolution de litiges et à l'application de nos contrats.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink-900 dark:text-white mt-8 mb-3">7. Modification de cette politique</h2>
            <p>Nous pouvons modifier cette politique de confidentialité de temps à autre. Toute modification sera publiée sur cette page avec une date de révision mise à jour.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink-900 dark:text-white mt-8 mb-3">8. Contact</h2>
            <p>Pour toute question concernant cette politique, contactez-nous :</p>
            <p className="mt-2">
              <strong>YoHa</strong><br />
              Site web : <a href="https://yoha.ma" className="text-brand-600 hover:underline">https://yoha.ma</a><br />
              Email : <a href="mailto:support@yoha.ma" className="text-brand-600 hover:underline">support@yoha.ma</a>
            </p>
          </section>
        </div>
      </div>

      <div className="rounded-3xl bg-white dark:bg-ink-900/80 border border-ink-200/60 dark:border-ink-800/50 shadow-lg p-6 sm:p-10">
        <h2 className="text-xl font-display font-extrabold text-ink-900 dark:text-white mb-1">Supprimer mon compte / Réclamation</h2>
        <p className="text-sm text-ink-400 mb-5">Remplissez ce formulaire pour demander la suppression de vos données ou nous faire part d&apos;un problème.</p>
        <RequestForm />
      </div>
    </div>
  );
}
