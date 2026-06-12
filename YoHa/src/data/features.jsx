'use client';

import React from 'react';
import { I } from '../icons/Icons.jsx';

export const FEATURES = [
  { icon:<I.Zap size={28}/>,    title:'Ultra rapide',           desc:'26 min en moyenne sur le campus et dans les hôpitaux.', from:'from-amber-400', to:'to-orange-500' },
  { icon:<I.Sparkle size={28}/>,title:'Commandes intelligentes',desc:'L\'IA vous suggère des repas selon vos cours et vos gardes.', from:'from-violet-400', to:'to-fuchsia-500' },
  { icon:<I.Chef size={28}/>,   title:'Multi-restaurants',      desc:'Un seul panier, plusieurs cuisines — combinez vos préférés.', from:'from-rose-400', to:'to-pink-500' },
  { icon:<I.MapPin size={28}/>, title:'Optimisé campus',        desc:'Livraison directe en chambre, à l\'aile hospitalière, à la BU.', from:'from-sky-400', to:'to-indigo-500' },
];
