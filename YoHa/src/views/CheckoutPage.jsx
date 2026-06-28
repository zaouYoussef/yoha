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
import { useCart } from '../contexts/AppContexts.jsx';

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

  const isCustom = cart.some(i => i.isCustom || ['pharmacy', 'dessert', 'supermarket', 'shop', 'parapharmacy'].includes(i.restaurantCuisine));
  const customItems = cart.filter(i => i.isCustom || ['pharmacy', 'dessert', 'supermarket', 'shop', 'parapharmacy'].includes(i.restaurantCuisine));
  const uniqueCustomShops = new Set(customItems.map(i => i.restaurantName?.trim().toLowerCase() || i.restaurantId));
  const deliveryFee = isCustom ? uniqueCustomShops.size * 20 : 0;

  const cartSection = useMemo(() => {
    const cuisines = cart.map(i => i.restaurantCuisine).filter(Boolean);
    const unique = [...new Set(cuisines)];
    if (unique.length === 0) return null;
    if (unique.some(c => ['pharmacy', 'parapharmacy', 'supermarket', 'shop', 'patisserie', 'dessert'].includes(c))) {
      return unique.find(c => ['pharmacy', 'parapharmacy', 'supermarket', 'shop', 'patisserie', 'dessert'].includes(c)) || unique[0];
    }
    return 'restaurant';
  }, [cart]);

  const discountPct = appliedPromo ? appliedPromo.discount : 0;
  const discountAmount = discountPct > 0 ? Math.round(total * discountPct) / 100 : 0;
  const grand = total + deliveryFee - discountAmount;

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
      setPromoErr('Erreur réseau. Vérifiez votre connexion.');
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoErr('');
  };

  const handleConfirm = async () => {
    setErr('');
    if (!isCustom && total < 70) {
      setErr("Le restaurant n'accepte pas les commandes de moins de 70 DH.");
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
      onSuccess(orderId);
    } catch (e) {
      setErr(e.message || 'Impossible de valider la commande.');
      setSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="page-enter max-w-2xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="text-7xl mb-4">🛒</div>
        <h2 className="font-display font-bold text-2xl">Aucun article à commander</h2>
        <p className="mt-2 text-ink-500">Ajoutez d'abord quelque chose de délicieux.</p>
      </div>
    );
  }

  return (
    <div className="page-enter max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <button onClick={onBack} className="cursor-grow inline-flex items-center gap-2 mb-6 px-3 py-2 rounded-xl hover:bg-ink-100 dark:hover:bg-ink-800 transition">
        <I.Left size={18}/> Retour au panier
      </button>

      <h1 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight">Validation de commande</h1>
      <p className="mt-1 text-ink-500 dark:text-ink-400">Presque fini — vérifiez vos infos et passons à table.</p>

      {!user && (
        <div className="mt-5 rounded-2xl bg-ink-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 px-4 py-3 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span>
            <span className="font-semibold">Commande invité</span> — pas besoin de compte pour commander.
          </span>
          {onLogin && (
            <button type="button" onClick={onLogin} className="font-semibold text-brand-600 hover:underline shrink-0">
              Se connecter pour sauver l’historique
            </button>
          )}
        </div>
      )}

      {user?.role === 'client' && (
        <div className="mt-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 px-4 py-3 text-sm text-ink-700 dark:text-ink-200">
          Connecté en tant que <strong>{user.displayName}</strong> — cette commande sera dans votre historique.
        </div>
      )}

      <div className="mt-8 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardHeader icon={<I.MapPin size={18}/>} title="Adresse de livraison" />
            <div className="px-5 pb-5 space-y-3">
              <Input label="Nom complet" value={name} onChange={setName} placeholder="Prénom Nom"/>
              {!user ? (
                <Input
                  label="E-mail *"
                  value={email}
                  onChange={setEmail}
                  placeholder="vous@exemple.com"
                  type="email"
                />
              ) : (
                <Input
                  label="E-mail"
                  value={email || user.email || ''}
                  onChange={setEmail}
                  placeholder="vous@exemple.com"
                  type="email"
                />
              )}
              {!user && (
                <p className="text-xs text-ink-500 -mt-1">
                  Obligatoire — vous recevrez le suivi de commande par e-mail.
                </p>
              )}
              <Input label="Adresse" value={address} onChange={setAddress} placeholder="Bâtiment, chambre, étage"/>
              <Input label="Téléphone" value={phone} onChange={setPhone} placeholder="+212 6 …" />
              <label className="block space-y-1">
                <span className="text-sm font-semibold text-ink-700 dark:text-ink-200">Remarques pour le restaurant</span>
                <textarea
                  value={restaurantNotes}
                  onChange={(e) => setRestaurantNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-ink-50 dark:bg-ink-900 border border-ink-200 dark:border-ink-800 outline-none focus:border-brand-500 transition resize-none"
                  rows={2}
                  placeholder="Sans tomate, sauce à part, bien cuit…"
                />
                <p className="text-xs text-ink-500">
                  Optionnel — le restaurant et le livreur verront ces instructions lors de la préparation.
                </p>
              </label>
            </div>
          </Card>

          <TimeSlotPicker selected={scheduledTime} onSelect={setScheduledTime} />

          <Card>
            <CardHeader icon={<I.Bag size={18}/>} title="Paiement" />
            <div className="px-5 pb-5">
              <p className="text-sm text-ink-600 dark:text-ink-400 leading-relaxed">
                Règlement <span className="font-semibold text-ink-900 dark:text-white">en espèces</span> au moment de la livraison.
              </p>
            </div>
          </Card>

          <Card>
            <CardHeader icon={<I.Bag size={18}/>} title={`Récapitulatif (${cart.reduce((s,i)=>s+i.qty,0)} articles)`} />
            <div className="px-5 pb-5 space-y-3">
              {cart.map(it => (
                <div key={it.id} className="flex items-start gap-3 py-1">
                  <MenuItemImage src={it.img} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0 mt-1"/>
                  <div className="flex-1 min-w-0">
                    {it.isCustom ? (
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">Demande sur-mesure</div>
                        {it.customDetails?.storeAddress && (
                          <div className="text-xs text-ink-500 font-semibold">Établissement : {it.customDetails.storeName} ({it.customDetails.storeAddress})</div>
                        )}
                        <textarea
                          value={it.customDetails?.details || ''}
                          onChange={(e) => {
                            const newDetails = e.target.value;
                            setCart(prev => prev.map(p => {
                              if (p.id === it.id) {
                                const storeName = p.customDetails?.storeName || p.restaurantName;
                                const name = p.customDetails?.storeAddress 
                                  ? `[${storeName}] ${newDetails}`
                                  : `${p.restaurantName} - ${newDetails}`;
                                return {
                                  ...p,
                                  name,
                                  customDetails: {
                                    ...p.customDetails,
                                    details: newDetails
                                  }
                                };
                              }
                              return p;
                            }));
                          }}
                          className="w-full text-sm bg-ink-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium"
                          placeholder="Modifiez les détails de votre demande..."
                          rows={2}
                        />
                      </div>
                    ) : (
                      <>
                        <div className="text-sm font-semibold truncate">{it.name}</div>
                        <div className="text-xs text-ink-500">x{it.qty} · {it.restaurantName}</div>
                      </>
                    )}
                  </div>
                  <div className="font-semibold text-sm pt-1">
                    {it.price > 0 ? formatMad(it.price * it.qty) : <span className="text-brand-600 dark:text-brand-400 font-semibold">Sur ticket</span>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:sticky lg:top-24 self-start">
          <Card>
            <div className="p-5 space-y-3">
              <h3 className="font-display font-bold text-lg">Total</h3>
              <Row 
                label="Sous-total" 
                value={isCustom 
                  ? (total > 0 ? `${formatMad(total)} + achats` : <span className="text-brand-600 dark:text-brand-400 font-semibold">Sur ticket</span>)
                  : formatMad(total)
                } 
              />
              <Row label="Frais de livraison" value={formatMad(deliveryFee)} />
              {discountPct > 0 && (
                <Row 
                  label={<span className="text-emerald-600 font-semibold">Code promo ({appliedPromo?.code})</span>}
                  value={<span className="text-emerald-600 font-bold">-{discountPct}%</span>}
                />
              )}
              <div className="border-t border-dashed border-ink-200 dark:border-ink-800"></div>
              <Row 
                label={<b className="text-base">À payer</b>} 
                value={
                  <b className={`text-2xl ${discountPct > 0 ? 'text-emerald-600' : 'text-gradient'}`}>
                    {isCustom 
                      ? (total > 0 ? `${formatMad(grand)} + achats` : "20,00 MAD + achats")
                      : formatMad(grand)
                    }
                  </b>
                } 
              />

              {/* Code promo */}
              <div className="pt-1">
                {appliedPromo ? (
                  <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-3 py-2 border border-emerald-200 dark:border-emerald-800">
                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{appliedPromo.code} · -{discountPct}%</span>
                    <button onClick={removePromo} className="text-xs font-semibold text-red-500 hover:underline">Retirer</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input value={promoInput} onChange={e => setPromoInput(e.target.value.toUpperCase())} placeholder="Code promo"
                      className="flex-1 rounded-xl border border-ink-200 bg-ink-50 px-3 py-2 text-sm font-bold tracking-wider outline-none focus:border-brand-500 dark:border-ink-700 dark:bg-ink-950 dark:text-white"/>
                    <button onClick={applyPromo}
                      className="cursor-grow shrink-0 rounded-xl bg-gradient-to-r from-brand-500 to-pink-500 px-4 py-2 text-sm font-bold text-white shadow-md hover:shadow-lg active:scale-95 transition-transform">
                      OK
                    </button>
                  </div>
                )}
                {promoErr && <p className="mt-1 text-xs font-semibold text-red-500">{promoErr}</p>}
              </div>

              {err && <p className="text-sm text-red-600 dark:text-red-400">{err}</p>}
              {!isCustom && total < 70 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-1">
                  ⚠️ Le restaurant n&apos;accepte pas les commandes de moins de 70 DH.
                </p>
              )}
              <div className="pt-3">
                <Button
                  onClick={handleConfirm}
                  disabled={submitting || (!isCustom && total < 70)}
                  variant="primary"
                  size="lg"
                  className="w-full justify-center"
                >
                  {submitting ? (
                    <span className="inline-flex items-center gap-2">Traitement<Loader/></span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      Confirmer · {isCustom 
                        ? (total > 0 ? `${formatMad(grand)} + achats` : "20 DH + achats") 
                        : formatMad(grand)
                      }{discountPct > 0 && <span className="text-emerald-300 text-xs line-through ml-1">{formatMad(total + deliveryFee)}</span>} <I.Check size={18} stroke={3}/>
                    </span>
                  )}
                </Button>
                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-ink-500"><I.Bag size={14}/> Espèces à la livraison</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
