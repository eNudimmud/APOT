/* Secondary editions of the connected account signal. */
(() => {
  'use strict';
  const engine = window.ApotStudio;
  const preview = document.querySelector('#card-preview');
  if (!engine || !preview) return;
  const ctx = preview.getContext('2d');
  const find = selector => document.querySelector(selector);
  const listen = find('#listen-signal');
  const soundStatus = find('#sound-status');
  const cardButton = find('#export-card');
  const soundButton = find('#export-sound');
  const extras = find('#edition-tools');
  const palettes = [...document.querySelectorAll('[data-tone]')];
  let tone = 'midnight', current = null, audio = null, source = null;
  let audioEpoch = 0, busy = false, filmBusy = false;
  const idle = 'An original, composed motif. Sound starts when you choose.';
  const stage = () => window.ApotStage;
  const connected = () => Boolean(current && stage()?.current() === current && stage()?.account()?.expiresAt > Date.now());

  function syncControls() {
    const enabled = connected() && !busy && !filmBusy;
    palettes.forEach(button => {
      button.disabled = !enabled;
      button.setAttribute('aria-pressed', String(button.dataset.tone === tone));
    });
    cardButton.disabled = !enabled || !ctx;
    soundButton.disabled = !enabled;
    listen.disabled = !enabled || !(window.AudioContext || window.webkitAudioContext);
  }
  function stopSound(message = idle) {
    audioEpoch++;
    if (source) {
      source.onended = null;
      try { source.stop(); } catch (_) {}
      source.disconnect(); source = null;
    }
    listen.setAttribute('aria-pressed', 'false');
    listen.querySelector('span').textContent = 'Listen to your signal';
    soundStatus.textContent = message;
  }
  function render() {
    syncControls();
    if (!connected()) return;
    if (ctx && extras.open) engine.paintCard(ctx, current, preview.width, preview.height, tone);
    preview.setAttribute('aria-label', 'Edition of your fixed X signal ' + current.seed + ', ' + tone + ' palette.');
    if (listen.disabled && !busy) soundStatus.textContent = 'Audio playback is unavailable here. Download the WAV to listen.';
  }
  function apply(sig) {
    stopSound(sig ? idle : 'Connect with X to create your signal editions.');
    current = sig || null;
    if (!current) {
      ctx?.clearRect(0, 0, preview.width, preview.height);
      preview.setAttribute('aria-label', 'Connect with X to create a card from your fixed signal.');
      syncControls();
    } else render();
  }
  window.addEventListener('apot:signature', event => apply(event.detail));
  window.addEventListener('apot:film-busy', event => { filmBusy = Boolean(event.detail); if (filmBusy) stopSound(); syncControls(); });
  apply(stage()?.current());
  extras.addEventListener('toggle', () => { if (extras.open) render(); });
  palettes.forEach(button => button.addEventListener('click', () => {
    if (!connected() || busy || filmBusy) return;
    tone = button.dataset.tone; render();
    window.dispatchEvent(new CustomEvent('apot:edition-tone', { detail: tone }));
  }));
  if (document.fonts?.ready) document.fonts.ready.then(render);

  listen.addEventListener('click', async () => {
    if (!connected() || busy || filmBusy) return;
    if (source) { stopSound(); return; }
    const epoch = ++audioEpoch;
    busy = true; syncControls();
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      if (!audio) audio = new Audio();
      const [permit] = await Promise.all([stage().authorize(), audio.resume()]);
      if (!stage().isCurrent(permit) || epoch !== audioEpoch || document.hidden) return;
      const pcm = engine.samples(permit.signature, engine.sampleRate);
      const buffer = audio.createBuffer(1, pcm.length, engine.sampleRate);
      buffer.getChannelData(0).set(pcm);
      source = audio.createBufferSource(); source.buffer = buffer; source.connect(audio.destination);
      source.onended = () => stopSound('Your motif is complete. Listen again, or carry it with you.');
      source.start(); listen.setAttribute('aria-pressed', 'true');
      listen.querySelector('span').textContent = 'Stop sound';
      soundStatus.textContent = 'Playing your five-second motif. Fixed seed ' + permit.signature.seed + '.';
    } catch (_) {
      if (connected()) stopSound('Playback could not start. Download the WAV to listen.');
    } finally { busy = false; syncControls(); }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopSound(); });
  window.addEventListener('pagehide', () => { stopSound(); if (audio) { void audio.close(); audio = null; } });

  function save(blob, name) {
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = name; document.body.append(link); link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
  cardButton.addEventListener('click', async () => {
    if (!connected() || !ctx || busy || filmBusy) return;
    const palette = tone, label = cardButton.innerHTML;
    let card = null;
    busy = true; syncControls(); cardButton.textContent = 'Drawing your card…';
    try {
      const permit = await stage().authorize();
      if (!stage().isCurrent(permit)) return;
      if (document.fonts?.load) { await document.fonts.load('400 93px Space'); await document.fonts.load('600 27px Space'); }
      if (!stage().isCurrent(permit)) return;
      card = document.createElement('canvas'); card.width = 3840; card.height = 2160;
      const context = card.getContext('2d'); if (!context) throw new Error('Canvas unavailable');
      engine.paintCard(context, permit.signature, card.width, card.height, palette);
      const blob = await new Promise(resolve => card.toBlob(resolve, 'image/png'));
      if (!blob || !stage().isCurrent(permit)) return;
      save(blob, 'apot-' + permit.signature.seed + '-' + palette + '-3840x2160.png');
      soundStatus.textContent = 'Your card is ready. Reconnect with the same X account to recover your signal.';
    } catch (_) { if (connected()) soundStatus.textContent = 'The card could not be saved here. Try again.'; }
    finally { if (card) { card.width = 1; card.height = 1; } cardButton.innerHTML = label; busy = false; syncControls(); }
  });
  soundButton.addEventListener('click', async () => {
    if (!connected() || busy || filmBusy) return;
    busy = true; syncControls();
    try {
      const permit = await stage().authorize();
      if (!stage().isCurrent(permit)) return;
      const blob = new Blob([engine.wav(permit.signature)], { type: 'audio/wav' });
      if (!stage().isCurrent(permit)) return;
      save(blob, 'apot-' + permit.signature.seed + '-motif.wav');
      soundStatus.textContent = 'Your original motif is ready: WAV, five seconds, 44.1 kHz.';
    } catch (_) { if (connected()) soundStatus.textContent = 'The sound could not be saved here. Try again.'; }
    finally { busy = false; syncControls(); }
  });

  const dialog=document.querySelector('#study-dialog');
  if(dialog&&typeof dialog.showModal==='function'){
    let trigger=null;
    document.querySelectorAll('[data-study]').forEach(link=>link.addEventListener('click',event=>{
      if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      event.preventDefault();trigger=link;
      const article=link.closest('article'), photo=link.querySelector('img');
      const large=dialog.querySelector('#study-dialog-image');
      large.src=link.href;large.alt=photo.alt;
      large.width=Number(photo.getAttribute('width'));large.height=Number(photo.getAttribute('height'));
      dialog.querySelector('#study-dialog-title').textContent=article.querySelector('h3').textContent;
      dialog.querySelector('#study-dialog-index').textContent=article.querySelector('.eyebrow').textContent;
      dialog.querySelector('#study-dialog-description').textContent=article.querySelector('p:last-child').textContent;
      dialog.showModal();document.body.classList.add('modal-open');
    }));
    dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
    dialog.querySelector('#study-compose').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',event=>{
      if(event.target!==dialog)return;
      const rect=dialog.getBoundingClientRect();
      if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();
    });
    dialog.addEventListener('close',()=>{document.body.classList.remove('modal-open');trigger?.focus({preventScroll:true});});
  }
})();
