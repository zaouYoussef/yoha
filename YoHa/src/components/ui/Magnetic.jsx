'use client';

import React from 'react';

export function Magnetic({ children, strength, className = '' }) {
  // Disabled: pass-through wrapper. No magnetic pull on hover.
  return <div className={`magnetic inline-block ${className}`}>{children}</div>;
}
