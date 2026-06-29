'use client';

import React, { useRef, useState } from 'react';
import { restaurantCover } from './MenuItemImage.jsx';

/**
 * Upload d’image vers l’API YoHa (multipart).
 * Les fichiers sont compressés en WebP côté serveur avant stockage.
 */
export function ImageUpload({
  label,
  hint,
  currentUrl,
  onUpload,
  accept = 'image/jpeg,image/png,image/webp,image/gif',
  aspect = 'aspect-video',
  busy = false,
}) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const displayUrl = preview || restaurantCover(currentUrl);

  const handleFile = async (file) => {
    if (!file || !onUpload) return;
    setError('');
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      await onUpload(file);
    } catch (e) {
      setPreview(null);
      setError(e.message || 'Échec de l’upload.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {label && <div className="text-sm font-semibold">{label}</div>}
      <div
        className={`relative rounded-2xl overflow-hidden border-2 border-dashed border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-900/50 ${aspect}`}
      >
        <img
          src={displayUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition flex items-center justify-center">
          <button
            type="button"
            disabled={uploading || busy}
            onClick={() => inputRef.current?.click()}
            className="px-4 py-2 rounded-xl bg-white text-ink-900 text-sm font-bold shadow-lg disabled:opacity-50"
          >
            {uploading ? 'Envoi…' : 'Choisir une photo'}
          </button>
        </div>
      </div>
      {hint && <p className="text-xs text-ink-500">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
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
