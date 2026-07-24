'use client';

import React, { useEffect, useRef } from 'react';

export default function BackgroundVideo({ webmSrc, mp4Src, poster, className = '' }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Enforce muted and playsinline for DOM autoplay policy
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('autoplay', '');

    const tryPlay = () => {
      const promise = video.play();
      if (promise !== undefined) {
        promise.catch((err) => {
          console.warn('Autoplay prevented by browser:', err);
          const handleUserGesture = () => {
            video.play().catch(() => {});
            window.removeEventListener('click', handleUserGesture);
            window.removeEventListener('touchstart', handleUserGesture);
            window.removeEventListener('scroll', handleUserGesture);
          };
          window.addEventListener('click', handleUserGesture, { once: true });
          window.addEventListener('touchstart', handleUserGesture, { once: true });
          window.addEventListener('scroll', handleUserGesture, { once: true });
        });
      }
    };

    video.load();
    tryPlay();
  }, [webmSrc, mp4Src]);

  return (
    <video
      ref={videoRef}
      src={mp4Src}
      className={className}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      poster={poster}
      aria-hidden="true"
    >
      <source src={webmSrc} type="video/webm" />
      <source src={mp4Src} type="video/mp4" />
    </video>
  );
}
