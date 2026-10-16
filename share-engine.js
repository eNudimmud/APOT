/* λP⊙T — shareable signal card (1200 × 675) and X share texts.
   Same seed, same card, on the site and on the server. */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ApotShare = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';
  const W = 1200, H = 675;
  const C = { night: '#07121d', deep: '#0c1d33', cream: '#e7e2d4', gold: '#d0bd8c', muted: '#a9b6c0' };
  const studio = () => (typeof module === 'object' && module.exports) ? require('./studio-engine') : root.ApotStudio;
  const valid = seed => /^[0-9A-F]{8}$/.test(String(seed || ''));

  function url(seed) {
    if (!valid(seed)) throw new Error('A valid signal is required.');
    return 'https://www.apot.world/s/' + seed;
  }

  function texts(seed) {
    const link = url(seed), id = 'λ-' + seed.slice(0, 4);
    return [
      'I got my signal: ' + id + '.\nIt sounds like me on a good day.\nFind yours, then tag @APOTsignal\n\n' + link,
      'The alien says every human carries a signal.\nThis is mine. ' + seed + '. Press play. 👁\n@APOTsignal\n\n' + link,
      'Some people get a horoscope.\nI got a waveform and a five-second song.\nSignal ' + seed + ' · @APOTsignal\n\n' + link
    ];
  }

  function intent(text) {
    return 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text);
  }

  function paint(ctx, sig, width, height) {
    if (!sig || !valid(sig.seed)) throw new Error('A valid signal is required.');
    width = width || W; height = height || H;
    ctx.save(); ctx.setTransform(width / W, 0, 0, height / H, 0, 0);
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, C.night); bg.addColorStop(1, C.deep);
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = C.gold; ctx.globalAlpha = .35; ctx.lineWidth = 1.5; ctx.strokeRect(24, 24, W - 48, H - 48);
    ctx.globalAlpha = .07; ctx.strokeStyle = C.cream; ctx.lineWidth = 1;
    for (let x = 64; x < W - 40; x += 40) { ctx.beginPath(); ctx.moveTo(x, 150); ctx.lineTo(x, 500); ctx.stroke(); }
    for (let y = 150; y <= 500; y += 35) { ctx.beginPath(); ctx.moveTo(64, y); ctx.lineTo(W - 64, y); ctx.stroke(); }
    ctx.globalAlpha = 1;
    studio().wordmark(ctx, 64, 58, 120, C.cream);
    ctx.textAlign = 'right'; ctx.fillStyle = C.gold; ctx.font = '400 15px Space, Arial, sans-serif';
    ctx.fillText('FIRST SIGNAL / OPEN CIRCUIT', W - 64, 86);
    // Waveform: the account's own derived trace.
    const field = { x: 64, y: 165, w: W - 128, h: 320 };
    const min = Math.min.apply(null, sig.wave), max = Math.max.apply(null, sig.wave);
    const wy = v => field.y + (max - v) / Math.max(1, max - min) * field.h;
    const pts = sig.wave.map((v, i) => [field.x + i / (sig.wave.length - 1) * field.w, wy(v)]);
    const trace = () => { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); };
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = C.gold; ctx.globalAlpha = .18; ctx.lineWidth = 16; trace();
    ctx.globalAlpha = 1; ctx.lineWidth = 4; trace();
    ctx.setLineDash([4, 8]); ctx.globalAlpha = .4; ctx.lineWidth = 1; ctx.strokeStyle = C.cream;
    ctx.beginPath(); ctx.moveTo(field.x, wy(sig.threshold)); ctx.lineTo(field.x + field.w, wy(sig.threshold)); ctx.stroke();
    ctx.setLineDash([]); ctx.globalAlpha = 1;
    const sx = field.x + sig.spikeT * field.w, syp = wy(sig.peak);
    ctx.fillStyle = C.cream; ctx.beginPath(); ctx.arc(sx, syp, 7, 0, Math.PI * 2); ctx.fill();
    // Eight note marks, the same score as the sound.
    studio().score(sig).forEach((n, i) => {
      const x = field.x + (n.start / 5) * field.w;
      ctx.globalAlpha = .55; ctx.fillStyle = C.gold; ctx.fillRect(x - 1, 520, 2, 10 + (n.frequency % 18));
    });
    ctx.globalAlpha = 1; ctx.textAlign = 'left';
    ctx.fillStyle = C.gold; ctx.font = '400 15px Space, Arial, sans-serif'; ctx.fillText('SIGNAL ' + sig.seed.slice(0, 4), 64, 585);
    ctx.fillStyle = C.cream; ctx.font = '600 46px Space, Arial, sans-serif'; ctx.fillText(sig.seed, 64, 630);
    ctx.textAlign = 'right'; ctx.font = '400 28px Space, Arial, sans-serif'; ctx.fillText('apot.world', W - 64, 600);
    ctx.fillStyle = C.muted; ctx.font = '400 13px Space, Arial, sans-serif';
    ctx.fillText(sig.threshold + ' mV threshold · 5-second motif · no neural data', W - 64, 630);
    ctx.restore();
  }
  return Object.freeze({ paint, texts, intent, url, valid, width: W, height: H });
});
