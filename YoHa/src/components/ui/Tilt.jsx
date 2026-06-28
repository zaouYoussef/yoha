'use client';

import React from 'react';

export function Tilt({ children, max, className = "" }) {
  // Disabled: pass-through wrapper. No 3D tilt or glare on hover.
  return (
    <div className={`tilt-3d relative overflow-hidden rounded-[inherit] ${className}`}>
      {children}
    </div>
  );
}

