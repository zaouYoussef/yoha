'use client';

import React from 'react';
import { I } from '../icons/Icons.jsx';

export const HOW_STEPS = [
  { num:'01', title:'Choisissez',  desc:'Parcourez les restaurants partenaires de votre campus ou hôpital.', icon:<I.Search size={22}/>, color:'from-orange-500 to-amber-500' },
  { num:'02', title:'Composez',    desc:'Mixez plusieurs cuisines dans un seul panier, en quelques tapotements.', icon:<I.Bag size={22}/>,   color:'from-pink-500 to-rose-500' },
  { num:'03', title:'Recevez',     desc:'Suivi en direct, livreur dédié, livré directement à votre porte.', icon:<I.Bike size={22}/>,  color:'from-violet-500 to-fuchsia-500' },
];
