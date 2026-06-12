'use client';

import React, { useState, useEffect } from 'react';
import { I } from '../icons/Icons.jsx';
import { useAuth, migrateLegacyDisplayName } from '../contexts/AuthContext.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Row } from '../components/ui/Row.jsx';
import { Card, CardHeader, Input, Loader } from '../components/checkout/CheckoutForms.jsx';
import { MenuItemImage } from '../components/ui/MenuItemImage.jsx';
import { getServiceFeeMad, formatMad } from '../data/index.js';

export function Checkout({ cart, total, onBack, onSuccess, addOrder, onLogin }) {
  const { user } = useAuth();
  const [address, setAddress] = useState('CHU-Tanger');
  const [phone, setPhone] = useState('+212 6 12 34 56 78');
  const [restaurantNotes, setRestaurantNotes] = useState('');
  const [name, setName] = useState('X Y');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.role === 'client') {
      if (user.displayName) setName(migrateLegacyDisplayName(user.displayName));
      if (user.email) setEmail(user.email);
    }
  }, [user]);

  const serviceFee = getServiceFeeMad(total);
  const grand = total + serviceFee;

  const [err, setErr] = useState('');

  const handleConfirm = async () => {
    setErr('');
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
    const customer = { name, address, phone, email: trimmedEmail, restaurantNotes: restaurantNotes.trim() };
    try {
      const orderId = await addOrder(cart, grand, customer);
      setTimeout(() => onSuccess(orderId), 800);
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
                <div key={it.id} className="flex items-center gap-3">
                  <MenuItemImage src={it.img} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0"/>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{it.name}</div>
                    <div className="text-xs text-ink-500">x{it.qty} · {it.restaurantName}</div>
                  </div>
                  <div className="font-semibold text-sm">{formatMad(it.price * it.qty)}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:sticky lg:top-24 self-start">
          <Card>
            <div className="p-5 space-y-3">
              <h3 className="font-display font-bold text-lg">Total</h3>
              <Row label="Sous-total" value={formatMad(total)} />
              <Row label="Frais de service" value={formatMad(serviceFee, { decimals: 0 })} />
              <div className="border-t border-dashed border-ink-200 dark:border-ink-800"></div>
              <Row label={<b className="text-base">À payer</b>} value={<b className="text-2xl text-gradient">{formatMad(grand)}</b>} />

              {err && <p className="text-sm text-red-600 dark:text-red-400">{err}</p>}
              <div className="pt-3">
                <Button onClick={handleConfirm} disabled={submitting} variant="primary" size="lg" className="w-full justify-center">
                  {submitting
                    ? <span className="inline-flex items-center gap-2">Traitement<Loader/></span>
                    : <span className="inline-flex items-center gap-2">Confirmer la commande <I.Check size={18} stroke={3}/></span>
                  }
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
