let _raf = null;
export function spotlightHandler(e) {
  if (_raf) return;
  const el = e.currentTarget;
  const cx = e.clientX;
  const cy = e.clientY;
  _raf = requestAnimationFrame(() => {
    _raf = null;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', (cx - r.left) + 'px');
    el.style.setProperty('--my', (cy - r.top) + 'px');
  });
}
