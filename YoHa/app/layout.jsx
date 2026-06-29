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
  title: 'YoHa — Livraison campus & CHU',
  description:
    'Livraison de repas intelligente pour les résidences universitaires et les hôpitaux de Tanger.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002'),
  openGraph: {
    title: 'YoHa',
    description: 'Ultra rapide. Pensé pour le campus.',
    type: 'website',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#fff7ed" />
      </head>
      <body className={`${inter.variable} ${jakarta.variable} font-sans min-h-screen min-h-[100dvh] bg-white dark:bg-ink-950 text-ink-900 dark:text-ink-50 overflow-x-hidden`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
