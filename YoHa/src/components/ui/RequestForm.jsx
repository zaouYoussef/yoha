'use client';

import React, { useState } from 'react';
import { I } from '../../icons/Icons.jsx';
import { userRequestsApi } from '../../lib/api.js';

const TYPES = [
  { value: 'complaint', label: 'Réclamation', icon: '⚠️', desc: 'Problème avec une commande, un livreur ou un restaurant' },
  { value: 'deletion', label: 'Suppression de mon compte', icon: '🗑️', desc: 'Demander la suppression de mes données personnelles' },
  { value: 'other', label: 'Autre demande', icon: '💬', desc: 'Question, suggestion ou autre' },
];

export function RequestForm({ defaultType = 'complaint' }) {
  const [form, setForm] = useState({ request_type: defaultType, email: '', display_name: '', message: '' });
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
    <div className="text-center py-12 animate-fade-up">
      <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-500 grid place-items-center mx-auto text-3xl shadow-lg mb-4">✓</div>
      <h3 className="text-xl font-display font-extrabold text-ink-900 dark:text-white mb-1">Demande envoyée !</h3>
      <p className="text-sm text-ink-500 dark:text-ink-400 max-w-sm mx-auto">
        Nous traitons votre demande dans les plus brefs délais. Vous recevrez une réponse par email.
      </p>
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-2.5">
        <label className="text-xs font-extrabold uppercase tracking-wider text-ink-400">Type de demande</label>
        <div className="grid gap-2.5">
          {TYPES.map((t) => {
            const active = form.request_type === t.value;
            return (
              <button key={t.value} type="button" onClick={() => setForm({ ...form, request_type: t.value })}
                className={`flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all ${
                  active
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30 shadow-sm'
                    : 'border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 hover:border-ink-300'
                }`}>
                <span className="text-xl">{t.icon}</span>
                <div>
                  <p className={`font-bold text-sm ${active ? 'text-brand-700 dark:text-brand-300' : 'text-ink-900 dark:text-white'}`}>{t.label}</p>
                  <p className="text-xs text-ink-400 mt-0.5">{t.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-xs font-extrabold uppercase tracking-wider text-ink-400 mb-1.5 block">Email *</label>
        <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="votre@email.com"
          className="w-full px-4 py-3 rounded-2xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm outline-none focus:border-brand-500 transition placeholder:text-ink-300" />
      </div>

      <div>
        <label className="text-xs font-extrabold uppercase tracking-wider text-ink-400 mb-1.5 block">Nom complet (optionnel)</label>
        <input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })}
          placeholder="Votre nom"
          className="w-full px-4 py-3 rounded-2xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm outline-none focus:border-brand-500 transition placeholder:text-ink-300" />
      </div>

      <div>
        <label className="text-xs font-extrabold uppercase tracking-wider text-ink-400 mb-1.5 block">Message</label>
        <textarea rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
          placeholder="Décrivez votre problème ou demande en quelques lignes..."
          className="w-full px-4 py-3 rounded-2xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm outline-none focus:border-brand-500 transition placeholder:text-ink-300 resize-none" />
      </div>

      <button type="submit" disabled={busy}
        className="w-full py-3.5 rounded-2xl bg-brand-500 text-white font-black text-sm hover:bg-brand-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20">
        {busy ? (
          <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Envoi en cours…</>
        ) : (
          <><I.Right size={16} /> Envoyer la demande</>
        )}
      </button>
    </form>
  );
}
