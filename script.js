'use strict';

(() => {
  const root = document.documentElement;
  const tabs = [...document.querySelectorAll('.journey-tab')];
  const panels = [...document.querySelectorAll('.journey-panel')];
  const tabList = document.querySelector('.journey-tabs');
  const menuButton = document.querySelector('.menu-toggle');
  const header = document.querySelector('.site-header');
  const nav = document.querySelector('#main-nav');
  const dialog = document.querySelector('#gallery-dialog');
  const galleryImage = document.querySelector('#gallery-image');
  const galleryCaption = document.querySelector('#gallery-caption');
  const galleryTitle = document.querySelector('#gallery-title');
  let selectedIndex = 0;
  let galleryIndex = 0;
  let galleryOpener;

  // Every scientific step has its own text, image and primary source.
  // Without JavaScript, the anchors lead to the three visible articles.
  tabList.setAttribute('role', 'tablist');
  tabs.forEach((tab, index) => {
    tab.id = `step-tab-${index}`;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panels[index].id);
    panels[index].setAttribute('role', 'tabpanel');
    panels[index].setAttribute('aria-labelledby', tab.id);
    panels[index].tabIndex = 0;
  });

  function selectStep(index, focus = false) {
    selectedIndex = (index + tabs.length) % tabs.length;
    tabs.forEach((tab, i) => {
      const active = i === selectedIndex;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      panels[i].toggleAttribute('data-active', active);
    });
    if (focus) tabs[selectedIndex].focus({ preventScroll: true });
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', (event) => {
      event.preventDefault();
      selectStep(index);
    });
    tab.addEventListener('keydown', (event) => {
      let next;
      if (event.key === 'ArrowRight') next = selectedIndex + 1;
      if (event.key === 'ArrowLeft') next = selectedIndex - 1;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (event.key === ' ') next = index;
      if (next !== undefined) { event.preventDefault();selectStep(next, true); }
    });
  });
  const initialStep = panels.findIndex(panel => `#${panel.id}` === location.hash);
  selectStep(initialStep >= 0 ? initialStep : 0);
  window.addEventListener('hashchange', () => {
    const index = panels.findIndex(panel => `#${panel.id}` === location.hash);
    if (index >= 0) selectStep(index);
  });

  function closeMenu(restoreFocus = false) {
    header.classList.remove('menu-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Ouvrir le menu');
    if (restoreFocus) menuButton.focus();
  }
  menuButton.hidden = false;
  menuButton.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    if (isOpen) closeMenu();
    else {
      header.classList.add('menu-open');
      menuButton.setAttribute('aria-expanded', 'true');
      menuButton.setAttribute('aria-label', 'Fermer le menu');
    }
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
  document.addEventListener('click', (event) => {
    if (!header.contains(event.target)) closeMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && header.classList.contains('menu-open')) closeMenu(true);
  });
  window.matchMedia('(min-width: 761px)').addEventListener('change', (event) => {
    if (event.matches) closeMenu();
  });

  const gallery = [
    { src: 'assets/apot-lab.webp', title: 'Le laboratoire', alt: 'Écran cathodique APOT au milieu d’instruments et de documents, esthétique d’archive analogique.', width: 1536, height: 1024 },
    { src: 'assets/apot-medallion.webp', title: 'L’empreinte', alt: 'Le médaillon APOT vu de face : or, bleu nuit et tracé du potentiel d’action.', width: 1050, height: 1050 },
    { src: 'assets/apot-signal.webp', title: 'Le signal', alt: 'Onde ivoire sur bleu nuit, identité APOT et repère de seuil −55 mV.', width: 800, height: 1192 },
    { src: 'assets/apot-profile.webp', title: 'Le médaillon', alt: 'Le médaillon Action Potential vu de trois quarts, métal doré sur fond sombre.', width: 850, height: 1266 }
  ];
  function showImage(index) {
    galleryIndex = (index + gallery.length) % gallery.length;
    const item = gallery[galleryIndex];
    galleryImage.src = item.src;
    galleryImage.alt = item.alt;
    galleryImage.width = item.width;
    galleryImage.height = item.height;
    galleryTitle.textContent = item.title;
    galleryCaption.textContent = `${String(galleryIndex + 1).padStart(2, '0')} / ${String(gallery.length).padStart(2, '0')} — ${item.title}`;
  }
  if (typeof dialog.showModal === 'function') {
    document.querySelectorAll('[data-gallery]').forEach(link => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        galleryOpener = link;
        showImage(Number(link.dataset.gallery));
        dialog.showModal();
      });
    });
    document.querySelector('.gallery-close').addEventListener('click', () => dialog.close());
    document.querySelector('.gallery-prev').addEventListener('click', () => showImage(galleryIndex - 1));
    document.querySelector('.gallery-next').addEventListener('click', () => showImage(galleryIndex + 1));
    dialog.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') { event.preventDefault();showImage(galleryIndex + 1); }
      if (event.key === 'ArrowLeft') { event.preventDefault();showImage(galleryIndex - 1); }
    });
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => galleryOpener?.focus({ preventScroll: true }));
  }
  root.classList.add('js');
})();
