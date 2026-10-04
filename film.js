/* A personal MP4 with its own audio, handed to the user's share sheet. */
(() => {
  'use strict';
  const find = selector => document.querySelector(selector);
  const create = find('#create-film'), player = find('#film-preview');
  if (!create || !player) return;
  const share = find('#share-card'), download = find('#download-film');
  const status = find('#film-status'), actions = find('#film-actions');
  const draft = find('#film-x-draft'), card = find('#card-preview');
  const stage = () => window.ApotStage;
  let tone = 'midnight', ready = null, request = null, busy = false, epoch = 0, shareTicket = null;
  const connected = () => Boolean(stage()?.current() && stage()?.account()?.expiresAt > Date.now());
  const valid = () => Boolean(ready && stage()?.isCurrent(ready.permit));
  const idle = () => connected() ? 'Your fixed signal and its own sound, together in one video.' : 'Connect with X to create your personal signal video.';
  function controls() {
    create.disabled = !connected() || busy;
    share.disabled = !valid() || busy;
    share.setAttribute('aria-disabled', String(share.disabled));
    download.disabled = !valid() || busy;
    actions.hidden = !valid();
  }
  function setBusy(value) {
    busy = value; controls();
    window.dispatchEvent(new CustomEvent('apot:film-busy', { detail: value }));
  }
  function clear() {
    epoch++; request?.abort(); request = null; shareTicket = null;
    player.pause(); player.removeAttribute('src'); player.load(); player.hidden = true; card.hidden = false;
    if (ready) URL.revokeObjectURL(ready.url);
    ready = null; draft.hidden = true; share.textContent = 'Share video';
    status.textContent = idle(); controls();
  }
  function caption() {
    return 'This is my signal. Turn sound on.\n\n' + ready.seed + ' · Made at λP⊙T\nYour account. Your signal. Your sound.\n\nhttps://www.apot.world/#signature';
  }
  function save() {
    const link = document.createElement('a'); link.href = ready.url; link.download = ready.file.name;
    document.body.append(link); link.click(); link.remove();
  }
  function fallback() {
    save();
    draft.href = 'https://x.com/intent/tweet?text=' + encodeURIComponent(caption());
    draft.hidden = false;
    status.textContent = 'MP4 downloaded with sound. Open the X draft and attach this video.';
  }
  async function handoff() {
    if (!valid()) { clear(); return; }
    const payload = { files: [ready.file], text: caption() };
    if (!navigator.share || !navigator.canShare?.({ files: payload.files })) { fallback(); return; }
    shareTicket = null; share.textContent = 'Share video';
    try {
      await navigator.share(payload);
      if (valid()) status.textContent = 'Video sent to the share menu. Review your post in X.';
    } catch (error) {
      if (!valid()) return;
      if (error?.name === 'AbortError') status.textContent = 'Sharing cancelled. Your video is still ready.';
      else if (error?.name === 'NotAllowedError') {
        shareTicket = { permit: ready.permit, until: Date.now() + 10000 };
        share.textContent = 'Choose X'; status.textContent = 'Your video is ready. Tap Choose X to open the share menu.';
      } else fallback();
    }
  }
  create.addEventListener('click', async () => {
    if (!connected() || busy) return;
    clear();
    const operation = epoch, palette = tone;
    const controller = new AbortController(); request = controller; setBusy(true);
    status.textContent = 'Composing your 1080p video and its sound…';
    try {
      const permit = await stage().authorize();
      if (operation !== epoch || !stage().isCurrent(permit)) return;
      const response = await fetch('api/x/film', { method: 'POST', credentials: 'same-origin', cache: 'no-store', signal: controller.signal,
        headers: { 'Content-Type': 'application/json', 'X-APOT-Account': permit.id }, body: JSON.stringify({ tone: palette }) });
      if (operation !== epoch || !stage().isCurrent(permit)) return;
      if (!response.ok) {
        if (response.status === 401 || response.status === 409) { await stage().authorize(); throw new Error('account'); }
        throw new Error(response.status === 429 ? 'busy' : 'render');
      }
      if (response.headers.get('X-APOT-Account') !== permit.id || response.headers.get('X-APOT-Seed') !== permit.signature.seed) throw new Error('account');
      const blob = await response.blob();
      if (operation !== epoch || !stage().isCurrent(permit)) return;
      if (blob.type !== 'video/mp4' || !blob.size || blob.size > 4000000) throw new Error('render');
      // Recheck after rendering, before exposing any downloadable or shareable file.
      const verified = await stage().authorize();
      if (operation !== epoch || !stage().isCurrent(verified) || verified.signature !== permit.signature) return;
      const file = new File([blob], 'apot-' + permit.signature.seed + '-' + palette + '-signal.mp4', { type: 'video/mp4' });
      ready = { file, url: URL.createObjectURL(file), seed: permit.signature.seed, permit: verified };
      player.src = ready.url; player.hidden = false; card.hidden = true;
      player.setAttribute('aria-label', 'Personal signal video ' + ready.seed + ', with its own sound.');
      status.textContent = 'Your 1920 × 1080 video is ready. Play it, then share the MP4 with sound.';
    } catch (error) {
      if (operation === epoch && connected() && error?.name !== 'AbortError') status.textContent = error.message === 'busy' ? 'The studio is rendering. Retry in a few seconds.' : 'The video could not be created. Please retry.';
    } finally {
      if (request === controller) request = null;
      setBusy(false);
    }
  });
  download.addEventListener('click', async () => {
    if (!valid() || busy) return;
    setBusy(true);
    try { const permit = await stage().authorize(); if (valid() && stage().isCurrent(permit) && permit.signature === ready.permit.signature) save(); }
    catch (_) { if (valid()) status.textContent = 'Reconnect with X before downloading.'; }
    finally { setBusy(false); }
  });
  share.addEventListener('click', async () => {
    if (!valid() || busy) return;
    if (shareTicket && shareTicket.until > Date.now() && stage().isCurrent(shareTicket.permit)) {
      setBusy(true); try { await handoff(); } finally { setBusy(false); } return;
    }
    shareTicket = null; setBusy(true);
    try {
      const permit = await stage().authorize();
      if (!valid() || !stage().isCurrent(permit) || permit.signature !== ready.permit.signature) return;
      if (navigator.share && navigator.canShare?.({ files: [ready.file] }) && navigator.userActivation?.isActive === false) {
        shareTicket = { permit, until: Date.now() + 10000 };
        share.textContent = 'Choose X'; status.textContent = 'Your video is ready. Tap Choose X to open the share menu.';
      } else await handoff();
    } catch (_) { if (valid()) status.textContent = 'Reconnect with X before sharing.'; }
    finally { setBusy(false); }
  });
  draft.addEventListener('click', event => { if (!valid() || busy) event.preventDefault(); });
  window.addEventListener('apot:signature', clear);
  window.addEventListener('apot:edition-tone', event => { tone = event.detail === 'paper' ? 'paper' : 'midnight'; clear(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) player.pause(); else if (!valid()) clear(); });
  window.addEventListener('pagehide', clear);
  clear();
})();
