import React, { useEffect, useRef } from 'react';

export function ParticleCanvas() {
  const ref = useRef();
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [], mouse = { x: -1000, y: -1000 }, raf;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const w = canvas.offsetWidth, h = canvas.offsetHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(1,0,0,1,0,0); ctx.scale(dpr, dpr);
      const count = Math.min(75, Math.floor((w * h) / 16000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: 1 + Math.random() * 2.4,
      }));
    };

    const onMove = e => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const onLeave = () => { mouse.x = -1000; mouse.y = -1000; };

    const draw = () => {
      const w = canvas.offsetWidth, h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      particles.forEach(p => {
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const d2 = dx*dx + dy*dy;
        if (d2 < 140*140) {
          const dist = Math.sqrt(d2) || 1;
          const force = (140 - dist) / 140 * 1.4;
          p.x += (dx / dist) * force;
          p.y += (dy / dist) * force;
        }
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0)   { p.x = 0;   p.vx *= -1; }
        if (p.x > w)   { p.x = w;   p.vx *= -1; }
        if (p.y < 0)   { p.y = 0;   p.vy *= -1; }
        if (p.y > h)   { p.y = h;   p.vy *= -1; }
      });

      /* connections */
      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx*dx + dy*dy;
          if (d2 < 130*130) {
            const dist = Math.sqrt(d2);
            const alpha = (1 - dist / 130) * 0.28;
            ctx.strokeStyle = `rgba(249, 115, 22, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      /* particles */
      particles.forEach(p => {
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const d2 = dx*dx + dy*dy;
        const near = d2 < 140*140;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r + (near ? 1 : 0), 0, Math.PI * 2);
        ctx.fillStyle = near ? 'rgba(236,72,153,0.85)' : 'rgba(249,115,22,0.65)';
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', onLeave);
    };
  }, []);
  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />;
}
