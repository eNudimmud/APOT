/* One fixed signature per verified X account. No visitor or URL seed generator. */
(() => {
  'use strict';
  const engine = window.ApotSignature;
  const renderer = window.ApotProfile;
  const section = document.querySelector('#signature');
  const preview = document.querySelector('#profile-preview');
  if (!engine || !renderer || !section || !preview) return;
  const find = selector => document.querySelector(selector);
  const status = find('#account-status');
  const locked = find('#profile-locked');
  const ready = find('#profile-ready');
  const controls = find('#account-controls');
  const extras = find('#edition-tools');
  const connect = find('#x-connect');
  const disconnect = find('#x-disconnect');
  const retry = find('#x-retry');
  const accountLabel = find('#x-account');
  const digits = find('#lambda-digits');
  const live = find('#signature-live');
  const note = find('#portrait-note');
  const opacityInput = find('#portrait-opacity');
  const opacityValue = find('#portrait-opacity-value');
  const overlayControls = find('#overlay-controls');
  const buttons = { pfp: find('#export-pfp'), banner: find('#export-banner') };
  const exportStatus = find('#profile-export-status');
  const seedValue = find('#seed-value');
  const seedCopy = find('#seed-copy');
  const seedStatus = find('#seed-copy-status');
  const tabs = [...document.querySelectorAll('[data-profile-mode]')];
  let account = null, current = null, portrait = null;
  let revision = 0, sessionRequest = 0, expiration = 0, fontReady = null;
  let mode = 'pfp', opacity = 0.45, exporting = false, state = 'loading';
  const check = engine.selfCheck();
  section.dataset.signatureCheck = check.ok ? 'pass' : 'fail';
  if (!check.ok) return;

  function makeCanvas(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    return canvas;
  }
  function publish() {
    window.dispatchEvent(new CustomEvent('apot:signature', { detail: current }));
  }
  function setState(next, message) {
    state = next;
    section.dataset.accountState = next;
    status.textContent = message;
    connect.hidden = next === 'ready';
    connect.setAttribute('aria-disabled', String(next === 'loading' || next === 'unavailable' || next === 'disconnecting'));
    connect.textContent = next === 'unavailable' ? 'X sign-in unavailable' : 'Connect with X';
    disconnect.hidden = next !== 'ready';
    retry.hidden = !['error', 'unavailable'].includes(next);
    ready.hidden = next !== 'ready';
    controls.hidden = next !== 'ready';
    extras.hidden = next !== 'ready';
    locked.hidden = next === 'ready';
    seedCopy.disabled = next !== 'ready';
    syncControls();
  }
  function disposePortrait() {
    if (portrait && typeof portrait.close === 'function') portrait.close();
    portrait = null;
  }
  function clear(next = 'signedout', message = 'Connect with X to create your fixed signal.') {
    revision++; sessionRequest++;
    window.clearTimeout(expiration);
    account = null; current = null;
    disposePortrait();
    preview.getContext('2d')?.clearRect(0, 0, preview.width, preview.height);
    preview.setAttribute('aria-label', 'Connect with X to preview your signal.');
    accountLabel.textContent = ''; digits.textContent = '————'; seedValue.textContent = '········';
    note.textContent = 'Your X avatar and your fixed signal form the PFP.';
    exportStatus.textContent = ''; live.textContent = message;
    for (const selector of ['#param-rest', '#param-threshold', '#param-amplitude', '#param-frequency']) find(selector).textContent = '—';
    setState(next, message); publish();
  }
  function validSession(data) {
    return data?.connected === true && data.binding === 'x-id-v1' &&
      typeof data.id === 'string' && /^[0-9]{1,20}$/.test(data.id) &&
      /^[A-Za-z0-9_]{1,15}$/.test(data.username || '') &&
      data.seed === engine.seedForIdentity(data.id) &&
      Number.isFinite(data.expiresAt) && data.expiresAt > Date.now();
  }
  function armExpiration() {
    window.clearTimeout(expiration);
    expiration = window.setTimeout(() => clear('signedout', 'Your X session expired. Reconnect to recover the same signal.'), Math.max(1, account.expiresAt - Date.now()));
  }
  function syncControls() {
    const connected = Boolean(account && current && state === 'ready' && account.expiresAt > Date.now());
    buttons.banner.disabled = !connected || exporting;
    buttons.pfp.disabled = !connected || !portrait || exporting;
    opacityInput.disabled = !connected || !portrait;
    overlayControls.hidden = mode !== 'pfp';
    tabs.forEach(button => {
      const selected = button.dataset.profileMode === mode;
      button.disabled = !connected;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
  }
  function renderPreview() {
    if (!current || !account) return;
    syncControls();
    find('#profile-panel').setAttribute('aria-labelledby', mode === 'pfp' ? 'profile-tab-pfp' : 'profile-tab-banner');
    const ctx = preview.getContext('2d');
    if (!ctx) { exportStatus.textContent = 'Profile drawing is unavailable in this browser.'; return; }
    if (mode === 'pfp') {
      preview.width = 720; preview.height = 720;
      preview.classList.remove('is-banner');
      if (portrait) renderer.paintPfp(ctx, current, portrait, 720, opacity, makeCanvas);
      else {
        ctx.fillStyle = '#07121d'; ctx.fillRect(0, 0, 720, 720);
        ctx.fillStyle = '#e7e2d4'; ctx.font = '400 28px Space, Arial, sans-serif';
        ctx.textAlign = 'center'; ctx.fillText('Loading your X avatar…', 360, 360);
      }
    } else {
      preview.width = 1500; preview.height = 500;
      preview.classList.add('is-banner');
      renderer.paintBanner(ctx, current, 1500, 500);
    }
    preview.setAttribute('aria-label', (mode === 'pfp' ? 'PFP' : 'Banner') + ' for @' + account.username + ', fixed signal ' + current.lambdaId + '.');
  }
  async function ensureFonts() {
    if (!fontReady) fontReady = (async () => {
      try { await document.fonts?.load('400 64px Space'); await document.fonts?.load('600 64px Space'); } catch (_) {}
    })();
    return fontReady;
  }
  async function loadBitmap(blob) {
    if (typeof createImageBitmap === 'function') return createImageBitmap(blob);
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob), image = new Image();
      image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
      image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('avatar')); };
      image.src = url;
    });
  }
  async function loadAvatar(expectedRevision) {
    try {
      const response = await fetch('api/x/avatar', { credentials: 'same-origin', cache: 'no-store' });
      if (expectedRevision !== revision) return;
      if (response.status === 401) { clear(); return; }
      if (!response.ok) throw new Error('avatar');
      if (response.headers.get('X-APOT-Account') !== account.id) { clear('loading', 'Checking your X session…'); void loadSession(); return; }
      const bitmap = await loadBitmap(await response.blob());
      if (expectedRevision !== revision) { bitmap.close?.(); return; }
      if (!(bitmap.width || bitmap.naturalWidth)) { bitmap.close?.(); throw new Error('avatar'); }
      disposePortrait(); portrait = bitmap;
      await ensureFonts();
      if (expectedRevision !== revision) return;
      note.textContent = 'Your X avatar with your fixed signal. Adjust the overlay to keep it readable.';
      renderPreview();
    } catch (_) {
      if (expectedRevision !== revision) return;
      note.textContent = 'Your X avatar could not be loaded. Reconnect to try again. Your fixed banner is available.';
      mode = 'banner'; renderPreview();
    }
  }
  function commitSession(data) {
    const changed = account?.id !== data.id || !current;
    const renewed = account?.expiresAt !== data.expiresAt;
    if (changed) {
      revision++; disposePortrait();
      current = engine.derive(data.seed);
      mode = 'pfp';
    }
    account = { id: data.id, username: data.username, expiresAt: data.expiresAt };
    accountLabel.textContent = '@' + account.username;
    digits.textContent = current.seed.slice(0, 4); seedValue.textContent = current.seed;
    const mv = value => (value < 0 ? '−' + Math.abs(value) : value) + ' mV';
    for (const [selector, text] of [['#param-rest', mv(current.resting)], ['#param-threshold', mv(current.threshold)], ['#param-amplitude', mv(current.amplitude)], ['#param-frequency', current.frequency.toFixed(1) + ' Hz']]) find(selector).textContent = text;
    live.textContent = 'Connected as @' + account.username + '. ' + current.lambdaId + ' is fixed to this X account.';
    setState('ready', 'One account. One fixed signal.'); armExpiration(); renderPreview();
    if (changed) publish();
    if (changed || renewed || !portrait) void loadAvatar(revision);
  }
  function failure(response) {
    if (response.status === 401) clear();
    else if (response.status === 503) clear('unavailable', 'X sign-in is unavailable on this server. Profile generation requires an X session.');
    else clear('error', 'Your X session could not be checked. Retry before creating your profile images.');
  }
  async function loadSession() {
    const request = ++sessionRequest;
    if (!account) setState('loading', 'Checking your X session…');
    try {
      const response = await fetch('api/x/session', { credentials: 'same-origin', cache: 'no-store' });
      if (request !== sessionRequest) return;
      if (!response.ok) {
        failure(response);
        const flag = new URLSearchParams(window.location.search).get('x');
        if (response.status === 401 && flag === 'denied') status.textContent = 'X sign-in was cancelled. Connect when you are ready.';
        else if (response.status === 401 && flag === 'error') status.textContent = 'X sign-in did not finish. Try connecting again.';
        return;
      }
      const data = await response.json();
      if (request !== sessionRequest) return;
      if (!validSession(data)) { clear('error', 'Your X session could not be verified. Reconnect to recover your fixed signal.'); return; }
      commitSession(data);
    } catch (_) {
      if (request === sessionRequest) clear('error', 'Your X session could not be checked. Retry to connect.');
    }
  }
  async function authorize() {
    if (!account || !current || state !== 'ready') return null;
    const expectedRevision = revision, expectedId = account.id;
    try {
      const response = await fetch('api/x/session', { credentials: 'same-origin', cache: 'no-store' });
      if (expectedRevision !== revision) return null;
      if (!response.ok) { failure(response); return null; }
      const data = await response.json();
      if (expectedRevision !== revision) return null;
      if (!validSession(data)) { clear('error', 'Reconnect with X to verify your signal.'); return null; }
      if (data.id !== expectedId) { commitSession(data); return null; }
      account = { id: data.id, username: data.username, expiresAt: data.expiresAt };
      accountLabel.textContent = '@' + account.username;
      armExpiration();
      return { revision, id: account.id, signature: current };
    } catch (_) {
      if (expectedRevision === revision) clear('error', 'Your X session could not be verified. Retry before downloading.');
      return null;
    }
  }
  function isCurrent(permit) {
    return Boolean(permit && account && current && permit.revision === revision && permit.id === account.id && permit.signature === current && state === 'ready' && account.expiresAt > Date.now());
  }
  async function download(kind) {
    if (exporting || (kind === 'pfp' && !portrait)) return;
    exporting = true; syncControls();
    let permit = null;
    try {
      permit = await authorize();
      if (!isCurrent(permit) || (kind === 'pfp' && !portrait)) return;
      exportStatus.textContent = 'Drawing your ' + (kind === 'pfp' ? 'PFP' : 'banner') + '…';
      await ensureFonts();
      if (!isCurrent(permit)) return;
      const canvas = kind === 'pfp' ? makeCanvas(1440, 1440) : makeCanvas(3000, 1000);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('canvas');
      if (kind === 'pfp') renderer.paintPfp(ctx, permit.signature, portrait, 1440, opacity, makeCanvas);
      else renderer.paintBanner(ctx, permit.signature, 3000, 1000);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob || !isCurrent(permit)) return;
      const url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = 'apot-' + permit.signature.seed + '-' + kind + '.png';
      document.body.append(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 30000);
      exportStatus.textContent = 'Your ' + (kind === 'pfp' ? 'PFP' : 'banner') + ' is ready. The signal stays fixed to your X account.';
    } catch (_) { if (isCurrent(permit)) exportStatus.textContent = 'The image could not be saved. Try again.'; }
    finally { exporting = false; syncControls(); }
  }
  connect.addEventListener('click', event => { if (connect.getAttribute('aria-disabled') === 'true') event.preventDefault(); });
  retry.addEventListener('click', () => { void loadSession(); });
  disconnect.addEventListener('click', async () => {
    clear('disconnecting', 'Disconnecting from X…');
    try {
      const response = await fetch('api/x/logout', { method: 'POST', credentials: 'same-origin', cache: 'no-store' });
      if (!response.ok) throw new Error('logout');
      clear();
    } catch (_) {
      clear('error', 'The server could not end your X session. Retry Disconnect to finish.');
      disconnect.hidden = false;
    }
  });
  tabs.forEach((button, index) => {
    button.addEventListener('click', () => { if (!account) return; mode = button.dataset.profileMode; renderPreview(); });
    button.addEventListener('keydown', event => {
      if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key) || !account) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
      mode = tabs[next].dataset.profileMode; renderPreview(); tabs[next].focus();
    });
  });
  opacityInput.addEventListener('input', () => {
    opacity = Math.max(15, Math.min(80, Number(opacityInput.value) || 45)) / 100;
    opacityValue.textContent = Math.round(opacity * 100) + '%'; renderPreview();
  });
  buttons.pfp.addEventListener('click', () => { void download('pfp'); });
  buttons.banner.addEventListener('click', () => { void download('banner'); });
  seedCopy.addEventListener('click', async () => {
    if (!account || !current) return;
    try { await navigator.clipboard.writeText(current.seed); seedStatus.textContent = 'Your fixed seed was copied.'; }
    catch (_) { seedStatus.textContent = 'Select the seed to copy it.'; }
  });
  window.addEventListener('pageshow', event => { if (event.persisted) { clear('loading', 'Checking your X session…'); void loadSession(); } });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && state !== 'disconnecting') void loadSession(); });
  window.ApotStage = Object.freeze({ current: () => current, account: () => account, authorize, isCurrent });
  clear('loading', 'Checking your X session…');
  void loadSession();
})();
