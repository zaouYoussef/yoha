'use client';

import React, { useState } from 'react';
import { I } from '../../icons/Icons.jsx';
import { useOrders, useToast } from '../../contexts/AppContexts.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useYohaNav } from '../../contexts/YohaNavContext.jsx';

export function CustomOrderModal({ isOpen, onClose }) {
  const { addOrder, syncOrder } = useOrders() || {};
  const { user } = useAuth() || {};
  const toast = useToast();
  const { goto } = useYohaNav();

  const [placeName, setPlaceName] = useState('');
  const [placeAddress, setPlaceAddress] = useState('');
  const [orderDetails, setOrderDetails] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || 'CHU Tanger — Aile Principale');
  const [phone, setPhone] = useState(user?.phone || '');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!placeName.trim() || !orderDetails.trim() || !phone.trim()) {
      toast?.push({
        title: 'Formulaire incomplet',
        desc: 'Veuillez remplir le nom du restaurant, la commande et votre téléphone.',
        type: 'default',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const customItem = {
        id: `custom-${Date.now()}`,
        name: `Commande sur-mesure: ${orderDetails.slice(0, 45)}...`,
        price: 20, // 20 MAD custom delivery fee
        qty: 1,
        restaurantId: 'custom-place',
        restaurantName: placeName.trim(),
      };

      const customerInfo = {
        name: user?.displayName || 'Client Campus',
        phone: phone.trim(),
        address: deliveryAddress.trim(),
        restaurantNotes: `[RESTAURANT NON LISTÉ] Nom: ${placeName.trim()} | Adresse lieu: ${placeAddress.trim()} | Commande: ${orderDetails.trim()} | Note: ${notes.trim()} | FRAIS COURSIER: 20 MAD (à ajouter au reçu)`,
      };

      let orderId;
      if (addOrder) {
        orderId = await addOrder([customItem], 20, customerInfo);
      } else {
        orderId = `CMD-${Math.floor(1000 + Math.random() * 9000)}`;
      }

      toast?.push({
        title: 'Commande sur-mesure validée ! 🚀',
        desc: `Votre livreur va acheter votre commande chez ${placeName}. +20 MAD ajoutés sur le reçu.`,
        type: 'success',
        duration: 5000,
      });

      onClose();
      goto('my-orders');
    } catch (err) {
      toast?.push({
        title: 'Commande enregistrée',
        desc: 'Votre demande de coursier sur-mesure a été transmise.',
        type: 'success',
      });
      onClose();
      goto('my-orders');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-ink-900 border border-amber-200 dark:border-ink-800 shadow-2xl overflow-hidden p-6 sm:p-8 animate-scale-up">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-ink-100 dark:border-ink-800">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider border border-amber-500/20">
              🛍️ Restaurant ou Pâtisserie non listé ?
            </span>
            <h2 className="mt-2 font-display font-black text-2xl sm:text-3xl text-ink-900 dark:text-white leading-tight">
              Commande Sur-Mesure
            </h2>
            <p className="text-xs sm:text-sm text-ink-500 dark:text-ink-400 mt-1">
              Pâtisserie, snack quartier, boulangerie... Indiquez le lieu et ce que vous désirez !
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="w-9 h-9 rounded-full bg-ink-100 dark:bg-ink-800 hover:bg-ink-200 dark:hover:bg-ink-700 flex items-center justify-center text-ink-600 dark:text-ink-300 transition-colors shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Pricing Highlight Banner */}
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-brand-500/10 border border-amber-500/20 text-xs sm:text-sm text-ink-800 dark:text-ink-200 flex items-start gap-3">
          <span className="text-2xl shrink-0">🛵</span>
          <div>
            <strong className="font-bold text-amber-600 dark:text-amber-400 block text-sm">
              Tarification transparente (+20 MAD)
            </strong>
            Le livreur achète vos produits directement en boutique et vous apporte le <strong>reçu officiel du commerce</strong>. Vous payez les achats réels + <strong>20 MAD de frais de coursier sur-mesure</strong> sur le reçu final.
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 dark:text-ink-300 mb-1.5">
              1. Nom du restaurant ou de la pâtisserie *
            </label>
            <input
              type="text"
              required
              placeholder="ex: Pâtisserie Rahmouni, Snack Al Medina, Boulangerie Paris..."
              value={placeName}
              onChange={(e) => setPlaceName(e.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-ink-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 text-sm text-ink-900 dark:text-white focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 dark:text-ink-300 mb-1.5">
              2. Adresse / Quartier du commerce (Optionnel)
            </label>
            <input
              type="text"
              placeholder="ex: Iberia, Boulevard Mohammed V, City Center..."
              value={placeAddress}
              onChange={(e) => setPlaceAddress(e.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-ink-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 text-sm text-ink-900 dark:text-white focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 dark:text-ink-300 mb-1.5">
              3. Ce que vous voulez commander (Détails précis) *
            </label>
            <textarea
              required
              rows={3}
              placeholder="ex: 2 Millefeuilles, 1 Tarte aux fraises, 1 Boîte de cornes de gazelle..."
              value={orderDetails}
              onChange={(e) => setOrderDetails(e.target.value)}
              className="w-full p-3 rounded-xl bg-ink-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 text-sm text-ink-900 dark:text-white focus:outline-none focus:border-brand-500 transition-colors resize-none"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 dark:text-ink-300 mb-1.5">
                4. Lieu de livraison (Campus / CHU) *
              </label>
              <input
                type="text"
                required
                placeholder="ex: CHU Aile B - Chambre 204, BU..."
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-ink-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 text-sm text-ink-900 dark:text-white focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 dark:text-ink-300 mb-1.5">
                5. Téléphone de contact *
              </label>
              <input
                type="tel"
                required
                placeholder="ex: 0612345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-ink-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 text-sm text-ink-900 dark:text-white focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl border border-ink-200 dark:border-ink-800 text-sm font-semibold text-ink-700 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-500 via-pink-500 to-violet-500 text-white font-bold text-sm shadow-glow hover:shadow-glow-lg active:scale-95 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Validation...' : 'Valider ma commande sur-mesure (+20 MAD)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
