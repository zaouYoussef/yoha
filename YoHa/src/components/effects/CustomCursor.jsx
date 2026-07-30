'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export function CustomCursor() {
  const [hovered, setHovered] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 28, stiffness: 350, mass: 0.5 };
  const smoothX = useSpring(cursorX, springConfig);
  const smoothY = useSpring(cursorY, springConfig);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(pointer: coarse)').matches) {
      setIsTouchDevice(true);
      return;
    }

    const moveCursor = (e) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const handleMouseOver = (e) => {
      const target = e.target;
      if (
        target.closest('button') ||
        target.closest('a') ||
        target.closest('[data-cursor="hover"]') ||
        target.closest('.interactive')
      ) {
        setHovered(true);
      } else {
        setHovered(false);
      }
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [cursorX, cursorY]);

  if (isTouchDevice) return null;

  return (
    <>
      {/* Central glow dot */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500 shadow-[0_0_12px_#f97316]"
        style={{
          x: smoothX,
          y: smoothY,
        }}
        animate={{
          scale: hovered ? 1.8 : 1,
        }}
        transition={{ duration: 0.15 }}
      />
      {/* Outer ring */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[9998] h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-orange-500/40 bg-orange-500/5 backdrop-blur-[1px]"
        style={{
          x: smoothX,
          y: smoothY,
        }}
        animate={{
          scale: hovered ? 1.6 : 1,
          borderColor: hovered ? 'rgba(249, 115, 22, 0.8)' : 'rgba(249, 115, 22, 0.3)',
        }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      />
    </>
  );
}
