'use client';

import React, { useEffect, useRef, useState } from 'react';
import BackgroundVideo from './BackgroundVideo';

export default function LazyBackgroundVideo({ containerClassName = '', ...props }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    if (ref.current) {
      obs.observe(ref.current);
    }

    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={containerClassName}>
      {visible && <BackgroundVideo {...props} />}
    </div>
  );
}
