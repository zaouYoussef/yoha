'use client';

import React, { useState, useEffect, useRef } from 'react';

export function Counter({ to, duration = 1800, decimals = 0, suffix = '' }) {
  const [val, setVal] = useState(0);
  const ref = useRef();
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const tick = (now) => {
          const elapsed = now - start;
          const p = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          setVal(to * eased);
          if (p < 1) requestAnimationFrame(tick);
          else setVal(to);
        };
        requestAnimationFrame(tick);
        io.disconnect();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration]);
  const display = decimals > 0
    ? val.toFixed(decimals).replace('.', ',')
    : Math.floor(val).toLocaleString('fr-FR');
  return <span ref={ref}>{display}{suffix}</span>;
}
