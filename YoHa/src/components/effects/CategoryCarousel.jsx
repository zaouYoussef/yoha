'use client';

import React, { useMemo } from 'react';

const CAROUSEL_IMAGES = {
  pharmacy: [
    { src: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=600&h=400&fit=crop', label: 'Médicaments' },
    { src: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&h=400&fit=crop', label: 'Phytothérapie' },
    { src: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=600&h=400&fit=crop', label: 'Soins dentaires' },
    { src: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&h=400&fit=crop', label: 'Premiers soins' },
    { src: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&h=400&fit=crop', label: 'Vitamines' },
    { src: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=600&h=400&fit=crop', label: 'Pharmacie' },
    { src: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=600&h=400&fit=crop', label: 'Ordonnances' },
    { src: 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=600&h=400&fit=crop', label: 'Médicaments' },
  ],
  parapharmacy: [
    { src: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&h=400&fit=crop', label: 'Soins visage' },
    { src: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&h=400&fit=crop', label: 'Cosmétiques' },
    { src: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&h=400&fit=crop', label: 'Maquillage' },
    { src: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&h=400&fit=crop', label: 'Soins cheveux' },
    { src: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&h=400&fit=crop', label: 'Crèmes' },
    { src: 'https://images.unsplash.com/photo-1570194065650-d99fb4ee8f39?w=600&h=400&fit=crop', label: 'Bien-être' },
    { src: 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=600&h=400&fit=crop', label: 'Huiles essentielles' },
    { src: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&h=400&fit=crop', label: 'Naturel' },
  ],
  supermarket: [
    { src: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=400&fit=crop', label: 'Fruits & Légumes' },
    { src: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=600&h=400&fit=crop', label: 'Épicerie' },
    { src: 'https://images.unsplash.com/photo-1534723328310-e82dad3ee43f?w=600&h=400&fit=crop', label: 'Supermarché' },
    { src: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=600&h=400&fit=crop', label: 'Courses' },
    { src: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=600&h=400&fit=crop', label: 'Produits frais' },
    { src: 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268b?w=600&h=400&fit=crop', label: 'Bio' },
    { src: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=600&h=400&fit=crop', label: 'Boissons' },
    { src: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=400&fit=crop', label: 'Marché' },
  ],
  patisserie: [
    { src: 'https://images.unsplash.com/photo-1557925923-cd4648e2a002?w=600&h=400&fit=crop', label: 'Croissants' },
    { src: 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=600&h=400&fit=crop', label: 'Pâtisseries' },
    { src: 'https://images.unsplash.com/photo-1587248720327-8eb72564be1e?w=600&h=400&fit=crop', label: 'Tartes' },
    { src: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&h=400&fit=crop', label: 'Macarons' },
    { src: 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=600&h=400&fit=crop', label: 'Desserts' },
    { src: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&h=400&fit=crop', label: 'Éclairs' },
    { src: 'https://images.unsplash.com/photo-1557925923-cd4648e2a002?w=600&h=400&fit=crop', label: 'Viennoiseries' },
    { src: 'https://images.unsplash.com/photo-1587248720327-8eb72564be1e?w=600&h=400&fit=crop', label: 'Entremets' },
  ],
  shop: [
    { src: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop', label: 'Mode' },
    { src: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=600&h=400&fit=crop', label: 'Vêtements' },
    { src: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&h=400&fit=crop', label: 'Shopping' },
    { src: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=400&fit=crop', label: 'Accessoires' },
    { src: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=600&h=400&fit=crop', label: 'Boutique' },
    { src: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop', label: 'Sport' },
    { src: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop', label: 'Nouvelles collections' },
    { src: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=600&h=400&fit=crop', label: 'Tendances' },
  ],
};

export function CategoryCarousel({ category }) {
  const images = useMemo(() => CAROUSEL_IMAGES[category] || CAROUSEL_IMAGES.shop, [category]);
  const duplicated = useMemo(() => [...images, ...images], [images]);

  return (
    <section className="relative overflow-hidden rounded-3xl">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-pink-500/5 dark:from-brand-500/10 dark:to-pink-500/10 rounded-3xl" />
      <div className="relative overflow-hidden rounded-3xl py-4 sm:py-5">
        <div
          className="flex gap-4 sm:gap-5 category-carousel-track"
          style={{
            animation: `category-scroll ${images.length * 4}s linear infinite`,
          }}
        >
          {duplicated.map((img, i) => (
            <div
              key={`${category}-${i}`}
              className="shrink-0 w-[200px] sm:w-[240px] md:w-[260px] h-[130px] sm:h-[150px] md:h-[160px] rounded-2xl overflow-hidden relative group cursor-pointer"
            >
              <img
                src={img.src}
                alt={img.label}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                <span className="text-white text-xs sm:text-sm font-bold drop-shadow-lg">
                  {img.label}
                </span>
              </div>
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes category-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .category-carousel-track {
          will-change: transform;
        }
        .category-carousel-track:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}
