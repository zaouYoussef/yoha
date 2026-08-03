import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import Script from 'next/script';
import { AppProviders } from '@/providers/AppProviders';
import { AnalyticsTracker } from '@/components/ui/AnalyticsTracker';
import { PathAwareShell } from '@/components/shell/PathAwareShell';
import './globals.css';
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
  weight: ['500', '600', '700', '800'],
});

export const metadata = {
  title: {
    default: 'YoHa — Livraison Alliance & CHU à Tanger | repas en ~30 min',
    template: '%s | YoHa'
  },
  description: "Commandez vos repas et produits préférés avec YoHa et soyez livrés en moins de 30 minutes directement au CHU, à la BU ou en résidence universitaire Alliance. Livraison rapide et gratuite.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://yoha.ma'),
  alternates: {
    canonical: './',
  },
  keywords: ['YoHa', 'Livraison Tanger', 'Livraison Alliance', 'Livraison CHU', 'ENCG Tanger', 'FMP Tanger', 'repas étudiant', 'Tanger food delivery'],
  openGraph: {
    title: 'YoHa — Livraison Alliance & CHU · Tanger',
    description: 'Ultra rapide. Livraison de repas intelligente sur les zones Alliance et CHU de Tanger.',
    url: 'https://yoha.ma',
    siteName: 'YoHa',
    images: [
      {
        url: '/logo.webp',
        width: 512,
        height: 512,
        alt: 'YoHa Logo',
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YoHa — Livraison Alliance & CHU · Tanger',
    description: 'Livraison ultra rapide pensée pour la résidence Alliance et les hôpitaux.',
    images: ['/logo.webp'],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FoodDeliveryService',
  'name': 'YoHa',
  'image': 'https://yoha.ma/logo.png',
  '@id': 'https://yoha.ma/#service',
  'url': 'https://yoha.ma',
  'telephone': '+212600000000',
  'priceRange': 'MAD',
  'address': {
    '@type': 'PostalAddress',
    'streetAddress': 'Résidence Alliance & CHU',
    'addressLocality': 'Tanger',
    'addressCountry': 'MA'
  },
  'areaServed': [
    {
      '@type': 'AdministrativeArea',
      'name': 'CHU Mohammed VI de Tanger'
    },
    {
      '@type': 'AdministrativeArea',
      'name': 'FMPT de Tanger'
    },
    {
      '@type': 'AdministrativeArea',
      'name': 'ISPITS Tanger'
    },
    {
      '@type': 'AdministrativeArea',
      'name': 'Résidence universitaire Alliance Tanger'
    }
  ],
  'provider': {
    '@type': 'Organization',
    'name': 'YoHa',
    'logo': 'https://yoha.ma/logo.png',
    'sameAs': [
      'https://www.instagram.com/yoha.ma'
    ]
  }
};


export default function RootLayout({ children }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#f97316" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0f172a" media="(prefers-color-scheme: dark)" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k="yoha_chunk_reload";function bad(m){m=String(m||"");return /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed/i.test(m)}function go(){try{if(sessionStorage.getItem(k)==="1")return;sessionStorage.setItem(k,"1");location.reload()}catch(e){}}window.addEventListener("error",function(e){if(bad(e&&e.message))go()},true);window.addEventListener("unhandledrejection",function(e){var r=e&&e.reason;if(bad(r&&(r.message||r))|| (r&&r.name==="ChunkLoadError"))go()});if(document.readyState==="complete"){try{sessionStorage.removeItem(k)}catch(e){}}else{window.addEventListener("load",function(){try{sessionStorage.removeItem(k)}catch(e){}})}}catch(e){}})();`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var ok=typeof Promise!=="undefined"&&typeof Symbol!=="undefined"&&typeof Map!=="undefined"&&typeof WeakMap!=="undefined"&&typeof Proxy!=="undefined"&&typeof fetch==="function"&&typeof Object.assign==="function"&&typeof Object.fromEntries==="function"&&!!Array.prototype.flat&&!!Array.prototype.includes;if(!ok){window.location.replace("/browser-update.html");}}catch(e){try{window.location.replace("/browser-update.html");}catch(_){}}})();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} ${jakarta.variable} font-sans min-h-screen min-h-[100dvh] bg-white dark:bg-ink-950 text-ink-900 dark:text-ink-50 overflow-x-hidden`}>
        <Script src="/legacy-polyfills.js" strategy="beforeInteractive" />
        <AppProviders>
          <AnalyticsTracker />
          <PathAwareShell>{children}</PathAwareShell>
        </AppProviders>
      </body>
    </html>
  );
}


