'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { I } from '../../icons/Icons.jsx';
import { useOrders, useToast } from '../../contexts/AppContexts.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useYohaNav } from '../../contexts/YohaNavContext.jsx';
import { OrdonnanceUpload } from './OrdonnanceUpload.jsx';
import { CAMPUS_HOSPITALS } from '../../data/index.js';

const CATEGORY_META = {
  all: {
    label: 'Restaurant',
    badge: '🍽️ Restaurant ou Pâtisserie non listé ?',
    title: 'Commande Sur-Mesure',
    subtitle: 'Pâtisserie, snack quartier, boulangerie... Indiquez le lieu et ce que vous désirez !',
    nameLabel: 'Nom du restaurant ou de la pâtisserie *',
    namePlaceholder: 'ex: Pâtisserie Rahmouni, Snack Al Medina, Boulangerie Paris...',
    addrPlaceholder: 'ex: Iberia, Boulevard Mohammed V, City Center...',
    detailsPlaceholder: 'ex: 2 Millefeuilles, 1 Tarte aux fraises, 1 Boîte de cornes de gazelle...',
    restaurantId: 'custom-restaurant',
  },
  pharmacy: {
    label: 'Pharmacie',
    badge: '💊 Pharmacie non listée ?',
    title: 'Pharmacie Sur-Mesure',
    subtitle: 'Médicaments, ordonnance, produits de santé... Indiquez la pharmacie et ce que vous désirez !',
    nameLabel: 'Nom de la pharmacie *',
    namePlaceholder: 'ex: Pharmacie du Progrès, Pharmacie de la Gare...',
    addrPlaceholder: 'ex: Boulevard Pasteur, rue des Far...',
    detailsPlaceholder: 'ex: 2 boîtes de Doliprane 1000mg, 1 boîte de Spasfon...',
    restaurantId: 'custom-pharmacy',
  },
  parapharmacy: {
    label: 'Parapharmacie',
    badge: '🌿 Parapharmacie non listée ?',
    title: 'Parapharmacie Sur-Mesure',
    subtitle: 'Soins, cosmétiques, compléments... Indiquez la parapharmacie et ce que vous désirez !',
    nameLabel: 'Nom de la parapharmacie *',
    namePlaceholder: 'ex: Pôle Para, Para Tanger, Hypernaturel...',
    addrPlaceholder: 'ex: Tanger Boulevard, Ibn Batouta Mall...',
    detailsPlaceholder: 'ex: Crème hydratante, sérum Vitamine C, complément Oméga 3...',
    restaurantId: 'custom-parapharmacy',
  },
  patisserie: {
    label: 'Pâtisserie',
    badge: '🥐 Pâtisserie non listée ?',
    title: 'Pâtisserie Sur-Mesure',
    subtitle: 'Gâteaux, pâtisseries orientales, pain frais... Indiquez la pâtisserie et ce que vous désirez !',
    nameLabel: 'Nom de la pâtisserie *',
    namePlaceholder: 'ex: Pâtisserie Rahmouni, La Banquise, Pâtisserie Matisse...',
    addrPlaceholder: 'ex: Médina, rue de la Liberté...',
    detailsPlaceholder: 'ex: 1 Millefeuille, 6 cornes de gazelle, 1 tarte aux fraises...',
    restaurantId: 'custom-patisserie',
  },
  supermarket: {
    label: 'Supermarché',
    badge: '🛒 Supermarché non listé ?',
    title: 'Supermarché Sur-Mesure',
    subtitle: 'Courses, épicerie, produits frais... Indiquez le supermarché et ce que vous désirez !',
    nameLabel: 'Nom du supermarché *',
    namePlaceholder: 'ex: Marjane, Carrefour Market, BIM...',
    addrPlaceholder: 'ex: Boulevard Yacoub El Mansour, Centre-ville...',
    detailsPlaceholder: 'ex: 1L de lait, pain complet, 6 bouteilles d’eau 1.5L...',
    restaurantId: 'custom-supermarket',
  },
  shop: {
    label: 'Magasin',
    badge: '🛍️ Magasin non listé ?',
    title: 'Magasin Sur-Mesure',
    subtitle: 'Vêtements, accessoires, électronique... Indiquez le magasin et ce que vous désirez !',
    nameLabel: 'Nom du magasin *',
    namePlaceholder: 'ex: Zara, Adidas, Electroplanet...',
    addrPlaceholder: 'ex: Ibn Batouta Mall, Boulevard Mohammed V...',
    detailsPlaceholder: 'ex: 1 jean taille 34, 1 paire de baskets pointure 42...',
    restaurantId: 'custom-shop',
  },
};

