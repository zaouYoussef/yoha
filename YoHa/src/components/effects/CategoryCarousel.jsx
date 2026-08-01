'use client';

import React, { useMemo } from 'react';

const CAROUSEL_IMAGES = {
  pharmacy: [
    { src: 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=500&auto=format&fit=crop&q=75', label: 'Médicaments' },
    { src: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&auto=format&fit=crop&q=75', label: 'Phytothérapie' },
    { src: 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=500&auto=format&fit=crop&q=75', label: 'Soins dentaires' },
    { src: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&auto=format&fit=crop&q=75', label: 'Premiers soins' },
    { src: 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=500&auto=format&fit=crop&q=75', label: 'Vitamines' },
    { src: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&auto=format&fit=crop&q=75', label: 'Pharmacie' },
  ],
  parapharmacy: [
    { src: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&auto=format&fit=crop&q=75', label: 'Soins visage' },
    { src: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&auto=format&fit=crop&q=75', label: 'Cosmétiques' },
    { src: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&auto=format&fit=crop&q=75', label: 'Maquillage' },
    { src: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&auto=format&fit=crop&q=75', label: 'Soins cheveux' },
    { src: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&auto=format&fit=crop&q=75', label: 'Crèmes' },
    { src: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&auto=format&fit=crop&q=75', label: 'Bien-être' },
  ],
  supermarket: [
    { src: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=75', label: 'Fruits & Légumes' },
    { src: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=75', label: 'Épicerie' },
    { src: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=75', label: 'Supermarché' },
    { src: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=75', label: 'Courses' },
    { src: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=75', label: 'Produits frais' },
    { src: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=75', label: 'Bio' },
  ],
  patisserie: [
    { src: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=500&auto=format&fit=crop&q=75', label: 'Croissants' },
    { src: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=500&auto=format&fit=crop&q=75', label: 'Pâtisseries' },
    { src: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=500&auto=format&fit=crop&q=75', label: 'Tartes' },
    { src: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=500&auto=format&fit=crop&q=75', label: 'Macarons' },
    { src: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=500&auto=format&fit=crop&q=75', label: 'Desserts' },
    { src: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=500&auto=format&fit=crop&q=75', label: 'Éclairs' },
  ],
  shop: [
    { src: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&auto=format&fit=crop&q=75', label: 'Mode' },
    { src: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&auto=format&fit=crop&q=75', label: 'Vêtements' },
    { src: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&auto=format&fit=crop&q=75', label: 'Shopping' },
    { src: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&auto=format&fit=crop&q=75', label: 'Accessoires' },
    { src: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&auto=format&fit=crop&q=75', label: 'Boutique' },
    { src: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&auto=format&fit=crop&q=75', label: 'Sport' },
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
