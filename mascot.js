(()=>{const P='assets/mascot/',dbg=/[?&]debug=1/.test(location.search),rm=matchMedia('(prefers-reduced-motion:reduce)').matches;
const L=document.createElement('div');L.id='apot-mascots';L.setAttribute('aria-hidden','true');document.body.appendChild(L);
const R={peek:262/473,sit:282/476,peer:435/285,walk:251/474,sleep:474/197,point:385/465};// w/h
const box=el=>{const r=el.getBoundingClientRect();return{x:r.left+scrollX,y:r.top+scrollY,w:r.width,h:r.height}};
const byText=(sel,re)=>(re=new RegExp(re),0)||[...document.querySelectorAll(sel)].find(e=>re.test(e.textContent));
const up=(el,minW)=>{while(el&&el.offsetWidth<minW)el=el.parentElement;return el};
let mx=-1e4,my=-1e4;addEventListener('pointermove',e=>{if(e.pointerType==='mouse'){mx=e.pageX;my=e.pageY}},{passive:true});
const S=[],seen=new Set();let mobG=false;
// clip: {x,y,w,h} page box in which the mascot is visible (outside = hidden behind the element)
function make(pose,{clip,img,tone='navy',contact,trigger,onShow,key=pose}){
 const c=document.createElement('div');c.className=`amc p-${pose} ${tone}`;c.style.cssText=`left:${clip.x}px;top:${clip.y}px;width:${clip.w}px;height:${clip.h}px`;
 const m=document.createElement('div');m.className='am';m.innerHTML=`<img src="${P+pose}.webp" alt="">`;Object.assign(m.style,img);c.appendChild(m);
 if(contact){const s=document.createElement('div');s.className='contact';Object.assign(s.style,contact);c.appendChild(s)}
 L.appendChild(c);const st={c,m,pose,trigger,on:false,show(){if(st.on)return;st.on=true;seen.add(key);c.classList.add('show');onShow&&onShow(st)}};S.push(st);
 if(dbg)st.show();else if(seen.has(key)){c.classList.add('instant');st.show();requestAnimationFrame(()=>requestAnimationFrame(()=>c.classList.remove('instant')))}
 else if(trigger){const io=new IntersectionObserver(es=>es.forEach(e=>{const r=e.boundingClientRect;if(e.isIntersecting&&(e.intersectionRatio>.3||(r.top<innerHeight*.65&&r.bottom>innerHeight*.35))){st.show();io.disconnect()}}),{threshold:[0,.15,.3,.5]});io.observe(trigger);st.io=io}
 return st}
function place(){S.forEach(x=>{x.io&&x.io.disconnect();x.stop&&x.stop()});L.innerHTML='';S.length=0;const mob=innerWidth<=720;mobG=mob;
 if(!mob){ // 01 HERO: peers over the top edge of the oscilloscope photograph, toward the CRT
 const hp=document.querySelector('.hero-photograph img');
 if(hp){const b=box(hp),w=mob?80:92,h=w/R.peer,vis=h;
  make('peer',{clip:{x:b.x+b.w*(mob?.78:.70)-w/2,y:b.y-vis+3,w,h:vis},img:{width:w+'px',left:0,top:0},trigger:hp,
   onShow:s=>{/* ducks when the cursor approaches, comes back */ }})}
}
 // 02 SIGNATURE: stands on the inner floor of the "Your signal starts with X" card, pointing at it
 let sc=[...document.querySelectorAll('h2,h3,p,div,span')].filter(e=>/^\s*Your signal starts with X/.test(e.textContent)).pop();while(sc&&!(sc.offsetWidth>Math.min(500,innerWidth*.8)&&sc.offsetWidth<1000&&sc.offsetHeight>250))sc=sc.parentElement;
 if(sc){const b=box(sc),h=mob?78:118,w=h*R.point;
  make('point',{clip:{x:b.x+b.w-w-(mob?10:28),y:b.y+b.h-h-2,w,h:h+12},img:{width:w+'px',left:0,top:0,transform:'scaleX(-1)'},trigger:sc,
   contact:{left:w*.18+'px',width:w*.6+'px',top:h-8+'px'}})}
 if(!mob){ // 03 ARCHIVE: sits on the top edge of the middle study (the pencil line), legs dangling over the photo
 const cards=document.querySelectorAll('.study-card img');const ci=cards[1];
 if(ci){const b=box(ci),h=132,w=h*R.sit,seat=h*.74;
  make('sit',{clip:{x:b.x+b.w-w-34,y:b.y-seat,w,h},img:{width:w+'px',left:0,top:0},trigger:ci,
   contact:{left:w*.12+'px',width:w*.76+'px',top:seat-5+'px'}})}
 // 04 RECORD: strolls along the inner floor of the film frame toward the filament, with a real step cycle
 const fp=up(byText('h3,h2,p,div,span','^\\s*Creating art'),500);
 if(fp){const b0=box(fp),h=72,w=h*280/320,x0=b0.x+190,x1=b0.x+b0.w-250,b={x:x0,y:b0.y+b0.h-h-26,w:x1-x0};
  const st=make('walk',{clip:{x:b.x,y:b.y-6,w:b.w,h:h+14},img:{width:w+'px',left:'0px',top:'6px'},trigger:fp,onShow:s=>walk(s,b.w-w-6,h)});st.m.querySelector('img').src=P+'walk-1.webp';
  const foot=document.createElement('div');foot.className='foot';foot.style.cssText=`left:${w*.2}px;width:${w*.6}px;top:${h-3}px`;st.m.appendChild(foot);
  const startle=()=>{st.c.classList.add('startle');st.pause&&st.pause(900)};
  document.addEventListener('play',startle,true);
  document.querySelectorAll('a[href="#play"],button').forEach(x=>/Watch the film/.test(x.textContent)&&x.addEventListener('click',startle))}
 // 05 LINEAGE: peeks from behind the "Still you" mirror photo, into the gap toward "Your move"
 const li=[...document.querySelectorAll('#lineage img')].filter(i=>i.offsetWidth>400&&i.offsetWidth<900);
 if(li.length>1){const a=box(li[0]),b=box(li[1]),h=150,w=h*R.peek;
  make('peek',{clip:{x:a.x+a.w,y:b.y+b.h*.30,w:w,h},img:{width:w+'px',left:0,top:0},trigger:li[0]})}
}
 // 06 COMMUNITY (cream band): peers over the top of "Bring your first signal"
 const bb=byText('#community a,#community button','Bring your first signal');
 if(bb){const b=box(bb),h=mob?64:78,w=h*R.peek;if(b.x+b.w+w>innerWidth-8)return footer(mob);
  make('peek',{clip:{x:b.x+b.w,y:b.y+b.h/2-h*.55,w,h},img:{width:w+'px',left:0,top:0},tone:'cream',trigger:bb})}
 footer(mob)}
// FOOTER: asleep on the T of the λPOT wordmark; settles in shortly after the visitor reaches the bottom
function footer(mob){const f=document.querySelector('footer');if(!f)return;const wm=f.querySelector('.footer-wordmark svg')||f;
 const b=box(wm),w=mob?84:132,h=w/R.sleep;
 const st=make('sleep',{clip:{x:b.x+b.w-w*1.02,y:b.y-h+(mob?8:12),w,h:h+8},img:{width:w+'px',left:0,top:0},trigger:null});
 if(dbg||st.on)return;let t=0;
 const near=()=>{const r=wm.getBoundingClientRect();return r.top<innerHeight-40||innerHeight+scrollY>=document.documentElement.scrollHeight-160};
 const chk=()=>{if(st.on||!document.body.contains(st.c)){removeEventListener('scroll',chk);return}
  if(near()){clearTimeout(t);t=setTimeout(()=>{near()&&st.show()},mob?700:1100)}};
 addEventListener('scroll',chk,{passive:true});chk()}
// walk cycle: 16 frames from a 2D cutout rig (contact/down/passing/up per side), sway, bob and arm swing baked in.
// Body advances a constant stride/16 per frame (= planted-foot speed), so the planted foot stays fixed on the floor.
const NF=16,WF=Array.from({length:NF},(_,i)=>P+'walk-'+(i+1)+'.webp');WF.forEach(u=>{const i=new Image();i.src=u});
function walk(st,dist,h){const img=st.m.querySelector('img'),still=P+'walk-5.webp';
 if(rm){img.src=still;st.m.style.transform=`translateX(${dist/2}px)`;return}
 const FD=62,ADV=18.404*h/640;let x=0,last=performance.now(),acc=0,f=0,hold=0,dir=1,raf;
 st.pause=ms=>{hold=Math.max(hold,ms)};const nextLook=()=>2200+Math.random()*3000;let look=nextLook();
 const setF=n=>{img.src=WF[n];st.m.classList.toggle('contact',n===0||n===8)};setF(0);st.m.classList.add('stepping');
 const tick=t=>{const dt=Math.min(50,t-last);last=t;
  if(hold>0){hold-=dt;if(hold<=0){st.m.classList.remove('looking');st.m.classList.add('stepping');setF(f)}}
  else{acc+=dt;look-=dt;while(acc>=FD){acc-=FD;x+=ADV*dir;f=(f+1)%NF;setF(f)}
   const stop=()=>{st.m.classList.remove('stepping','contact');st.m.classList.add('looking');img.src=still};
   if(x>=dist||x<=0){x=Math.max(0,Math.min(dist,x));dir*=-1;hold=900;stop()}
   else if(look<=0&&(f===4||f===12)){look=nextLook();hold=1100+Math.random()*700;stop()}}
  st.m.style.transform=`translateX(${x}px) scaleX(${dir})`;raf=requestAnimationFrame(tick)};
 raf=requestAnimationFrame(tick);st.stop=()=>cancelAnimationFrame(raf)}
// cursor proximity: peer/peek duck, sit leans back
setInterval(()=>S.forEach(s=>{if(!s.on||!/peer|peek|sit/.test(s.pose))return;const r=s.c.getBoundingClientRect(),cx=r.left+scrollX+r.width/2,cy=r.top+scrollY+r.height/2;
 s.c.classList.toggle('duck',Math.hypot(mx-cx,my-cy)<Math.max(r.width,r.height)*.9)}),120);
let rt,lw=innerWidth,lh=0;const re=()=>{clearTimeout(rt);rt=setTimeout(()=>{lw=innerWidth;lh=document.documentElement.scrollHeight;place()},250)};
const boot=()=>{lh=document.documentElement.scrollHeight;place();document.fonts&&document.fonts.ready.then(re)};
document.readyState==='complete'?setTimeout(boot,200):addEventListener('load',()=>setTimeout(boot,200));
addEventListener('resize',()=>{if(innerWidth!==lw)re()});
new ResizeObserver(()=>{if(Math.abs(document.documentElement.scrollHeight-lh)>4)re()}).observe(document.body);
})();
