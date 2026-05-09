import React, { useMemo } from 'react';
import { I } from '../icons/Icons.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useOrders } from '../contexts/AppContexts.jsx';
import { ORDER_STATES, formatMad } from '../data/index.js';
import { Button } from '../components/ui/Button.jsx';
import { filterOrdersForClient } from '../utils/clientOrders.js';

function formatDate(ts) {
  if (!ts) return '—';
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(ts));
  } catch {
    return '—';
  }
}

export function MyOrdersPage({ onBack, onOpenOrder }) {
  const { user } = useAuth();
  const { orders } = useOrders();

  const mine = useMemo(
    () =>
      [...filterOrdersForClient(orders, user)].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
    [orders, user]
  );

  if (!user || user.role !== 'client') {
    return (
      <div className="page-enter max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-ink-600 dark:text-ink-400">Connectez-vous avec un compte client pour voir l’historique de vos commandes.</p>
        <Button className="mt-6" variant="primary" onClick={onBack}>
          Retour <I.Right size={18}/>
        </Button>
      </div>
    );
  }

  return (
    <div className="page-enter max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <button
        type="button"
        onClick={onBack}
        className="cursor-grow inline-flex items-center gap-2 mb-6 px-3 py-2 rounded-xl hover:bg-ink-100 dark:hover:bg-ink-800 transition text-sm"
      >
        <I.Left size={18}/> Retour
      </button>

      <h1 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight">Mes commandes</h1>
      <p className="mt-1 text-ink-500 dark:text-ink-400 text-sm">
        Retrouvez toutes vos commandes et ouvrez le suivi en temps réel.
      </p>

      {mine.length === 0 ? (
        <div className="mt-12 rounded-2xl border-2 border-dashed border-ink-200 dark:border-ink-800 py-16 text-center text-ink-500">
          Aucune commande pour l’instant. Passez votre première commande !
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {mine.map((o) => {
            const st = ORDER_STATES[o.status];
            const label = st?.label ?? o.status;
            const done = o.status === 'delivered';
            return (
              <li
                key={o.id}
                className="rounded-2xl bg-white dark:bg-ink-900 border border-ink-200/60 dark:border-ink-800 p-4 sm:p-5 shadow-card flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-display font-bold text-lg">{o.id}</div>
                  <div className="text-sm text-ink-500 mt-0.5">{o.restaurantName}</div>
                  <div className="text-xs text-ink-400 mt-1">{formatDate(o.createdAt)}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        done
                          ? 'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300'
                          : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      {label}
                    </span>
                    <span className="text-sm font-semibold">{formatMad(o.totalDh, { decimals: 0 })}</span>
                  </div>
                </div>
                <Button variant={done ? 'ghost' : 'primary'} size="md" className="shrink-0" onClick={() => onOpenOrder(o.id)}>
                  {done ? 'Voir le détail' : 'Suivi en direct'} <I.Right size={16}/>
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
