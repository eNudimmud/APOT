/* APOT signal study: original abstract geometry, not clinical data.
   Native WebGL; one draw call, no framework or external runtime. */
(() => {
  'use strict';
  const canvas = document.querySelector('#signal-canvas');
  const stage = document.querySelector('.hero-stage');
  if (!canvas || !stage) return;
  const gl = canvas.getContext('webgl', { alpha: true, antialias: true, depth: false, powerPreference: 'low-power' });
  if (!gl) return;
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
  canvas.addEventListener('webglcontextrestored',()=>{window.location.reload();});
  window.APOTSignal={setProgress(value){progress=value;if(inView)requestDraw();},setPaused(value){paused=value;previous=0;requestDraw();},isReady:true};
  document.documentElement.classList.add('scene-ready');resize();
})();
