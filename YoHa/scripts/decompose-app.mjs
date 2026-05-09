/**
 * Extrait src/App.jsx en modules depuis les plages de lignes (1-based, inclusives).
 * Usage : node scripts/decompose-app.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const appPath = path.join(root, 'src', 'App.jsx');
const lines = fs.readFileSync(appPath, 'utf8').split(/\r?\n/);

function slice(startLine, endLine) {
  return lines.slice(startLine - 1, endLine).join('\n');
}

/** Joint plusieurs plages (évite les trous, ex. spotlight extrait à part). */
function joinSlices(ranges) {
  return ranges.map(([a, b]) => slice(a, b)).join('\n\n');
}

function write(rel, content) {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content.trimEnd() + '\n', 'utf8');
  console.log('+', rel);
}

function exportFunctions(code) {
  return code.replace(/^function /gm, 'export function ');
}

function exportConsts(code) {
  return code.replace(/^const /gm, 'export const ');
}

// —— Icons —— (lignes 5–39, puis fermeture avec Award)
let icons = slice(5, 39);
icons = icons.replace(/^const Svg/, 'export const Svg');
icons = icons.replace(/\nconst I = \{/, '\nexport const I = {');
icons +=
  '\n  Award: p => <Svg {...p}><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></Svg>,\n};';
write('src/icons/Icons.jsx', `import React from 'react';\n\n${icons}`);

// —— Data ——
write('src/data/cuisines.js', exportConsts(slice(45, 55)));
write('src/data/restaurants.js', exportConsts(slice(57, 199)));
write('src/data/categories.js', exportConsts(slice(201, 210)));
write(
  'src/data/features.jsx',
  `import React from 'react';\nimport { I } from '../icons/Icons.jsx';\n\n${exportConsts(slice(212, 217))}`
);
write('src/data/testimonials.js', exportConsts(slice(219, 226)));
write(
  'src/data/howSteps.jsx',
  `import React from 'react';\nimport { I } from '../icons/Icons.jsx';\n\n${exportConsts(slice(228, 232))}`
);
write('src/data/campusHospitals.js', exportConsts(slice(234, 255)));

let oc = slice(261, 283);
oc = exportConsts(oc)
  .replace(/^export const computeProfit/, 'export const computeProfit')
  .replace(/^export const computeNet/, 'export const computeNet');
write('src/data/orderConstants.js', oc);

write(
  'src/data/mockOrders.js',
  `import { RESTAURANTS } from './restaurants.js';
import { COURIERS, computeProfit, computeNet, EUR_TO_DH } from './orderConstants.js';

${slice(286, 322).replace(/^function generateMockOrders/, 'export function generateMockOrders')}
`
);

write(
  'src/data/index.js',
  `export { CUISINES } from './cuisines.js';
export { RESTAURANTS } from './restaurants.js';
export { CATEGORIES_BANNERS } from './categories.js';
export { FEATURES } from './features.jsx';
export { TESTIMONIALS } from './testimonials.js';
export { HOW_STEPS } from './howSteps.jsx';
export { CAMPUS_HOSPITALS } from './campusHospitals.js';
export * from './orderConstants.js';
export { generateMockOrders } from './mockOrders.js';
`
);

// —— Contexts ——
write(
  'src/contexts/AppContexts.jsx',
  `import { createContext, useContext } from 'react';

export const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);
export const CartIconRefCtx = createContext({ current: null });
export const OrdersCtx = createContext(null);
export const useOrders = () => useContext(OrdersCtx);
`
);

// —— Utils ——
write('src/utils/spotlight.js', exportFunctions(slice(1139, 1143)));
write('src/utils/flyToCart.js', exportFunctions(slice(758, 782)));
write('src/utils/ripple.js', exportFunctions(slice(2381, 2393)));

// —— Effects ——
write(
  'src/components/effects/ScrollProgress.jsx',
  `import React, { useState, useEffect } from 'react';

${exportFunctions(slice(555, 567))}`
);
write(
  'src/components/effects/ParticleCanvas.jsx',
  `import React, { useEffect, useRef } from 'react';

${exportFunctions(slice(572, 667))}`
);
write(
  'src/components/ui/OrderStep.jsx',
  `import React from 'react';

${exportFunctions(slice(746, 753))}`
);
/* LiveOrderTracker retiré — remplacé par SocialOrderPopup.jsx (fichier maintenu à la main). */

// —— UI primitives ——
write(
  'src/components/ui/Button.jsx',
  `import React from 'react';
import { rippleEffect } from '../../utils/ripple.js';

${exportFunctions(slice(2361, 2379))}`
);
write(
  'src/components/ui/Reveal.jsx',
  `import React, { useState, useEffect, useRef } from 'react';

${exportFunctions(slice(2395, 2407))}`
);
write(
  'src/components/ui/Tilt.jsx',
  `import React, { useEffect, useRef } from 'react';

${exportFunctions(slice(2409, 2426))}`
);
write(
  'src/components/ui/Magnetic.jsx',
  `import React, { useEffect, useRef } from 'react';

${exportFunctions(slice(2428, 2445))}`
);
write(
  'src/components/ui/Counter.jsx',
  `import React, { useState, useEffect, useRef } from 'react';

${exportFunctions(slice(2447, 2476))}`
);
write(
  'src/components/ui/ToastViewport.jsx',
  `import React from 'react';
import { I } from '../../icons/Icons.jsx';

${exportFunctions(slice(2478, 2499))}`
);
write(
  'src/components/ui/ModalOverlay.jsx',
  `import React, { useEffect } from 'react';

${exportFunctions(slice(3459, 3471))}`
);
write(
  'src/components/ui/Row.jsx',
  `import React from 'react';

${exportFunctions(slice(2024, 2031))}`
);

// —— Checkout form bits used by Checkout + dashboards ——
write(
  'src/components/checkout/CheckoutForms.jsx',
  `import React from 'react';
import { I } from '../../icons/Icons.jsx';

${exportFunctions(slice(2158, 2201))}`
);

// —— Layout ——
write(
  'src/components/layout/Logo.jsx',
  `import React from 'react';

${exportFunctions(slice(869, 876))}`
);

write(
  'src/dashboards/DashShared.jsx',
  `import React, { useState } from 'react';
import { I } from '../icons/Icons.jsx';
import { Logo } from '../components/layout/Logo.jsx';
import { ORDER_STATES } from '../data/index.js';
import { spotlightHandler } from '../utils/spotlight.js';

${exportFunctions(slice(2508, 2718))}`
);

write(
  'src/components/layout/Navbar.jsx',
  `import React, { useState, useEffect, useRef } from 'react';
import { I } from '../../icons/Icons.jsx';
import { Logo } from './Logo.jsx';
import { Magnetic } from '../ui/Magnetic.jsx';
import { DashLink } from '../../dashboards/DashShared.jsx';

${exportFunctions(slice(787, 867))}`
);

// —— Landing (spotlight définition retirée → utils) ——
const landingBody = joinSlices([
  [881, 1138],
  [1145, 1596],
]);
write(
  'src/pages/landing/LandingViews.jsx',
  `import React, { useState, useEffect, useRef, useMemo, Fragment } from 'react';
import { I } from '../../icons/Icons.jsx';
import { RESTAURANTS } from '../../data/restaurants.js';
import { FEATURES } from '../../data/features.jsx';
import { HOW_STEPS } from '../../data/howSteps.jsx';
import { TESTIMONIALS } from '../../data/testimonials.js';
import { CAMPUS_HOSPITALS } from '../../data/campusHospitals.js';
import { ParticleCanvas } from '../../components/effects/ParticleCanvas.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Magnetic } from '../../components/ui/Magnetic.jsx';
import { Tilt } from '../../components/ui/Tilt.jsx';
import { Reveal } from '../../components/ui/Reveal.jsx';
import { Counter } from '../../components/ui/Counter.jsx';
import { spotlightHandler } from '../../utils/spotlight.js';

${exportFunctions(landingBody)}`
);

// —— Browse / restaurant ——
write(
  'src/pages/BrowseViews.jsx',
  `import React, { useState, useEffect, useMemo, useRef } from 'react';
import { I } from '../icons/Icons.jsx';
import { RESTAURANTS, CUISINES, CATEGORIES_BANNERS } from '../data/index.js';
import { Reveal } from '../components/ui/Reveal.jsx';
import { Tilt } from '../components/ui/Tilt.jsx';
import { rippleEffect } from '../utils/ripple.js';
import { spotlightHandler } from '../utils/spotlight.js';

${exportFunctions(slice(1600, 1923))}`
);

// —— Cart (sans Row : déjà dans ui/Row.jsx) ——
write(
  'src/pages/CartViews.jsx',
  `import React, { useEffect, Fragment } from 'react';
import { I } from '../icons/Icons.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Row } from '../components/ui/Row.jsx';

${exportFunctions(joinSlices([[1928, 2022], [2036, 2050]]))}`
);

// —— Checkout page ——
write(
  'src/pages/CheckoutPage.jsx',
  `import React, { useState } from 'react';
import { I } from '../icons/Icons.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Row } from '../components/ui/Row.jsx';
import { Card, CardHeader, Input, PayOption, Loader } from '../components/checkout/CheckoutForms.jsx';

${exportFunctions(slice(2055, 2156))}`
);

// —— Success ——
write(
  'src/pages/SuccessPage.jsx',
  `import React, { useMemo } from 'react';
import { I } from '../icons/Icons.jsx';
import { ORDER_STATES } from '../data/orderConstants.js';
import { useOrders } from '../contexts/AppContexts.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Step } from '../components/ui/OrderStep.jsx';

${exportFunctions(slice(2206, 2279))}`
);

// —— Bottom nav & footer ——
write(
  'src/components/layout/BottomNav.jsx',
  `import React from 'react';
import { I } from '../../icons/Icons.jsx';

${exportFunctions(slice(2284, 2308))}`
);
write(
  'src/components/layout/Footer.jsx',
  `import React from 'react';
import { Logo } from './Logo.jsx';

${exportFunctions(slice(2313, 2356))}`
);

// —— Dashboards ——
write(
  'src/dashboards/AdminPanel.jsx',
  `import React, { useState, useMemo } from 'react';
import { I } from '../icons/Icons.jsx';
import {
  ORDER_STATES,
  COURIERS,
  DELIVERY_FEE_DH,
  RESTAURANTS,
  EUR_TO_DH,
} from '../data/index.js';
import { useOrders } from '../contexts/AppContexts.jsx';
import {
  DashLayout,
  LineChart,
  BarChart,
  DonutChart,
  StatCard,
  StatusPill,
} from './DashShared.jsx';

${exportFunctions(slice(2723, 3020))}`
);

write(
  'src/dashboards/DeliveryPanel.jsx',
  `import React, { useState, useMemo } from 'react';
import { I } from '../icons/Icons.jsx';
import { ORDER_STATES, COURIERS, DELIVERY_FEE_DH } from '../data/index.js';
import { useOrders } from '../contexts/AppContexts.jsx';
import { DashLayout, StatCard, StatusPill, LineChart } from './DashShared.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Loader } from '../components/checkout/CheckoutForms.jsx';
import { spotlightHandler } from '../utils/spotlight.js';
import { RecentOrdersTable } from './AdminPanel.jsx';

${exportFunctions(slice(3025, 3224))}`
);

write(
  'src/dashboards/RestaurantPanel.jsx',
  `import React, { useState } from 'react';
import { I } from '../icons/Icons.jsx';
import { ORDER_STATES, RESTAURANTS } from '../data/index.js';
import { useOrders } from '../contexts/AppContexts.jsx';
import { DashLayout, LineChart, BarChart, StatCard } from './DashShared.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/checkout/CheckoutForms.jsx';
import { ModalOverlay } from '../components/ui/ModalOverlay.jsx';

${exportFunctions(joinSlices([[3229, 3457], [3473, 3499]]))}`
);

console.log('\nOK — modules générés depuis App.jsx');
