'use client';

import React, { useEffect, useRef } from 'react';

export function Magnetic({ children, strength = 25, className = '' }) {
  const ref = useRef();
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    let isClicking = false;
    const onMove = (e) => {
      if (isClicking) return;
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width/2;
      const y = e.clientY - r.top  - r.height/2;
      el.style.transform = `translate(${x/strength}px, ${y/strength}px)`;
    };
    const onLeave = () => { if (!isClicking) el.style.transform = ''; };
    const onDown = () => { isClicking = true; };
    const onUp = () => { isClicking = false; };
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    el.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
      el.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
    };
  }, [strength]);
  return <div ref={ref} className={`magnetic inline-block ${className}`}>{children}</div>;
}
