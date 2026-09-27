(() => {
  'use strict';
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const wave = document.querySelector('.signal-wave');
  if (!motion.matches && wave && 'IntersectionObserver' in window && typeof wave.animate === 'function') {
    const length = wave.getTotalLength();
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      wave.animate([
        { strokeDasharray: String(length), strokeDashoffset: String(length) },
        { strokeDasharray: String(length), strokeDashoffset: '0' }
      ], { duration: 1450, easing: 'cubic-bezier(.3,0,.25,1)' });
      observer.disconnect();
    }, { threshold: 0.5 });
    observer.observe(wave);
  }
})();
