'use client';

import React, { useState, useEffect } from 'react';
import { I } from '../../icons/Icons.jsx';
import { Button } from './Button.jsx';
import { saveReview, getStoredReviews } from '../../utils/reviews.js';

export function OrderRatingCard({ order }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [existingReview, setExistingReview] = useState(null);

  useEffect(() => {
    if (!order?.id) return;
    const reviews = getStoredReviews();
    const found = reviews.find((r) => r.orderId === String(order.id) || r.orderId === order.public_id);
    if (found) {
      setExistingReview(found);
      setSubmitted(true);
    }
  }, [order?.id, order?.public_id]);

  if (!order || order.status !== 'delivered') return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const newReview = {
      id: 'rev-' + Date.now(),
      orderId: String(order.id || order.public_id || 'YH-ORDER'),
      createdAt: Date.now(),
      rating: Number(rating),
      comment: comment.trim() || 'Commande bien reçue !',
      customerName: order.customerName || order.name || 'Client YoHa',
      restaurantName: order.restaurantName || 'Restaurant',
      courierName: order.courierName || 'Livreur YoHa',
    };
    saveReview(newReview);
    setExistingReview(newReview);
    setSubmitted(true);
  };

  if (submitted && existingReview) {
    return (
      <div className="mt-6 rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white dark:from-emerald-950/40 dark:via-ink-900 dark:to-ink-900 border border-emerald-200/80 dark:border-emerald-800/60 p-5 sm:p-6 text-center shadow-lg animate-fade-up">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white grid place-items-center mx-auto text-xl shadow-md mb-3">
          ⭐
        </div>
        <h3 className="font-display font-black text-lg text-ink-900 dark:text-white">
          Merci pour votre avis !
        </h3>
        <div className="flex items-center justify-center gap-1 my-2 text-amber-400">
          {[1, 2, 3, 4, 5].map((star) => (
            <span key={star} className="text-lg">
              {star <= existingReview.rating ? '★' : '☆'}
            </span>
          ))}
        </div>
        <p className="text-xs text-ink-600 dark:text-ink-300 italic max-w-sm mx-auto">
          &ldquo;{existingReview.comment}&rdquo;
        </p>
        <p className="mt-3 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
          Transmis au livreur {existingReview.courierName} & {existingReview.restaurantName}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-3xl bg-white dark:bg-ink-900 border border-amber-200/70 dark:border-amber-900/40 p-5 sm:p-6 shadow-xl relative overflow-hidden animate-fade-up">
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 grid place-items-center text-lg shrink-0">
          ⭐
        </div>
        <div>
          <h3 className="font-display font-black text-base sm:text-lg text-ink-900 dark:text-white leading-tight">
            Donnez votre avis sur votre commande
          </h3>
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
            Votre note sera transmise à l&apos;équipe et au livreur.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star Rating Bar */}
        <div className="flex items-center justify-center gap-2 py-2 bg-slate-50 dark:bg-ink-950/60 rounded-2xl border border-ink-100 dark:border-ink-800">
          {[1, 2, 3, 4, 5].map((star) => {
            const active = star <= (hoverRating || rating);
            return (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="cursor-grow p-1 text-2xl sm:text-3xl transition-transform active:scale-125 hover:scale-110 focus:outline-none"
                aria-label={`${star} étoile${star > 1 ? 's' : ''}`}
              >
                <span className={active ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]' : 'text-ink-300 dark:text-ink-700'}>
                  ★
                </span>
              </button>
            );
          })}
        </div>

        {/* Remarks / Comments TextArea */}
        <div>
          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-ink-500 mb-1.5">
            Vos remarques ou commentaires
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Qualité des plats, amabilité du livreur, rapidité de livraison..."
            className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50/80 dark:bg-ink-950 border border-ink-200/80 dark:border-ink-800 text-sm outline-none focus:border-brand-500 transition text-ink-900 dark:text-white placeholder:text-ink-400 resize-none font-medium"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full justify-center rounded-2xl shadow-md shadow-brand-500/20"
        >
          <span>Envoyer mon avis ({rating} ★)</span>
          <I.Right size={18} />
        </Button>
      </form>
    </div>
  );
}
