'use client';

/** Native scroll only — Lenis RAF was costing main-thread time on every frame. */
export function SmoothScrollProvider({ children }) {
  return children;
}
