(() => {
 'use strict';
 const $=selector=>document.querySelector(selector), all=selector=>[...document.querySelectorAll(selector)];
 const config=window.VIZ_CONFIG||{links:{}}, dictionaries=window.VIZ_I18N, supported=['tr','uz','en'];
 const locales={tr:'tr-TR',uz:'uz-Latn-UZ',en:'en-GB'}, ogLocales={tr:'tr_TR',uz:'uz_UZ',en:'en_GB'};
 const storage={get(key){try{return localStorage.getItem(key);}catch{return null;}},set(key,value){try{localStorage.setItem(key,value);}catch{}}};
 const requested=new URL(location.href).searchParams.get('lang'), saved=storage.get('viz-language');
 const browserLanguage=(navigator.languages||[navigator.language]).map(code=>String(code).slice(0,2)).find(code=>supported.includes(code));
 let language=supported.includes(requested)?requested:supported.includes(saved)?saved:browserLanguage||'tr';
 let toastTimer, toastState=null, lastStats=null, statsFailed=false, statsBusy=false, nextStatsAt=0, manualMotion=storage.get('viz-reduce-motion')==='true';
 const systemMotion=matchMedia('(prefers-reduced-motion: reduce)');
 const t=(key,args={})=>{let value=dictionaries[language][key]||dictionaries.tr[key]||key;for(const [name,replacement] of Object.entries(args))value=value.replaceAll(`{${name}}`,replacement);return value;};
 function announce(key,args={}){toastState={key,args};$('#toast').textContent=t(key,args);$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>{$('#toast').classList.remove('visible');toastState=null;},3500);}
 function closeMenu(){const menu=$('.menu-toggle');$('#main-nav').classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label',t('menuOpen'));}
 function motionReduced(){return manualMotion||systemMotion.matches;}
 function renderMotion(){const reduced=motionReduced();document.documentElement.classList.toggle('motion-reduced',reduced);const button=$('#motion-toggle');button.textContent=t(systemMotion.matches?'motionSystem':reduced?'motionEnable':'motionReduce');button.setAttribute('aria-pressed',String(reduced));button.disabled=systemMotion.matches;window.dispatchEvent(new CustomEvent('viz:motion',{detail:{reduced}}));if(reduced)$('.intro')?.remove();}
 function number(value,suffix=''){if(value===null||value===undefined||value===''||!Number.isFinite(Number(value)))return '—';return new Intl.NumberFormat(locales[language],{maximumFractionDigits:2}).format(Number(value))+suffix;}
 function dateTimeFormat(){return new Intl.DateTimeFormat(locales[language],{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23',timeZone:'UTC'});}
 function renderStats(){
  const faceit=lastStats?.faceit||{},premier=lastStats?.premier||{};
  $('#premier').textContent=number(premier.rating);$('#faceit').textContent=number(faceit.elo);$('#level').textContent=t('level',{value:number(faceit.level)});
  $('#kd').textContent=number(faceit.kd);$('#winrate').textContent=number(faceit.winrate,'%');$('#headshots').textContent=number(faceit.headshots,'%');
  const hasStats=lastStats&&(number(faceit.elo)!=='—'||number(premier.rating)!=='—');
  const premierSource=lastStats?.sources?.premier?.provider==='Leetify';
  $('#status-copy').textContent=t(statsFailed?'statsError':premierSource?(hasStats?'premierReceived':'premierUnranked'):hasStats?'statsCurrent':'statsWaiting');$('#stats-status').classList.toggle('connected',!!hasStats&&!statsFailed);
  if(statsFailed)$('#stats-note').textContent=t('statsErrorNote');
  else if(premierSource){const format=date=>dateTimeFormat().format(new Date(date));const notes=[t('premierChecked',{time:format(lastStats.checkedAt||lastStats.updatedAt)})];if(lastStats.lastTrackedMatch&&Number.isFinite(Date.parse(lastStats.lastTrackedMatch)))notes.push(t('leetifyMatch',{time:format(lastStats.lastTrackedMatch)}));if(lastStats.sources?.faceit?.state==='not_configured')notes.push(t('faceitPending'));$('#stats-note').textContent=notes.join(' ');}
  else if(hasStats){const time=dateTimeFormat().format(new Date(lastStats.updatedAt));$('#stats-note').textContent=(premier.rating==null?t('premierPending'):'')+t('statsUpdated',{time});}
  else $('#stats-note').textContent=t('statsNote');
 }
 function updateEmailLinks(){all('[data-link="email"]').forEach(a=>{if(config.links.email)a.href=`mailto:${config.links.email}?subject=${encodeURIComponent(t('emailSubject'))}`;});}
 function applyLanguage(next,{persist=false,announceChange=false}={}){
  if(!supported.includes(next))return;language=next;document.documentElement.lang=language;$('#language').value=language;
  all('[data-i18n]').forEach(element=>{element.textContent=t(element.dataset.i18n);});
  all('[data-i18n-aria]').forEach(element=>element.setAttribute('aria-label',t(element.dataset.i18nAria)));
  all('[data-link][aria-disabled="true"]').forEach(element=>element.setAttribute('aria-description',t('linkPending')));
  document.title=t('title');$('meta[name="description"]').content=t('description');$('meta[property="og:title"]').content=t('title');$('meta[property="og:description"]').content=t('description');$('meta[property="og:locale"]').content=ogLocales[language];
  $('.menu-toggle').setAttribute('aria-label',t($('#main-nav').classList.contains('open')?'menuClose':'menuOpen'));
  if(!config.crosshair)$('#crosshair-code').textContent=t('crosshairPending');
  updateEmailLinks();renderStats();renderMotion();
  if(toastState)$('#toast').textContent=t(toastState.key,toastState.args);
  if(persist){storage.set('viz-language',language);const url=new URL(location.href);url.searchParams.set('lang',language);history.replaceState(null,'',url);}
  if(announceChange){$('#language-announcement').textContent=t('languageChanged');document.documentElement.classList.remove('language-change');void document.documentElement.offsetWidth;document.documentElement.classList.add('language-change');}
 }
 all('[data-link]').forEach(a=>{
  const key=a.dataset.link,value=config.links[key];let valid=false;
  if(value){try{const url=new URL(key==='email'?`mailto:${value}`:value);if(!['https:','mailto:'].includes(url.protocol))throw Error();a.href=url.href;valid=true;if(url.protocol==='https:'){a.target='_blank';a.rel='noopener noreferrer';}}catch{}}
  if(!valid){a.setAttribute('aria-disabled','true');a.setAttribute('aria-description',t('linkPending'));a.classList.add('pending');a.addEventListener('click',event=>{event.preventDefault();announce(value?'linkUnavailable':'linkSoon');});}
  if(key==='idonate'&&valid){a.classList.remove('pending');const label=a.querySelector('.pending-tag');if(label){label.dataset.i18n='donate';label.className='text-link';}}
 });
 $('#year').textContent=new Date().getFullYear();
 if(config.crosshair){$('#crosshair-code').textContent=config.crosshair;$('#copy-code').disabled=false;}
 applyLanguage(language);
 $('#language').addEventListener('change',event=>applyLanguage(event.target.value,{persist:true,announceChange:true}));
 addEventListener('popstate',()=>{const lang=new URL(location.href).searchParams.get('lang');if(supported.includes(lang))applyLanguage(lang);});
 $('#motion-toggle').addEventListener('click',()=>{manualMotion=!manualMotion;storage.set('viz-reduce-motion',String(manualMotion));renderMotion();});
 systemMotion.addEventListener('change',renderMotion);
 $('.intro')?.addEventListener('animationend',event=>{if(event.animationName==='introOut')event.currentTarget.remove();});
 $('.menu-toggle').addEventListener('click',()=>{const open=$('#main-nav').classList.toggle('open');$('.menu-toggle').setAttribute('aria-expanded',String(open));$('.menu-toggle').setAttribute('aria-label',t(open?'menuClose':'menuOpen'));});
 all('#main-nav a').forEach(a=>a.addEventListener('click',closeMenu));
 document.addEventListener('keydown',event=>{if(event.key==='Escape'){const wasOpen=$('#main-nav').classList.contains('open');closeMenu();if(wasOpen)$('.menu-toggle').focus();}});
 document.addEventListener('click',event=>{
  if(!event.target.closest('.site-header'))closeMenu();
  const anchor=event.target.closest('a[href^="#"]');if(!anchor||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  const id=anchor.getAttribute('href').slice(1),target=id&&document.getElementById(id);if(!target)return;event.preventDefault();
  requestAnimationFrame(()=>{const top=target.getBoundingClientRect().top+scrollY-$('.site-header').offsetHeight-22;const url=new URL(location.href);url.hash=id;history.replaceState(null,'',url);window.scrollTo({top:Math.max(0,top),behavior:motionReduced()?'instant':'smooth'});});
 });
 async function copy(value,key,element){if(!value)return;try{await navigator.clipboard.writeText(value);announce(key);}catch{if(element){const range=document.createRange();range.selectNodeContents(element);const selection=getSelection();selection.removeAllRanges();selection.addRange(range);}announce('copyFallback');}}
 $('#copy-code').addEventListener('click',()=>copy(config.crosshair,'codeCopied',$('#crosshair-code')));
 $('#copy-email').addEventListener('click',()=>copy(config.links.email,'emailCopied',$('#email-value')));
 $('#bg-toggle').addEventListener('click',()=>$('.aim-scene').classList.toggle('light'));
 $('#share-site').addEventListener('click',async()=>{const url=new URL(location.href);url.searchParams.set('lang',language);url.hash='';try{if(navigator.share)await navigator.share({title:t('title'),url:url.href});else{await navigator.clipboard.writeText(url.href);announce('siteCopied');}}catch(error){if(error.name!=='AbortError')announce('shareFallback');}});
 let scrollQueued=false;
 function updateScroll(){const height=document.documentElement.scrollHeight-innerHeight;$('.scroll-progress').style.transform=`scaleX(${height>0?Math.min(1,scrollY/height):0})`;$('.site-header').classList.toggle('scrolled',scrollY>40);const hero=$('#home');hero.style.setProperty('--hero-progress',String(Math.min(1,scrollY/Math.max(1,hero.offsetHeight))));scrollQueued=false;}
 addEventListener('scroll',()=>{if(!scrollQueued){scrollQueued=true;requestAnimationFrame(updateScroll);}},{passive:true});addEventListener('resize',updateScroll);updateScroll();
 if('IntersectionObserver' in window){
  document.documentElement.classList.add('reveal-ready');
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in-view');observer.unobserve(entry.target);}}),{threshold:.08});
  all('[data-reveal]').forEach((element,index)=>{element.style.setProperty('--reveal-delay',`${Math.min(index%3,2)*65}ms`);observer.observe(element);});
  const navObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{const link=$(`#main-nav a[href="#${entry.target.id}"]`);if(link){link.classList.toggle('active',entry.isIntersecting);if(entry.isIntersecting)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');}}),{rootMargin:'-18% 0px -52% 0px'});all('main section[id]').forEach(section=>navObserver.observe(section));
 }
 if(matchMedia('(hover: hover) and (pointer: fine)').matches){all('.button').forEach(button=>{button.addEventListener('pointermove',event=>{if(motionReduced())return;const r=button.getBoundingClientRect();button.style.setProperty('--mx',`${(event.clientX-r.x-r.width/2)*.035}px`);button.style.setProperty('--my',`${(event.clientY-r.y-r.height/2)*.06}px`);});button.addEventListener('pointerleave',()=>{button.style.removeProperty('--mx');button.style.removeProperty('--my');});});}
 async function refreshStats(){
  if(!config.statsEndpoint||statsBusy||document.hidden||Date.now()<nextStatsAt)return;statsBusy=true;const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),10000);
  try{const url=new URL(config.statsEndpoint,location.origin);if(url.origin!==location.origin)throw Error();const response=await fetch(url,{signal:controller.signal,cache:'no-store'});if(!response.ok){if(response.status===429)nextStatsAt=Date.now()+Math.max(60,Number(response.headers.get('Retry-After'))||120)*1000;try{if((await response.json()).clear)lastStats=null;}catch{}throw Error();}const data=await response.json();if(!Number.isFinite(new Date(data.updatedAt).getTime()))throw Error();lastStats=data;statsFailed=false;nextStatsAt=0;}
  catch{statsFailed=true;}finally{clearTimeout(timeout);statsBusy=false;renderStats();}
 }
 refreshStats();setInterval(refreshStats,60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshStats();});
})();
