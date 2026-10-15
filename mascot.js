(()=>{const P='assets/mascot/',dbg=/[?&]debug=1/.test(location.search),rm=matchMedia('(prefers-reduced-motion:reduce)').matches;
const L=document.createElement('div');L.id='apot-mascots';L.setAttribute('aria-hidden','true');document.body.appendChild(L);
const R={peek:262/473,sit:282/476,peer:435/285,walk:251/474,sleep:474/197,point:385/465};// w/h
const box=el=>{const r=el.getBoundingClientRect();return{x:r.left+scrollX,y:r.top+scrollY,w:r.width,h:r.height}};
const byText=(sel,re)=>(re=new RegExp(re),0)||[...document.querySelectorAll(sel)].find(e=>re.test(e.textContent));
const up=(el,minW)=>{while(el&&el.offsetWidth<minW)el=el.parentElement;return el};
let mx=-1e4,my=-1e4;addEventListener('pointermove',e=>{mx=e.pageX;my=e.pageY},{passive:true});
const S=[];
// clip: {x,y,w,h} page box in which the mascot is visible (outside = hidden behind the element)
function make(pose,{clip,img,tone='navy',contact,trigger,onShow}){
 const c=document.createElement('div');c.className=`amc p-${pose} ${tone}`;c.style.cssText=`left:${clip.x}px;top:${clip.y}px;width:${clip.w}px;height:${clip.h}px`;
 const m=document.createElement('div');m.className='am';m.innerHTML=`<img src="${P+pose}.webp" alt="">`;Object.assign(m.style,img);c.appendChild(m);
 if(contact){const s=document.createElement('div');s.className='contact';Object.assign(s.style,contact);c.appendChild(s)}
 L.appendChild(c);const st={c,m,pose,trigger,on:false,show(){if(st.on)return;st.on=true;c.classList.add('show');onShow&&onShow(st)}};S.push(st);
 if(dbg)st.show();else new IntersectionObserver((es,o)=>es.forEach(e=>{if(e.isIntersecting&&e.intersectionRatio>.6){st.show();o.disconnect()}}),{threshold:[.6]}).observe(trigger);
 return st}
function place(){L.innerHTML='';S.length=0;const mob=innerWidth<=720;
 if(!mob){ // 01 HERO: peers over the top edge of the oscilloscope photograph, toward the CRT
 const hp=document.querySelector('.hero-photograph img');
 if(hp){const b=box(hp),w=mob?80:92,h=w/R.peer,vis=h;
  make('peer',{clip:{x:b.x+b.w*(mob?.78:.70)-w/2,y:b.y-vis+3,w,h:vis},img:{width:w+'px',left:0,top:0},trigger:hp,
   onShow:s=>{/* ducks when the cursor approaches, comes back */ }})}
}
 if(mob){footer(true);return}
 // 02 SIGNATURE: stands on the inner floor of the "Your signal starts with X" card, pointing at it
 let sc=[...document.querySelectorAll('h2,h3,p,div,span')].filter(e=>/^\s*Your signal starts with X/.test(e.textContent)).pop();while(sc&&!(sc.offsetWidth>500&&sc.offsetWidth<1000&&sc.offsetHeight>250))sc=sc.parentElement;
 if(sc){const b=box(sc),h=118,w=h*R.point;
  make('point',{clip:{x:b.x+b.w-w-28,y:b.y+b.h-h-2,w,h:h+12},img:{width:w+'px',left:0,top:0,transform:'scaleX(-1)'},trigger:sc,
   contact:{left:w*.18+'px',width:w*.6+'px',top:h-8+'px'}})}
 // 03 ARCHIVE: sits on the top edge of the middle study (the pencil line), legs dangling over the photo
 const cards=document.querySelectorAll('.study-card img');const ci=cards[1];
 if(ci){const b=box(ci),h=132,w=h*R.sit,seat=h*.74;
  make('sit',{clip:{x:b.x+b.w-w-34,y:b.y-seat,w,h},img:{width:w+'px',left:0,top:0},trigger:ci,
   contact:{left:w*.12+'px',width:w*.76+'px',top:seat-5+'px'}})}
 // 04 RECORD: walks along the top border of the "Creating art with the mind" film frame
 const fp=up(byText('h3,h2,p,div,span','^\\s*Creating art'),500);
 if(fp){const b0=box(fp),h=60,w=h*R.walk,x0=b0.x+190,x1=b0.x+b0.w-250,b={x:x0,y:b0.y+b0.h-h-26,w:x1-x0};const st=make('walk',{clip:{x:b.x,y:b.y,w:b.w,h:h+6},img:{width:w+'px',left:'0px',top:0},trigger:fp});
  st.m.style.setProperty('--dist',(b.w-w-10)+'px');
  document.addEventListener('play',()=>{st.c.classList.add('startle');setTimeout(()=>st.c.classList.remove('startle'),900)},true);
  document.querySelectorAll('a[href="#play"],button').forEach(x=>/Watch the film/.test(x.textContent)&&x.addEventListener('click',()=>{st.c.classList.add('startle');setTimeout(()=>st.c.classList.remove('startle'),900)}))}
 // 05 LINEAGE: peeks from behind the "Still you" mirror photo, into the gap toward "Your move"
 const li=[...document.querySelectorAll('#lineage img')].filter(i=>i.offsetWidth>400&&i.offsetWidth<900);
 if(li.length>1){const a=box(li[0]),b=box(li[1]),h=150,w=h*R.peek;
  make('peek',{clip:{x:a.x+a.w,y:b.y+b.h*.30,w:w,h},img:{width:w+'px',left:0,top:0},trigger:li[0]})}
 // 06 COMMUNITY (cream band): peers over the top of "Bring your first signal"
 const bb=byText('#community a,#community button','Bring your first signal');
 if(bb){const b=box(bb),h=78,w=h*R.peek;
  make('peek',{clip:{x:b.x+b.w,y:b.y+b.h/2-h*.55,w,h},img:{width:w+'px',left:0,top:0},tone:'cream',trigger:bb})}
 footer(false)}
// FOOTER: curled up asleep against the right end of the λPOT wordmark; only falls asleep once the page is idle
function footer(mob){const f=document.querySelector('footer');if(!f)return;const wm=f.querySelector('.footer-wordmark svg')||f;
 const b=box(wm),w=mob?84:132,h=w/R.sleep;
 const st=make('sleep',{clip:{x:b.x+b.w-w*1.02,y:b.y-h+(mob?8:12),w,h:h+8},img:{width:w+'px',left:0,top:0},trigger:f});
 if(!dbg){st.show=(o=>function(){let t;const arm=()=>{clearTimeout(t);t=setTimeout(o,2500)};arm();['scroll','pointermove'].forEach(e=>addEventListener(e,()=>{if(!st.on)arm()},{passive:true}))})(st.show)}}
// cursor proximity: peer/peek duck, sit leans back
setInterval(()=>S.forEach(s=>{if(!s.on||!/peer|peek|sit/.test(s.pose))return;const r=s.c.getBoundingClientRect(),cx=r.left+scrollX+r.width/2,cy=r.top+scrollY+r.height/2;
 s.c.classList.toggle('duck',Math.hypot(mx-cx,my-cy)<Math.max(r.width,r.height)*.9)}),120);
addEventListener('load',()=>setTimeout(place,400));let rt,lw=innerWidth;addEventListener('resize',()=>{if(innerWidth===lw)return;lw=innerWidth;clearTimeout(rt);rt=setTimeout(place,400)});
})();
