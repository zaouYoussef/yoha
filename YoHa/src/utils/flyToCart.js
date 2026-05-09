export function flyToCart(sourceEl, targetEl, imgSrc) {
  const sRect = sourceEl.getBoundingClientRect();
  const tRect = targetEl.getBoundingClientRect();
  const startSize = Math.min(sRect.width, 80);
  const clone = document.createElement('div');
  clone.className = 'fly-clone';
  clone.style.width = startSize + 'px';
  clone.style.height = startSize + 'px';
  clone.style.left = (sRect.left + sRect.width/2 - startSize/2) + 'px';
  clone.style.top  = (sRect.top  + sRect.height/2 - startSize/2) + 'px';
  clone.style.background = `url(${imgSrc}) center/cover`;
  clone.style.boxShadow = '0 10px 30px rgba(249,115,22,.45)';
  clone.style.transform = 'scale(1) rotate(0deg)';
  document.body.appendChild(clone);

  /* trigger transition */
  requestAnimationFrame(() => {
    const dx = (tRect.left + tRect.width/2)  - (sRect.left + sRect.width/2);
    const dy = (tRect.top  + tRect.height/2) - (sRect.top  + sRect.height/2);
    clone.style.transform = `translate(${dx}px, ${dy}px) scale(0.15) rotate(720deg)`;
    clone.style.opacity = '0';
  });

  setTimeout(() => clone.remove(), 1100);
}
