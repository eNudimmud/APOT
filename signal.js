/* λP⊙T — original projected filament. Abstract brand geometry, not a recording.
   Canvas 2D draws a depth-sorted 3D bundle. Scroll is the primary pose;
   time only drifts the impulse and the camera. SVG/CSS is the no-canvas fallback. */
(() => {
  'use strict';
  const canvas = document.querySelector('#signal-canvas');
  const scene = document.querySelector('.signal-scene');
  if (!canvas || !scene) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const small = matchMedia('(max-width: 760px)');
  let ctx = null;
  try { ctx = canvas.getContext('2d', { alpha: true }); } catch (_) { ctx = null; }

  let width = 1;
  let height = 1;
  let frame = 0;
  let last = 0;
  let time = 0.4;
  let paused = reduced.matches;
  let visible = true;
  let scroll = 0;
  let pointerX = 0;
  let pointerY = 0;
  let targetX = 0;
  let targetY = 0;
  let strands = [];
  let steps = 120;

  function clamp01(value) {
    return Math.min(1, Math.max(0, value));
  }

  function pose(phase, drift) {
    const yaw = -0.72 + phase * 1.7 + drift;
    const pitch = 0.46 - phase * 0.34 + pointerY * 0.06;
    const roll = -0.12 + phase * 0.22 + pointerX * 0.05;
    const spread = 0.34 + phase * 0.92;
    const twist = 1.6 + phase * 7.2;
    return { yaw, pitch, roll, spread, twist, orbit: Math.round((yaw * 180) / Math.PI) };
  }

  function waveY(t, phase) {
    const start = 0.28;
    const peak = 0.40 + phase * 0.03;
    const fallEnd = 0.54 + phase * 0.04;
    const recovery = 0.74;
    const amp = 0.95 + phase * 2.05;
    const depth = 0.28 + phase * 0.85;
    if (t < start || t > recovery) return 0;
    if (t < peak) {
      const u = (t - start) / (peak - start);
      return amp * u * u;
    }
    if (t < fallEnd) {
      const u = (t - peak) / (fallEnd - peak);
      return amp * (1 - u) - depth * u;
    }
    const u = (t - fallEnd) / (recovery - fallEnd);
    return -depth * (1 - u);
  }

  function makeGeometry() {
    steps = small.matches ? 84 : 120;
    const count = small.matches ? 28 : 46;
    strands = Array.from({ length: count }, (_, i) => ({
      phi: (i / count) * Math.PI * 2,
      radius: 0.52 + ((i * 13) % 19) / 19 * 0.62,
      warm: i % 8 === 0,
      xy: new Array(steps),
      depth: 0
    }));
  }

  function project(x, y, z, camera, scale, originX, originY) {
    const cy = Math.cos(camera.yaw);
    const sy = Math.sin(camera.yaw);
    const cp = Math.cos(camera.pitch);
    const sp = Math.sin(camera.pitch);
    const cr = Math.cos(camera.roll);
    const sr = Math.sin(camera.roll);
    const rx = x * cy + z * sy;
    const rz = -x * sy + z * cy;
    const ry = y * cp - rz * sp;
    const depth = y * sp + rz * cp;
    const perspective = 6.2 / (7.4 - depth);
    const sx = rx * cr - ry * sr;
    const sy2 = rx * sr + ry * cr;
    return [originX + sx * scale * perspective, originY - sy2 * scale * perspective, depth];
  }

  function strokePath(points, widthPx, color) {
    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      if (i === 0) ctx.moveTo(p[0], p[1]);
      else ctx.lineTo(p[0], p[1]);
    }
    ctx.lineWidth = widthPx;
    ctx.strokeStyle = color;
    ctx.stroke();
  }

  function render(now) {
    frame = 0;
    const phase = clamp01(scroll);
    if (!paused) {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
      time += dt;
    }
    last = now || 0;
    pointerX += (targetX - pointerX) * 0.07;
    pointerY += (targetY - pointerY) * 0.07;

    const drift = paused ? 0 : Math.sin(time * 0.42) * 0.1;
    const camera = pose(phase, drift + pointerX * 0.1);
    const narrow = width < 780;
    const fit = narrow ? width * 0.86 : width * 0.5;
    const scale = Math.min(fit / 9.4, (height * (narrow ? 0.34 : 0.46)) / 3.4);
    const originX = narrow ? width * 0.5 : width * 0.67;
    const originY = narrow ? height * 0.58 : height * 0.48;
    const breathe = paused ? 1 : 1 + Math.sin(time * 0.8) * 0.03;
    const spin = paused ? 0 : time * 0.22;
    let impulse = phase * 0.9;
    if (!paused) impulse = (impulse * 0.65 + time * 0.045) % 1;

    ctx.clearRect(0, 0, width, height);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const ringTs = [0.22, 0.48, 0.7];
    ctx.lineWidth = 1;
    for (let r = 0; r < ringTs.length; r++) {
      const t = ringTs[r];
      const y0 = waveY(t, phase);
      const x = (t - 0.5) * 9.4;
      const radius = (0.55 + phase * 0.9) * (r === 1 ? 1.15 : 0.82);
      ctx.beginPath();
      for (let k = 0; k <= 40; k++) {
        const a = (k / 40) * Math.PI * 2;
        const p = project(x, y0 + Math.cos(a) * radius, Math.sin(a) * radius, camera, scale, originX, originY);
        if (k === 0) ctx.moveTo(p[0], p[1]);
        else ctx.lineTo(p[0], p[1]);
      }
      ctx.strokeStyle = r === 1 ? 'rgba(208,189,140,0.55)' : 'rgba(176,198,210,0.28)';
      ctx.stroke();
    }

    const center = new Array(steps);
    let crest = center[0];
    let crestT = 1;
    const peakT = 0.40 + phase * 0.03;
    for (const strand of strands) {
      let depthSum = 0;
      for (let j = 0; j < steps; j++) {
        const t = j / (steps - 1);
        const y = waveY(t, phase);
        const envelope = Math.sin(Math.min(1, Math.max(0, (t - 0.08) / 0.84)) * Math.PI);
        const angle = strand.phi + t * camera.twist + spin;
        const radial = strand.radius * camera.spread * (0.22 + envelope) * breathe;
        const p = project((t - 0.5) * 9.4, y + Math.cos(angle) * radial, Math.sin(angle) * radial * 1.2, camera, scale, originX, originY);
        strand.xy[j] = p;
        depthSum += p[2];
        if (strand === strands[0]) {
          center[j] = project((t - 0.5) * 9.4, y, 0, camera, scale, originX, originY);
          const dist = Math.abs(t - peakT);
          if (dist < crestT) { crestT = dist; crest = center[j]; }
        }
      }
      strand.depth = depthSum / steps;
    }

    const ordered = strands.slice().sort((a, b) => a.depth - b.depth);
    for (const strand of ordered) {
      const front = Math.max(0, Math.min(1, (strand.depth + 1.7) / 3.5));
      const alpha = 0.16 + front * 0.78;
      const color = strand.warm
        ? `rgba(224,198,140,${0.28 + front * 0.62})`
        : `rgba(214,230,236,${alpha})`;
      strokePath(strand.xy, (narrow ? 0.8 : 1.05) + front * 1.25, color);

      const i0 = Math.max(0, Math.floor((impulse - 0.035) * (steps - 1)));
      const i1 = Math.min(steps - 1, Math.ceil((impulse + 0.018) * (steps - 1)));
      if (i1 > i0) {
        strokePath(strand.xy.slice(i0, i1 + 1), 1.6 + front * 2.6, `rgba(255,228,170,${0.28 + front * 0.72})`);
      }
    }

    strokePath(center, narrow ? 1.6 : 2.15, `rgba(236,232,222,${0.45 + phase * 0.4})`);
    const spikeStart = Math.max(0, Math.floor(0.3 * (steps - 1)));
    const spikeEnd = Math.min(steps - 1, Math.ceil((0.5 + phase * 0.06) * (steps - 1)));
    strokePath(center.slice(spikeStart, spikeEnd + 1), narrow ? 2.4 : 3.1, `rgba(240,214,150,${0.35 + phase * 0.6})`);

    if (crest) {
      const glow = ctx.createRadialGradient(crest[0], crest[1], 0, crest[0], crest[1], 70 + phase * 80);
      glow.addColorStop(0, `rgba(236,206,140,${0.18 + phase * 0.38})`);
      glow.addColorStop(1, 'rgba(236,206,140,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(crest[0], crest[1], 78 + phase * 86, 0, Math.PI * 2);
      ctx.fill();
    }

    canvas.dataset.renderer = 'projected-3d';
    canvas.dataset.scroll = phase.toFixed(3);
    canvas.dataset.orbit = String(camera.orbit);
    scene.style.setProperty('--scroll', phase.toFixed(4));

    if (visible && !paused && !document.hidden) queue();
    return { phase, orbit: camera.orbit };
  }

  function queue() {
    if (!frame) frame = requestAnimationFrame(render);
  }

  function resize() {
    const box = scene.getBoundingClientRect();
    width = Math.max(box.width, 1);
    height = Math.max(box.height, 1);
    const ratio = Math.min(devicePixelRatio || 1, small.matches ? 1.5 : 1.75);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    render(performance.now());
  }

  window.LambdaSignal = {
    setPaused(value) {
      paused = Boolean(value);
      last = 0;
      if (ctx) return render(performance.now());
      return { phase: clamp01(scroll), orbit: pose(clamp01(scroll), 0).orbit };
    },
    setScroll(value) {
      scroll = clamp01(value);
      scene.style.setProperty('--scroll', scroll.toFixed(4));
      if (ctx && visible) return render(performance.now());
      const orbit = pose(scroll, 0).orbit;
      canvas.dataset.scroll = scroll.toFixed(3);
      canvas.dataset.orbit = String(orbit);
      return { phase: scroll, orbit };
    }
  };

  if (!ctx) return;

  document.documentElement.classList.add('scene-ready');
  makeGeometry();
  resize();
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(scene);
  else window.addEventListener('resize', resize, { passive: true });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (visible) { last = 0; queue(); }
      else { cancelAnimationFrame(frame); frame = 0; }
    }).observe(scene);
  }
  small.addEventListener('change', () => { makeGeometry(); resize(); });
  const stage = document.querySelector('.signal-world');
  stage.addEventListener('pointermove', event => {
    if (paused || event.pointerType === 'touch') return;
    const box = scene.getBoundingClientRect();
    targetX = Math.max(-1, Math.min(1, ((event.clientX - box.left) / box.width) * 2 - 1));
    targetY = Math.max(-1, Math.min(1, ((event.clientY - box.top) / box.height) * 2 - 1));
  }, { passive: true });
  stage.addEventListener('pointerleave', () => { targetX = 0; targetY = 0; });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
    else if (visible) { last = 0; queue(); }
  });
})();
