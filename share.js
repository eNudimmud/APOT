/* 06 / OPEN CIRCUIT — generate the connected account's signal card and share it on X. */
(() => {
  'use strict';
  const share = window.ApotShare, sign = window.ApotSignature, studio = window.ApotStudio;
  const box = document.querySelector('#first-signal');
  if (!share || !sign || !studio || !box) return;
  const $ = s => box.querySelector(s);
  const canvas = $('#signal-share-card'), ctx = canvas.getContext('2d');
  const make = $('#share-make'), xButton = $('#share-x'), dl = $('#share-download'), play = $('#share-play');
  const status = $('#share-status'), chips = [...box.querySelectorAll('[data-variant]')], textOut = $('#share-text');
  let sig = null, variant = 0, audio = null, src = null;
  const stage = () => window.ApotStage;
  const connected = () => Boolean(stage()?.current() && stage()?.account()?.expiresAt > Date.now());

  function sync() {
    const on = connected();
    make.textContent = on ? (sig ? 'Regenerate my card' : 'Generate my signal card') : 'Connect with X first';
    [dl, play].forEach(b => { b.disabled = !sig; }); xButton.setAttribute('aria-disabled', String(!sig));
    chips.forEach((c, i) => { c.disabled = !sig; c.setAttribute('aria-pressed', String(i === variant)); });
    if (sig) { textOut.textContent = share.texts(sig.seed)[variant]; xButton.href = share.intent(textOut.textContent); }
  }
  async function generate() {
    if (!connected()) { location.hash = 'signature'; return; }
    const permit = await stage().authorize();
    if (!stage().isCurrent(permit)) return;
    if (document.fonts?.load) await Promise.all([document.fonts.load('400 28px Space'), document.fonts.load('600 46px Space')]);
    sig = permit.signature; box.dataset.state = 'ready';
    share.paint(ctx, sig, canvas.width, canvas.height);
    status.textContent = 'Signal ' + sig.seed + ' is ready. Save the card, then share.';
    sync();
  }
  make.addEventListener('click', () => { generate().catch(() => { status.textContent = 'Your card could not be drawn. Try again.'; }); });
  chips.forEach((c, i) => c.addEventListener('click', () => { variant = i; sync(); }));
  dl.addEventListener('click', () => canvas.toBlob(b => {
    const u = URL.createObjectURL(b), a = document.createElement('a');
    a.href = u; a.download = 'apot-signal-' + sig.seed + '.png'; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 30000);
  }, 'image/png'));
  play.addEventListener('click', () => {
    if (src) { src.stop(); return; }
    const A = window.AudioContext || window.webkitAudioContext; if (!A || !sig) return;
    audio = audio || new A(); audio.resume();
    const pcm = studio.samples(sig, studio.sampleRate), buf = audio.createBuffer(1, pcm.length, studio.sampleRate);
    buf.getChannelData(0).set(pcm); src = audio.createBufferSource(); src.buffer = buf; src.connect(audio.destination);
    src.onended = () => { src = null; play.textContent = 'Play my sound'; }; src.start(); play.textContent = 'Stop';
  });
  window.addEventListener('apot:signature', () => { if (!connected()) { sig = null; box.dataset.state = 'idle'; ctx.clearRect(0, 0, canvas.width, canvas.height); } sync(); });
  sync();
})();
