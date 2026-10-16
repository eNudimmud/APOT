(() => {
  const seed = document.body.dataset.seed, sig = window.ApotSignature.derive(seed), studio = window.ApotStudio;
  const c = document.querySelector('#share-card'), play = document.querySelector('#share-play');
  const draw = () => window.ApotShare.paint(c.getContext('2d'), sig, c.width, c.height);
  draw(); document.fonts?.ready.then(draw);
  let ctx = null, src = null;
  play.addEventListener('click', () => {
    if (src) { src.stop(); return; }
    const A = window.AudioContext || window.webkitAudioContext; if (!A) return;
    ctx = ctx || new A(); ctx.resume();
    const pcm = studio.samples(sig, studio.sampleRate), b = ctx.createBuffer(1, pcm.length, studio.sampleRate);
    b.getChannelData(0).set(pcm); src = ctx.createBufferSource(); src.buffer = b; src.connect(ctx.destination);
    src.onended = () => { src = null; play.textContent = 'Play the sound'; }; src.start(); play.textContent = 'Stop';
  });
})();
