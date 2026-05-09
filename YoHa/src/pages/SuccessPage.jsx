import React, { useMemo } from 'react';
import { I } from '../icons/Icons.jsx';
import { ORDER_STATES } from '../data/orderConstants.js';
import { useOrders } from '../contexts/AppContexts.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Step } from '../components/ui/OrderStep.jsx';

export function SuccessPage({ orderId, onHome, onMyOrders }) {
  const { orders } = useOrders();
  const order = orders.find(o => o.id === orderId);
  const stepNum = order ? ORDER_STATES[order.status]?.step || 1 : 1;
  const stepLabel = order ? ORDER_STATES[order.status]?.label : 'Confirmée';

  return (
    <div className="page-enter relative max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
      <Confetti />
      <div className="relative inline-grid place-items-center w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-cardhover animate-bounce-soft">
        <svg viewBox="0 0 24 24" className="w-14 h-14 text-white">
          <path d="M5 12l4 4L19 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"
            style={{ strokeDasharray:50, strokeDashoffset:50, animation:'check-in .7s .3s forwards cubic-bezier(.16,1,.3,1)' }}/>
        </svg>
        <span className="absolute inset-0 rounded-full bg-emerald-400/40 animate-ping"></span>
      </div>
      <h1 className="mt-8 font-display font-extrabold text-4xl sm:text-5xl tracking-tight">Commande confirmée ! 🎉</h1>
      <p className="mt-3 text-ink-500 dark:text-ink-400 text-lg">Merci — votre repas est en route. Arrivée estimée dans <b className="text-ink-900 dark:text-white">15 à 22 minutes</b>.</p>

      <div className="mt-8 max-w-md mx-auto rounded-3xl bg-white dark:bg-ink-900 border border-ink-200/60 dark:border-ink-800 p-5 text-left shadow-card">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-brand-500 text-white grid place-items-center"><I.Bike size={20}/></span>
          <div className="flex-1 min-w-0">
            <div className="font-semibold">Commande #{orderId || 'YH-XXXX'}</div>
            <div className="text-xs text-ink-500">{stepLabel} · suivi temps réel</div>
          </div>
          <span className="px-2 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/10 text-emerald-600">EN DIRECT</span>
        </div>
        {/* Live progress bar */}
        <div className="mt-4 h-1.5 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-brand-500 via-pink-500 to-emerald-500 transition-all duration-1000" style={{ width: (stepNum / 5 * 100) + '%' }}></div>
        </div>
        <div className="mt-4 grid grid-cols-5 text-[10px] gap-1">
          {Object.entries(ORDER_STATES).map(([key, st]) => (
            <Step key={key} active={stepNum >= st.step} label={st.label.split(' ')[0]}/>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3 justify-center">
        {onMyOrders && (
          <Button onClick={onMyOrders} variant="ghost" size="lg">
            Mes commandes <I.History size={18}/>
          </Button>
        )}
        <Button onClick={onHome} variant="primary" size="lg">Commander autre chose <I.Right size={18}/></Button>
      </div>
    </div>
  );
}

export function Confetti() {
  const pieces = useMemo(() => Array.from({ length: 32 }).map((_,i) => ({
    id:i, left:Math.random()*100, delay:Math.random()*0.6,
    duration:1.6 + Math.random()*1.4,
    color:['#f97316','#ec4899','#8b5cf6','#3b82f6','#10b981','#f59e0b'][i % 6],
    rotate:Math.random()*360, shape:i % 3,
  })), []);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map(p => (
        <span key={p.id}
          style={{
            position:'absolute', top:'-10px', left:`${p.left}%`,
            width:p.shape === 1 ? 10 : 8, height:p.shape === 0 ? 14 : 8,
            background:p.color, borderRadius:p.shape === 2 ? '50%' : 2,
            transform:`rotate(${p.rotate}deg)`,
            animation:`fall ${p.duration}s ${p.delay}s ease-in forwards`,
          }}/>
      ))}
      <style>{`@keyframes fall { to { transform: translateY(110vh) rotate(720deg); opacity: 0.4; } }`}</style>
    </div>
  );
}
