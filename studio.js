(() => {
  'use strict';
  const engine=window.ApotStudio;
  const preview=document.querySelector('#card-preview');
  if(!engine||!preview) return;
  const ctx=preview.getContext('2d');
  const listen=document.querySelector('#listen-signal');
  const soundStatus=document.querySelector('#sound-status');
  const cardButton=document.querySelector('#export-card');
  const soundButton=document.querySelector('#export-sound');
  const share=document.querySelector('#share-card');
  const palettes=[...document.querySelectorAll('[data-tone]')];
  const query=new URLSearchParams(window.location.search);
  let tone=query.get('tone')==='paper'?'paper':'midnight';
  let current=null, audio=null, source=null, audioEpoch=0;
  const idle='An original, composed motif. Sound starts when you choose.';

  function stopSound(message=idle) {
    audioEpoch++;
    if(source){source.onended=null;try{source.stop();}catch(_){}source.disconnect();source=null;}
    listen.setAttribute('aria-pressed','false');
    listen.querySelector('span').textContent='Listen to your signal';
    soundStatus.textContent=message;
  }
  function render() {
    palettes.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.tone===tone)));
    if(!current) return;
    if(ctx) engine.paintCard(ctx,current,preview.width,preview.height,tone);
    preview.setAttribute('aria-label','Signal edition '+current.seed+', '+tone+' palette.');
    const url=engine.permalink(current,tone);
    const text='Potential, in motion.\n\nMy signal: '+current.seed+'\nMade at λP⊙T. Hear it. Make yours.\n\n'+url;
    share.href='https://x.com/intent/tweet?text='+encodeURIComponent(text);
    share.removeAttribute('aria-disabled');
    share.setAttribute('aria-label','Share edition '+current.seed+' on X. Opens a draft.');
    cardButton.disabled=!ctx; soundButton.disabled=false;
    listen.disabled=!(window.AudioContext||window.webkitAudioContext);
    if(listen.disabled) soundStatus.textContent='Audio playback is unavailable here. Download the WAV to listen.';
  }
  function apply(sig){if(!sig)return;stopSound();current=sig;render();}
  window.addEventListener('apot:signature',event=>apply(event.detail));
  apply(window.ApotStage?.current());
  palettes.forEach(button=>button.addEventListener('click',()=>{tone=button.dataset.tone;render();}));
  share.addEventListener('click',event=>{if(!current)event.preventDefault();});
  if(document.fonts?.ready) document.fonts.ready.then(render);

  listen.addEventListener('click',async()=>{
    if(!current)return;
    if(source){stopSound();return;}
    const epoch=++audioEpoch, sig=current;
    listen.disabled=true;
    try{
      const Audio=window.AudioContext||window.webkitAudioContext;
      if(!audio)audio=new Audio();
      await audio.resume();
      if(epoch!==audioEpoch||document.hidden)return;
      const pcm=engine.samples(sig,engine.sampleRate);
      const buffer=audio.createBuffer(1,pcm.length,engine.sampleRate);
      buffer.getChannelData(0).set(pcm);
      source=audio.createBufferSource();source.buffer=buffer;source.connect(audio.destination);
      source.onended=()=>stopSound('Your motif is complete. Listen again, or carry it with you.');
      source.start();listen.setAttribute('aria-pressed','true');
      listen.querySelector('span').textContent='Stop sound';
      soundStatus.textContent='Playing your five-second motif. Seed '+sig.seed+'.';
    }catch(_){stopSound('Playback could not start. Download the WAV to listen.');}
    finally{listen.disabled=!(window.AudioContext||window.webkitAudioContext);}
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopSound();});
  window.addEventListener('pagehide',()=>{stopSound();if(audio){void audio.close();audio=null;}});

  function save(blob,name){
    const url=URL.createObjectURL(blob), link=document.createElement('a');
    link.href=url;link.download=name;document.body.append(link);link.click();link.remove();
    window.setTimeout(()=>URL.revokeObjectURL(url),30000);
  }
  cardButton.addEventListener('click',async()=>{
    if(!current||!ctx)return;
    const sig=current, palette=tone, label=cardButton.innerHTML;
    cardButton.disabled=true;cardButton.textContent='Drawing your card…';
    try{
      if(document.fonts?.load){await document.fonts.load('400 93px Space');await document.fonts.load('600 27px Space');}
      const card=document.createElement('canvas');card.width=3840;card.height=2160;
      const context=card.getContext('2d');if(!context)throw new Error('Canvas unavailable');
      engine.paintCard(context,sig,card.width,card.height,palette);
      const blob=await new Promise((resolve,reject)=>card.toBlob(value=>value?resolve(value):reject(new Error('Export unavailable')),'image/png'));
      save(blob,'apot-'+sig.seed+'-'+palette+'-3840x2160.png');
      soundStatus.textContent='Your card is ready. Keep the full seed to restore it.';
      card.width=1;card.height=1;
    }catch(_){soundStatus.textContent='The card could not be saved here. Try again in another browser.';}
    finally{cardButton.innerHTML=label;cardButton.disabled=!ctx;}
  });
  soundButton.addEventListener('click',()=>{
    if(!current)return;
    try{save(new Blob([engine.wav(current)],{type:'audio/wav'}),'apot-'+current.seed+'-motif.wav');soundStatus.textContent='Your original motif is ready: WAV, five seconds, 44.1 kHz.';}
    catch(_){soundStatus.textContent='The sound could not be saved here. Try again.';}
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
