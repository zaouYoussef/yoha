'use client';

import React, { useMemo } from 'react';

const CAROUSEL_IMAGES = {
  pharmacy: [
    { src: '/media/restaurants/custom-pharmacy.webp', label: 'Médicaments' },
    { src: '/media/restaurants/custom-parapharmacy.webp', label: 'Phytothérapie' },
    { src: '/media/restaurants/custom-pharmacy.webp', label: 'Soins dentaires' },
    { src: '/media/restaurants/custom-parapharmacy.webp', label: 'Premiers soins' },
    { src: '/media/restaurants/custom-pharmacy.webp', label: 'Vitamines' },
    { src: '/media/restaurants/custom-parapharmacy.webp', label: 'Pharmacie' },
  ],
  parapharmacy: [
    { src: '/media/restaurants/custom-parapharmacy.webp', label: 'Soins visage' },
    { src: '/media/restaurants/custom-parapharmacy.webp', label: 'Cosmétiques' },
    { src: '/media/restaurants/custom-parapharmacy.webp', label: 'Maquillage' },
    { src: '/media/restaurants/custom-parapharmacy.webp', label: 'Soins cheveux' },
    { src: '/media/restaurants/custom-parapharmacy.webp', label: 'Crèmes' },
    { src: '/media/restaurants/custom-parapharmacy.webp', label: 'Bien-être' },
  ],
  supermarket: [
    { src: '/media/restaurants/custom-supermarket.webp', label: 'Fruits & Légumes' },
    { src: '/media/restaurants/custom-supermarket.webp', label: 'Épicerie' },
    { src: '/media/restaurants/custom-supermarket.webp', label: 'Supermarché' },
    { src: '/media/restaurants/custom-supermarket.webp', label: 'Courses' },
    { src: '/media/restaurants/custom-supermarket.webp', label: 'Produits frais' },
    { src: '/media/restaurants/custom-supermarket.webp', label: 'Bio' },
  ],
  patisserie: [
    { src: '/media/restaurants/custom-patisserie.webp', label: 'Croissants' },
    { src: '/media/restaurants/custom-patisserie.webp', label: 'Pâtisseries' },
    { src: '/media/restaurants/custom-patisserie.webp', label: 'Tartes' },
    { src: '/media/restaurants/custom-patisserie.webp', label: 'Macarons' },
    { src: '/media/restaurants/custom-patisserie.webp', label: 'Desserts' },
    { src: '/media/restaurants/custom-patisserie.webp', label: 'Éclairs' },
  ],
  shop: [
    { src: '/media/restaurants/custom-shop.webp', label: 'Mode' },
    { src: '/media/restaurants/custom-shop.webp', label: 'Vêtements' },
    { src: '/media/restaurants/custom-shop.webp', label: 'Shopping' },
    { src: '/media/restaurants/custom-shop.webp', label: 'Accessoires' },
    { src: '/media/restaurants/custom-shop.webp', label: 'Boutique' },
    { src: '/media/restaurants/custom-shop.webp', label: 'Sport' },
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
