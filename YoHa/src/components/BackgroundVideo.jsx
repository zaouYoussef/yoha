'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function BackgroundVideo({ webmSrc, mp4Src, poster, className = '' }) {
  const videoRef = useRef(null);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) return;
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
  }, [webmSrc, mp4Src, isMobile]);

  if (isMobile) {
    return (
      <img
        src={poster}
        alt="Hero Background"
        className={className}
        loading="eager"
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
