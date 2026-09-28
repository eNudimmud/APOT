'use strict';

(() => {
  const $ = (selector) => document.querySelector(selector);
  const root = document.documentElement;
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let effects = !motionPreference.matches;
  try {
    const stored = localStorage.getItem('apot-effects');
    if (stored !== null) effects = stored === 'on' && !motionPreference.matches;
  } catch { /* Preferences remain available without persistent storage. */ }

  const effectsButton = $('.effects-toggle');
  const hero = $('.hero');
  const heroButton = $('.fire-hero');
  const slider = $('#stimulus');
  const stimulateButton = $('#stimulate');
  const canvas = $('#signal-canvas');
  const ctx = canvas.getContext('2d');
  const scope = $('.scope-screen');
  const soundButton = $('.sound-toggle');
  let soundEnabled = false;
  let audioContext;
  let audioUnavailable = false;
  let pulseCount = 0;
  let frame = 0;
  let heroTimeout = 0;
  let width = 0;
  let height = 0;
  let lastStrength = null;
  let startTime = 0;
  let inView = false;
  let lastTrigger = 0;
  const THRESHOLD = 60;
  const DURATION = 1700;

  const hasMotion = () => effects && !motionPreference.matches;
  const canAnimate = () => hasMotion() && inView && !document.hidden;

  function updateEffects() {
    root.dataset.effects = hasMotion() ? 'on' : 'off';
    effectsButton.disabled = motionPreference.matches;
    effectsButton.setAttribute('aria-pressed', String(hasMotion()));
    $('.effects-label').textContent = hasMotion() ? 'Effets activés' : 'Effets désactivés';
    effectsButton.title = motionPreference.matches ? 'Réduction des animations activée dans votre système' : hasMotion() ? 'Désactiver les animations' : 'Activer les animations';
    if (!hasMotion()) {
      hero.classList.remove('is-firing');
      cancelAnimationFrame(frame);
      draw(1);
    }
  }
  effectsButton.hidden = false;
  effectsButton.addEventListener('click', () => {
    effects = !hasMotion();
    // The system's reduced-motion preference always takes priority.
    if (motionPreference.matches) effects = false;
    updateEffects();
    try { localStorage.setItem('apot-effects', effects ? 'on' : 'off'); } catch {}
  });
  motionPreference.addEventListener('change', () => {
    if (motionPreference.matches) effects = false;
    updateEffects();
  });

  function waveform(t, strength) {
    if (strength === null) return 0;
    // Normalized illustration: super-threshold signals share the same amplitude.
    if (strength < THRESHOLD) return (strength / THRESHOLD) * .2 * Math.exp(-(((t - .43) / .055) ** 2));
    const bump = (center, spread, amplitude) => amplitude * Math.exp(-(((t - center) / spread) ** 2));
    return bump(.31, .022, .10) + bump(.435, .021, 1) - bump(.49, .023, .40) + bump(.57, .035, .045);
  }

  function draw(progress) {
    if (!ctx || !width || !height) return;
    ctx.clearRect(0, 0, width, height);
    const baseline = height * .61;
    const amplitude = height * .39;
    const left = 34;
    const right = width - 20;
    ctx.strokeStyle = '#35563e';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 7]);
    ctx.beginPath(); ctx.moveTo(left, baseline); ctx.lineTo(right, baseline); ctx.stroke();
    ctx.setLineDash([]);
    const completed = progress >= 1;
    const end = lastStrength === null || completed ? 1 : Math.max(.002, progress);
    ctx.beginPath();
    const count = Math.ceil((right - left) * end);
    for (let i = 0; i <= count; i++) {
      const t = i / (right - left);
      const y = baseline - waveform(t, lastStrength) * amplitude;
      if (i === 0) ctx.moveTo(left, y); else ctx.lineTo(left + i, y);
    }
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = lastStrength !== null && lastStrength < THRESHOLD ? '#d0dd92' : '#b6eed1';
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = hasMotion() ? 12 : 0;
    ctx.stroke();
    ctx.shadowBlur = 0;
    if (!completed && lastStrength !== null) {
      const t = Math.min(1, end);
      const x = left + (right - left) * t;
      const y = baseline - waveform(t, lastStrength) * amplitude;
      ctx.fillStyle = '#efffdc';
      ctx.beginPath();ctx.arc(x, y, 3, 0, Math.PI * 2);ctx.fill();
      ctx.strokeStyle = '#b6eed11a';
      ctx.beginPath();ctx.moveTo(x, 0);ctx.lineTo(x, height);ctx.stroke();
    }
  }

  function resizeScope() {
    const rect = scope.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    if (ctx) ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw(1);
  }
  function animate(now) {
    if (!canAnimate()) { draw(1); return; }
    const progress = Math.min((now - startTime) / DURATION, 1);
    draw(progress);
    if (progress < 1) frame = requestAnimationFrame(animate);
  }

  function updateSoundLabel() {
    soundButton.setAttribute('aria-pressed', String(soundEnabled));
    $('.sound-label').textContent = soundEnabled ? 'Son activé' : 'Son désactivé';
  }
  function ensureAudio() {
    if (audioUnavailable) return false;
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) {
      audioUnavailable = true;
      soundEnabled = false;
      soundButton.disabled = true;
      $('.sound-label').textContent = 'Son indisponible';
      return false;
    }
    try {
      audioContext ||= new Audio();
      if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
      return true;
    } catch {
      soundEnabled = false;
      audioUnavailable = true;
      soundButton.setAttribute('aria-pressed', 'false');
      $('.sound-label').textContent = 'Son indisponible';
      return false;
    }
  }
  function playTone(success) {
    if (!soundEnabled || !ensureAudio()) return;
    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(success ? 370 : 170, now);
    oscillator.frequency.exponentialRampToValueAtTime(success ? 740 : 110, now + .1);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(.045, now + .015);
    gain.gain.exponentialRampToValueAtTime(.0001, now + .24);
    oscillator.connect(gain);gain.connect(audioContext.destination);
    oscillator.start(now);oscillator.stop(now + .25);
    oscillator.onended = () => { oscillator.disconnect();gain.disconnect(); };
  }
  if (window.AudioContext || window.webkitAudioContext) {
    soundButton.hidden = false;
    soundButton.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      if (soundEnabled && !ensureAudio()) return;
      updateSoundLabel();
      if (soundEnabled) playTone(true);
    });
  }

  function trigger(strength, fromHero = false) {
    const now = performance.now();
    if (now - lastTrigger < 250) return;
    lastTrigger = now;
    lastStrength = strength;
    const success = strength >= THRESHOLD;
    if (success) pulseCount++;
    const paddedCount = String(pulseCount).padStart(2, '0');
    $('#pulse-count').textContent = paddedCount;
    $('#scope-state').textContent = success ? 'SEUIL FRANCHI' : 'SOUS LE SEUIL';
    $('#signal-readout').textContent = success ? 'IMPULSION COMPLÈTE' : 'PERTURBATION LOCALE';
    $('#lab-feedback').replaceChildren();
    const title = document.createElement('strong');
    title.textContent = success ? 'Seuil franchi.' : 'Sous le seuil.';
    $('#lab-feedback').append(title, document.createElement('br'), success ? 'Une impulsion se propage.' : 'Le signal s’atténue. Essayez au-dessus de 60.');
    canvas.setAttribute('aria-label', success ? `Stimulus ${strength} sur 100 : seuil franchi, une impulsion complète se propage.` : `Stimulus ${strength} sur 100 : sous le seuil, petite perturbation sans impulsion complète.`);
    cancelAnimationFrame(frame);
    if (canAnimate()) { startTime = performance.now();frame = requestAnimationFrame(animate); }
    else draw(1);
    playTone(success);
    if (fromHero) {
      $('#hero-feedback').textContent = `IMPULSION ENVOYÉE / ${paddedCount} DANS CETTE SESSION`;
      clearTimeout(heroTimeout);
      hero.classList.remove('is-firing');
      if (hasMotion()) {
        // Restart the short, user-triggered trace without an idle animation loop.
        void hero.offsetWidth;
        hero.classList.add('is-firing');
        heroTimeout = window.setTimeout(() => hero.classList.remove('is-firing'), 1700);
      }
    }
  }

  slider.disabled = false;
  stimulateButton.disabled = false;
  function updateSlider() {
    $('#stimulus-value').value = slider.value;
    slider.style.setProperty('--range-value', `${slider.value}%`);
    slider.setAttribute('aria-valuetext', `${slider.value} sur 100, ${Number(slider.value) >= THRESHOLD ? 'au-dessus du seuil illustratif' : 'sous le seuil illustratif'}`);
  }
  slider.addEventListener('input', updateSlider);
  slider.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') { event.preventDefault();trigger(Number(slider.value)); }
  });
  stimulateButton.addEventListener('click', () => trigger(Number(slider.value)));
  heroButton.hidden = false;
  heroButton.addEventListener('click', () => {
    slider.value = '68';updateSlider();trigger(68, true);
  });
  updateSlider();

  if ('ResizeObserver' in window) new ResizeObserver(resizeScope).observe(scope);
  else window.addEventListener('resize', resizeScope, { passive: true });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      inView = entries[0].isIntersecting;
      if (!inView) { cancelAnimationFrame(frame);draw(1); }
    }, { threshold: .05 }).observe(scope);
  } else inView = true;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame);draw(1); }
  });
  resizeScope();
  updateEffects();

  const dialog = $('#archive-dialog');
  const archiveLink = $('.archive-open');
  if (typeof dialog.showModal === 'function') {
    archiveLink.addEventListener('click', (event) => { event.preventDefault();dialog.showModal(); });
    $('.dialog-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => archiveLink.focus({ preventScroll: true }));
  }
})();
