/* /s/<SEED>: server-rendered meta so X shows the card; the page replays the same signal and sound. */
module.exports = function signalPage(req, res) {
  const seed = String(req.query?.id || '').toUpperCase();
  if (!/^[0-9A-F]{8}$/.test(seed)) { res.statusCode = 302; res.setHeader('Location', '/#community'); return res.end(); }
  const base = 'https://www.apot.world', img = base + '/s/' + seed + '.png', id = 'λ-' + seed.slice(0, 4);
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.end(`<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Signal ${seed} · λP⊙T</title>
<meta name="description" content="A composed signal and its five-second sound. Make yours at apot.world.">
<meta property="og:title" content="Signal ${id} · λP⊙T"><meta property="og:description" content="Press play. Then bring your own signal.">
<meta property="og:type" content="website"><meta property="og:url" content="${base}/s/${seed}">
<meta property="og:image" content="${img}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="675">
<meta property="og:image:alt" content="Signal ${seed}: a gold waveform on midnight blue, apot.world">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:site" content="@APOTsignal"><meta name="twitter:image" content="${img}">
<link rel="icon" href="/assets/lambda-mark.svg" type="image/svg+xml"><link rel="stylesheet" href="/styles.css?v=human-frame-2"><link rel="stylesheet" href="/share.css">
<script src="/signature-engine.js" defer></script><script src="/studio-engine.js" defer></script><script src="/share-engine.js" defer></script><script src="/share-page.js" defer></script>
</head><body class="share-page" data-seed="${seed}"><main class="section-pad">
<span class="eyebrow">FIRST SIGNAL / OPEN CIRCUIT</span><h1>Signal ${seed}</h1>
<canvas id="share-card" width="1200" height="675" role="img" aria-label="Signal ${seed}"></canvas>
<div class="share-actions"><button class="solid-button" id="share-play" type="button">Play the sound</button><a class="text-link" href="/#community">Bring your own signal →</a></div>
<p class="studio-note">Generated artwork and sound. No neural data.</p></main></body></html>`);
};
