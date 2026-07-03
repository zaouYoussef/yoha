export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yoha.ma';

  // Base static routes
  const routes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/browse`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  // Try to fetch dynamic restaurant pages from backend
  try {
    const res = await fetch('http://127.0.0.1:8000/api/v1/restaurants/', {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      const restaurants = Array.isArray(data) ? data : (data.results || []);
      
      restaurants.forEach((r) => {
        if (r.slug) {
          routes.push({
            url: `${baseUrl}/restaurant/${r.slug}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
          });
        }
      });
    }
  } catch (error) {
    console.warn('Could not fetch restaurants for sitemap, using static routes only.');
  }

  return routes;
}
