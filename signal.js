/* λP⊙T — original projected filament. Abstract brand geometry, not a recording.
   Canvas 2D draws a depth-sorted bundle on a continuous idle loop.
   Scroll only nudges the pose. Time is the motion. */
(() => {
  'use strict';
  const canvas = document.querySelector('#signal-canvas');
  const scene = document.querySelector('.signal-scene');
  if (!canvas || !scene) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const small = matchMedia('(max-width: 760px)');
  const CYCLE = 18;
  let ctx = null;
  try { ctx = canvas.getContext('2d', { alpha: true }); } catch (_) { ctx = null; }

  let width = 1;
  let height = 1;
  let frame = 0;
  let last = 0;
  let time = CYCLE * 0.3;
  let paused = reduced.matches;
  let visible = true;
  let scroll = 0;
  let scrollSmooth = 0;
  let pointerX = 0;
  let pointerY = 0;
  let targetX = 0;
  let targetY = 0;
  let strands = [];
  let order = [];
  let center = [];
  let rings = [];
  let wave = new Float64Array(0);
  let steps = 64;
  let narrow = false;
  let metricsListener = null;
  let lastMetrics = null;
  let publishedBucket = -1;
  let publishedOrbit = null;
  let publishedPhase = -1;

  const glow = document.createElement('canvas');
  glow.width = 128;
  glow.height = 128;
  const glowCtx = glow.getContext('2d');
  if (glowCtx) {
    const shade = glowCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
    shade.addColorStop(0, 'rgba(236,206,140,0.85)');
    shade.addColorStop(0.35, 'rgba(236,206,140,0.18)');
    shade.addColorStop(1, 'rgba(236,206,140,0)');
    glowCtx.fillStyle = shade;
    glowCtx.fillRect(0, 0, 128, 128);
  }

  function clamp01(value) {
    return Math.min(1, Math.max(0, value));
  }

  function smooth(value) {
    return value * value * (3 - 2 * value);
  }

  function autoOpen(at) {
    const u = (at % CYCLE) / CYCLE;
    const ping = u < 0.5 ? u * 2 : 2 - u * 2;
    return smooth(ping);
  }

  function quality() {
    narrow = small.matches || width < 800;
    if (narrow) return { strands: 16, steps: 52, dpr: 2 };
    return { strands: 26, steps: 68, dpr: 2 };
  }

  function makeGeometry() {
    const q = quality();
    steps = q.steps;
    const count = q.strands;
    const golden = Math.PI * (3 - Math.sqrt(5));
    strands = Array.from({ length: count }, (_, i) => ({
      phi: i * golden,
      radius: 0.58 + (i % 5) * 0.11,
      warm: i % 6 === 0,
      impulse: i % 3 === 0,
      depth: 0,
      xy: Array.from({ length: steps }, () => [0, 0, 0])
    }));
    order = strands.map((_, i) => i);
    center = Array.from({ length: steps }, () => [0, 0, 0]);
    rings = Array.from({ length: 2 }, () => Array.from({ length: (narrow ? 20 : 28) + 1 }, () => [0, 0, 0]));
    wave = new Float64Array(steps);
  }

  function waveY(t, open) {
    const start = 0.28;
    const peak = 0.4 + open * 0.02;
    const fallEnd = 0.54 + open * 0.02;
    const recovery = 0.74;
    const amp = 0.72 + open * 1.55;
    const depth = 0.18 + open * 0.5;
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

  function projectInto(out, x, y, z, camera, scale, originX, originY) {
    const rx = x * camera.cy + z * camera.sy;
    const rz = -x * camera.sy + z * camera.cy;
    const ry = y * camera.cp - rz * camera.sp;
    const depth = y * camera.sp + rz * camera.cp;
    const perspective = 6.1 / (7.2 - depth);
    const sx = rx * camera.cr - ry * camera.sr;
    const sy = rx * camera.sr + ry * camera.cr;
    out[0] = originX + sx * scale * perspective;
    out[1] = originY - sy * scale * perspective;
    out[2] = depth;
  }

  function strokeRange(points, start, end, widthPx) {
    if (end <= start) return;
    ctx.beginPath();
    ctx.moveTo(points[start][0], points[start][1]);
    for (let i = start + 1; i <= end; i++) ctx.lineTo(points[i][0], points[i][1]);
    ctx.lineWidth = widthPx;
    ctx.stroke();
  }

  function cameraFor(open) {
    const yaw = -0.62 + open * 0.72 + time * 0.11 + pointerX * 0.06 + (scrollSmooth - 0.15) * 0.12;
    const pitch = 0.4 - open * 0.16 + pointerY * 0.04;
    const roll = -0.08 + open * 0.1 + pointerX * 0.03;
    return {
      yaw,
      pitch,
      roll,
      spread: 0.4 + open * 0.62,
      twist: 1.8 + open * 2.6,
      cy: Math.cos(yaw),
      sy: Math.sin(yaw),
      cp: Math.cos(pitch),
      sp: Math.sin(pitch),
      cr: Math.cos(roll),
      sr: Math.sin(roll),
      orbit: ((Math.round((yaw * 180) / Math.PI) % 360) + 360) % 360
    };
  }

  function paint(open, camera) {
    const fit = width * 0.84;
    const scale = Math.min(fit / 9.2, height * 0.8 / 3.2);
    const originX = width * 0.5;
    const originY = height * 0.54;
    const breathe = paused ? 1 : 1 + Math.sin(time * 0.7) * 0.018;
    const spin = paused ? time * 0.11 : time * 0.16;
    const impulse = (time * 0.085) % 1;
    const peakT = 0.4 + open * 0.02;

    ctx.clearRect(0, 0, width, height);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.globalAlpha = 1;

    const ringTs = [0.34, 0.62];
    const ringSeg = narrow ? 20 : 28;
    for (let r = 0; r < ringTs.length; r++) {
      const t = ringTs[r];
      const y0 = waveY(t, open);
      const x = (t - 0.5) * 9.2;
      const radius = (0.5 + open * 0.55) * (r === 0 ? 0.82 : 1.05);
      for (let k = 0; k <= ringSeg; k++) {
        const a = (k / ringSeg) * Math.PI * 2;
        projectInto(rings[r][k], x, y0 + Math.cos(a) * radius, Math.sin(a) * radius, camera, scale, originX, originY);
      }
    }

    for (let j = 0; j < steps; j++) wave[j] = waveY(j / (steps - 1), open);

    let crest = center[0];
    let crestT = 1;
    for (let s = 0; s < strands.length; s++) {
      const strand = strands[s];
      let depthSum = 0;
      for (let j = 0; j < steps; j++) {
        const t = j / (steps - 1);
        const envelope = Math.sin(Math.min(1, Math.max(0, (t - 0.08) / 0.84)) * Math.PI);
        const angle = strand.phi + t * camera.twist + spin;
        const radial = strand.radius * camera.spread * (0.2 + envelope) * breathe;
        const point = strand.xy[j];
        projectInto(point, (t - 0.5) * 9.2, wave[j] + Math.cos(angle) * radial, Math.sin(angle) * radial * 1.15, camera, scale, originX, originY);
        depthSum += point[2];
        if (s === 0) {
          projectInto(center[j], (t - 0.5) * 9.2, wave[j], 0, camera, scale, originX, originY);
          const dist = Math.abs(t - peakT);
          if (dist < crestT) {
            crestT = dist;
            crest = center[j];
          }
        }
      }
      strand.depth = depthSum / steps;
    }

    // Fit the entire projected bundle, including its rings, inside the small band.
    // A fixed vertical scale clipped the crest as the camera turned.
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const include = point => {
      minX = Math.min(minX, point[0]); maxX = Math.max(maxX, point[0]);
      minY = Math.min(minY, point[1]); maxY = Math.max(maxY, point[1]);
    };
    for (const ring of rings) for (const point of ring) include(point);
    for (const strand of strands) for (const point of strand.xy) include(point);
    for (const point of center) include(point);
    const padding = Math.min(10, width * 0.08, height * 0.08);
    const fitScale = Math.min(1, (width - padding * 2) / (maxX - minX || 1), (height - padding * 2) / (maxY - minY || 1));
    ctx.save();
    ctx.translate(width * 0.5, height * 0.5);
    ctx.scale(fitScale, fitScale);
    ctx.translate(-(minX + maxX) * 0.5, -(minY + maxY) * 0.5);
    for (let r = 0; r < rings.length; r++) {
      ctx.strokeStyle = r === 1 ? 'rgba(208,189,140,0.42)' : 'rgba(176,198,210,0.22)';
      strokeRange(rings[r], 0, ringSeg, 1);
    }

    order.sort((a, b) => strands[a].depth - strands[b].depth);
    const i0 = Math.max(0, Math.floor((impulse - 0.028) * (steps - 1)));
    const i1 = Math.min(steps - 1, Math.ceil((impulse + 0.016) * (steps - 1)));
    for (let n = 0; n < order.length; n++) {
      const strand = strands[order[n]];
      const front = Math.max(0, Math.min(1, (strand.depth + 1.6) / 3.3));
      ctx.strokeStyle = strand.warm ? '#e0c68c' : '#d6e6ec';
      ctx.globalAlpha = 0.14 + front * 0.7;
      strokeRange(strand.xy, 0, steps - 1, (narrow ? 0.7 : 0.85) + front * 0.9);
      if (strand.impulse && i1 > i0) {
        ctx.strokeStyle = '#ffe4aa';
        ctx.globalAlpha = 0.35 + front * 0.55;
        strokeRange(strand.xy, i0, i1, 1.25 + front);
      }
    }

    ctx.strokeStyle = '#ece8de';
    ctx.globalAlpha = 0.55 + open * 0.3;
    strokeRange(center, 0, steps - 1, narrow ? 1.45 : 1.8);
    const spikeStart = Math.max(0, Math.floor(0.32 * (steps - 1)));
    const spikeEnd = Math.min(steps - 1, Math.ceil(0.5 * (steps - 1)));
    ctx.strokeStyle = '#f0d696';
    ctx.globalAlpha = 0.4 + open * 0.45;
    strokeRange(center, spikeStart, spikeEnd, narrow ? 2.1 : 2.5);
    if (i1 > i0) {
      ctx.strokeStyle = '#fff4d2';
      ctx.globalAlpha = 0.85;
      strokeRange(center, i0, i1, narrow ? 2.4 : 2.8);
    }

    if (crest && glowCtx) {
      const size = (narrow ? 88 : 112) + open * 28;
      ctx.globalAlpha = 0.22 + open * 0.28;
      ctx.drawImage(glow, crest[0] - size * 0.5, crest[1] - size * 0.5, size, size);
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function publish(open, orbit) {
    const phase = clamp01(open);
    const bucket = phase < 0.25 ? 0 : phase < 0.5 ? 1 : phase < 0.75 ? 2 : 3;
    const phaseKey = Math.round(phase * 40);
    if (bucket === publishedBucket && orbit === publishedOrbit && phaseKey === publishedPhase && lastMetrics) return;
    publishedBucket = bucket;
    publishedOrbit = orbit;
    publishedPhase = phaseKey;
    lastMetrics = { phase, orbit };
    canvas.dataset.renderer = ctx ? 'idle-loop' : 'fallback';
    canvas.dataset.orbit = String(orbit);
    if (metricsListener) metricsListener(lastMetrics);
  }

  function integrate(now) {
    const dt = last ? Math.min(0.032, Math.max(0, (now - last) / 1000)) : 0.016;
    last = now || 0;
    if (paused) {
      scrollSmooth = scroll;
      return;
    }
    time += dt;
    const follow = 1 - Math.exp(-dt * 6);
    pointerX += (targetX - pointerX) * follow;
    pointerY += (targetY - pointerY) * follow;
    scrollSmooth += (scroll - scrollSmooth) * (1 - Math.exp(-dt * 2.2));
  }

  function draw(now) {
    integrate(now);
    const open = clamp01(autoOpen(time) + scrollSmooth * 0.06);
    const camera = cameraFor(open);
    if (ctx) paint(open, camera);
    publish(open, camera.orbit);
    return lastMetrics;
  }

  function shouldRun() {
    return !paused && visible && !document.hidden;
  }

  function schedule() {
    if (frame || !shouldRun()) return;
    frame = requestAnimationFrame(onFrame);
  }

  function onFrame(now) {
    frame = 0;
    draw(now);
    if (shouldRun()) schedule();
  }

  function drawStill() {
    if (frame) return;
    frame = requestAnimationFrame(now => {
      frame = 0;
      draw(now);
      if (shouldRun()) schedule();
    });
  }

  window.LambdaSignal = {
    setPaused(value) {
      paused = Boolean(value);
      last = 0;
      if (paused) {
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        return draw(performance.now());
      }
      schedule();
      return lastMetrics || { phase: autoOpen(time), orbit: 0 };
    },
    setScroll(value) {
      scroll = clamp01(value);
      if (paused && visible && !document.hidden) drawStill();
      return lastMetrics || { phase: autoOpen(time), orbit: 0 };
    },
    onMetrics(fn) {
      metricsListener = fn;
      if (lastMetrics) fn(lastMetrics);
    }
  };

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      return;
    }
    if (visible) {
      last = 0;
      if (paused) drawStill();
      else schedule();
    }
  });

  if (!ctx) {
    visible = true;
    if (!paused) schedule();
    else draw(performance.now());
    return;
  }

  document.documentElement.classList.add('scene-ready');

  function resize() {
    const box = scene.getBoundingClientRect();
    width = Math.max(box.width, 1);
    height = Math.max(box.height, 1);
    const q = quality();
    if (!strands.length || strands.length !== q.strands || steps !== q.steps) makeGeometry();
    const ratio = Math.min(devicePixelRatio || 1, q.dpr);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (frame) return;
    if (paused || document.hidden || !visible) draw(performance.now());
    else schedule();
  }

  resize();
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(scene);
  else window.addEventListener('resize', resize, { passive: true });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (!visible) {
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        return;
      }
      last = 0;
      if (paused) drawStill();
      else schedule();
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
})();
