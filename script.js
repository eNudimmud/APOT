(() => {
  'use strict';
  const root = document.documentElement;
  root.classList.add('js');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 760px)');
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#main-nav');
  const header = document.querySelector('.site-header');
  const tablist = document.querySelector('[role=tablist]');
  const motionButton = document.querySelector('.motion-toggle');
  let paused = reduced.matches, manualMotion = false, scrollFrame = 0;
  function closeMenu() {
    nav.classList.remove('is-open');
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Open menu');
  }
  function syncMenu() {
    menu.hidden = !mobile.matches;
    tablist.setAttribute('aria-orientation', mobile.matches ? 'horizontal' : 'vertical');
    closeMenu();
  }
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    nav.classList.toggle('is-open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); }
  });
  mobile.addEventListener('change', syncMenu); syncMenu();

  function syncMotion() {
    root.dataset.motion = paused ? 'off' : 'on';
    root.classList.toggle('motion-on', !paused);
    root.classList.toggle('motion-off', paused);
    motionButton.setAttribute('aria-pressed', String(!paused));
    motionButton.querySelector('.motion-label').textContent = paused ? 'Play motion' : 'Pause motion';
    motionButton.querySelector('.motion-icon').textContent = paused ? '▷' : 'Ⅱ';
    window.LambdaSignal?.setPaused(paused);
  }
  motionButton.addEventListener('click', () => { manualMotion = true; paused = !paused; syncMotion(); });
  reduced.addEventListener('change', () => { if (!manualMotion) { paused = reduced.matches; syncMotion(); } });
  syncMotion();
  function updateScroll() {
    scrollFrame = 0;
    header.classList.toggle('is-scrolled', window.scrollY > 40);
    window.LambdaSignal?.setScroll(Math.min(1, window.scrollY / Math.max(1, window.innerHeight)));
  }
  window.addEventListener('scroll', () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll); }, { passive: true });
  updateScroll();

  const reveals = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-revealed'); observer.unobserve(entry.target); }
    }), { threshold: .08 });
    reveals.forEach(el => observer.observe(el));
  } else reveals.forEach(el => el.classList.add('is-revealed'));

  const tabs = [...document.querySelectorAll('[role=tab]')];
  function selectTab(index, focus = false) {
    tabs.forEach((tab, i) => {
      const active = i === index;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
    });
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
      if (next !== undefined) { event.preventDefault(); selectTab(next, true); }
    });
  });

  const film=document.querySelector('#film-dialog'),filmFrame=film.querySelector('.film-frame');
  const gallery=document.querySelector('#gallery-dialog'),galleryImage=gallery.querySelector('#gallery-image'),galleryCaption=gallery.querySelector('#gallery-caption');
  const images=[
    ['assets/apot-lab.webp','The laboratory / original artwork','The original APOT signal emblem on an analog laboratory monitor.'],
    ['assets/apot-medallion.webp','The imprint','Front view of the gold and midnight-blue APOT medallion.'],
    ['assets/apot-signal.webp','The signal','The ivory APOT signal on midnight blue. The −55 mV label is an illustrative reference, not a universal threshold.'],
    ['assets/apot-profile.webp','The medallion','Three-quarter view of the APOT medallion.']
  ];
  let galleryIndex=0,dialogTrigger=null;
  function openDialog(dialog,trigger){dialogTrigger=trigger;dialog.showModal();document.body.classList.add('modal-open');}
  function updateGallery(){const [src,label,alt]=images[galleryIndex];galleryImage.src=src;galleryImage.alt=alt;galleryCaption.textContent=String(galleryIndex+1).padStart(2,'0')+' / 04 — '+label;}
  function stepGallery(delta){galleryIndex=(galleryIndex+delta+images.length)%images.length;updateGallery();}
  if(typeof film.showModal==='function'){
    document.querySelectorAll('[data-film]').forEach(link=>link.addEventListener('click',event=>{
      if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      event.preventDefault();
      const player=document.createElement('iframe');
      player.src='https://www.youtube-nocookie.com/embed/5hYg3rUfLiQ?autoplay=1&rel=0&hl=en&cc_lang_pref=en';
      player.title='Creating Art With The Mind — Neuralink';player.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';player.allowFullscreen=true;player.referrerPolicy='strict-origin-when-cross-origin';
      filmFrame.replaceChildren(player);openDialog(film,link);
    }));
    document.querySelectorAll('[data-gallery]').forEach(link=>link.addEventListener('click',event=>{
      if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      event.preventDefault();galleryIndex=Number(link.dataset.gallery);updateGallery();openDialog(gallery,link);
    }));
    [film,gallery].forEach(dialog=>{
      dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
      dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();});
      dialog.addEventListener('close',()=>{if(dialog===film)filmFrame.replaceChildren();document.body.classList.remove('modal-open');dialogTrigger?.focus({preventScroll:true});});
    });
    gallery.querySelector('.gallery-prev').addEventListener('click',()=>stepGallery(-1));gallery.querySelector('.gallery-next').addEventListener('click',()=>stepGallery(1));
    gallery.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();stepGallery(event.key==='ArrowLeft'?-1:1);}});
  }
})();
