'use client';

import React, { useEffect, useRef } from 'react';

export function Tilt({ children, max = 8, className = "" }) {
  const ref = useRef();
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    let isClicking = false;
    const onMove = (e) => {
      if (isClicking) return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top ) / r.height - 0.5;
      el.style.transform = `perspective(1100px) rotateX(${-y*max}deg) rotateY(${x*max}deg) translateY(-3px)`;
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
  }, [max]);
  return <div ref={ref} className={`tilt-3d ${className}`}>{children}</div>;
}
