'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { I } from '../icons/Icons.jsx';
import { useAuth, migrateLegacyDisplayName } from '../contexts/AuthContext.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Row } from '../components/ui/Row.jsx';
import { Card, CardHeader, Input, Loader } from '../components/checkout/CheckoutForms.jsx';
import { TimeSlotPicker } from '../components/checkout/TimeSlotPicker.jsx';
import { MenuItemImage } from '../components/ui/MenuItemImage.jsx';
import { getServiceFeeMad, formatMad } from '../data/index.js';
import { useCart, useOrders } from '../contexts/AppContexts.jsx';

export function Checkout({ cart, total, onBack, onSuccess, addOrder, onLogin }) {
  const { user } = useAuth();
  const { setCart } = useCart();
  const [address, setAddress] = useState('CHU-Tanger');
  const [phone, setPhone] = useState('+212 6 12 34 56 78');
  const [restaurantNotes, setRestaurantNotes] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [name, setName] = useState('X Y');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoErr, setPromoErr] = useState('');

  const MIN_ORDER_TOTAL = 40;
  const isCustom = cart.some(i => i.isCustom || ['pharmacy', 'dessert', 'supermarket', 'shop', 'parapharmacy'].includes(i.restaurantCuisine));
  const customItems = cart.filter(i => i.isCustom || ['pharmacy', 'dessert', 'supermarket', 'shop', 'parapharmacy'].includes(i.restaurantCuisine));
  const uniqueCustomShops = new Set(customItems.map(i => i.restaurantName?.trim().toLowerCase() || i.restaurantId));
  
  // Smart Win-Win Fee Structure:
  // - Total >= 200 MAD (Group Order): 0 MAD delivery + 0 MAD service fee!
  // - Total >= 120 MAD: 4.99 MAD delivery + 3.99 MAD service fee.
  // - Total < 120 MAD: 7.99 MAD delivery + 3.99 MAD service fee.
  const isGroupOrder = total >= 200;
  const isEcoDelivery = total >= 120 && total < 200;
  const deliveryFee = isCustom ? uniqueCustomShops.size * 20 : (isGroupOrder ? 0 : (isEcoDelivery ? 4.99 : 7.99));
  const serviceFee = isCustom ? 0 : (isGroupOrder ? 0 : 3.99);

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
  const grand = Math.max(0, total + deliveryFee + serviceFee - discountAmount);

  const mainStoreName = cart[0]?.restaurantName || 'YoHa Partner';

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
    }
  }, [user]);

  const [err, setErr] = useState('');
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

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
    if (!isCustom && total < MIN_ORDER_TOTAL) {
      setErr(`Le restaurant n'accepte pas les commandes de moins de ${MIN_ORDER_TOTAL} DH. Ajoutez encore ${formatMad(MIN_ORDER_TOTAL - total)}.`);
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
    setSubmitting(true);
    const customer = { name, address, phone, email: trimmedEmail, restaurantNotes: restaurantNotes.trim(), scheduledTime: scheduledTime || undefined };
    try {
      const orderId = await addOrder(cart, grand, customer);
      try {
        const storeName = cart[0]?.restaurantName || 'YoHa Store';
        localStorage.setItem('yoha_last_order', JSON.stringify({
          restaurantName: storeName,
          restaurantId: cart[0]?.restaurantId,
          items: cart,
          total: grand,
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
      <div className="page-enter max-w-2xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-4xl mb-4 shadow-inner">
          🛒
        </div>
        <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-ink-900 dark:text-white">Panier vide</h2>
        <p className="mt-2 text-ink-500 dark:text-ink-400 font-medium">Ajoutez quelques délices et revenez finaliser votre commande.</p>
        <button
          onClick={onBack}
          className="mt-6 px-6 py-3 rounded-2xl bg-brand-500 text-white font-extrabold text-sm shadow-glow hover:scale-105 active:scale-95 transition-all"
        >
          Découvrir les cartes ➔
        </button>
      </div>
    );
  }

  return (
    <div className="page-enter max-w-5xl mx-auto px-4 sm:px-6 pt-4 pb-28 lg:pb-8">
      {/* Back Button & Checkout Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <button
          onClick={onBack}
          className="cursor-pointer inline-flex items-center gap-2 self-start px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-ink-900 dark:hover:bg-ink-800 text-ink-700 dark:text-white font-bold text-xs transition-colors shadow-xs"
        >
          <I.Left size={16}/> <span>Retour à la carte</span>
        </button>

        {/* Deliveroo-Style Step Indicator */}
        <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-bold bg-slate-100 dark:bg-ink-900 px-3.5 py-1.5 rounded-full border border-ink-100 dark:border-ink-800">
          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <span>✓</span> Panier
          </span>
          <span className="text-ink-400">➔</span>
          <span className="text-brand-600 dark:text-brand-400 font-extrabold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
            Validation
          </span>
          <span className="text-ink-400">➔</span>
          <span className="text-ink-400">Confirmation</span>
        </div>
      </div>

      {/* Main Title & Subtitle */}
      <div className="mb-6">
        <h1 className="font-display font-black text-2xl sm:text-4xl tracking-tight text-ink-900 dark:text-white">
          Finalisation de commande
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-ink-500 dark:text-ink-400 font-medium">
          Livraison rapide en <span className="font-bold text-brand-600 dark:text-brand-400">30-45 min</span> à l'Alliance & CHU Tanger 🏍️
        </p>
      </div>

      {/* Guest vs Logged-In Notice Pill */}
      {!user ? (
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-brand-500/10 to-amber-500/10 border border-brand-500/30 px-4 py-3.5 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">⚡</span>
            <span className="text-ink-800 dark:text-ink-100 font-medium">
              <strong className="font-extrabold text-ink-950 dark:text-white">Commande Express en Invité</strong> — aucun mot de passe requis !
            </span>
          </div>
          {onLogin && (
            <button
              type="button"
              onClick={onLogin}
              className="font-extrabold text-brand-600 dark:text-brand-400 hover:underline shrink-0 text-xs bg-white dark:bg-ink-900 px-3 py-1.5 rounded-xl border border-brand-500/20 shadow-xs cursor-pointer"
            >
              Se connecter pour cumuler des points ➔
            </button>
          )}
        </div>
      ) : (
        <div className="mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 flex items-center gap-2.5 font-medium shadow-xs">
          <span className="text-lg">✅</span>
          <span>
            Connecté en tant que <strong className="font-extrabold">{user.displayName}</strong> — cette commande comptera pour votre cagnotte de -50 MAD !
          </span>
        </div>
      )}

      {/* Main Form Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Form & Options */}
        <div className="lg:col-span-2 space-y-6">
          {/* Delivery Address Card */}
          <Card className="rounded-3xl shadow-sm border border-ink-100 dark:border-ink-800 overflow-hidden">
            <CardHeader icon={<I.MapPin size={20} className="text-brand-500" />} title="Coordonnées de livraison" />
            <div className="p-4 sm:p-6 space-y-4">
              <Input label="Nom complet" value={name} onChange={setName} placeholder="Prénom Nom"/>
              {!user ? (
                <div>
                  <Input
                    label="E-mail *"
                    value={email}
                    onChange={setEmail}
                    placeholder="vous@exemple.com"
                    type="email"
                  />
                  <p className="text-[11px] text-ink-500 mt-1 font-medium">
                    📧 Vous recevrez la confirmation et le lien de suivi en direct par e-mail.
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
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                <Input label="Lieu de livraison" value={address} onChange={setAddress} placeholder="Campus, CHU, Bâtiment, Chambre..."/>
                <Input label="Numéro de téléphone" value={phone} onChange={setPhone} placeholder="+212 6 12 34 56 78" />
              </div>

              <label className="block space-y-1.5">
                <span className="text-[11px] sm:text-xs font-bold text-ink-700 dark:text-ink-200 uppercase tracking-wider">Instructions pour le livreur / restaurant</span>
                <textarea
                  value={restaurantNotes}
                  onChange={(e) => setRestaurantNotes(e.target.value)}
                  className="w-full px-3.5 sm:px-4 py-3 rounded-2xl bg-slate-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 outline-none focus:border-brand-500 dark:focus:border-brand-400 text-base sm:text-sm font-medium transition resize-none text-ink-900 dark:text-white"
                  rows={2}
                  placeholder="Ex: Sans oignons, appeler en arrivant devant le portail CHU..."
                />
              </label>
            </div>
          </Card>

          {/* Time Slot Picker */}
          <TimeSlotPicker selected={scheduledTime} onSelect={setScheduledTime} />

          {/* Payment Method Card */}
          <Card className="rounded-3xl shadow-sm border border-ink-100 dark:border-ink-800 overflow-hidden">
            <CardHeader icon={<I.Bag size={20} className="text-emerald-500" />} title="Mode de paiement" />
            <div className="p-4 sm:p-6">
              <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-xl shrink-0 font-bold shadow-md">
                  💵
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-extrabold text-xs sm:text-sm text-ink-900 dark:text-white truncate">Paiement en espèces à la livraison</h4>
                  <p className="text-[11px] sm:text-xs text-ink-600 dark:text-ink-400 mt-0.5 font-medium leading-normal">
                    Payez directement le livreur de la flotte YoHa dès réception de vos plats.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Detailed Items Card */}
          <Card className="rounded-3xl shadow-sm border border-ink-100 dark:border-ink-800 overflow-hidden">
            <CardHeader
              icon={<I.Bag size={20} className="text-brand-500" />}
              title={`Articles sélectionnés (${cart.reduce((s,i)=>s+i.qty,0)}) chez ${mainStoreName}`}
            />
            <div className="p-4 sm:p-6 space-y-3.5 divide-y divide-ink-100 dark:divide-ink-800">
              {cart.map(it => (
                <div key={it.id} className="pt-3 first:pt-0 flex items-center gap-3">
                  <MenuItemImage src={it.img} alt="" className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover shrink-0 border border-black/5 shadow-xs"/>
                  <div className="flex-1 min-w-0">
                    {it.isCustom ? (
                      <div className="space-y-1">
                        <div className="text-[10px] sm:text-xs font-black text-brand-600 dark:text-brand-400 uppercase tracking-wider">Demande sur-mesure</div>
                        {it.customDetails?.storeAddress && (
                          <div className="text-xs text-ink-500 font-semibold">{it.customDetails.storeName}</div>
                        )}
                        <p className="text-xs text-ink-700 dark:text-ink-300 font-medium truncate">{it.customDetails?.details}</p>
                      </div>
                    ) : (
                      <>
                        <h4 className="font-extrabold text-xs sm:text-sm text-ink-900 dark:text-white truncate">{it.name}</h4>
                        <div className="text-[11px] sm:text-xs text-ink-500 dark:text-ink-400 font-medium mt-0.5">
                          Quantité : <strong className="text-ink-900 dark:text-white">{it.qty}</strong> · {it.restaurantName || mainStoreName}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="font-black text-xs sm:text-sm text-ink-900 dark:text-white shrink-0">
                    {it.price > 0 ? formatMad(it.price * it.qty) : <span className="text-brand-600 dark:text-brand-400">Sur ticket</span>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Order Summary & Checkout Button */}
        <div className="lg:sticky lg:top-20 self-start">
          <Card className="rounded-3xl shadow-xl border border-brand-500/30 overflow-hidden bg-white dark:bg-ink-900">
            <div className="p-4 sm:p-6 space-y-4">
              <h3 className="font-display font-black text-xl text-ink-900 dark:text-white border-b border-ink-100 dark:border-ink-800 pb-3 flex items-center justify-between">
                <span>Récapitulatif</span>
                {isGroupOrder ? (
                  <span className="text-xs font-black text-white bg-gradient-to-r from-emerald-500 to-teal-500 px-2.5 py-1 rounded-full shadow-md animate-pulse">
                    🎉 OFFRE GROUPE
                  </span>
                ) : (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    {deliveryFee === 0 ? '⚡ 0 MAD livraison' : '⚡ 30-45 min'}
                  </span>
                )}
              </h3>

              {/* Group Order Offer Banner */}
              {!isCustom && (
                <div className={`p-3 rounded-2xl border text-xs ${
                  isGroupOrder
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200'
                    : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200'
                }`}>
                  {isGroupOrder ? (
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🎉</span>
                      <div>
                        <strong className="font-black">Offre Commande de Groupe Activée !</strong>
                        <div className="text-[11px] opacity-90">Livraison & Frais de service 100% OFFERTS sur ce panier.</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💡</span>
                      <div>
                        <strong className="font-black">Astuce Commande de Groupe :</strong>
                        <div className="text-[11px] opacity-90">
                          Ajoutez <strong className="font-black text-brand-600 dark:text-brand-400">{formatMad(200 - total)}</strong> de plus pour profiter de la <strong>Livraison & Service 100% OFFERTS</strong> !
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Row 
                label="Sous-total plats" 
                value={isCustom 
                  ? (total > 0 ? `${formatMad(total)} + achats` : <span className="text-brand-600 dark:text-brand-400 font-bold">Sur ticket</span>)
                  : formatMad(total)
                } 
              />
              <Row
                label="Frais de livraison"
                value={
                  deliveryFee === 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-black">OFFERT 🚀</span>
                  ) : (
                    <span className="text-ink-900 dark:text-white font-bold">{formatMad(deliveryFee)}</span>
                  )
                }
              />
              <Row
                label="Frais de service"
                value={
                  serviceFee === 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-black">OFFERT 🎉</span>
                  ) : (
                    <span className="text-ink-900 dark:text-white font-bold">{formatMad(serviceFee)}</span>
                  )
                }
              />
              
              {discountAmount > 0 && (
                <Row 
                  label={<span className="text-emerald-600 dark:text-emerald-400 font-bold">Code Promo ({appliedPromo?.code || 'YOHA50'})</span>}
                  value={<span className="text-emerald-600 dark:text-emerald-400 font-black">-{formatMad(discountAmount)}</span>}
                />
              )}

              <div className="border-t border-dashed border-ink-200 dark:border-ink-800 pt-3">
                <Row 
                  label={<b className="text-base sm:text-lg font-black text-ink-900 dark:text-white">Total à payer</b>} 
                  value={
                    <b className={`text-2xl sm:text-3xl font-black ${discountAmount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-brand-600 dark:text-brand-400'}`}>
                      {isCustom 
                        ? (total > 0 ? `${formatMad(grand)} + achats` : "20,00 MAD + achats")
                        : formatMad(grand)
                      }
                    </b>
                  } 
                />
              </div>

              {/* Minimum Order Threshold Notice */}
              {!isCustom && total < MIN_ORDER_TOTAL && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-extrabold bg-rose-50 dark:bg-rose-950/50 p-3 rounded-2xl border border-rose-200 dark:border-rose-800">
                  ⚠️ Minimum de commande : {MIN_ORDER_TOTAL} MAD. Ajoutez encore {formatMad(MIN_ORDER_TOTAL - total)} pour valider.
                </p>
              )}

              {/* OFFRE DE BIENVENUE 50 MAD OFFERTS BUTTON CARD (Seulement pour les utilisateurs qui n'ont pas encore fait de commande) */}
              {isYoha50Active && !appliedPromo && !hasUsedYoha50 && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-600 to-rose-600 text-white shadow-lg border border-rose-400/50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-white text-rose-600 px-2.5 py-0.5 rounded-full shadow-xs">
                      Offre Spéciale Bienvenue
                    </span>
                    <span className="text-xs font-black text-amber-300">50 MAD OFFERTS</span>
                  </div>
                  
                  <p className="text-xs font-bold text-rose-100 leading-tight">
                    Profitez de -50 MAD sur votre commande avec le code <strong className="text-white font-black underline">YOHA50</strong> !
                  </p>

                  {!user ? (
                    <div className="text-[11px] font-semibold text-amber-200 bg-black/20 px-2.5 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5">
                      <span>🔒</span>
                      <span>Connectez-vous pour activer l'offre 1ère commande</span>
                    </div>
                  ) : (
                    <div className="text-[11px] font-semibold text-emerald-200 bg-black/20 px-2.5 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5">
                      <span>🎉</span>
                      <span>Éligible ! -50 MAD sur votre 1ère commande</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={applyYoha50}
                    className={`w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      !user
                        ? 'bg-white/30 text-white/70 hover:bg-white/40'
                        : 'bg-white text-slate-950 hover:scale-[1.02] active:scale-95'
                    }`}
                  >
                    <span>Appliquer -50 MAD 🚀</span>
                  </button>
                </div>
              )}

              {/* Code Promo Input */}
              <div className="pt-1">
                {appliedPromo ? (
                  <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl px-3.5 py-2.5 border border-emerald-300 dark:border-emerald-700">
                    <span className="text-xs sm:text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
                      Code {appliedPromo.code} appliqué (-{formatMad(discountAmount)})
                    </span>
                    <button onClick={removePromo} className="text-xs font-bold text-rose-600 hover:underline cursor-pointer">
                      Retirer
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      value={promoInput}
                      onChange={e => setPromoInput(e.target.value.toUpperCase())}
                      placeholder="Code promo"
                      className="flex-1 rounded-xl border border-ink-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold tracking-wider outline-none focus:border-brand-500 dark:border-ink-700 dark:bg-ink-950 dark:text-white"
                    />
                    <button
                      onClick={applyPromo}
                      className="cursor-pointer shrink-0 rounded-xl bg-ink-900 dark:bg-white text-white dark:text-ink-950 px-4 py-2.5 text-xs font-black hover:scale-105 active:scale-95 transition-all"
                    >
                      Valider
                    </button>
                  </div>
                )}
                {promoErr && <p className="mt-1.5 text-xs font-bold text-rose-600">{promoErr}</p>}
              </div>

              {err && <p className="text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200">{err}</p>}
              
              {/* Main CTA Confirmation Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={submitting || (!isCustom && total < MIN_ORDER_TOTAL)}
                  className="w-full relative py-3.5 px-5 sm:px-6 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-[0.99] text-white font-extrabold text-sm sm:text-base shadow-sm shadow-brand-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 border border-brand-400/30"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2 font-bold text-xs sm:text-sm">
                      Traitement en cours... <Loader />
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2 font-display">
                      <span>Confirmer la commande</span>
                      <I.Right size={18} stroke={2.5} />
                    </span>
                  )}
                </button>
                
                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-ink-500 font-medium">
                  <I.Bag size={14} className="text-emerald-500" />
                  <span>Paiement 100% sécurisé à la livraison</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Mobile Floating Sticky Checkout Bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-50 p-3 bg-white/95 dark:bg-ink-950/95 backdrop-blur-xl border-t border-ink-200/80 dark:border-ink-800 shadow-2xl pb-[calc(10px+env(safe-area-inset-bottom))]">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <div className="shrink-0 pl-1">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-ink-400">Total</div>
            <div className="font-display font-black text-sm sm:text-base text-brand-600 dark:text-brand-400">
              {isCustom ? (total > 0 ? `${formatMad(grand)}` : '20 DH') : formatMad(grand)}
            </div>
          </div>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || (!isCustom && total < MIN_ORDER_TOTAL)}
            className="flex-1 py-3 px-4 rounded-xl bg-brand-500 active:bg-brand-600 text-white font-extrabold text-xs sm:text-sm shadow-sm active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer border border-brand-400/30"
          >
            {submitting ? (
              <span className="text-center font-bold text-xs">Traitement…</span>
            ) : (
              <span className="flex items-center justify-center gap-1.5 font-display font-bold">
                <span>Confirmer la commande</span>
                <I.Right size={16} stroke={2.5} />
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
