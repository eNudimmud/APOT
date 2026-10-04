/* Account profile artwork. The controller supplies the verified X signature. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ApotProfile = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const exportSizes = Object.freeze({
    pfp: Object.freeze({ width: 4096, height: 4096 }),
    banner: Object.freeze({ width: 6000, height: 2000 })
  });
  // Draw the same composition in native pixels at every output size.
  const pfpSpace = 720;
  const bannerSpace = { width: 1500, height: 500 };
  function clamp01(n) {
    return Math.min(1, Math.max(0, n));
  }

  function sinceSpike(at, spikeT) {
    return at >= spikeT ? at - spikeT : at + 1 - spikeT;
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


  function paintPfp(ctx, sig, portrait, size, opacity, makeCanvas) {
    if (!ctx || !sig || !portrait || typeof makeCanvas !== 'function') throw new Error('A connected profile and drawing surface are required.');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, size, size);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    drawCover(ctx, portrait, size);
    paintVignette(ctx, size);
    const overlay = makeCanvas(size, size);
    try {
      const layer = overlay.getContext('2d');
      if (!layer) throw new Error('The profile overlay could not be drawn.');
      layer.setTransform(size / pfpSpace, 0, 0, size / pfpSpace, 0, 0);
      paint(layer, pfpSpace, pfpSpace, sig, { mode: 'pfp', reveal: 1, travel: sig.spikeT, time: 0, still: true, simplified: false });
      layer.setTransform(1, 0, 0, 1, 0, 0);
      softenOverlay(layer, size);
      ctx.save();
      ctx.globalAlpha = Math.max(0.15, Math.min(0.8, opacity));
      ctx.drawImage(overlay, 0, 0);
      ctx.restore();
    } finally {
      // Release the temporary full-resolution layer immediately on mobile too.
      overlay.width = 0; overlay.height = 0;
    }
  }

  function paintBanner(ctx, sig, width, height) {
    if (!ctx || !sig) throw new Error('A connected signature and drawing surface are required.');
    ctx.save();
    try {
      ctx.setTransform(width / bannerSpace.width, 0, 0, height / bannerSpace.height, 0, 0);
      paint(ctx, bannerSpace.width, bannerSpace.height, sig, { mode: 'banner', reveal: 1, travel: sig.spikeT, time: 0, still: true, simplified: false });
    } finally { ctx.restore(); }
  }

  return Object.freeze({ paintPfp, paintBanner, exportSizes });
});
