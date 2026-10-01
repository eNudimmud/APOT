/* λP⊙T — deterministic signal signature.
   One seed is the only source of truth.
   Graphic grammar of an excitable curve and a fine network.
   Not a physiological recording, and not a Hodgkin–Huxley solve. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ApotSignature = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const FIXTURE_SEED = '7F2A91C4';
  const ARCHIVE = ['7F2A91C4', '91BC4E18', 'A04E77D2', '31FF0C8A'];
const SAMPLES = 256;
/* Fixture 7F2A91C4 — λ-7F2A, resting −65 mV, threshold −46 mV,
   amplitude 90 mV, frequency 12.7 Hz, spikeT 0.3255,
   3 clusters, 28 nodes, 24 edges. Same bytes on every device. */
const FIXTURE = 'ac242dc53c887d8928bce5186dcf6935b6f7093e6ba67388d96b417bceb4b8f5';

  const K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ]);

  function rotr(x, n) {
    return ((x >>> n) | (x << (32 - n))) >>> 0;
  }

  function utf8(str) {
    const out = [];
    for (let i = 0; i < str.length; i++) {
      let c = str.charCodeAt(i);
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
      else if (c >= 0xd800 && c <= 0xdbff) {
        const c2 = str.charCodeAt(++i);
        const u = ((c - 0xd800) << 10) + (c2 - 0xdc00) + 0x10000;
        out.push(0xf0 | (u >> 18), 0x80 | ((u >> 12) & 63), 0x80 | ((u >> 6) & 63), 0x80 | (u & 63));
      } else out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    return out;
  }

  function sha256Hex(str) {
    const bytes = utf8(str);
    const bitLen = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    const hi = Math.floor(bitLen / 0x100000000);
    const lo = bitLen >>> 0;
    for (let i = 3; i >= 0; i--) bytes.push((hi >>> (i * 8)) & 255);
    for (let i = 3; i >= 0; i--) bytes.push((lo >>> (i * 8)) & 255);

    let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
    let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
    const w = new Uint32Array(64);

    for (let i = 0; i < bytes.length; i += 64) {
      for (let t = 0; t < 16; t++) {
        const j = i + t * 4;
        w[t] = ((bytes[j] << 24) | (bytes[j + 1] << 16) | (bytes[j + 2] << 8) | bytes[j + 3]) >>> 0;
      }
      for (let t = 16; t < 64; t++) {
        const s0 = rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
        const s1 = rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
        w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
      }
      let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
      for (let t = 0; t < 64; t++) {
        const s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const temp1 = (h + s1 + ch + K[t] + w[t]) >>> 0;
        const s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const temp2 = (s0 + maj) >>> 0;
        h = g; g = f; f = e;
        e = (d + temp1) >>> 0;
        d = c; c = b; b = a;
        a = (temp1 + temp2) >>> 0;
      }
      h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
      h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
    }
    return [h0, h1, h2, h3, h4, h5, h6, h7].map(word => word.toString(16).padStart(8, '0')).join('');
  }

  function hashWords(hex) {
    const words = [];
    for (let i = 0; i < 8; i++) words.push(parseInt(hex.slice(i * 8, i * 8 + 8), 16) >>> 0);
    return words;
  }

  /* Mulberry32. One stream per hash word so later features cannot shift earlier bytes. */
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function next() {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function q2(n) { return Math.round(n * 100) / 100; }
  function q4(n) { return Math.round(n * 10000) / 10000; }
  function clamp(n, a, b) { return Math.min(b, Math.max(a, n)); }
  function clamp01(n) { return clamp(n, 0, 1); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(t) {
    const u = clamp01(t);
    return u * u * (3 - 2 * u);
  }
  function ramp(t, a, b) {
    if (b <= a) return t >= b ? 1 : 0;
    return smooth((t - a) / (b - a));
  }

  function normalizeSeed(input) {
    const raw = String(input == null ? '' : input).toUpperCase().replace(/[^0-9A-F]/g, '');
    if (raw.length !== 8) return null;
    return raw;
  }

  function lambdaId(seed) {
    return 'λ-' + seed.slice(0, 4);
  }

  /* Numeric X user id only. The @handle can change, so it is not an input.
     First 8 hex characters of SHA-256("apot-x-user:" + id), then derive(). */
  const FIXTURE_X_ID = '1847291056384729103';
  const FIXTURE_X_SEED = '4A6445B3';
  const FIXTURE_X_LAMBDA = 'λ-4A64';
  const FIXTURE_X_FINGERPRINT = 'b02cabbcd5ab26899f23decdd654d17075041c3b14302846d588796a75b28b5d';

  function seedForIdentity(id) {
    const text = String(id == null ? '' : id).trim();
    if (!/^[0-9]{1,20}$/.test(text)) return null;
    return sha256Hex('apot-x-user:' + text).slice(0, 8).toUpperCase();
  }

  function sampleWave(params, modifiers) {
    const rest = params.resting;
    const threshold = params.threshold;
    const peak = q2(rest + params.amplitude);
    const under = q2(rest - params.amplitude * modifiers.undershoot);
    const freqT = (params.frequency - 1) / 14;
    const narrow = 1 - freqT * 0.45;
    let tRest = 0.16;
    let tThreshold = tRest + (0.075 + 0.07 * modifiers.rise) * (0.85 + 0.3 * (1 - freqT));
    let tPeak = tThreshold + modifiers.spikeWidth * narrow;
    let tHold = tPeak + modifiers.shoulder * 0.03 * narrow;
    let tFall = tHold + (0.055 + 0.035 * (1 - modifiers.shoulder)) * narrow;
    let tUnder = tFall + (0.04 + 0.028 * modifiers.recovery) * narrow;
    let tRecover = tUnder + (0.11 + 0.15 * modifiers.recovery) * (1.05 - 0.35 * freqT);
    const marks = [tRest, tThreshold, tPeak, tHold, tFall, tUnder, tRecover];
    if (marks[6] > 0.9) {
      const scale = 0.9 / marks[6];
      for (let i = 0; i < marks.length; i++) marks[i] *= scale;
    }
    tRest = marks[0];
    tThreshold = marks[1];
    tPeak = marks[2];
    tHold = marks[3];
    tFall = marks[4];
    tUnder = marks[5];
    tRecover = marks[6];

    const wave = new Array(SAMPLES);
    let peakI = 0;
    for (let i = 0; i < SAMPLES; i++) {
      const t = i / (SAMPLES - 1);
      let v;
      if (t <= tThreshold) v = lerp(rest, threshold, ramp(t, tRest, tThreshold));
      else if (t <= tPeak) v = lerp(threshold, peak, 1 - Math.pow(1 - ramp(t, tThreshold, tPeak), 3));
      else if (t <= tHold) v = peak;
      else if (t <= tFall) v = lerp(peak, rest, 1 - Math.pow(1 - ramp(t, tHold, tFall), 2));
      else if (t <= tUnder) v = lerp(rest, under, ramp(t, tFall, tUnder));
      else if (t <= tRecover) v = lerp(under, rest, ramp(t, tUnder, tRecover));
      else v = rest;
      v = q2(v);
      wave[i] = v;
      if (v > wave[peakI]) peakI = i;
    }
    wave[peakI] = peak;
    return {
      wave,
      spikeT: q4(peakI / (SAMPLES - 1)),
      peak,
      under: wave.reduce((min, v) => Math.min(min, v), wave[0])
    };
  }

  function buildNetwork(params, spikeT, nodeRng, edgeRng) {
    const freqT = (params.frequency - 1) / 14;
    const restT = (params.resting + 75) / 15;
    const ampT = (params.amplitude - 80) / 40;
    const ease = (-35 - params.threshold) / 20;
    const clusterCount = 3 + Math.floor(nodeRng() * 3);
    const centers = [];
    for (let c = 0; c < clusterCount; c++) {
      const span = clusterCount === 1 ? 0.5 : c / (clusterCount - 1);
      const fan = (span - 0.5) * (0.5 + nodeRng() * 0.18);
      centers.push({
        x: q4(clamp(spikeT + fan, 0.14, 0.86)),
        y: q4(clamp(0.3 + nodeRng() * 0.48, 0.22, 0.86)),
        spread: q4(0.075 + nodeRng() * 0.055)
      });
    }
    for (let c = 0; c < centers.length; c++) {
      for (let p = 0; p < c; p++) {
        const dx = centers[c].x - centers[p].x;
        const dy = centers[c].y - centers[p].y;
        if (dx * dx + dy * dy < 0.018) centers[c].x = q4(clamp(centers[c].x + 0.14, 0.14, 0.86));
      }
    }

    const count = 16 + Math.floor(nodeRng() * 5) + Math.floor(freqT * 12);
    const nodes = [];
    for (let i = 0; i < count; i++) {
      const cluster = Math.floor(nodeRng() * clusterCount);
      const jx = nodeRng() - 0.5;
      const jy = nodeRng() - 0.5;
      const pathway = nodeRng() < 0.3 + ease * 0.45 ? 1 : 0;
      const basal = q4(0.12 + restT * 0.55 + nodeRng() * 0.18);
      const center = centers[cluster];
      nodes.push({
        id: i,
        cluster,
        x: q4(clamp(center.x + jx * center.spread * 2, 0.05, 0.95)),
        y: q4(clamp(center.y + jy * center.spread * 2, 0.14, 0.94)),
        pathway,
        basal,
        root: 0,
        delay: 0
      });
    }
    nodes.push({
      id: count,
      cluster: 0,
      x: q4(clamp(spikeT, 0.05, 0.95)),
      y: 0.035,
      pathway: 1,
      basal: q4(0.28 + restT * 0.4),
      root: 1,
      delay: 0
    });

    const edgeMap = new Map();
    function addEdge(a, b, weight, kind) {
      if (a === b) return;
      const i = a < b ? a : b;
      const j = a < b ? b : a;
      const key = i + ':' + j;
      const next = q4(clamp(weight, 0.05, 1));
      const prev = edgeMap.get(key);
      if (!prev || next > prev.weight) edgeMap.set(key, { a: i, b: j, weight: next, kind: prev && prev.weight >= next ? prev.kind : kind });
    }

    const byCluster = Array.from({ length: clusterCount }, () => []);
    nodes.forEach(node => {
      if (!node.root) byCluster[node.cluster].push(node.id);
    });
    function dist2(a, b) {
      const dx = nodes[a].x - nodes[b].x;
      const dy = nodes[a].y - nodes[b].y;
      return dx * dx + dy * dy;
    }
    byCluster.forEach(ids => {
      ids.forEach(id => {
        const mates = ids.filter(other => other !== id);
        mates.sort((p, r) => dist2(id, p) - dist2(id, r) || p - r);
        if (mates.length) {
          const mate = nodes[mates[0]];
          const local = 0.22 + ampT * 0.28 + (nodes[id].pathway && mate.pathway ? 0.12 : 0);
          addEdge(id, mates[0], local, 'local');
        }
      });
    });

    const rootId = count;
    byCluster.forEach(ids => {
      if (!ids.length) return;
      ids.sort((p, r) => dist2(rootId, p) - dist2(rootId, r) || p - r);
      addEdge(rootId, ids[0], 0.55 + ampT * 0.4, 'root');
    });
    for (let c = 0; c < clusterCount; c++) {
      const left = byCluster[c];
      const right = byCluster[(c + 1) % clusterCount];
      if (!left.length || !right.length || left === right) continue;
      let bestA = left[0];
      let bestB = right[0];
      let best = Infinity;
      left.forEach(a => {
        right.forEach(b => {
          const d = dist2(a, b);
          if (d < best || (d === best && (a < bestA || (a === bestA && b < bestB)))) {
            best = d;
            bestA = a;
            bestB = b;
          }
        });
      });
      addEdge(bestA, bestB, 0.28 + ampT * 0.32, 'bridge');
    }

    const spanCount = Math.floor(edgeRng() * (1 + Math.round(ease * 3)));
    for (let s = 0; s < spanCount; s++) {
      const a = Math.floor(edgeRng() * nodes.length);
      let b = Math.floor(edgeRng() * nodes.length);
      if (a === b) b = (b + 1) % nodes.length;
      const dx = nodes[a].x - nodes[b].x;
      const dy = nodes[a].y - nodes[b].y;
      if (dx * dx + dy * dy > 0.2) continue;
      addEdge(a, b, 0.16 + ease * 0.22, 'span');
    }

    const edges = [...edgeMap.values()].sort((p, r) => p.a - r.a || p.b - r.b || (p.kind < r.kind ? -1 : p.kind > r.kind ? 1 : 0));
    const adj = nodes.map(() => []);
    edges.forEach(edge => {
      adj[edge.a].push(edge.b);
      adj[edge.b].push(edge.a);
    });
    adj.forEach(list => list.sort((a, b) => a - b));
    const delay = new Array(nodes.length).fill(99);
    delay[rootId] = 0;
    const queue = [rootId];
    for (let q = 0; q < queue.length; q++) {
      const id = queue[q];
      adj[id].forEach(next => {
        if (delay[next] <= delay[id] + 1) return;
        delay[next] = delay[id] + 1;
        queue.push(next);
      });
    }
    let maxDelay = 0;
    nodes.forEach(node => {
      node.delay = delay[node.id];
      if (node.delay !== 99 && node.delay > maxDelay) maxDelay = node.delay;
    });

    return {
      clusters: centers,
      nodes,
      edges,
      maxDelay,
      ampT: q4(ampT),
      restT: q4(restT),
      ease: q4(ease)
    };
  }

  function derive(input) {
    const seed = normalizeSeed(input);
    if (!seed) return null;
    const digest = sha256Hex(seed);
    const words = hashWords(digest);
    const paramsRng = mulberry32(words[0]);
    const shapeRng = mulberry32(words[1]);
    const nodeRng = mulberry32(words[2]);
    const edgeRng = mulberry32(words[3]);
    const params = {
      resting: -75 + Math.floor(paramsRng() * 16),
      threshold: -55 + Math.floor(paramsRng() * 21),
      amplitude: 80 + Math.floor(paramsRng() * 41),
      frequency: Math.round((1 + paramsRng() * 14) * 10) / 10
    };
    const modifiers = {
      rise: q4(0.35 + shapeRng() * 0.5),
      spikeWidth: q4(0.042 + shapeRng() * 0.05),
      undershoot: q4(0.08 + shapeRng() * 0.14),
      recovery: q4(0.12 + shapeRng() * 0.2),
      shoulder: q4(shapeRng())
    };
    const curve = sampleWave(params, modifiers);
    const network = buildNetwork(params, curve.spikeT, nodeRng, edgeRng);
    return {
      seed,
      lambdaId: lambdaId(seed),
      hash: digest,
      resting: params.resting,
      threshold: params.threshold,
      amplitude: params.amplitude,
      frequency: params.frequency,
      modifiers,
      wave: curve.wave,
      spikeT: curve.spikeT,
      peak: curve.peak,
      under: curve.under,
      network
    };
  }

  function canonical(sig) {
    const mods = [sig.modifiers.rise, sig.modifiers.spikeWidth, sig.modifiers.undershoot, sig.modifiers.recovery, sig.modifiers.shoulder];
    return [
      sig.seed,
      String(sig.resting),
      String(sig.threshold),
      String(sig.amplitude),
      sig.frequency.toFixed(1),
      mods.map(n => n.toFixed(4)).join(','),
      sig.spikeT.toFixed(4),
      sig.wave.map(v => v.toFixed(2)).join(','),
      String(sig.network.clusters.length),
      sig.network.nodes.map(n => [n.id, n.cluster, n.x.toFixed(4), n.y.toFixed(4), n.basal.toFixed(4), n.pathway, n.root, n.delay].join(':')).join(';'),
      sig.network.edges.map(e => [e.a, e.b, e.weight.toFixed(4), e.kind].join(':')).join(';')
    ].join('\n');
  }

  function fingerprint(sig) {
    return sha256Hex(canonical(sig));
  }

  function summary(sig) {
    if (!sig) return null;
    return {
      seed: sig.seed,
      lambdaId: sig.lambdaId,
      hash: sig.hash,
      resting: sig.resting,
      threshold: sig.threshold,
      amplitude: sig.amplitude,
      frequency: sig.frequency,
      spikeT: sig.spikeT,
      nodes: sig.network.nodes.length,
      edges: sig.network.edges.length,
      clusters: sig.network.clusters.length,
      fingerprint: fingerprint(sig)
    };
  }

  function selfCheck() {
    const problems = [];
    if (sha256Hex('') !== 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855') problems.push('sha256');
    const sig = derive(FIXTURE_SEED);
    const again = derive('  ' + FIXTURE_SEED.toLowerCase() + ' ');
    const prefixed = derive('λ-' + FIXTURE_SEED);
    if (!sig || !again || !prefixed) problems.push('derive');
    else {
      const fp = fingerprint(sig);
      if (sig.lambdaId !== 'λ-7F2A') problems.push('lambda');
      if (fp !== fingerprint(again) || fp !== fingerprint(prefixed)) problems.push('idempotent');
      if (FIXTURE && fp !== FIXTURE) problems.push('fixture');
      if (sig.resting < -75 || sig.resting > -60) problems.push('rest');
      if (sig.threshold < -55 || sig.threshold > -35) problems.push('threshold');
      if (sig.amplitude < 80 || sig.amplitude > 120) problems.push('amplitude');
      if (!(sig.threshold > sig.resting)) problems.push('order');
      if (sig.frequency < 1 || sig.frequency > 15) problems.push('frequency');
      if (Math.abs(sig.wave[0] - sig.resting) > 0.02) problems.push('rest-start');
      if (Math.abs(sig.wave[sig.wave.length - 1] - sig.resting) > 0.02) problems.push('rest-end');
      if (Math.abs(sig.peak - (sig.resting + sig.amplitude)) > 0.02) problems.push('peak');
      if (!(sig.under < sig.resting - 1)) problems.push('undershoot');
      const ids = new Set(sig.network.nodes.map(n => n.id));
      if (sig.network.edges.some(e => !ids.has(e.a) || !ids.has(e.b) || e.a === e.b)) problems.push('edge');
      if (sig.network.nodes.some(n => n.x < 0 || n.x > 1 || n.y < 0 || n.y > 1)) problems.push('bounds');
      if (!sig.network.nodes.some(n => n.root)) problems.push('root');
    }
    const seen = new Set();
    ARCHIVE.forEach(seed => {
      const item = derive(seed);
      if (!item || item.lambdaId !== 'λ-' + seed.slice(0, 4)) problems.push('archive-id');
      else {
        const fp = fingerprint(item);
        if (seen.has(fp)) problems.push('collide');
        seen.add(fp);
        if (fingerprint(derive(seed)) !== fp) problems.push('archive-replay');
      }
    });
    if (normalizeSeed('λ-7F2A') !== null) problems.push('short-id');
    if (normalizeSeed('7F2A91C4FF') !== null) problems.push('long-seed');
    const idSeed = seedForIdentity(FIXTURE_X_ID);
    const idAgain = seedForIdentity(' ' + FIXTURE_X_ID + ' ');
    if (!idSeed || idSeed !== idAgain || idSeed !== FIXTURE_X_SEED) problems.push('identity-seed');
    if (seedForIdentity('APOTsignal') !== null || seedForIdentity('') !== null) problems.push('identity-reject');
    if (idSeed) {
      const idSig = derive(idSeed);
      const idReplay = derive(seedForIdentity(FIXTURE_X_ID));
      if (!idSig || !idReplay || idSig.lambdaId !== FIXTURE_X_LAMBDA) problems.push('identity-lambda');
      else if (fingerprint(idSig) !== FIXTURE_X_FINGERPRINT || canonical(idSig) !== canonical(idReplay)) problems.push('identity-replay');
    }
    return { ok: problems.length === 0, problems, fingerprint: sig ? fingerprint(sig) : '', summary: summary(sig) };
  }

  return {
    FIXTURE_SEED,
    FIXTURE,
    ARCHIVE,
    SAMPLES,
    FIXTURE_X_ID,
    FIXTURE_X_SEED,
    FIXTURE_X_LAMBDA,
    FIXTURE_X_FINGERPRINT,
    normalizeSeed,
    lambdaId,
    seedForIdentity,
    sha256Hex,
    derive,
    canonical,
    fingerprint,
    summary,
    selfCheck
  };
});
