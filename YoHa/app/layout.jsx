import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { AppProviders } from '@/providers/AppProviders';
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
});

export const metadata = {
  title: {
    default: 'YoHa — Livraison Alliance campus & CHU à Tanger | repas en ~30 min',
    template: '%s | YoHa'
  },
  description: "Commandez vos repas et produits préférés avec YoHa et soyez livrés en moins de 30 minutes directement au CHU, à la BU ou en résidence universitaire Alliance. Livraison rapide et gratuite.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://yoha.ma'),
  alternates: {
    canonical: './',
  },
  keywords: ['YoHa', 'Livraison Tanger', 'Livraison campus', 'Livraison CHU', 'ENCG Tanger', 'FMP Tanger', 'repas étudiant', 'Tanger food delivery'],
  openGraph: {
    title: 'YoHa — Livraison campus & CHU · Tanger',
    description: 'Ultra rapide. Livraison de repas intelligente sur les campus et CHU de Tanger.',
    url: 'https://yoha.ma',
    siteName: 'YoHa',
    images: [
      {
        url: '/logo.png',
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
    title: 'YoHa — Livraison campus & CHU · Tanger',
    description: 'Livraison ultra rapide pensée pour le campus et les hôpitaux.',
    images: ['/logo.png'],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
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
    'streetAddress': 'Campus Universitaire & CHU',
    'addressLocality': 'Tanger',
    'addressCountry': 'MA'
  },
  'areaServed': [
    {
      '@type': 'AdministrativeArea',
      'name': 'Campus ENCG Tanger'
    },
    {
      '@type': 'AdministrativeArea',
      'name': 'CHU Tanger'
    },
    {
      '@type': 'AdministrativeArea',
      'name': 'Faculté de Médecine Tanger'
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
        <meta name="theme-color" content="#fff7ed" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} ${jakarta.variable} font-sans min-h-screen min-h-[100dvh] bg-white dark:bg-ink-950 text-ink-900 dark:text-ink-50 overflow-x-hidden`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
