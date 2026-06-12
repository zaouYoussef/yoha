'use client';

import React, { useEffect, useRef } from 'react';

export function Tilt({ children, max = 8, className = "" }) {
  const ref = useRef();
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top ) / r.height - 0.5;
      el.style.transform = `perspective(1100px) rotateX(${-y*max}deg) rotateY(${x*max}deg) translateY(-3px)`;
    };
    const onLeave = () => { el.style.transform = ''; };
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave); };
  }, [max]);
  return <div ref={ref} className={`tilt-3d ${className}`}>{children}</div>;
}
