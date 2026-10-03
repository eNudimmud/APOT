/* λP⊙T — signature stage, archive plates, and seed-drawn exports.
   The canvas is a view of the seed. It is not a screenshot, and not a recording. */
(() => {
  'use strict';
  const engine = window.ApotSignature;
  const canvas = document.querySelector('#signature-canvas');
  const stage = document.querySelector('.signature-stage');
  if (!engine || !canvas || !stage) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const small = matchMedia('(max-width: 760px)');
  const root = document.documentElement;
  const section = document.querySelector('#signature');
  const live = document.querySelector('#signature-live');
  const digits = document.querySelector('#lambda-digits');
  const seedValue = document.querySelector('#seed-value');
  const seedError = document.querySelector('#seed-error');
  const seedInput = document.querySelector('#seed-input');
  const restorePanel = document.querySelector('#restore-panel');
  const restoreToggle = document.querySelector('#restore-toggle');
  const generateButton = document.querySelector('#generate-signal');
  const exportPfp = document.querySelector('#export-pfp');
  const exportBanner = document.querySelector('#export-banner');
  const xConnect = document.querySelector('#x-connect');
  const xDisconnect = document.querySelector('#x-disconnect');
  const xAccount = document.querySelector('#x-account');
  const portraitNote = document.querySelector('#portrait-note');
  const portraitPreview = document.querySelector('#portrait-preview');
  const portraitWrap = document.querySelector('.portrait-preview');
  const opacityInput = document.querySelector('#portrait-opacity');
  const opacityValue = document.querySelector('#portrait-opacity-value');
  const share = document.querySelector('#share-signal');
  const seedCopy = document.querySelector('#seed-copy');
  const seedStatus = document.querySelector('#seed-copy-status');
  const algorithm = document.querySelector('#algorithm-body');
  const plates = [...document.querySelectorAll('.signal-plate')];

  let paused = root.dataset.motion === 'off' || reduced.matches;
  let visible = true;
  let frame = 0;
  let last = 0;
  let time = 0;
  let travel = 0;
  let revealFrom = 0;
  let current = null;
  let exporting = false;
  let portrait = null;
  let xUser = '';
  let boundId = '';
  let opacity = 0.45;
  const overlayCache = new Map();
  const PFP_SIZE = 1440;
  const PREVIEW_SIZE = 720;
  const check = engine.selfCheck();

  if (section) section.dataset.signatureCheck = check.ok ? 'pass' : 'fail';
  if (!check.ok) console.error('λP⊙T signature fixture failed', check.problems);

  function clamp01(n) {
    return Math.min(1, Math.max(0, n));
  }

  function formatMv(n) {
    if (n < 0) return '−' + Math.abs(n) + ' mV';
    return String(n) + ' mV';
  }

  function formatHz(n) {
    return n.toFixed(1) + ' Hz';
  }

  function mintSeed() {
    if (!globalThis.crypto || typeof crypto.getRandomValues !== 'function') return null;
    const bytes = new Uint8Array(4);
    crypto.getRandomValues(bytes);
    let hex = '';
    for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, '0');
    return hex.toUpperCase();
  }

  function recalled() {
    try { return engine.normalizeSeed(sessionStorage.getItem('apot-signal-seed')); }
    catch (_) { return null; }
  }

  function remember(seed) {
    try { sessionStorage.setItem('apot-signal-seed', seed); }
    catch (_) { /* private mode still shows the seed on the page */ }
  }

  function copyText(value) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(value);
    return new Promise((resolve, reject) => {
      const area = document.createElement('textarea');
      area.value = value;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.append(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      if (ok) resolve();
      else reject(new Error('copy failed'));
    });
  }

  function shareHref(sig) {
    const text = sig.lambdaId + '\n\nPotential, in motion.\nMade at λP⊙T.\n\nhttps://www.apot.world/?seed=' + sig.seed + '#signature';
    return 'https://x.com/intent/tweet?text=' + encodeURIComponent(text);
  }

  function periodFor(freq) {
    const span = (freq - 1) / 14;
    const base = small.matches ? 15000 : 12000;
    return base - span * 3000;
  }

  function currentReveal(now) {
    if (paused || !revealFrom) return 1;
    const t = Math.min(1, (now - revealFrom) / 1400);
    return 1 - Math.pow(1 - t, 3);
  }

  function sinceSpike(at, spikeT) {
    let delta = at - spikeT;
    if (delta < 0) delta += 1;
    return delta;
  }

  function fitCanvas(target, simplified) {
    const parent = target.parentElement;
    if (!parent) return null;
    const box = parent.getBoundingClientRect();
    if (box.width < 2 || box.height < 2) return null;
    const width = box.width;
    const height = box.height;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const pw = Math.round(width * ratio);
    const ph = Math.round(height * ratio);
    if (target.width !== pw || target.height !== ph) {
      target.width = pw;
      target.height = ph;
    }
    const ctx = target.getContext('2d');
    if (!ctx) return null;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    return { ctx, width, height };
  }

  function sceneBox(mode, width, height) {
    if (mode === 'banner') return { x: width * 0.3, y: height * 0.12, w: width * 0.4, h: height * 0.76 };
    if (mode === 'pfp') return { x: width * 0.07, y: height * 0.22, w: width * 0.86, h: height * 0.52 };
    const padX = width * (mode === 'plate' ? 0.07 : 0.05);
    const padY = height * 0.08;
    return { x: padX, y: padY, w: width - padX * 2, h: height - padY * 2 };
  }

  function strokesFor(mode, width, simplified) {
    if (mode === 'pfp') {
      return {
        wave: Math.max(1.25, width * 0.0015),
        spike: Math.max(2, width * 0.0028),
        edge: Math.max(0.7, width * 0.00075),
        node: Math.max(1.4, width * 0.0018)
      };
    }
    if (mode === 'banner') {
      return { wave: Math.max(1.5, width * 0.0013), spike: Math.max(2.6, width * 0.0028), edge: 1.15, node: 2.3 };
    }
    const scale = simplified ? 0.9 : 1;
    const plate = mode === 'plate' ? 1.15 : 1;
    return { wave: 1.35 * scale * plate, spike: 2.5 * scale * plate, edge: 0.75 * scale, node: (simplified ? 1.6 : 1.9) * plate };
  }

  function drawSvgPath(ctx, d) {
    const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+/g);
    if (!tokens) return;
    let i = 0;
    let cmd = '';
    let cx = 0;
    let cy = 0;
    let prev = null;
    const num = () => parseFloat(tokens[i++]);
    ctx.beginPath();
    while (i < tokens.length) {
      if (/[a-zA-Z]/.test(tokens[i])) cmd = tokens[i++];
      if (cmd === 'M' || cmd === 'm') {
        const x = num();
        const y = num();
        if (cmd === 'm') { cx += x; cy += y; } else { cx = x; cy = y; }
        ctx.moveTo(cx, cy);
        prev = null;
        cmd = cmd === 'm' ? 'l' : 'L';
      } else if (cmd === 'L' || cmd === 'l') {
        const x = num();
        const y = num();
        if (cmd === 'l') { cx += x; cy += y; } else { cx = x; cy = y; }
        ctx.lineTo(cx, cy);
        prev = null;
      } else if (cmd === 'H' || cmd === 'h') {
        const x = num();
        cx = cmd === 'h' ? cx + x : x;
        ctx.lineTo(cx, cy);
        prev = null;
      } else if (cmd === 'V' || cmd === 'v') {
        const y = num();
        cy = cmd === 'v' ? cy + y : y;
        ctx.lineTo(cx, cy);
        prev = null;
      } else if (cmd === 'C' || cmd === 'c') {
        let x1 = num(), y1 = num(), x2 = num(), y2 = num(), x = num(), y = num();
        if (cmd === 'c') { x1 += cx; y1 += cy; x2 += cx; y2 += cy; x += cx; y += cy; }
        ctx.bezierCurveTo(x1, y1, x2, y2, x, y);
        prev = { x: x2, y: y2 };
        cx = x;
        cy = y;
      } else if (cmd === 'S' || cmd === 's') {
        let x2 = num(), y2 = num(), x = num(), y = num();
        if (cmd === 's') { x2 += cx; y2 += cy; x += cx; y += cy; }
        const x1 = prev ? 2 * cx - prev.x : cx;
        const y1 = prev ? 2 * cy - prev.y : cy;
        ctx.bezierCurveTo(x1, y1, x2, y2, x, y);
        prev = { x: x2, y: y2 };
        cx = x;
        cy = y;
      } else break;
    }
  }

  function drawWordmark(ctx, x, y, w, color) {
    const s = w / 256;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 6;
    ctx.lineCap = 'square';
    ctx.lineJoin = 'round';
    drawSvgPath(ctx, 'M16 8h4c5 0 8 4 11 11l18 43M30 21 8 62M73 62V11h21c13 0 21 7 21 17s-8 17-21 17H73M207 11h43M228.5 11v51');
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(163, 36.5, 25.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(163, 36.5, 4.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawLambda(ctx, x, y, h, color) {
    const s = h / 64;
    ctx.save();
    ctx.translate(x - 8 * s, y - 4 * s);
    ctx.scale(s, s);
    ctx.strokeStyle = color;
    ctx.lineWidth = 6;
    ctx.lineCap = 'square';
    ctx.lineJoin = 'round';
    drawSvgPath(ctx, 'M16 8h4c5 0 8 4 11 11l18 43M30 21 8 62');
    ctx.stroke();
    ctx.restore();
    return 46 * s;
  }

  function setFont(ctx, size) {
    ctx.font = '400 ' + Math.round(size) + 'px Space, Arial, sans-serif';
  }

  function paintLabels(ctx, width, height, sig, mode) {
    const ivory = '#e7e2d4';
    const muted = '#9aa8b2';
    ctx.textBaseline = 'middle';
    if (mode === 'pfp') {
      ctx.save();
      ctx.shadowColor = 'rgba(7,18,29,0.5)';
      ctx.shadowBlur = Math.max(2, width * 0.005);
      drawWordmark(ctx, width * 0.07, height * 0.05, width * 0.15, ivory);
      const idSize = width * 0.04;
      const y = height * 0.905;
      let cursor = width * 0.07;
      const markW = drawLambda(ctx, cursor, y, idSize, ivory);
      cursor += markW + idSize * 0.1;
      setFont(ctx, idSize * 0.82);
      ctx.fillStyle = ivory;
      ctx.fillText('-' + sig.seed.slice(0, 4), cursor, y + idSize * 0.46);
      ctx.restore();
      return;
    }
    drawWordmark(ctx, width * 0.055, height * 0.13, Math.min(width * 0.15, 280), ivory);
    const idSize = height * 0.2;
    let cursor = width * 0.055;
    const markW = drawLambda(ctx, cursor, height * 0.36, idSize, ivory);
    cursor += markW + idSize * 0.08;
    setFont(ctx, idSize * 0.82);
    ctx.fillStyle = ivory;
    const digitsWidth = ctx.measureText('-' + sig.seed.slice(0, 4)).width;
    const room = width * 0.28 - cursor;
    const used = digitsWidth > room && room > 40 ? idSize * 0.82 * (room / digitsWidth) : idSize * 0.82;
    setFont(ctx, used);
    ctx.fillText('-' + sig.seed.slice(0, 4), cursor, height * 0.36 + idSize * 0.48);

    const right = width * 0.725;
    const maxW = width * 0.22;
    let headline = Math.round(height * 0.095);
    const lines = ['POTENTIAL,', 'IN MOTION.'];
    setFont(ctx, headline);
    while (headline > 16 && lines.some(line => ctx.measureText(line).width > maxW)) {
      headline -= 2;
      setFont(ctx, headline);
    }
    ctx.textBaseline = 'top';
    ctx.fillStyle = ivory;
    lines.forEach((line, i) => ctx.fillText(line, right, height * 0.3 + i * headline * 1.08));
    const microSize = Math.max(11, Math.round(height * 0.028));
    setFont(ctx, microSize);
    ctx.fillStyle = muted;
    const micro = ['COMPOSED SIGNAL.', 'NO NEURAL DATA.'];
    const microY = height * 0.3 + lines.length * headline * 1.08 + microSize;
    micro.forEach((line, i) => ctx.fillText(line, right, microY + i * microSize * 1.45));
  }

  function paint(ctx, width, height, sig, opt) {
    const mode = opt.mode;
    const simplified = Boolean(opt.simplified);
    ctx.clearRect(0, 0, width, height);
    ctx.globalAlpha = 1;
    if (mode === 'banner') {
      ctx.fillStyle = '#07121d';
      ctx.fillRect(0, 0, width, height);
      const radius = Math.max(width, height) * 0.42;
      const shade = ctx.createRadialGradient(width * 0.5, height * 0.52, 0, width * 0.5, height * 0.52, radius);
      shade.addColorStop(0, 'rgba(26,58,77,0.55)');
      shade.addColorStop(1, 'rgba(26,58,77,0)');
      ctx.fillStyle = shade;
      ctx.fillRect(0, 0, width, height);
    }

    const box = sceneBox(mode, width, height);
    const pen = strokesFor(mode, width, simplified);
    const rest = sig.resting;
    const peak = sig.peak;
    const baseline = box.y + box.h * 0.78;
    const hAmp = box.h * 0.58;
    const reveal = clamp01(opt.reveal);
    const since = sinceSpike(opt.travel, sig.spikeT);
    const propagating = since < 0.58;
    const maxDelay = sig.network.maxDelay || 1;
    const wave = sig.wave;
    const lastIndex = Math.max(1, Math.ceil((wave.length - 1) * Math.min(1, reveal * 1.18)));
    const points = new Array(wave.length);
    for (let i = 0; i < wave.length; i++) {
      const t = i / (wave.length - 1);
      points[i] = [
        box.x + t * box.w,
        baseline - ((wave[i] - rest) / (peak - rest)) * hAmp
      ];
    }
    const nodes = sig.network.nodes.map(node => {
      const top = box.y + 4;
      return {
        node,
        x: box.x + node.x * box.w,
        y: baseline - node.y * (baseline - top)
      };
    });
    const shown = nodes.map(({ node }) => {
      if (reveal >= 1) return 1;
      if (node.root) return clamp01((reveal - 0.18) / 0.2);
      const dist = node.delay === 99 ? 1 : node.delay / (maxDelay + 1);
      return clamp01((reveal - (0.3 + dist * 0.62)) / 0.16);
    });

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(231,226,212,0.28)';
    ctx.lineWidth = mode === 'pfp' ? 1.25 : 1;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(box.x, baseline);
    ctx.lineTo(box.x + box.w * Math.min(1, reveal * 1.18), baseline);
    ctx.stroke();

    sig.network.edges.forEach(edge => {
      const fade = Math.min(shown[edge.a], shown[edge.b]);
      if (fade <= 0) return;
      const ga = nodes[edge.a].node;
      const gb = nodes[edge.b].node;
      const glowA = propagating && ga.delay !== 99 ? pulse(since, ga.delay, maxDelay) : 0;
      const glowB = propagating && gb.delay !== 99 ? pulse(since, gb.delay, maxDelay) : 0;
      const glow = Math.max(glowA, glowB);
      const warm = edge.kind === 'root' || edge.kind === 'bridge' || glow > 0.15;
      let alpha = ((mode === 'pfp' ? 0.16 : 0.05) + edge.weight * (mode === 'pfp' ? 0.5 : 0.24)) * fade;
      if (edge.kind === 'root') alpha += 0.1 * fade;
      alpha += glow * 0.5;
      ctx.beginPath();
      ctx.moveTo(nodes[edge.a].x, nodes[edge.a].y);
      ctx.lineTo(nodes[edge.b].x, nodes[edge.b].y);
      ctx.strokeStyle = warm ? '#e0c68c' : 'rgba(186,206,214,0.95)';
      ctx.globalAlpha = Math.min(0.9, alpha);
      ctx.lineWidth = pen.edge * (edge.kind === 'root' ? 1.35 : 1);
      ctx.stroke();
    });

    nodes.forEach((point, index) => {
      const fade = shown[index];
      if (fade <= 0) return;
      const node = point.node;
      const glow = propagating && node.delay !== 99 ? pulse(since, node.delay, maxDelay) : 0;
      const breath = opt.still ? 1 : 1 + Math.sin(opt.time * 0.00045 + node.id) * 0.05;
      const radius = pen.node * (node.root ? 1.4 : 1) * (1 + glow * 0.55);
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = glow > 0.25 || node.root ? '#f0d696' : '#e7e2d4';
      ctx.globalAlpha = Math.min(1, (0.28 + node.basal * 0.5 + glow * 0.55) * fade * breath);
      ctx.fill();
      if (!simplified && glow > 0.45 && mode !== 'plate') {
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius + pen.node * 1.8, 0, Math.PI * 2);
        ctx.strokeStyle = '#f0d696';
        ctx.lineWidth = 1;
        ctx.globalAlpha = glow * 0.35 * fade;
        ctx.stroke();
      }
    });

    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = '#e7e2d4';
    ctx.lineWidth = pen.wave;
    strokeSpan(ctx, points, 0, lastIndex);
    const spike = spikeSpan(wave, rest, sig.amplitude);
    if (spike[1] > spike[0]) {
      const spikeEnd = Math.min(spike[1], lastIndex);
      if (spikeEnd > spike[0]) {
        ctx.strokeStyle = '#f0d696';
        ctx.lineWidth = pen.spike;
        ctx.globalAlpha = 0.95;
        strokeSpan(ctx, points, spike[0], spikeEnd);
      }
    }

    if (reveal > 0.96) {
      const f = opt.travel * (wave.length - 1);
      const i = Math.min(wave.length - 2, Math.floor(f));
      const u = f - i;
      const x = points[i][0] + (points[i + 1][0] - points[i][0]) * u;
      const y = points[i][1] + (points[i + 1][1] - points[i][1]) * u;
      if (!simplified && mode !== 'plate') {
        const radius = mode === 'pfp' ? pen.node * 6 : 16;
        const halo = ctx.createRadialGradient(x, y, 0, x, y, radius);
        halo.addColorStop(0, 'rgba(240,214,150,0.45)');
        halo.addColorStop(1, 'rgba(240,214,150,0)');
        ctx.fillStyle = halo;
        ctx.globalAlpha = 1;
        ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      }
      ctx.beginPath();
      ctx.arc(x, y, mode === 'pfp' ? pen.node * 1.3 : 2.4, 0, Math.PI * 2);
      ctx.fillStyle = '#fff4d4';
      ctx.globalAlpha = 0.95;
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    if (mode === 'pfp' || mode === 'banner') paintLabels(ctx, width, height, sig, mode);
  }

  function pulse(since, delay, maxDelay) {
    const arrive = (delay / (maxDelay + 1)) * 0.34;
    const delta = since - arrive;
    if (delta < 0 || delta > 0.18) return 0;
    return 1 - delta / 0.18;
  }

  function spikeSpan(wave, rest, amplitude) {
    const mark = rest + amplitude * 0.42;
    let start = -1;
    let end = 0;
    for (let i = 0; i < wave.length; i++) {
      if (wave[i] >= mark) {
        if (start < 0) start = i;
        end = i;
      }
    }
    if (start < 0) return [0, 0];
    return [Math.max(0, start - 1), end];
  }

  function strokeSpan(ctx, points, start, end) {
    ctx.beginPath();
    ctx.moveTo(points[start][0], points[start][1]);
    for (let i = start + 1; i <= end; i++) ctx.lineTo(points[i][0], points[i][1]);
    ctx.stroke();
  }

  function paintPlate(button) {
    const target = button.querySelector('canvas');
    const sig = engine.derive(button.dataset.seed);
    if (!target || !sig) return;
    const fitted = fitCanvas(target, true);
    if (!fitted) return;
    paint(fitted.ctx, fitted.width, fitted.height, sig, {
      mode: 'plate',
      reveal: 1,
      travel: sig.spikeT,
      time: 0,
      still: true,
      simplified: small.matches
    });
  }

  function markArchive(seed) {
    plates.forEach(button => {
      const on = button.dataset.seed === seed;
      button.classList.toggle('is-current', on);
      if (on) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
  }

  function fillAlgorithm(sig) {
    if (!algorithm) return;
    algorithm.replaceChildren();
    const rows = [
      ['Hash', 'SHA-256 of the seed, in this browser. ' + sig.hash],
      ['Parameters', 'Mulberry32 reads the first hash word, in order. Resting potential is an integer from −75 to −60 mV. Threshold is an integer from −55 to −35 mV. Spike amplitude is an integer from 80 to 120 mV. Frequency is a tenth from 1.0 to 15.0 Hz. These are graphic parameters, not a measurement.'],
      ['Waveform', 'A second stream sets rise, width, undershoot, and recovery. The curve rests, climbs to the threshold, spikes, falls, undershoots, and returns. The peak is the resting potential plus the amplitude. It is a drawn grammar, not a Hodgkin–Huxley solve.'],
      ['Network', 'Two further streams place clusters, nodes, and edges. Resting potential sets the basal level. Threshold sets how readily paths connect. Amplitude sets the strength of the dominant paths. Frequency sets how many nodes gather. The same seed rebuilds the same topology.'],
      ['This seed', sig.seed + ' · ' + sig.lambdaId + ' · ' + sig.network.clusters.length + ' clusters · ' + sig.network.nodes.length + ' nodes · ' + sig.network.edges.length + ' edges'],
      ['Fixture', check.ok ? 'Seed 7F2A91C4 matches this build.' : 'Seed 7F2A91C4 did not match this build.']
    ];
    rows.forEach(([title, text], index) => {
      const kicker = document.createElement('p');
      kicker.className = 'algo-kicker';
      if (index === 0) kicker.classList.add('is-first');
      kicker.textContent = title;
      const body = document.createElement('p');
      body.textContent = text;
      algorithm.append(kicker, body);
    });
  }

  function renderStage() {
    if (!current) return;
    if (!paused) {
      const period = periodFor(current.frequency);
      travel = (time % period) / period;
    }
    const fitted = fitCanvas(canvas, small.matches);
    if (!fitted) return;
    paint(fitted.ctx, fitted.width, fitted.height, current, {
      mode: 'stage',
      reveal: currentReveal(performance.now()),
      travel,
      time,
      still: paused,
      simplified: small.matches
    });
  }

  function schedule() {
    if (frame || paused || !visible || document.hidden) return;
    frame = requestAnimationFrame(onFrame);
  }

  function onFrame(now) {
    frame = 0;
    const dt = last ? Math.min(34, Math.max(0, now - last)) : 16;
    last = now;
    if (!paused) time += dt;
    renderStage();
    if (!paused && visible && !document.hidden) schedule();
  }

  function drawStill() {
    if (frame) return;
    frame = requestAnimationFrame(now => {
      frame = 0;
      last = now || 0;
      renderStage();
      if (!paused && visible && !document.hidden) schedule();
    });
  }

  function apply(sig, animate) {
    current = sig;
    remember(sig.seed);
    if (digits) digits.textContent = sig.seed.slice(0, 4);
    const fields = [
      ['#param-rest', formatMv(sig.resting)],
      ['#param-threshold', formatMv(sig.threshold)],
      ['#param-amplitude', formatMv(sig.amplitude)],
      ['#param-frequency', formatHz(sig.frequency)]
    ];
    fields.forEach(([selector, text]) => {
      const node = document.querySelector(selector);
      if (node) node.textContent = text;
    });
    if (seedValue) seedValue.textContent = sig.seed;
    if (share) {
      share.href = shareHref(sig);
      share.removeAttribute('aria-disabled');
      share.setAttribute('aria-label', 'Share ' + sig.lambdaId + ' on X. Opens a compose window. Nothing is posted for you.');
    }
    if (exportBanner) {
      exportBanner.disabled = false;
      exportBanner.setAttribute('aria-label', 'Download banner for ' + sig.lambdaId);
    }
    overlayCache.clear();
    syncPortraitControls();
    if (portrait) void refreshPreview();
    if (live) {
      const fromAccount = boundId && sig.seed === engine.seedForIdentity(boundId);
      const source = fromAccount ? ' Restored from this X account.' : ' Drawn in this browser. Not a recording.';
      live.textContent = sig.lambdaId + '. Resting ' + formatMv(sig.resting) + '. Threshold ' + formatMv(sig.threshold) + '. Amplitude ' + formatMv(sig.amplitude) + '. Frequency ' + formatHz(sig.frequency) + '.' + source;
    }
    markArchive(sig.seed);
    fillAlgorithm(sig);
    if (paused || !animate) {
      travel = sig.spikeT;
      revealFrom = 0;
    } else {
      revealFrom = performance.now();
    }
    renderStage();
    if (!paused && visible && !document.hidden) schedule();
    window.dispatchEvent(new CustomEvent('apot:signature', { detail: sig }));
  }

  let fontReady = null;
  function ensureFont() {
    if (fontReady) return fontReady;
    fontReady = (async () => {
      if (!document.fonts || !document.fonts.load) return;
      try {
        await document.fonts.load('400 64px Space');
        await document.fonts.load('600 64px Space');
      } catch (_) { /* Arial still draws the Latin text */ }
    })();
    return fontReady;
  }

  function loadBitmap(blob) {
    if (typeof createImageBitmap === 'function') return createImageBitmap(blob);
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('unreadable'));
      };
      img.src = url;
    });
  }

  function noteIdle() {
    return 'A profile image needs an X sign-in. Connect reads your avatar only. The signal is still drawn in this browser. Nothing is posted.';
  }

  function noteReady(username) {
    const label = current ? current.lambdaId : 'your signal';
    return 'Signed in as @' + username + '. This account restores ' + label + '. Your X avatar is the base. Nothing is posted.';
  }

  function drawCover(ctx, image, size) {
    const sw = image.width || image.naturalWidth;
    const sh = image.height || image.naturalHeight;
    const scale = Math.max(size / sw, size / sh);
    const dw = sw * scale;
    const dh = sh * scale;
    ctx.drawImage(image, (size - dw) / 2, (size - dh) / 2, dw, dh);
  }

  function paintVignette(ctx, size) {
    const shade = ctx.createRadialGradient(size * 0.5, size * 0.42, size * 0.22, size * 0.5, size * 0.5, size * 0.72);
    shade.addColorStop(0, 'rgba(7,18,29,0)');
    shade.addColorStop(0.62, 'rgba(7,18,29,0.05)');
    shade.addColorStop(1, 'rgba(7,18,29,0.4)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, size, size);
  }

  function softenOverlay(ctx, size) {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-in';
    const mask = ctx.createRadialGradient(size * 0.5, size * 0.48, size * 0.18, size * 0.5, size * 0.5, size * 0.78);
    mask.addColorStop(0, 'rgba(0,0,0,1)');
    mask.addColorStop(0.72, 'rgba(0,0,0,0.94)');
    mask.addColorStop(1, 'rgba(0,0,0,0.58)');
    ctx.fillStyle = mask;
    ctx.fillRect(0, 0, size, size);
    ctx.restore();
  }

  function overlayPlate(size) {
    const hit = overlayCache.get(size);
    if (hit && hit.seed === current.seed) return hit.canvas;
    const plate = document.createElement('canvas');
    plate.width = size;
    plate.height = size;
    const layer = plate.getContext('2d');
    paint(layer, size, size, current, {
      mode: 'pfp',
      reveal: 1,
      travel: current.spikeT,
      time: 0,
      still: true,
      simplified: false
    });
    softenOverlay(layer, size);
    overlayCache.set(size, { seed: current.seed, canvas: plate });
    return plate;
  }

  function paintComposite(ctx, size) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, size, size);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    drawCover(ctx, portrait, size);
    paintVignette(ctx, size);
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.drawImage(overlayPlate(size), 0, 0);
    ctx.restore();
  }

  function paintPreview() {
    if (!portraitPreview || !portraitWrap) return;
    if (!current || !portrait) {
      portraitWrap.hidden = true;
      return;
    }
    portraitWrap.hidden = false;
    if (portraitPreview.width !== PREVIEW_SIZE || portraitPreview.height !== PREVIEW_SIZE) {
      portraitPreview.width = PREVIEW_SIZE;
      portraitPreview.height = PREVIEW_SIZE;
    }
    const ctx = portraitPreview.getContext('2d');
    if (!ctx) return;
    paintComposite(ctx, PREVIEW_SIZE);
    portraitPreview.setAttribute('aria-label', 'Preview of @' + xUser + ' with ' + current.lambdaId + ' at ' + Math.round(opacity * 100) + ' percent opacity');
  }

  async function refreshPreview() {
    if (portrait) await ensureFont();
    overlayCache.clear();
    paintPreview();
  }

  function clearPortrait() {
    if (portrait && typeof portrait.close === 'function') portrait.close();
    portrait = null;
    xUser = '';
    if (xAccount) {
      xAccount.hidden = true;
      xAccount.textContent = '';
    }
    if (portraitWrap) portraitWrap.hidden = true;
    if (portraitNote) portraitNote.textContent = noteIdle();
    syncPortraitControls();
  }

  function syncPortraitControls() {
    const ready = Boolean(current && portrait && xUser);
    if (exportPfp) {
      exportPfp.disabled = !ready;
      exportPfp.setAttribute('aria-label', ready ? 'Download PFP for ' + current.lambdaId : 'Connect with X before downloading a PFP');
    }
    if (opacityInput) opacityInput.disabled = !portrait;
    if (xConnect) xConnect.hidden = Boolean(xUser);
    if (xDisconnect) xDisconnect.hidden = !xUser;
  }

  function setOpacity(value) {
    const next = Math.min(80, Math.max(15, Number(value)));
    opacity = (Number.isFinite(next) ? next : 45) / 100;
    if (opacityValue) opacityValue.textContent = Math.round(opacity * 100) + '%';
    if (portrait) paintPreview();
  }

  async function download(kind) {
    if (!current || exporting) return;
    if (kind === 'pfp' && !portrait) return;
    exporting = true;
    const button = kind === 'pfp' ? exportPfp : exportBanner;
    const previous = button ? button.textContent : '';
    if (button) {
      button.disabled = true;
      button.textContent = 'Drawing…';
    }
    await ensureFont();
    overlayCache.clear();
    const plate = kind === 'pfp' ? renderPfp(PFP_SIZE) : renderPlate('banner');
    const blob = plate ? await new Promise(resolve => plate.toBlob(resolve, 'image/png')) : null;
    if (blob) {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'apot-' + current.seed + '-' + kind + '.png';
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    }
    if (button) button.textContent = previous;
    syncPortraitControls();
    if (exportBanner && current) exportBanner.disabled = false;
    if (portrait) paintPreview();
    exporting = false;
  }

  function identitySeed() {
    return boundId ? engine.seedForIdentity(boundId) : null;
  }

  function bindIdentity(id) {
    if (typeof id !== 'string') return false;
    const seed = engine.seedForIdentity(id);
    const sig = seed && engine.derive(seed);
    if (!sig) return false;
    boundId = id.trim();
    apply(sig, true);
    return true;
  }

  function showUnbound() {
    const stored = recalled();
    const linked = engine.normalizeSeed(new URLSearchParams(window.location.search).get('seed'));
    const initial = linked || stored || mintSeed();
    if (initial) {
      const sig = engine.derive(initial);
      if (sig) apply(sig, !stored && !paused);
      return;
    }
    if (live) live.textContent = 'Enter an eight-character seed to restore a signal.';
    if (restorePanel) restorePanel.hidden = false;
    if (restoreToggle) restoreToggle.setAttribute('aria-expanded', 'true');
  }

  if (generateButton) {
    generateButton.addEventListener('click', () => {
      const seed = identitySeed() || mintSeed();
      if (!seed) {
        if (live) live.textContent = 'This browser could not mint a seed. Enter one to restore a signal.';
        if (restorePanel) restorePanel.hidden = false;
        if (restoreToggle) restoreToggle.setAttribute('aria-expanded', 'true');
        seedInput?.focus();
        return;
      }
      const sig = engine.derive(seed);
      if (sig) apply(sig, true);
    });
  }

  if (restoreToggle && restorePanel) {
    restoreToggle.addEventListener('click', () => {
      const willOpen = restorePanel.hidden;
      restorePanel.hidden = !willOpen;
      restoreToggle.setAttribute('aria-expanded', String(willOpen));
      if (willOpen) seedInput?.focus();
    });
  }

  if (restorePanel && seedInput) {
    restorePanel.addEventListener('submit', event => {
      event.preventDefault();
      const sig = engine.derive(seedInput.value);
      if (!sig) {
        if (seedError) seedError.hidden = false;
        seedInput.setAttribute('aria-invalid', 'true');
        seedInput.focus();
        return;
      }
      if (seedError) seedError.hidden = true;
      seedInput.removeAttribute('aria-invalid');
      apply(sig, true);
    });
  }

  if (seedCopy) {
    seedCopy.addEventListener('click', async () => {
      if (!current) return;
      try {
        await copyText(current.seed);
        seedCopy.textContent = 'Copied';
        if (seedStatus) seedStatus.textContent = 'Seed copied.';
        window.setTimeout(() => {
          seedCopy.textContent = 'Copy';
          if (seedStatus) seedStatus.textContent = '';
        }, 1600);
      } catch (_) {
        seedCopy.textContent = 'Select';
        if (seedStatus) seedStatus.textContent = 'Select the seed to copy it.';
      }
    });
  }

  if (exportPfp) exportPfp.addEventListener('click', () => { download('pfp'); });
  if (exportBanner) exportBanner.addEventListener('click', () => { download('banner'); });

  async function applyAvatar(username) {
    const response = await fetch('api/x/avatar', { credentials: 'same-origin' });
    if (!response.ok) throw new Error('avatar');
    const image = await loadBitmap(await response.blob());
    if (!image.width && !image.naturalWidth) throw new Error('empty');
    if (portrait && typeof portrait.close === 'function') portrait.close();
    portrait = image;
    xUser = username;
    if (xAccount) {
      xAccount.hidden = false;
      xAccount.textContent = '@' + username;
    }
    if (portraitNote) portraitNote.textContent = noteReady(username);
    syncPortraitControls();
    await refreshPreview();
  }

  async function loadXSession() {
    const flag = new URLSearchParams(location.search).get('x');
    let response;
    try {
      response = await fetch('api/x/session', { credentials: 'same-origin' });
    } catch (_) {
      if (portraitNote) portraitNote.textContent = 'Connect with X is available on the deployed site. The signal can still be generated in this browser. Nothing is posted.';
      return false;
    }
    if (response.status === 503) {
      if (portraitNote) portraitNote.textContent = 'X sign-in is not configured on this server yet. The signal can still be generated here. Nothing is posted.';
      return false;
    }
    if (!response.ok) {
      if (flag === 'denied' && portraitNote) portraitNote.textContent = 'X sign-in was cancelled. Nothing was connected.';
      else if (flag === 'error' && portraitNote) portraitNote.textContent = 'X sign-in did not finish. Try Connect with X again. Nothing was posted.';
      return false;
    }
    let data;
    try { data = await response.json(); }
    catch (_) { return false; }
    if (!data || !bindIdentity(data.id)) return false;
    if (!/^[A-Za-z0-9_]{1,15}$/.test(data.username || '')) return true;
    try {
      await applyAvatar(data.username);
    } catch (_) {
      clearPortrait();
      if (portraitNote) portraitNote.textContent = 'The X avatar could not be read. This account still restores ' + (current ? current.lambdaId : 'its signal') + '. Nothing was posted.';
    }
    return true;
  }

  if (xDisconnect) {
    xDisconnect.addEventListener('click', async () => {
      try { await fetch('api/x/logout', { method: 'POST', credentials: 'same-origin' }); }
      catch (_) { /* the portrait still leaves this page */ }
      boundId = '';
      clearPortrait();
    });
  }

  if (opacityInput) opacityInput.addEventListener('input', () => setOpacity(opacityInput.value));
  if (share) {
    share.addEventListener('click', event => {
      if (!current) event.preventDefault();
    });
  }

  plates.forEach((button, index) => {
    button.addEventListener('click', () => {
      const sig = engine.derive(button.dataset.seed);
      if (!sig) return;
      apply(sig, true);
      section?.scrollIntoView({ behavior: paused ? 'auto' : 'smooth', block: 'start' });
    });
    button.addEventListener('keydown', event => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.preventDefault();
      const next = (index + (event.key === 'ArrowRight' ? 1 : plates.length - 1)) % plates.length;
      plates[next].focus();
    });
  });

  function paintPlates() {
    plates.forEach(paintPlate);
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        paintPlate(entry.target);
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '240px' });
    plates.forEach(button => observer.observe(button));
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
    }).observe(stage);
  } else {
    paintPlates();
  }

  if ('ResizeObserver' in window) {
    new ResizeObserver(() => {
      if (paused || !visible || document.hidden) drawStill();
      else schedule();
      paintPlates();
    }).observe(stage);
  } else {
    window.addEventListener('resize', () => {
      drawStill();
      paintPlates();
    }, { passive: true });
  }

  small.addEventListener('change', () => {
    drawStill();
    paintPlates();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      return;
    }
    last = 0;
    if (visible) {
      if (paused) drawStill();
      else schedule();
    }
  });

  function renderPfp(size) {
    if (!current || !portrait) return null;
    const plate = document.createElement('canvas');
    plate.width = size;
    plate.height = size;
    const ctx = plate.getContext('2d');
    if (!ctx) return null;
    paintComposite(ctx, size);
    return plate;
  }

  function renderPlate(kind) {
    if (!current || kind !== 'banner') return null;
    const plate = document.createElement('canvas');
    plate.width = 3000;
    plate.height = 1000;
    const ctx = plate.getContext('2d');
    if (!ctx) return null;
    paint(ctx, plate.width, plate.height, current, {
      mode: 'banner',
      reveal: 1,
      travel: current.spikeT,
      time: 0,
      still: true,
      simplified: false
    });
    return plate;
  }

  window.ApotStage = {
    setPaused(value) {
      paused = Boolean(value);
      last = 0;
      if (paused) {
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        drawStill();
        return;
      }
      schedule();
    },
    current() {
      return current;
    }
  };

  loadXSession().then(bound => {
    const linked = engine.normalizeSeed(new URLSearchParams(window.location.search).get('seed'));
    if (linked) apply(engine.derive(linked), false);
    else if (!bound) showUnbound();
  }).catch(() => {
    if (!boundId) showUnbound();
  });
})();
