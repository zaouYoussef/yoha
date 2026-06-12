'use client';

import React, { useState, useEffect, useRef } from 'react';

export function Reveal({ children, delay = 0 }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setTimeout(() => setShown(true), delay); io.disconnect(); }
    }, { rootMargin:'-30px' });
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);
  return <div ref={ref} className={`reveal ${shown ? 'in' : ''}`}>{children}</div>;
}
