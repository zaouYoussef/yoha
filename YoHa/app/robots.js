export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yoha.ma';
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/checkout',
        '/orders',
        '/success',
        '/auth',
        '/api/',
        '/_next/static/media/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
