'use client';

import React, { useEffect, useState, useRef } from 'react';

export default function BackgroundVideo({ webmSrc, mp4Src, poster, className = '' }) {
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  useEffect(() => {
    if (!mounted || !isDesktop) return;
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');

    const tryPlay = () => {
      const promise = video.play();
      if (promise !== undefined) {
        promise.catch((err) => {
          console.warn('Autoplay prevented by browser:', err);
        });
      }
    };

    video.load();
    tryPlay();
  }, [webmSrc, mp4Src, mounted, isDesktop]);

  // On Mobile (<768px), SSR, or before mount: render ultra-lightweight WebP poster image ONLY
  if (!mounted || !isDesktop) {
    return (
      <img
        src={poster}
        alt="Background"
        className={className}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        aria-hidden="true"
      />
    );
  }

  return (
    <video
      ref={videoRef}
      src={mp4Src}
      className={className}
      autoPlay
      loop
      muted
      playsInline
      preload="none"
      poster={poster}
      aria-hidden="true"
    >
      <source src={webmSrc} type="video/webm" />
      <source src={mp4Src} type="video/mp4" />
    </video>
  );
}
