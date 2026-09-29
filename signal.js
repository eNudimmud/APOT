/* λP⊙T — original signal sculpture. Abstract brand geometry, not recorded data.
   Canvas 2D projects a 3D filament bundle; CSS/SVG remains the no-canvas fallback. */
(() => {
  'use strict';
  const canvas = document.querySelector('#signal-canvas');
  const scene = document.querySelector('.signal-scene');
  if (!canvas || !scene) return;
  let ctx;
  try { ctx = canvas.getContext('2d', { alpha: true }); } catch (_) { return; }
  if (!ctx) return;
  const small = matchMedia('(max-width:760px)');
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  let width = 1, height = 1, frame = 0, last = 0, time = .65;
  let paused = reduced.matches, visible = true, scroll = 0;
  let targetX = 0, targetY = 0, pointerX = 0, pointerY = 0;
  let strands = [], steps = 145;
  const TAU = Math.PI * 2;
  function makeGeometry() {
    steps = small.matches ? 115 : 155;
    const count = small.matches ? 44 : 66;
    strands = Array.from({ length: count }, (_, i) => {
      const phi = i / count * TAU;
      const radius = .62 + .38 * ((i * 17 % 37) / 37);
      const points = Array.from({ length: steps }, (_, j) => {
        const t = j / (steps - 1);
        const wave = 2.45 * Math.exp(-Math.pow((t - .395) / .088, 2))
          - 1.9 * Math.exp(-Math.pow((t - .59) / .095, 2))
          + .23 * Math.exp(-Math.pow((t - .76) / .055, 2));
        return { t, x: (t - .5) * 8.4, wave, angle: phi + t * 4.8, radius };
      });
      return { points, phi, warm: i % 7 === 0 };
    });
  }
  function render(now) {
    frame = 0;
    const interval = small.matches ? 32 : 16;
    if (!paused && last && now - last < interval) { queue(); return; }
    if (!paused) time += last ? Math.min(now - last, 80) / 1000 : 0;
    last = now;
    pointerX += (targetX - pointerX) * .06;
    pointerY += (targetY - pointerY) * .06;
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'lighter';
    const yaw = -.34 + Math.sin(time * .48) * .19 + pointerX * .1 + scroll * .12;
    const pitch = .27 + Math.cos(time * .37) * .12 + pointerY * .07;
    const tilt = -.16 + Math.sin(time * .34) * .055;
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const ct = Math.cos(tilt), st = Math.sin(tilt);
    const scale = Math.min(width / 8.9, height / 6.5);
    const travel = (time / 5.2 + .22) % 1;
    const breathing = 1 + Math.sin(time * .8) * .07;
    function project(x, y, z) {
      const rx = x * cy + z * sy, rz = -x * sy + z * cy;
      const ry = y * cp - rz * sp, depth = y * sp + rz * cp;
      const perspective = 7 / (7.7 - depth);
      return [width * .51 + (rx * ct - ry * st) * scale * perspective,
        height * .49 - (rx * st + ry * ct) * scale * perspective];
    }
    for (const strand of strands) {
      const points = [];
      const rotation = Math.sin(time * .6) * .34;
      for (const point of strand.points) {
        const spread = (.35 + Math.sin(point.t * Math.PI) * .33) * point.radius * breathing;
        const angle = point.angle + rotation;
        const y = point.wave + Math.cos(angle) * spread;
        const z = Math.sin(angle) * spread;
        points.push(project(point.x, y, z));
      }
      const front = (Math.sin(strand.phi + rotation) + 1) * .5;
      ctx.lineWidth = small.matches ? .8 : .85;
      ctx.strokeStyle = strand.warm ? 'rgba(212,184,120,.38)' : `rgba(173,206,221,${.15 + front * .32})`;
      ctx.beginPath();
      for (let j = 0; j < points.length; j++) {
        const p = points[j];
        if (j === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]);
      }
      ctx.stroke();
      // A bright, broad impulse travels through the entire bundle every 5.2 s.
      const start = Math.max(0, Math.floor((travel - .07) * steps));
      const end = Math.min(steps - 1, Math.floor((travel + .025) * steps));
      if (end > start) {
        ctx.beginPath();
        for (let j = start; j <= end; j++) {
          const p = points[j];
          if (j === start) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]);
        }
        ctx.lineWidth = small.matches ? 1.35 : 1.3;
        ctx.strokeStyle = `rgba(243,220,164,${.22 + front * .65})`;
        ctx.stroke();
      }
    }
    if (visible && !paused && !document.hidden) queue();
  }
  function queue() { if (!frame) frame = requestAnimationFrame(render); }
  function resize() {
    const box = scene.getBoundingClientRect();
    width = Math.max(box.width, 1); height = Math.max(box.height, 1);
    const ratio = Math.min(devicePixelRatio || 1, small.matches ? 1.5 : 1.75);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    queue();
  }
  window.LambdaSignal = {
    setPaused(value) { paused = Boolean(value); last = 0; queue(); },
    setScroll(value) { scroll = value; if (visible) queue(); }
  };
  document.documentElement.classList.add('scene-ready');
  canvas.dataset.renderer = 'canvas-2d';
  makeGeometry(); resize();
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(scene);
  else window.addEventListener('resize', resize, { passive: true });
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) { last = 0; queue(); }
    else { cancelAnimationFrame(frame); frame = 0; }
  }).observe(scene);
  small.addEventListener('change', () => { makeGeometry(); resize(); });
  document.querySelector('.hero-stage').addEventListener('pointermove', event => {
    if (paused || event.pointerType === 'touch') return;
    const box = scene.getBoundingClientRect();
    targetX = Math.max(-1, Math.min(1, (event.clientX - box.left) / width * 2 - 1));
    targetY = Math.max(-1, Math.min(1, (event.clientY - box.top) / height * 2 - 1));
  }, { passive: true });
  document.querySelector('.hero-stage').addEventListener('pointerleave', () => { targetX = 0; targetY = 0; });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
    else if (visible) { last = 0; queue(); }
  });
})();
