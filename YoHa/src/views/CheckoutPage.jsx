'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { I } from '../icons/Icons.jsx';
import { useAuth, migrateLegacyDisplayName } from '../contexts/AuthContext.jsx';
import { Row } from '../components/ui/Row.jsx';
import { Card, CardHeader, Input, Loader } from '../components/checkout/CheckoutForms.jsx';
import { TimeSlotPicker } from '../components/checkout/TimeSlotPicker.jsx';
import { MenuItemImage } from '../components/ui/MenuItemImage.jsx';
import { getSmallOrderSurchargeMad, getServiceFeeMad, formatMad, CAMPUS_HOSPITALS } from '../data/index.js';
import { useOrders } from '../contexts/AppContexts.jsx';

export function Checkout({ cart, total, onBack, onSuccess, addOrder, onLogin }) {
  const { user } = useAuth();
  const [address, setAddress] = useState(CAMPUS_HOSPITALS[0]?.name || 'CHU Mohammed VI de Tanger');
  const [phone, setPhone] = useState('');
  const [restaurantNotes, setRestaurantNotes] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoErr, setPromoErr] = useState('');

  // Aucun minimum de commande. Supplément petite commande selon sous-total.
  // Livraison : 0 MAD restos / 20 MAD × boutiques sur-mesure.
  const isCustom = cart.some(i => i.isCustom || ['pharmacy', 'dessert', 'supermarket', 'shop', 'parapharmacy'].includes(i.restaurantCuisine));
  const customItems = cart.filter(i => i.isCustom || ['pharmacy', 'dessert', 'supermarket', 'shop', 'parapharmacy'].includes(i.restaurantCuisine));
  const uniqueCustomShops = new Set(customItems.map(i => i.restaurantName?.trim().toLowerCase() || i.restaurantId));
  
  const deliveryFee = isCustom ? uniqueCustomShops.size * 20 : 0;
  const smallOrderFee = getSmallOrderSurchargeMad(total);
  const isGroupOrder = !isCustom && total >= 200;
  const serviceFee = getServiceFeeMad(total, { isCustom });


  const cartSection = useMemo(() => {
    const cuisines = cart.map(i => i.restaurantCuisine).filter(Boolean);
    const unique = [...new Set(cuisines)];
    if (unique.length === 0) return null;
    if (unique.some(c => ['pharmacy', 'parapharmacy', 'supermarket', 'shop', 'patisserie', 'dessert'].includes(c))) {
      return unique.find(c => ['pharmacy', 'parapharmacy', 'supermarket', 'shop', 'patisserie', 'dessert'].includes(c)) || unique[0];
    }
    return 'restaurant';
  }, [cart]);

  const discountPct = appliedPromo ? (appliedPromo.discount || 0) : 0;
  const fixedDiscount = appliedPromo && appliedPromo.fixed_amount ? appliedPromo.fixed_amount : (appliedPromo?.code === 'YOHA50' ? 50 : 0);
  const discountAmount = fixedDiscount > 0 ? Math.min(total, fixedDiscount) : (discountPct > 0 ? Math.round(total * discountPct) / 100 : 0);
  const grand = Math.max(0, total + deliveryFee + serviceFee + smallOrderFee - discountAmount);

  const mainStoreName = cart[0]?.restaurantName || 'YoHa Partner';

  const uniqueStores = cart.reduce((acc, i) => {
    const key = i.restaurantId || i.restaurantName?.trim().toLowerCase();
    if (key && !acc.has(key)) acc.set(key, i.restaurantName || key);
    return acc;
  }, new Map());
  const storeNames = [...uniqueStores.values()];
  const isMultiStore = storeNames.length > 1;
  const deliveryEta = isMultiStore ? '45 min - 1h' : '45-60 min';
  const storeLabel = storeNames.length > 2
    ? `${storeNames.slice(0, 2).join(', ')} & ${storeNames.length - 2} autre${storeNames.length - 2 > 1 ? 's' : ''}`
    : storeNames.join(' & ');

  const { orders = [] } = useOrders() || {};

  // Check promo code active status from localStorage / Admin settings
  const checkPromoStatus = (codeName) => {
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('yoha_promos');
        if (raw) {
          const list = JSON.parse(raw);
          const found = list.find(p => p.code?.toUpperCase() === codeName.toUpperCase());
          if (found) return found;
        }
      }
    } catch {}
    return { code: codeName, active: true };
  };

  const yoha50Status = checkPromoStatus('YOHA50');
  const isYoha50Active = yoha50Status.active !== false;

  // Check if current user / phone / email has ALREADY used YOHA50 or has previous orders
  const hasUsedYoha50 = useMemo(() => {
    const userEmail = (user?.email || email || '').toLowerCase().trim();
    const userUid = user?.uid || user?.id;
    const userPhone = (phone || '').replace(/\s+/g, '');

    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('yoha_used_yoha50');
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            if (
              (userEmail && list.includes(userEmail)) ||
              (userUid && list.includes(String(userUid))) ||
              (userPhone && list.includes(userPhone))
            ) {
              return true;
            }
          }
        }
      }
    } catch {}

    return orders.some((o) => {
      if (o.status === 'cancelled') return false;
      const matchEmail = userEmail && o.customer?.email && o.customer.email.toLowerCase().trim() === userEmail;
      const matchUid = userUid && o.userId && String(o.userId) === String(userUid);
      const matchPhone = userPhone && o.customer?.phone && o.customer.phone.replace(/\s+/g, '') === userPhone;
      return matchEmail || matchUid || matchPhone;
    });
  }, [orders, user, email, phone]);

  const applyYoha50 = () => {
    setPromoErr('');
    if (!isYoha50Active) {
      setPromoErr('Le code YOHA50 a été désactivé par l\'administration.');
      return;
    }
    if (!user) {
      setPromoErr('Offre YOHA50 réservée aux comptes connectés. Connectez-vous d\'abord pour profiter de -50 MAD sur votre 1ère commande !');
      return;
    }
    if (hasUsedYoha50) {
      setPromoErr('Le code YOHA50 a déjà été utilisé sur votre compte. Cette offre est réservée uniquement à votre 1ère commande.');
      return;
    }
    setAppliedPromo({ code: 'YOHA50', fixed_amount: 50, valid: true });
  };

  useEffect(() => {
    if (user?.role === 'client') {
      if (user.displayName) setName(migrateLegacyDisplayName(user.displayName));
      if (user.email) setEmail(user.email);
      if (user.phone) setPhone(String(user.phone));
    }
  }, [user]);

  const [err, setErr] = useState('');
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

  useEffect(() => {
    if (!err) return;
    try {
      document.getElementById('checkout-err-banner')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch {
      /* ignore */
    }
  }, [err]);

  const applyPromo = async () => {
    setPromoErr('');
    const code = promoInput.trim().toUpperCase();
    if (!code) { setPromoErr('Entrez un code promo'); return; }

    const promoStatus = checkPromoStatus(code);
    if (promoStatus.active === false) {
      setPromoErr(`Le code promo ${code} a été désactivé par l'administration.`);
      return;
    }

    if (code === 'YOHA50') {
      if (!user) {
        setPromoErr('Le code YOHA50 est réservé aux membres connectés pour leur 1ère commande.');
        return;
      }
      if (hasUsedYoha50) {
        setPromoErr('Le code YOHA50 a déjà été utilisé. Cette offre de 50 MAD est valable 1 seule fois par client.');
        return;
      }
      setAppliedPromo({ code: 'YOHA50', fixed_amount: 50, valid: true });
      setPromoInput('');
      return;
    }

    if (code === 'GROUPE0') {
      if (total < 200) {
        setPromoErr('Le code GROUPE0 nécessite un panier d\'au moins 200 MAD.');
        return;
      }
      setAppliedPromo({ code: 'GROUPE0', fixed_amount: 0, valid: true, free_delivery: true });
      setPromoInput('');
      return;
    }

    if (code === 'YOHA10') {
      setAppliedPromo({ code: 'YOHA10', discount: 10, valid: true });
      setPromoInput('');
      return;
    }

    if (code === 'EXCLU15') {
      setAppliedPromo({ code: 'EXCLU15', discount: 15, valid: true });
      setPromoInput('');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/marketing/promos/validate/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, section: cartSection || 'restaurant' }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setAppliedPromo(data);
        setPromoInput('');
      } else {
        setPromoErr(data.detail || 'Code invalide ou expiré');
      }
    } catch {
      setPromoErr('Code invalide ou non reconnu.');
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoErr('');
  };

  const handleConfirm = async () => {
    setErr('');
    const trimmedName = String(name || '').trim();
    if (!trimmedName || trimmedName.length < 2) {
      setErr('Indiquez votre nom pour la livraison.');
      return;
    }
    const trimmedEmail = email.trim();
    if (!user && !trimmedEmail) {
      setErr('E-mail obligatoire pour recevoir le suivi de commande.');
      return;
    }
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErr('Adresse e-mail invalide.');
      return;
    }
    if (!CAMPUS_HOSPITALS.some((p) => p.name === address)) {
      setErr('Choisissez un lieu de livraison parmi les 4 zones YoHa.');
      return;
    }
    const trimmedPhone = String(phone || '').trim();
    const phoneDigits = trimmedPhone.replace(/\D/g, '');
    if (!trimmedPhone) {
      setErr('Numéro de téléphone obligatoire pour que le livreur puisse vous joindre.');
      return;
    }
    // Accepte 06… / 07… / +2126… / 2126… (9+ chiffres utiles)
    if (phoneDigits.length < 9 || phoneDigits.length > 15) {
      setErr('Numéro de téléphone invalide. Ex. : +212 6 XX XX XX XX');
      return;
    }
    setSubmitting(true);
    const ordonnanceUrl = cart.find(i => i.customDetails?.ordonnanceUrl)?.customDetails?.ordonnanceUrl || '';
    const customer = { name: trimmedName, address, phone: trimmedPhone, email: trimmedEmail, restaurantNotes: restaurantNotes.trim(), scheduledTime: scheduledTime || undefined, ordonnanceUrl };
    try {
      const orderId = await addOrder(cart, grand, customer);
      try {
        const storeName = cart[0]?.restaurantName || 'YoHa Store';
        localStorage.setItem('yoha_last_order', JSON.stringify({
          restaurantName: storeName,
          restaurantId: cart[0]?.restaurantId,
          items: cart,
          total: Math.round(grand * 100) / 100,
          date: new Date().toISOString(),
        }));

        // Permanently record that this user/email/phone has placed an order / used YOHA50
        const raw = localStorage.getItem('yoha_used_yoha50');
        let list = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(list)) list = [];
        const userEmail = (user?.email || trimmedEmail || '').toLowerCase().trim();
        const userUid = user?.uid || user?.id;
        const userPhone = (phone || '').replace(/\s+/g, '');

        if (userEmail && !list.includes(userEmail)) list.push(userEmail);
        if (userUid && !list.includes(String(userUid))) list.push(String(userUid));
        if (userPhone && !list.includes(userPhone)) list.push(userPhone);

        localStorage.setItem('yoha_used_yoha50', JSON.stringify(list));
      } catch {}
      onSuccess(orderId);
    } catch (e) {
      setErr(e.message || 'Impossible de valider la commande.');
      setSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="page-enter relative min-h-[70vh] max-w-2xl mx-auto px-4 sm:px-6 py-20 sm:py-24 text-center overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(70%_50%_at_50%_0%,rgba(249,115,22,0.2),transparent_55%),radial-gradient(50%_40%_at_80%_30%,rgba(236,72,153,0.12),transparent_50%),radial-gradient(40%_35%_at_20%_80%,rgba(139,92,246,0.1),transparent_55%)] pointer-events-none"
        />
        <div className="relative">
          <p className="font-display font-black text-4xl sm:text-5xl text-gradient">YoHa</p>
          <h2 className="mt-4 font-display font-bold text-2xl sm:text-3xl text-ink-950 dark:text-white tracking-tight">
            Panier vide
          </h2>
          <p className="mt-2 text-ink-500 dark:text-ink-400 font-medium max-w-sm mx-auto text-sm sm:text-base">
            Ajoute quelques plats et reviens finaliser ta commande.
          </p>
          <button
            type="button"
            onClick={onBack}
            className="mt-7 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 via-pink-500 to-violet-500 text-white font-bold text-sm shadow-glow active:scale-95 transition-all btn-sweep"
          >
            Découvrir les restaurants →
          </button>
        </div>
      </div>
    );
  }

  const cartQty = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <div className="page-enter relative w-full min-w-0 overflow-x-hidden bg-white dark:bg-ink-950">
      <section className="relative overflow-hidden bg-ink-950 text-white">
        <div
          aria-hidden
          className="browse-hero-mesh absolute inset-0 pointer-events-none opacity-90"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,rgba(2,6,23,0.55)_100%)] pointer-events-none"
        />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-7 sm:pb-9">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onBack}
              className="cursor-pointer inline-flex items-center gap-2 self-start min-h-[40px] px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-colors border border-white/15"
            >
              <I.Left size={16} /> <span>Retour</span>
            </button>
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] sm:text-[12px] font-semibold text-white/50">
              <span className="text-pink-200/90">Panier</span>
              <span aria-hidden className="text-white/25">→</span>
              <span className="text-white">Validation</span>
              <span aria-hidden className="text-white/25">→</span>
              <span className="hidden md:inline">Confirmation</span>
            </div>
          </div>

          <h1 className="mt-5 sm:mt-6 font-display font-black tracking-tight leading-[0.95] max-w-xl">
            <span className="block text-gradient text-glow text-[clamp(2.4rem,8vw,3.75rem)]">YoHa</span>
            <span className="mt-2.5 block text-[1.25rem] sm:text-2xl lg:text-[1.75rem] text-white/95 font-bold">
              Finaliser ta commande
            </span>
          </h1>
          <p className="mt-2.5 text-sm text-white/60 font-medium max-w-lg leading-relaxed">
            Livraison en {deliveryEta}
            <span className="text-white/30"> · </span>
            Alliance · CHU
            <span className="text-white/30"> · </span>
            {cartQty} article{cartQty > 1 ? 's' : ''}
          </p>
        </div>
      </section>

      <div className="browse-grid-bg relative">
        <div className="relative max-w-5xl mx-auto w-full px-3.5 sm:px-6 pt-4 sm:pt-6 pb-[calc(7.25rem+env(safe-area-inset-bottom))] lg:pb-12">
          {!user ? (
            <div className="mb-4 sm:mb-5 rounded-2xl bg-ink-950 text-white px-4 py-3.5 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 border border-white/10">
              <p className="font-medium text-white/85 text-[13px] sm:text-sm leading-snug">
                <span className="font-bold text-white">Commande invité</span> — aucun mot de passe requis.
              </p>
              {onLogin && (
                <button
                  type="button"
                  onClick={onLogin}
                  className="font-semibold text-pink-200 hover:text-white shrink-0 text-xs cursor-pointer self-start sm:self-auto"
                >
                  Se connecter →
                </button>
              )}
            </div>
          ) : (
            <div className="mb-4 sm:mb-5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/70 dark:border-emerald-500/25 px-4 py-3 text-[13px] sm:text-sm text-emerald-900 dark:text-emerald-200 font-medium">
              Connecté · <strong className="font-bold">{user.displayName}</strong> — cette commande compte pour ta cagnotte.
            </div>
          )}

          <div className="grid lg:grid-cols-5 gap-4 sm:gap-5 lg:gap-6 min-w-0 items-start">
            <div className="lg:col-span-3 space-y-3.5 sm:space-y-4 animate-fade-up min-w-0 order-2 lg:order-1">
              <Card>
                <CardHeader
                  icon={<I.MapPin size={17} />}
                  title="Coordonnées de livraison"
                  subtitle="Alliance · CHU · FMPT · ISPITS"
                />
                <div className="p-4 sm:p-5 space-y-4">
                  <Input label="Nom complet" value={name} onChange={setName} placeholder="Prénom Nom" />
                  {!user ? (
                    <div>
                      <Input label="E-mail *" value={email} onChange={setEmail} placeholder="vous@exemple.com" type="email" />
                      <p className="text-[12px] text-ink-500 mt-1.5 font-medium">
                        Confirmation et suivi envoyés par e-mail.
                      </p>
                    </div>
                  ) : (
                    <Input
                      label="E-mail de confirmation"
                      value={email || user.email || ''}
                      onChange={setEmail}
                      placeholder="vous@exemple.com"
                      type="email"
                    />
                  )}

                  <div>
                    <span className="text-[12px] font-semibold text-ink-600 dark:text-ink-300 tracking-tight">
                      Lieu de livraison *
                    </span>
                    <p className="mt-1 text-[12px] text-ink-500 font-medium">Choisis ta zone YoHa</p>
                    <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                      {CAMPUS_HOSPITALS.map((place) => {
                        const selected = address === place.name;
                        return (
                          <button
                            key={place.name}
                            type="button"
                            onClick={() => setAddress(place.name)}
                            className={`text-left rounded-2xl border p-3 sm:p-3.5 transition-all min-h-[64px] ${
                              selected
                                ? 'border-brand-500 bg-gradient-to-br from-brand-500/12 via-pink-500/8 to-violet-500/10 ring-2 ring-brand-500/20'
                                : 'border-ink-200 dark:border-ink-800 bg-ink-50/60 dark:bg-ink-950 hover:border-brand-400/50'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <span
                                className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 ${
                                  selected ? 'border-brand-500 bg-brand-500' : 'border-ink-300 dark:border-ink-600'
                                }`}
                              >
                                {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                              </span>
                              <div className="min-w-0">
                                <div className="font-bold text-[13px] sm:text-sm text-ink-950 dark:text-white leading-snug">{place.name}</div>
                                <div className="mt-0.5 text-[11px] sm:text-[12px] text-ink-500 font-medium leading-snug">{place.subtitle}</div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <Input label="Numéro de téléphone *" value={phone} onChange={setPhone} placeholder="+212 6 XX XX XX XX" type="tel" />
                  <p className="text-[12px] text-ink-500 -mt-2 font-medium">
                    Le livreur t&apos;appelle si besoin à l&apos;arrivée.
                  </p>

                  <label className="block space-y-1.5">
                    <span className="text-[12px] font-semibold text-ink-600 dark:text-ink-300 tracking-tight">
                      Instructions livreur / restaurant
                    </span>
                    <textarea
                      value={restaurantNotes}
                      onChange={(e) => setRestaurantNotes(e.target.value)}
                      className="w-full min-h-[72px] px-3.5 sm:px-4 py-3 rounded-xl bg-ink-50/90 dark:bg-ink-950 border border-ink-200/90 dark:border-ink-800 outline-none focus:border-brand-500 dark:focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15 text-base sm:text-sm font-medium transition resize-none text-ink-950 dark:text-white"
                      rows={2}
                      placeholder="Ex. : sans oignons, appeler devant le portail CHU…"
                    />
                  </label>
                </div>
              </Card>

              <Card>
                <CardHeader
                  icon={<I.Clock size={17} />}
                  title="Quand livrer ?"
                  subtitle="ASAP ou créneau planifié"
                />
                <div className="p-4 sm:p-5">
                  <TimeSlotPicker selected={scheduledTime} onSelect={setScheduledTime} />
                </div>
              </Card>

              <Card>
                <CardHeader icon={<I.Card size={17} />} title="Mode de paiement" subtitle="Uniquement à la livraison" />
                <div className="p-4 sm:p-5">
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-ink-950 text-white flex items-center gap-3.5 border border-white/10">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 via-pink-500 to-violet-500 flex items-center justify-center shrink-0 font-bold text-xs tracking-tight shadow-glow">
                      MAD
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-sm text-white">Espèces à la livraison</h4>
                      <p className="text-[12px] text-white/60 mt-0.5 font-medium leading-normal">
                        Paye le livreur YoHa dès réception.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <CardHeader
                  icon={<I.Bag size={17} />}
                  title="Ton panier"
                  subtitle={`${cartQty} article${cartQty > 1 ? 's' : ''} · ${storeLabel}`}
                />
                <div className="p-4 sm:p-5 space-y-0 divide-y divide-ink-100 dark:divide-ink-800">
                  {cart.map((it) => (
                    <div key={it.id} className="py-3 first:pt-0 last:pb-0 flex items-center gap-3 min-w-0">
                      <MenuItemImage src={it.img} alt="" className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        {it.isCustom ? (
                          <div className="space-y-0.5">
                            <div className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">Sur-mesure</div>
                            {it.customDetails?.storeAddress && (
                              <div className="text-xs text-ink-500 font-semibold truncate">{it.customDetails.storeName}</div>
                            )}
                            <p className="text-xs text-ink-700 dark:text-ink-300 font-medium truncate">{it.customDetails?.details}</p>
                          </div>
                        ) : (
                          <>
                            <h4 className="font-bold text-sm text-ink-950 dark:text-white truncate">{it.name}</h4>
                            <div className="text-[12px] text-ink-500 dark:text-ink-400 font-medium mt-0.5 truncate">
                              ×{it.qty} · {it.restaurantName || mainStoreName}
                            </div>
                            {(it.options || []).length > 0 && (
                              <div className="text-[11px] text-ink-400 dark:text-ink-500 mt-0.5 truncate">
                                {it.options.map((o) => o.name).join(' · ')}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      <div className="font-bold text-sm text-ink-950 dark:text-white shrink-0 tabular-nums">
                        {it.price > 0 ? formatMad(it.price * it.qty) : <span className="text-brand-600">Sur ticket</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="lg:col-span-2 lg:sticky lg:top-20 self-start animate-fade-up min-w-0 order-1 lg:order-2" style={{ animationDelay: '60ms' }}>
              <Card className="border-brand-500/25 shadow-[0_28px_60px_-30px_rgba(249,115,22,0.4)] ring-1 ring-brand-500/10">
                <div className="relative p-4 sm:p-5 space-y-3.5 sm:space-y-4">
                  <div className="flex items-end justify-between gap-2 border-b border-ink-100 dark:border-white/8 pb-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-400">
                        Récapitulatif
                      </p>
                      <h3 className="font-display font-black text-lg sm:text-xl text-ink-950 dark:text-white tracking-tight mt-0.5">
                        Total à payer
                      </h3>
                    </div>
                    {isGroupOrder ? (
                      <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-2.5 py-1 rounded-xl shrink-0">
                        Offre groupe
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 bg-brand-500/10 px-2.5 py-1 rounded-xl shrink-0">
                        {deliveryFee === 0 ? 'Livraison offerte' : deliveryEta}
                      </span>
                    )}
                  </div>

                  {!isCustom && (
                    <div className={`p-3 rounded-2xl text-[12px] font-medium leading-snug ${isGroupOrder ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200' : 'bg-ink-50 dark:bg-ink-950 text-ink-700 dark:text-ink-300'}`}>
                      {isGroupOrder ? (
                        <p><strong className="font-bold">Commande de groupe</strong> — livraison &amp; service offerts.</p>
                      ) : (
                        <p>
                          Ajoute <strong className="font-bold text-brand-600 dark:text-brand-400">{formatMad(200 - total)}</strong> pour livraison &amp; service offerts (seuil 200 MAD).
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2.5">
                    <Row
                      label="Sous-total plats"
                      value={isCustom ? (total > 0 ? `${formatMad(total)} + achats` : <span className="text-brand-600 dark:text-brand-400 font-bold">Sur ticket</span>) : formatMad(total)}
                    />
                    <Row
                      label="Frais de livraison"
                      value={deliveryFee === 0 ? <span className="text-emerald-600 dark:text-emerald-400 font-bold">Offerte</span> : <span className="text-ink-950 dark:text-white font-bold">{formatMad(deliveryFee)}</span>}
                    />
                    <Row
                      label="Frais de service"
                      value={serviceFee === 0 ? <span className="text-emerald-600 dark:text-emerald-400 font-bold">Offerts</span> : <span className="text-ink-950 dark:text-white font-bold">{formatMad(serviceFee)}</span>}
                    />
                    <Row
                      label="Supplément petite commande"
                      value={smallOrderFee === 0 ? <span className="text-ink-400 font-medium">Aucun</span> : <span className="text-ink-950 dark:text-white font-bold">{formatMad(smallOrderFee)}</span>}
                    />

                    {discountAmount > 0 && (
                      <Row
                        label={<span className="text-emerald-600 dark:text-emerald-400 font-bold">Promo ({appliedPromo?.code || 'YOHA50'})</span>}
                        value={<span className="text-emerald-600 dark:text-emerald-400 font-bold">-{formatMad(discountAmount)}</span>}
                      />
                    )}
                  </div>

                  <div className="border-t border-ink-100 dark:border-white/8 pt-3">
                    <Row
                      label={<b className="text-base font-bold text-ink-950 dark:text-white">Total</b>}
                      value={
                        <b className="font-display text-2xl sm:text-[1.85rem] font-black tracking-tight text-gradient">
                          {isCustom ? `${formatMad(grand)} + achats` : formatMad(grand)}
                        </b>
                      }
                    />
                  </div>

                  {smallOrderFee > 0 && (
                    <p className="text-[12px] text-ink-500 dark:text-ink-400 bg-ink-50 dark:bg-ink-950 p-3 rounded-2xl leading-snug">
                      {total < 40
                        ? `Panier < 40 MAD : +10 MAD. Dès 40 MAD → +5 MAD, dès 70 MAD → aucun supplément.`
                        : `Panier < 70 MAD : +5 MAD. Ajoute ${formatMad(70 - total)} pour supprimer le supplément.`}
                    </p>
                  )}

                  {isYoha50Active && !appliedPromo && !hasUsedYoha50 && (
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-ink-950 text-white space-y-2.5 border border-white/10">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-pink-200">Offre bienvenue</span>
                        <span className="text-xs font-bold">−50 MAD</span>
                      </div>
                      <p className="text-[12px] text-white/70 font-medium leading-snug">
                        Code <strong className="text-white">YOHA50</strong> sur ta 1ʳᵉ commande.
                      </p>
                      {!user ? (
                        <p className="text-[11px] font-medium text-white/55">Connecte-toi pour activer l&apos;offre.</p>
                      ) : (
                        <p className="text-[11px] font-medium text-emerald-300">Tu es éligible.</p>
                      )}
                      <button
                        type="button"
                        onClick={applyYoha50}
                        className={`w-full min-h-[44px] py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center cursor-pointer ${
                          !user
                            ? 'bg-white/15 text-white/70 hover:bg-white/20'
                            : 'bg-gradient-to-r from-brand-500 via-pink-500 to-violet-500 text-white shadow-glow active:scale-[0.98] btn-sweep'
                        }`}
                      >
                        Appliquer −50 MAD
                      </button>
                    </div>
                  )}

                  <div className="pt-0.5">
                    {appliedPromo ? (
                      <div className="flex items-center justify-between gap-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl px-3.5 py-2.5 border border-emerald-200 dark:border-emerald-700">
                        <span className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-300 truncate">
                          {appliedPromo.code} (−{formatMad(discountAmount)})
                        </span>
                        <button type="button" onClick={removePromo} className="text-xs font-bold text-rose-600 hover:underline cursor-pointer shrink-0">Retirer</button>
                      </div>
                    ) : (
                      <div className="flex items-stretch gap-2">
                        <input
                          value={promoInput}
                          onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                          placeholder="Code promo"
                          className="flex-1 min-w-0 min-h-[44px] rounded-xl border border-ink-200 bg-ink-50 px-3.5 py-2.5 text-xs font-bold tracking-wider outline-none focus:border-brand-500 dark:border-ink-700 dark:bg-ink-950 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={applyPromo}
                          className="cursor-pointer shrink-0 min-h-[44px] rounded-xl bg-ink-950 dark:bg-white text-white dark:text-ink-950 px-4 py-2.5 text-xs font-bold hover:bg-brand-500 dark:hover:bg-brand-500 dark:hover:text-white active:scale-95 transition-all"
                        >
                          Valider
                        </button>
                      </div>
                    )}
                    {promoErr && <p className="mt-1.5 text-xs font-bold text-rose-600 leading-snug">{promoErr}</p>}
                  </div>

                  {err && (
                    <p id="checkout-err-banner" className="text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200 leading-snug">
                      {err}
                    </p>
                  )}

                  <div className="pt-1 hidden lg:block">
                    <button
                      type="button"
                      onClick={handleConfirm}
                      disabled={submitting}
                      className="w-full relative min-h-[52px] py-3.5 px-5 rounded-2xl bg-gradient-to-r from-brand-500 via-pink-500 to-violet-500 text-white font-bold text-sm sm:text-base shadow-glow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99] btn-sweep"
                    >
                      {submitting ? (
                        <span className="flex items-center justify-center gap-2 font-bold text-sm">Traitement… <Loader /></span>
                      ) : (
                        <span className="flex items-center justify-center gap-2 font-display font-bold">
                          <span>Confirmer la commande</span>
                          <I.Right size={18} stroke={2.5} />
                        </span>
                      )}
                    </button>
                    <p className="mt-3 text-center text-[12px] text-ink-500 font-medium">Paiement à la livraison · Espèces</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 inset-x-0 z-50 px-3 pt-2.5 bg-ink-950/96 backdrop-blur-xl border-t border-white/10 shadow-[0_-20px_50px_-20px_rgba(0,0,0,0.55)] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="max-w-lg mx-auto space-y-2">
          {err ? (
            <p className="text-[11px] font-bold text-rose-200 bg-rose-500/20 px-2.5 py-2 rounded-xl leading-snug">{err}</p>
          ) : null}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="shrink-0 min-w-0 max-w-[34%]">
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/45">Total</div>
              <div className="font-display font-black text-lg text-white truncate tabular-nums leading-tight">{formatMad(grand)}</div>
            </div>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={submitting}
              className="min-w-0 flex-1 min-h-[48px] py-3 px-3 rounded-2xl bg-gradient-to-r from-brand-500 via-pink-500 to-violet-500 text-white font-bold text-sm active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-glow btn-sweep"
            >
              {submitting ? (
                <span className="font-bold text-xs flex items-center gap-2">Traitement… <Loader /></span>
              ) : (
                <span className="flex items-center justify-center gap-1.5 font-display font-bold">
                  <span className="truncate">Confirmer</span>
                  <I.Right size={16} stroke={2.5} className="shrink-0" />
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
