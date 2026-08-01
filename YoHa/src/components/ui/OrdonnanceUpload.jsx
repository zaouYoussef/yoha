'use client';

import React, { useRef, useState } from 'react';
import { ordersApi } from '../../lib/api.js';

/**
 * Upload de l'ordonnance (commande pharmacie sur-mesure).
 * Photo depuis la galerie ou la caméra mobile, compressée en WebP côté serveur.
 * `value` = URL déjà uploadée ; `onChange(url)` notifie le parent.
 */
export function OrdonnanceUpload({
  value,
  onChange,
  label = 'Avez-vous une ordonnance ? (Optionnel)',
  hint = 'Prenez une photo de votre ordonnance : notre livreur la montrera à la pharmacie avant l’achat.',
  disabled = false,
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file) => {
    if (!file || disabled) return;
    setError('');
    setUploading(true);
    try {
      const res = await ordersApi.uploadOrdonnance(file);
      onChange?.(res.url || '');
    } catch (e) {
      setError(e.message || 'Échec de l’envoi de l’ordonnance.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-xl border border-ink-200 dark:border-ink-800 bg-ink-50/60 dark:bg-ink-950/40 p-3 space-y-2">
      <div className="flex items-start gap-2">
        <span className="text-lg shrink-0 leading-none mt-0.5">📎</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink-800 dark:text-ink-200">{label}</p>
          <p className="text-xs text-ink-500 dark:text-ink-400 leading-relaxed">{hint}</p>
        </div>
      </div>

      {value ? (
        <div className="flex items-center gap-3">
          <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-ink-200 dark:border-ink-700 shrink-0 bg-white dark:bg-ink-900">
            <img src={value} alt="Ordonnance" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">✓ Ordonnance jointe</p>
            <button
              type="button"
              disabled={disabled}
              onClick={() => { onChange?.(''); setError(''); }}
              className="mt-1 text-xs font-semibold text-red-500 hover:text-red-600 disabled:opacity-50"
            >
              Retirer l’ordonnance
            </button>
          </div>
          <button
            type="button"
            disabled={uploading || disabled}
            onClick={() => inputRef.current?.click()}
            className="shrink-0 px-3 py-2 rounded-lg bg-ink-900 dark:bg-white text-white dark:text-ink-900 text-xs font-bold disabled:opacity-50"
          >
            Remplacer
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading || disabled}
          onClick={() => inputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-ink-300 dark:border-ink-700 text-sm font-bold text-ink-700 dark:text-ink-300 hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 transition disabled:opacity-50"
        >
          {uploading ? 'Envoi en cours…' : '📷 Joindre une photo (galerie ou appareil photo)'}
        </button>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}
