(() => {
 const canvas=document.getElementById('ambient-canvas'),context=canvas?.getContext('2d',{alpha:false});if(!context)return;
 let width=0,height=0,frame=0,phase=0,lastTime=0,reduced=document.documentElement.classList.contains('motion-reduced'),inView=true;
 function size(){const rect=canvas.parentElement.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,2);width=rect.width;height=rect.height;canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);context.setTransform(ratio,0,0,ratio,0,0);draw();}
 function draw(){
  context.fillStyle='#0a0d12';context.fillRect(0,0,width,height);
  const glow=context.createRadialGradient(width*.7,height*.6,0,width*.7,height*.6,width*.75);glow.addColorStop(0,'#122b4055');glow.addColorStop(.55,'#0c1b2b30');glow.addColorStop(1,'#0a0d1200');context.fillStyle=glow;context.fillRect(0,0,width,height);
  for(let layer=0;layer<2;layer++){
   for(let band=0;band<40;band++){
    const p=band/39,fade=Math.sin(p*Math.PI),opacity=(layer?.085:.13)*fade;
    context.strokeStyle=`rgba(128,171,210,${opacity})`;context.lineWidth=band%9===0?1.1:.55;context.beginPath();
    for(let step=0;step<=74;step++){
     const u=step/74,x=u*width*1.32-width*.16;
     const arch=Math.sin(u*Math.PI*1.7+phase*.12+layer*1.8+p*.52);
     const fold=Math.sin(u*Math.PI*3.1-phase*.08+p*.62)*height*.035;
     const y=height*(layer?.42:.64)+arch*height*(layer?.13:.2)+fold+(p-.5)*height*.24;
     if(step===0)context.moveTo(x,y);else context.lineTo(x,y);
    }context.stroke();
   }
  }
  const vignette=context.createRadialGradient(width*.5,height*.43,height*.08,width*.5,height*.43,Math.max(width,height)*.72);vignette.addColorStop(0,'#0a0d1200');vignette.addColorStop(1,'#0a0d12dd');context.fillStyle=vignette;context.fillRect(0,0,width,height);
 }
 function tick(time){frame=0;if(reduced||document.hidden||!inView)return;if(time-lastTime>32){phase+=Math.min((time-lastTime)/1000,.05);lastTime=time;draw();}frame=requestAnimationFrame(tick);}
 function resume(){if(frame)cancelAnimationFrame(frame);frame=0;lastTime=performance.now();if(reduced||document.hidden||!inView){draw();return;}frame=requestAnimationFrame(tick);}
 new ResizeObserver(size).observe(canvas.parentElement);
 if('IntersectionObserver' in window)new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;resume();},{threshold:0}).observe(canvas.parentElement);
 addEventListener('viz:motion',event=>{reduced=event.detail.reduced;resume();});document.addEventListener('visibilitychange',resume);size();resume();
})();
