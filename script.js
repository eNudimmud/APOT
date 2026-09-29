(() => {
  'use strict';
  const root = document.documentElement;
  root.classList.add('js');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 760px)');
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#main-nav');
  const header = document.querySelector('.site-header');
  const world = document.querySelector('.signal-world');
  const motionButton = document.querySelector('.motion-toggle');
  const phaseLive = document.querySelector('#phase-live');
  const studyLine = document.querySelector('#study-line');
  const phaseName = document.querySelector('#phase-name');
  const orbitReadout = document.querySelector('#orbit-readout');
  const phaseFill = document.querySelector('#phase-fill');
  const phaseMarks = [...document.querySelectorAll('[data-phase]')];
  let paused = reduced.matches;
  let manualMotion = false;
  let scrollFrame = 0;
  let lastBucket = '';

  const buckets = {
    rest: 'Quiet, before the impulse.',
    rise: 'Potential gathers along the line.',
    spike: 'The crest becomes action.',
    field: 'The filament opens into a field.'
  };

  function closeMenu() {
    nav.classList.remove('is-open');
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Open menu');
  }

  function syncMenu() {
    menu.hidden = !mobile.matches;
    closeMenu();
  }

  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    nav.classList.toggle('is-open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) nav.querySelector('a')?.focus();
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menu.focus();
    }
  });
  mobile.addEventListener('change', syncMenu);
  syncMenu();

  function syncMotion() {
    root.dataset.motion = paused ? 'off' : 'on';
    root.classList.toggle('motion-on', !paused);
    root.classList.toggle('motion-off', paused);
    motionButton.setAttribute('aria-pressed', String(!paused));
    motionButton.querySelector('.motion-label').textContent = paused ? 'Play' : 'Pause';
    motionButton.setAttribute('aria-label', paused ? 'Play motion' : 'Pause motion');
    motionButton.querySelector('.motion-icon').textContent = paused ? '▷' : 'Ⅱ';
    window.LambdaSignal?.setPaused(paused);
  }
  motionButton.addEventListener('click', () => {
    manualMotion = true;
    paused = !paused;
    syncMotion();
  });
  reduced.addEventListener('change', () => {
    if (!manualMotion) {
      paused = reduced.matches;
      syncMotion();
    }
  });
  syncMotion();

  function bucketFor(progress) {
    if (progress < 0.25) return 'rest';
    if (progress < 0.5) return 'rise';
    if (progress < 0.75) return 'spike';
    return 'field';
  }

  function applyMetrics(metrics) {
    const bucket = bucketFor(metrics.phase);
    const name = bucket.toUpperCase();
    if (phaseName.textContent !== name) phaseName.textContent = name;
    if (studyLine.textContent !== buckets[bucket]) studyLine.textContent = buckets[bucket];
    const orbit = `ORBIT ${metrics.orbit}°`;
    if (orbitReadout.textContent !== orbit) orbitReadout.textContent = orbit;
    phaseFill.style.transform = `scaleX(${metrics.phase.toFixed(3)})`;
    if (bucket === lastBucket) return;
    lastBucket = bucket;
    phaseMarks.forEach(mark => mark.classList.toggle('is-active', mark.dataset.phase === bucket));
  }

  function updateScroll() {
    scrollFrame = 0;
    header.classList.toggle('is-scrolled', window.scrollY > 24);
    const traveled = -world.getBoundingClientRect().top / Math.max(window.innerHeight, 1);
    window.LambdaSignal?.setScroll(Math.min(1, Math.max(0, traveled)));
  }

  phaseLive.textContent = 'The filament turns on its own. Pause stops the motion.';
  window.LambdaSignal?.onMetrics(applyMetrics);

  window.addEventListener('scroll', () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll);
  }, { passive: true });
  window.addEventListener('resize', () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll);
  }, { passive: true });
  updateScroll();

  const reveals = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    reveals.forEach(el => observer.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('is-revealed'));
  }

  const tablist = document.querySelector('[role=tablist]');
  const tabs = [...document.querySelectorAll('[role=tab]')];
  function selectTab(index, focus = false) {
    tabs.forEach((tab, i) => {
      const active = i === index;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
    });
    tablist.setAttribute('aria-orientation', mobile.matches ? 'horizontal' : 'vertical');
    if (focus) tabs[index].focus({ preventScroll: true });
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(index));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      selectTab(next, true);
    });
  });
  mobile.addEventListener('change', () => selectTab(tabs.findIndex(tab => tab.getAttribute('aria-selected') === 'true')));

  const film = document.querySelector('#film-dialog');
  const filmFrame = film.querySelector('.film-frame');
  const gallery = document.querySelector('#gallery-dialog');
  const galleryImage = gallery.querySelector('#gallery-image');
  const galleryCaption = gallery.querySelector('#gallery-caption');
  const images = [
    ['assets/apot-lab.webp', 'The laboratory', 'Original emblem on an analog laboratory monitor.'],
    ['assets/apot-medallion.webp', 'The medallion', 'Front view of the gold and midnight-blue medallion.'],
    ['assets/apot-signal.webp', 'The signal plate', 'Ivory signal line on midnight blue. The voltage mark is illustrative, not a measured threshold.'],
    ['assets/apot-profile.webp', 'The profile', 'Three-quarter view of the medallion.']
  ];
  let galleryIndex = 0;
  let dialogTrigger = null;

  function openDialog(dialog, trigger) {
    dialogTrigger = trigger;
    dialog.showModal();
    document.body.classList.add('modal-open');
  }

  function updateGallery() {
    const [src, label, alt] = images[galleryIndex];
    galleryImage.src = src;
    galleryImage.alt = alt;
    galleryCaption.textContent = `${String(galleryIndex + 1).padStart(2, '0')} / 04 — ${label}`;
  }

  function stepGallery(delta) {
    galleryIndex = (galleryIndex + delta + images.length) % images.length;
    updateGallery();
  }

  if (typeof film.showModal === 'function') {
    document.querySelectorAll('[data-film]').forEach(link => link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const player = document.createElement('iframe');
      player.src = 'https://www.youtube-nocookie.com/embed/5hYg3rUfLiQ?autoplay=1&rel=0&hl=en&cc_lang_pref=en';
      player.title = 'Creating Art With The Mind — Neuralink';
      player.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      player.allowFullscreen = true;
      player.referrerPolicy = 'strict-origin-when-cross-origin';
      filmFrame.replaceChildren(player);
      openDialog(film, link);
    }));
    document.querySelectorAll('[data-gallery]').forEach(link => link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      galleryIndex = Number(link.dataset.gallery);
      updateGallery();
      openDialog(gallery, link);
      gallery.querySelector('.gallery-next').focus();
    }));
    [film, gallery].forEach(dialog => {
      dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
      dialog.addEventListener('click', event => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
        if (!inside) dialog.close();
      });
      dialog.addEventListener('close', () => {
        if (dialog === film) filmFrame.replaceChildren();
        document.body.classList.remove('modal-open');
        dialogTrigger?.focus({ preventScroll: true });
      });
    });
    gallery.querySelector('.gallery-prev').addEventListener('click', () => stepGallery(-1));
    gallery.querySelector('.gallery-next').addEventListener('click', () => stepGallery(1));
    gallery.addEventListener('keydown', event => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      stepGallery(event.key === 'ArrowLeft' ? -1 : 1);
    });
  }

  const mintToggle = document.querySelector('.mint-address');
  const mintCopy = document.querySelector('.mint-copy');
  if (mintToggle) {
    mintToggle.addEventListener('click', () => {
      const open = mintToggle.getAttribute('aria-expanded') === 'true';
      mintToggle.setAttribute('aria-expanded', String(!open));
    });
  }
  if (mintCopy) {
    const status = mintCopy.querySelector('.mint-action');
    mintCopy.addEventListener('click', async () => {
      const value = mintCopy.getAttribute('data-copy');
      try {
        await copyText(value);
        mintCopy.classList.add('is-copied');
        status.textContent = 'Copied';
        window.setTimeout(() => {
          mintCopy.classList.remove('is-copied');
          status.textContent = 'Copy';
        }, 1600);
      } catch {
        if (mintToggle) mintToggle.setAttribute('aria-expanded', 'true');
        status.textContent = 'Select';
      }
    });
  }

  function copyText(value) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(value);
    return new Promise((resolve, reject) => {
      const area = document.createElement('textarea');
      area.value = value;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.append(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      if (ok) resolve();
      else reject(new Error('copy failed'));
    });
  }
})();
