(() => {
  'use strict';
  const root=document.documentElement;
  root.classList.add('js');
  const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
  const mobile=matchMedia('(max-width: 760px)');
  const menu=document.querySelector('.menu-toggle'), nav=document.querySelector('#main-nav');
  function closeMenu(){nav.classList.remove('is-open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open menu');}
  function syncMenu(){menu.hidden=!mobile.matches;closeMenu();}
  menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';nav.classList.toggle('is-open',open);menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close menu':'Open menu');});
  nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.getAttribute('aria-expanded')==='true'){closeMenu();menu.focus();}});
  mobile.addEventListener('change',syncMenu);syncMenu();

  const track=document.querySelector('.hero-track'),stage=document.querySelector('.hero-stage'),intro=document.querySelector('.hero-intro'),reveal=document.querySelector('.hero-reveal'),progressBar=document.querySelector('.hero-progress span'),motionButton=document.querySelector('.motion-toggle');
  let paused=motionPreference.matches,scrollFrame=0;
  const clamp=value=>Math.min(1,Math.max(0,value));
  function updateStory(){
    scrollFrame=0;
    const active=root.classList.contains('has-motion');
    const distance=Math.max(1,track.offsetHeight-stage.offsetHeight);
    const progress=active?clamp(-track.getBoundingClientRect().top/distance):0;
    const fade=active?clamp((progress-.2)/.31):0;
    const incoming=active?clamp((progress-.47)/.27):0;
    intro.style.opacity=String(1-fade);intro.style.transform='translateY('+(-fade*28)+'px)';
    reveal.style.opacity=String(incoming);reveal.style.transform='translateY('+((1-incoming)*26)+'px)';
    const secondActive=incoming>.3;
    reveal.classList.toggle('is-active',secondActive);reveal.inert=!secondActive;reveal.setAttribute('aria-hidden',String(!secondActive));
    intro.inert=fade>.8;intro.setAttribute('aria-hidden',String(fade>.8));
    progressBar.style.width=(progress*100)+'%';
    if(window.APOTSignal)window.APOTSignal.setProgress(progress);
  }
  function queueStory(){if(!scrollFrame)scrollFrame=requestAnimationFrame(updateStory);}
  function syncMotion(){
    root.classList.toggle('has-motion',Boolean(window.APOTSignal)&&!motionPreference.matches);
    motionButton.hidden=!window.APOTSignal||motionPreference.matches;
    motionButton.setAttribute('aria-pressed',String(paused));
    motionButton.querySelector('.motion-label').textContent=paused?'Resume motion':'Pause motion';
    motionButton.querySelector('.pause-symbol').textContent=paused?'▷':'Ⅱ';
    window.APOTSignal?.setPaused(paused);queueStory();
  }
  motionButton.addEventListener('click',()=>{paused=!paused;syncMotion();});
  motionPreference.addEventListener('change',()=>{paused=motionPreference.matches;syncMotion();});
  window.addEventListener('scroll',queueStory,{passive:true});window.addEventListener('resize',queueStory,{passive:true});syncMotion();

  const film=document.querySelector('#film-dialog'),filmFrame=film.querySelector('.film-frame');
  const gallery=document.querySelector('#gallery-dialog'),galleryImage=gallery.querySelector('#gallery-image'),galleryCaption=gallery.querySelector('#gallery-caption');
  const images=[
    ['assets/apot-lab.webp','The laboratory','APOT’s signal emblem on an analog laboratory monitor.'],
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
      player.src='https://www.youtube-nocookie.com/embed/5hYg3rUfLiQ?autoplay=1&rel=0';
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
  // Preserve an editorial image if a video host cannot supply its thumbnail.
  const poster=document.querySelector('.film-poster img');
  function posterFallback(){poster.src='assets/apot-lab.webp';poster.alt='APOT visual archive. Open the official Neuralink film featuring Audrey.';}
  poster.addEventListener('error',posterFallback,{once:true});
  if(poster.complete&&poster.naturalWidth===0)posterFallback();
})();
