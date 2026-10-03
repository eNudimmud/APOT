/* λP⊙T — original card and sound composition, version 1.
   Synthetic artwork from a seed. No neural recordings or medical inference. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ApotStudio = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const RATE = 44100;
  const DURATION = 5;
  const NOTES = [0, 2, 4, 7, 9, 12, 14, 16];

  function score(sig) {
    if (!sig || !/^[0-9A-F]{8}$/.test(sig.seed)) throw new Error('A valid signal is required.');
    return Array.from(sig.seed, (digit, i) => {
      const value = parseInt(digit, 16);
      const midi = 57 + NOTES[(value + i) % NOTES.length];
      return { start: 0.16 + i * 0.5, frequency: 440 * Math.pow(2, (midi - 69) / 12),
        duration: 1.3, gain: 0.13 + (value % 4) * 0.008 };
    });
  }

  function samples(sig, rate) {
    rate = rate == null ? RATE : rate;
    if (!Number.isInteger(rate) || rate < 8000 || rate > 96000) throw new Error('Unsupported sample rate.');
    const output = new Float32Array(Math.round(DURATION * rate));
    score(sig).forEach(note => {
      const start = Math.round(note.start * rate);
      const length = Math.round(note.duration * rate);
      for (let j = 0; j < length && start + j < output.length; j++) {
        const t = j / rate;
        const attack = Math.min(1, t / 0.012);
        const release = Math.min(1, (note.duration - t) / 0.16);
        const envelope = attack * release * Math.exp(-3.3 * t);
        const phase = 2 * Math.PI * note.frequency * t;
        const tone = Math.sin(phase) + 0.24 * Math.sin(phase * 2) + 0.08 * Math.sin(phase * 3);
        output[start + j] += note.gain * envelope * tone;
      }
    });
    for (let i = 0; i < output.length; i++) output[i] = Math.max(-0.7, Math.min(0.7, output[i]));
    return output;
  }

  function wav(sig, rate) {
    rate = rate == null ? RATE : rate;
    const pcm = samples(sig, rate);
    const buffer = new ArrayBuffer(44 + pcm.length * 2);
    const view = new DataView(buffer);
    const ascii = (offset, value) => { for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i)); };
    ascii(0, 'RIFF'); view.setUint32(4, buffer.byteLength - 8, true); ascii(8, 'WAVE'); ascii(12, 'fmt ');
    view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
    view.setUint32(24, rate, true); view.setUint32(28, rate * 2, true); view.setUint16(32, 2, true);
    view.setUint16(34, 16, true); ascii(36, 'data'); view.setUint32(40, pcm.length * 2, true);
    for (let i = 0; i < pcm.length; i++) view.setInt16(44 + i * 2, Math.round(pcm[i] * (pcm[i] < 0 ? 32768 : 32767)), true);
    return buffer;
  }

  function permalink(sig) {
    if (!sig || !/^[0-9A-F]{8}$/.test(sig.seed)) throw new Error('A valid signal is required.');
    return 'https://www.apot.world/#signature';
  }

  function wordmark(ctx, x, y, width, color) {
    ctx.save(); ctx.translate(x, y); ctx.scale(width / 256, width / 256);
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 6; ctx.lineJoin = 'round'; ctx.lineCap = 'square';
    ctx.beginPath(); ctx.moveTo(16,8); ctx.lineTo(20,8); ctx.bezierCurveTo(25,8,28,12,31,19); ctx.lineTo(49,62);
    ctx.moveTo(30,21); ctx.lineTo(8,62); ctx.moveTo(73,62); ctx.lineTo(73,11); ctx.lineTo(94,11);
    ctx.bezierCurveTo(107,11,115,18,115,28); ctx.bezierCurveTo(115,38,107,45,94,45); ctx.lineTo(73,45); ctx.stroke();
    ctx.beginPath(); ctx.arc(163,36.5,25.5,0,Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.arc(163,36.5,4.4,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(207,11); ctx.lineTo(250,11); ctx.moveTo(228.5,11); ctx.lineTo(228.5,62); ctx.stroke(); ctx.restore();
  }

  function paintCard(ctx, sig, width, height, tone) {
    score(sig);
    if (!ctx || !Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) throw new Error('A drawing surface is required.');
    const paper = tone === 'paper';
    const background = paper ? '#e7e2d4' : '#07121d';
    const foreground = paper ? '#07121d' : '#e7e2d4';
    const accent = paper ? '#75633b' : '#d0bd8c';
    const muted = paper ? '#485762' : '#a9b6c0';
    ctx.save(); ctx.setTransform(width/1600,0,0,height/900,0,0); ctx.globalAlpha=1;
    ctx.fillStyle=background; ctx.fillRect(0,0,1600,900);
    // Every export is drawn directly at its target size; no raster enlargement.
    ctx.strokeStyle=foreground; ctx.globalAlpha=.12; ctx.lineWidth=1;
    ctx.strokeRect(32,32,1536,836); ctx.beginPath(); ctx.moveTo(80,144); ctx.lineTo(1520,144);
    ctx.moveTo(80,744); ctx.lineTo(1520,744); ctx.stroke(); ctx.globalAlpha=1;
    wordmark(ctx,80,67,145,foreground);
    ctx.textAlign='right'; ctx.fillStyle=muted; ctx.font='400 15px Space, Arial, sans-serif';
    ctx.fillText('SIGNAL EDITION / 001',1520,102);
    ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillStyle=foreground; ctx.font='400 93px Space, Arial, sans-serif';
    ctx.fillText('Potential,',80,315); ctx.fillStyle=accent; ctx.fillText('in motion.',80,422);
    ctx.fillStyle=muted; ctx.font='400 23px Space, Arial, sans-serif';
    ctx.fillText('Art. Sound. Human intention.',84,502);
    ctx.font='400 15px Space, Arial, sans-serif'; ctx.fillText('One seed. A pattern. A possibility.',84,555);
    const field={x:675,y:188,w:840,h:452};
    ctx.save(); ctx.beginPath(); ctx.rect(field.x,field.y,field.w,field.h); ctx.clip();
    ctx.strokeStyle=foreground; ctx.globalAlpha=.08; ctx.lineWidth=1;
    for(let x=field.x;x<field.x+field.w;x+=42){ctx.beginPath();ctx.moveTo(x,field.y);ctx.lineTo(x,field.y+field.h);ctx.stroke();}
    for(let y=field.y;y<field.y+field.h;y+=42){ctx.beginPath();ctx.moveTo(field.x,y);ctx.lineTo(field.x+field.w,y);ctx.stroke();}
    const min=Math.min.apply(null,sig.wave), max=Math.max.apply(null,sig.wave);
    const waveY=value=>field.y+30+(max-value)/Math.max(1,max-min)*(field.h-65);
    ctx.globalAlpha=.18; ctx.strokeStyle=accent; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(field.x,waveY(sig.resting)); ctx.lineTo(field.x+field.w,waveY(sig.resting)); ctx.stroke();
    ctx.globalAlpha=1; ctx.strokeStyle=accent; ctx.lineWidth=3.5; ctx.lineJoin='round'; ctx.lineCap='round';
    ctx.beginPath(); sig.wave.forEach((value,i)=>{const x=field.x+i/(sig.wave.length-1)*field.w; const y=waveY(value);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();
    const spikeX=field.x+sig.spikeT*field.w, spikeY=waveY(sig.peak);
    ctx.fillStyle=foreground; ctx.beginPath(); ctx.arc(spikeX,spikeY,5,0,Math.PI*2); ctx.fill(); ctx.restore();
    ctx.textAlign='right'; ctx.fillStyle=muted; ctx.font='400 13px Space, Arial, sans-serif';
    ctx.fillText('COMPOSED SIGNAL / NO NEURAL DATA',1515,684);
    ctx.textAlign='left'; ctx.fillStyle=accent; ctx.font='400 13px Space, Arial, sans-serif'; ctx.fillText('YOUR EDITION',84,791);
    ctx.fillStyle=foreground; ctx.font='600 27px Space, Arial, sans-serif'; ctx.fillText(sig.seed,84,830);
    ctx.textAlign='right'; ctx.fillStyle=foreground; ctx.font='400 25px Space, Arial, sans-serif'; ctx.fillText('apot.world',1517,801);
    ctx.fillStyle=muted; ctx.font='400 13px Space, Arial, sans-serif'; ctx.fillText('Reconnect with your X account.',1517,830);
    ctx.restore();
  }
  return Object.freeze({score,samples,wav,paintCard,permalink,wordmark,sampleRate:RATE,duration:DURATION});
});
