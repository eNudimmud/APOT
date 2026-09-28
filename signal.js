/* APOT signal study: original abstract geometry, not clinical data.
   Native WebGL; one draw call, no framework or external runtime. */
(() => {
  'use strict';
  const canvas = document.querySelector('#signal-canvas');
  const stage = document.querySelector('.hero-stage');
  if (!canvas || !stage) return;
  const gl = canvas.getContext('webgl', { alpha: true, antialias: true, depth: false, powerPreference: 'low-power' });
  if (!gl) { startCanvasFallback(); return; }
  // The same original three-dimensional motif remains available on browsers
  // without WebGL. This renderer projects the filaments into a 2D canvas.
  function startCanvasFallback() {
    const ctx=canvas.getContext('2d',{alpha:true});
    if(!ctx)return;
    const small=matchMedia('(max-width:760px)'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
    const count=small.matches?80:128,steps=small.matches?130:190;
    const strands=[];
    for(let i=0;i<count;i++){
      const phi=i/count*Math.PI*2,seed=(i*31%113)/113,r=.65+.35*((i*17%29)/29),points=[];
      for(let j=0;j<steps;j++){
        const t=j/(steps-1),twist=phi+t*5.7,spread=.38+Math.sin(t*Math.PI)*.49;
        const wave=2.35*Math.exp(-Math.pow((t-.43)/.085,2))-1.65*Math.exp(-Math.pow((t-.61)/.093,2));
        points.push([(t-.5)*8.4,wave+Math.cos(twist)*r*spread+Math.sin(t*16+seed*20)*.017,Math.sin(twist)*r*spread+Math.sin(t*7+seed*12)*.09,t]);
      }
      strands.push({points,phi,seed});
    }
    let width=1,height=1,ratio=1,progress=0,time=0,last=0,frame=0,visible=true,paused=reduced.matches,px=0,py=0;
    function project(point){
      const yaw=-.36+progress*.48+(paused?0:px*.10),pitch=.14+(paused?0:py*.06),tilt=(small.matches?.46:.12)-progress*.08;
      const x=point[0]*Math.cos(yaw)+point[2]*Math.sin(yaw),z=-point[0]*Math.sin(yaw)+point[2]*Math.cos(yaw);
      const y=point[1]*Math.cos(pitch)-z*Math.sin(pitch),zz=point[1]*Math.sin(pitch)+z*Math.cos(pitch);
      const rx=x*Math.cos(tilt)+y*Math.sin(tilt),ry=-x*Math.sin(tilt)+y*Math.cos(tilt),scale=(small.matches?2:2.35)/(6.6-zz);
      return [((rx*scale/(width/height)+(small.matches?.46:.52))* .5+.5)*width,(1-(ry*scale+(small.matches?-.08:-.04)))*height*.5];
    }
    function render(now){
      frame=0;
      if(!paused&&last&&now-last<32){frame=requestAnimationFrame(render);return;}
      if(!paused)time+=last?Math.min(now-last,60)/1000:0;last=now;
      ctx.clearRect(0,0,width,height);ctx.globalCompositeOperation='lighter';ctx.lineWidth=small.matches?.55:.65;
      for(const strand of strands){
        const gold=Math.max(0,Math.sin(strand.phi*2+strand.seed*2));
        ctx.strokeStyle=gold>.8?'rgba(213,182,119,.29)':'rgba(166,192,202,.24)';
        ctx.beginPath();
        const projected=strand.points.map(project);
        for(let j=8;j<projected.length-8;j++){const p=projected[j];if(j===8)ctx.moveTo(...p);else ctx.lineTo(...p);}
        ctx.stroke();
        const at=(time*.034+.24)%1,start=Math.max(8,Math.floor((at-.018)*steps)),end=Math.min(steps-9,Math.floor((at+.018)*steps));
        if(start<end){ctx.beginPath();for(let j=start;j<=end;j++){const p=projected[j];if(j===start)ctx.moveTo(...p);else ctx.lineTo(...p);}ctx.strokeStyle='rgba(231,203,144,.53)';ctx.stroke();}
      }
      if(visible&&!paused&&!document.hidden)frame=requestAnimationFrame(render);
    }
    function requestDraw(){if(!frame)frame=requestAnimationFrame(render);}
    function resize(){const b=stage.getBoundingClientRect();width=b.width;height=b.height;ratio=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);requestDraw();}
    new ResizeObserver(resize).observe(stage);
    new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){last=0;requestDraw();}else{cancelAnimationFrame(frame);frame=0;}},{threshold:0}).observe(stage);
    stage.addEventListener('pointermove',event=>{if(paused||event.pointerType==='touch')return;px=(event.clientX/width-.5)*2;py=(event.clientY/height-.5)*2;requestDraw();},{passive:true});
    stage.addEventListener('pointerleave',()=>{px=0;py=0;requestDraw();},{passive:true});
    document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else{last=0;requestDraw();}});
    window.APOTSignal={setProgress(value){progress=reduced.matches?0:value;if(visible)requestDraw();},setPaused(value){paused=value;last=0;requestDraw();},isReady:true};
    document.documentElement.classList.add('scene-ready');resize();
  }
  const vertexSource = `
    precision highp float;
    attribute vec4 aStrand;
    uniform float uTime, uAspect, uProgress, uMobile;
    uniform vec2 uPointer;
    varying float vT, vLight, vGold, vDepth;
    void main(){
      float t=aStrand.x, phi=aStrand.y, r=aStrand.z, seed=aStrand.w;
      float twist=phi+t*5.7+sin(t*6.283+uTime*.12)*.09;
      float spread=.38+sin(t*3.14159)*.49+uProgress*t*.38;
      float pulse=2.35*exp(-pow((t-.43)/.085,2.0))-1.65*exp(-pow((t-.61)/.093,2.0));
      vec3 p=vec3((t-.5)*8.4,pulse+cos(twist)*r*spread,sin(twist)*r*spread);
      p.y+=sin(t*16.0+seed*20.0)*.017;
      p.z+=sin(t*7.0+seed*12.0)*.09;
      float ay=-.36+uProgress*.48+uPointer.x*.10;
      float ax=.14+uPointer.y*.06;
      p=vec3(p.x*cos(ay)+p.z*sin(ay),p.y,-p.x*sin(ay)+p.z*cos(ay));
      p=vec3(p.x,p.y*cos(ax)-p.z*sin(ax),p.y*sin(ax)+p.z*cos(ax));
      float tilt=mix(.12,.46,uMobile)-uProgress*.08;
      p.xy=mat2(cos(tilt),-sin(tilt),sin(tilt),cos(tilt))*p.xy;
      float perspective=1.0/(6.6-p.z);
      float scale=mix(2.35,2.0,uMobile);
      vec2 screen=p.xy*perspective*scale;
      screen.x/=uAspect;
      screen+=vec2(mix(.52,.46,uMobile),mix(-.04,-.08,uMobile));
      gl_Position=vec4(screen,0.,1.);
      vT=t;
      vLight=.34+.66*pow(max(0.,cos(twist-.8)),1.6);
      vGold=smoothstep(.78,1.,sin(phi*2.0+seed*2.0));
      vDepth=clamp((p.z+1.9)/3.8,.14,1.0);
    }`;
  const fragmentSource = `
    precision mediump float;
    uniform float uTime, uAspect, uMobile;
    varying float vT, vLight, vGold, vDepth;
    void main(){
      float ends=smoothstep(0.,.16,vT)*(1.-smoothstep(.88,1.,vT));
      float signal=exp(-pow((vT-fract(uTime*.034+.24))/.026,2.0));
      vec3 cold=vec3(.47,.61,.72), ivory=vec3(.84,.88,.85), gold=vec3(.91,.74,.41);
      vec3 color=mix(cold,ivory,vLight);
      color=mix(color,gold,vGold*.60+signal*.32);
      float opacity=(.12+vLight*.27+signal*.20)*ends*(.3+vDepth*.7);
      gl_FragColor=vec4(color,opacity);
    }`;
  function shader(type, source) {
    const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){gl.deleteShader(s);throw new Error('Signal shader could not compile.');}
    return s;
  }
  let program;
  try {
    const vs=shader(gl.VERTEX_SHADER,vertexSource), fs=shader(gl.FRAGMENT_SHADER,fragmentSource);
    program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
    gl.deleteShader(vs);gl.deleteShader(fs);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Signal program could not link.');
  } catch(error) { console.warn('APOT: static signal fallback active.');return; }
  const mobile=matchMedia('(max-width:760px)');
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const strands=mobile.matches?140:220, segments=mobile.matches?200:280;
  const vertices=new Float32Array(strands*(segments-1)*2*4);
  let offset=0;
  for(let strand=0;strand<strands;strand++){
    const phi=strand/strands*Math.PI*2;
    const radius=.65+.35*((strand*17%29)/29);
    const seed=(strand*31%113)/113;
    for(let step=0;step<segments-1;step++)for(let point=0;point<2;point++){
      vertices[offset++]=(step+point)/(segments-1);vertices[offset++]=phi;vertices[offset++]=radius;vertices[offset++]=seed;
    }
  }
  gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.STATIC_DRAW);
  const attribute=gl.getAttribLocation(program,'aStrand');gl.enableVertexAttribArray(attribute);gl.vertexAttribPointer(attribute,4,gl.FLOAT,false,0,0);
  const uniforms={};['uTime','uAspect','uProgress','uMobile','uPointer'].forEach(name=>uniforms[name]=gl.getUniformLocation(program,name));
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.clearColor(0,0,0,0);
  let width=1,height=1,progress=0,time=0,previous=0,frame=0,inView=true,paused=reduced.matches,contextLost=false;
  let pointerX=0,pointerY=0,currentX=0,currentY=0;
  function draw(now){
    frame=0;if(contextLost)return;
    const elapsed=previous?Math.min(now-previous,50):0;previous=now;
    if(!paused)time+=elapsed/1000;
    currentX+=(pointerX-currentX)*.06;currentY+=(pointerY-currentY)*.06;
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(uniforms.uTime,time);gl.uniform1f(uniforms.uAspect,width/height);gl.uniform1f(uniforms.uProgress,reduced.matches?0:progress);
    gl.uniform1f(uniforms.uMobile,mobile.matches?1:0);gl.uniform2f(uniforms.uPointer,paused?0:currentX,paused?0:currentY);
    gl.drawArrays(gl.LINES,0,vertices.length/4);
    if(inView&&!paused&&!document.hidden)frame=requestAnimationFrame(draw);
  }
  function requestDraw(){if(!frame&&!contextLost)frame=requestAnimationFrame(draw);}
  function resize(){
    const bounds=stage.getBoundingClientRect();width=bounds.width;height=bounds.height;
    const ratio=Math.min(devicePixelRatio||1,mobile.matches?1.5:1.75);
    canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);gl.viewport(0,0,canvas.width,canvas.height);requestDraw();
  }
  new ResizeObserver(resize).observe(stage);
  new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;if(inView){previous=0;requestDraw();}else if(frame){cancelAnimationFrame(frame);frame=0;}},{threshold:0}).observe(stage);
  stage.addEventListener('pointermove',event=>{if(event.pointerType==='touch'||paused)return;pointerX=(event.clientX/width-.5)*2;pointerY=(event.clientY/height-.5)*2;requestDraw();},{passive:true});
  stage.addEventListener('pointerleave',()=>{pointerX=0;pointerY=0;},{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else{previous=0;requestDraw();}});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();contextLost=true;cancelAnimationFrame(frame);document.documentElement.classList.remove('scene-ready');});
  window.APOTSignal={setProgress(value){progress=value;if(inView)requestDraw();},setPaused(value){paused=value;previous=0;requestDraw();},isReady:true};
  document.documentElement.classList.add('scene-ready');resize();
})();
