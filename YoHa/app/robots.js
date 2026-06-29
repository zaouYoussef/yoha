export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yoha.ma';
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/checkout',
        '/delivery',
        '/restaurant-dash',
        '/zaoujal/',
        '/orders',
        '/success',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