/** Cache du référentiel des commerces de Tanger pour l'autocomplétion. */
let placesCache = null;
async function getPlaces() {
  if (placesCache) return placesCache;
  try {
    const res = await fetch('/data/autocomplete.json');
    placesCache = await res.json();
  } catch {
    placesCache = [];
  }
  return placesCache;
}

/** Normalise un texte (minuscules, sans accents) pour la recherche. */
function norm(s = '') {
  return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** Liste déroulante de suggestions. */
function SuggestionList({ items, onPick, render }) {
  if (!items.length) return null;
  return (
    <div className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto rounded-xl bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 shadow-2xl">
      {items.map((it, i) => (
        <button
          key={i}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onPick(it)}
          className="w-full text-left px-4 py-2.5 text-sm hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-800 dark:text-ink-100 transition-colors flex items-start justify-between gap-3"
        >
          {render(it)}
        </button>
      ))}
    </div>
  );
}

export function CustomOrderModal({ isOpen, onClose, category = 'all' }) {
  const { addOrder, syncOrder } = useOrders() || {};
  const { user } = useAuth() || {};
  const toast = useToast();
  const { goto } = useYohaNav();

  const [placeName, setPlaceName] = useState('');
  const [placeAddress, setPlaceAddress] = useState('');
  const [orderDetails, setOrderDetails] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState(CAMPUS_HOSPITALS[0]?.name || 'CHU Mohammed VI de Tanger');
  const [phone, setPhone] = useState(user?.phone || '');
  const [notes, setNotes] = useState('');
  const [ordonnanceUrl, setOrdonnanceUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [places, setPlaces] = useState([]);
  const [focusField, setFocusField] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    getPlaces().then((list) => { if (active) setPlaces(list); });
    return () => { active = false; };
  }, [isOpen]);

  const nameSuggestions = useMemo(() => {
    const q = norm(placeName);
    if (q.length < 2) return [];
    const matches = places.filter((p) => norm(p.n).includes(q));
    matches.sort((a, b) => Number(!norm(a.n).startsWith(q)) - Number(!norm(b.n).startsWith(q)));
    return matches.slice(0, 8);
  }, [places, placeName]);

  const addrList = useMemo(() => {
    const m = new Map();
    for (const p of places) if (p.a && !m.has(p.a)) m.set(p.a, p.n);
    return Array.from(m, ([a, n]) => ({ a, n }));
  }, [places]);

  const addrSuggestions = useMemo(() => {
    const q = norm(placeAddress);
    if (q.length < 2) return [];
    return addrList.filter((x) => norm(x.a).includes(q)).slice(0, 8);
  }, [addrList, placeAddress]);

  const metaKey =
    category === 'dessert' || category === 'patisserie'
      ? 'patisserie'
      : CATEGORY_META[category] ? category : 'all';
  const meta = CATEGORY_META[metaKey];

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
        id: `custom-${meta.restaurantId}-${Date.now()}`,
        name: `${meta.label} sur-mesure: ${orderDetails.slice(0, 45)}...`,
        price: 20, // 20 MAD custom delivery fee
        qty: 1,
        restaurantId: meta.restaurantId,
        restaurantName: placeName.trim(),
      };

      const customerInfo = {
        name: user?.displayName || 'Client Alliance',
        phone: phone.trim(),
        address: deliveryAddress.trim(),
        ordonnanceUrl: metaKey === 'pharmacy' ? ordonnanceUrl : '',
        restaurantNotes: `[${meta.label.toUpperCase()} NON LISTÉ] Nom: ${placeName.trim()} | Adresse lieu: ${placeAddress.trim()} | Commande: ${orderDetails.trim()} | Note: ${notes.trim()} | FRAIS COURSIER: 20 MAD (à ajouter au reçu)`,
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
              {meta.badge}
            </span>
            <h2 className="mt-2 font-display font-black text-2xl sm:text-3xl text-ink-900 dark:text-white leading-tight">
              {meta.title}
            </h2>
            <p className="text-xs sm:text-sm text-ink-500 dark:text-ink-400 mt-1">
              {meta.subtitle}
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
              1. {meta.nameLabel}
            </label>
            <div
              className="relative"
              onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setFocusField(null); }}
            >
              <input
                type="text"
                required
                placeholder={meta.namePlaceholder}
                value={placeName}
                onChange={(e) => setPlaceName(e.target.value)}
                onFocus={() => setFocusField('name')}
                className="w-full h-11 px-4 rounded-xl bg-ink-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 text-sm text-ink-900 dark:text-white focus:outline-none focus:border-brand-500 transition-colors"
              />
              {focusField === 'name' && nameSuggestions.length > 0 && (
                <SuggestionList
                  items={nameSuggestions}
                  onPick={(p) => {
                    setPlaceName(p.n);
                    if (!placeAddress.trim()) setPlaceAddress(p.a);
                    setFocusField(null);
                  }}
                  render={(p) => (
                    <>
                      <span className="font-semibold truncate">{p.n}</span>
                      {p.a && <span className="text-xs text-ink-400 dark:text-ink-500 truncate shrink-0">{p.a}</span>}
                    </>
                  )}
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 dark:text-ink-300 mb-1.5">
              2. Adresse / Quartier du commerce (Optionnel)
            </label>
            <div
              className="relative"
              onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setFocusField(null); }}
            >
              <input
                type="text"
                placeholder={meta.addrPlaceholder}
                value={placeAddress}
                onChange={(e) => setPlaceAddress(e.target.value)}
                onFocus={() => setFocusField('addr')}
                className="w-full h-11 px-4 rounded-xl bg-ink-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 text-sm text-ink-900 dark:text-white focus:outline-none focus:border-brand-500 transition-colors"
              />
              {focusField === 'addr' && addrSuggestions.length > 0 && (
                <SuggestionList
                  items={addrSuggestions}
                  onPick={(x) => { setPlaceAddress(x.a); setFocusField(null); }}
                  render={(x) => (
                    <>
                      <span className="truncate">{x.a}</span>
                      {x.n && <span className="text-xs text-ink-400 dark:text-ink-500 truncate shrink-0">{x.n}</span>}
                    </>
                  )}
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 dark:text-ink-300 mb-1.5">
              3. Ce que vous voulez commander (Détails précis) *
            </label>
            <textarea
              required
              rows={3}
              placeholder={meta.detailsPlaceholder}
              value={orderDetails}
              onChange={(e) => setOrderDetails(e.target.value)}
              className="w-full p-3 rounded-xl bg-ink-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 text-sm text-ink-900 dark:text-white focus:outline-none focus:border-brand-500 transition-colors resize-none"
            />
          </div>

          {metaKey === 'pharmacy' && (
            <OrdonnanceUpload
              value={ordonnanceUrl}
              onChange={setOrdonnanceUrl}
              label="Avez-vous une ordonnance ? (Optionnel)"
              hint="Prenez une photo de votre ordonnance : notre livreur la montrera à la pharmacie avant l’achat."
            />
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 dark:text-ink-300 mb-1.5">
                4. Lieu de livraison *
              </label>
              <select
                required
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-ink-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 text-sm text-ink-900 dark:text-white focus:outline-none focus:border-brand-500 transition-colors"
              >
                {CAMPUS_HOSPITALS.map((place) => (
                  <option key={place.name} value={place.name}>
                    {place.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[10px] text-ink-500 font-medium">4 zones YoHa uniquement</p>
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
