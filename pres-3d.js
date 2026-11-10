/* pres-3d.js · Semana 13, Sesión 3: ajusta el zoom de cada lámina para llenar el espacio,
   cuenta los números al aparecer, deja girar las escenas 3D con el dedo o el mouse y
   mueve los simuladores. No toca respuestas ni puntos. */
(function(){
'use strict';
var lam=document.getElementById('lam'), esc=document.getElementById('esc'), tit=document.getElementById('tit');
if(!lam || !esc) return;
var ultimo='', ocupado=false;

function fmt(n, dec){ return n.toLocaleString('es-PE',{ minimumFractionDigits:dec, maximumFractionDigits:dec }); }

/* ---------- zoom para llenar la lámina ---------- */
function ajusta(){
  if(ocupado) return; ocupado=true;
  try{
    if(window.innerWidth<820){ lam.style.removeProperty('--pz'); return; }
    var W=esc.clientWidth, z=Math.max(1.0, Math.min(1.9, W/1180));
    lam.style.setProperty('--pz', z.toFixed(3));
    var n=0;
    while(n++<40 && z>0.55 && (lam.scrollHeight>lam.clientHeight+1 || lam.scrollWidth>lam.clientWidth+1)){
      z-=0.03; lam.style.setProperty('--pz', z.toFixed(3));
    }
    llena();
  }finally{ ocupado=false; }
}

/* la escena 3D crece para llenar el espacio que sobra en su columna */
function llena(){
  var e=lam.querySelector('.pz-esc'); if(!e) return;
  var m=/--ah:(\d+)px/.exec(e.getAttribute('style')||''); if(!m) return;
  var base=+m[1];
  e.style.setProperty('--ah', base+'px'); e.style.setProperty('--k', 1);
  var t2=lam.querySelector('.teo2'), t=lam.querySelector('.teo2 > .teo');
  var extra=0;
  if(t2 && t) extra=t2.offsetHeight-t.offsetHeight;
  else extra=lam.clientHeight-lam.scrollHeight-6;
  extra=Math.min(300, extra-14);
  if(extra>20){
    e.style.setProperty('--ah', (base+extra)+'px'); e.style.setProperty('--k', ((base+extra)/base).toFixed(3));
    if(lam.scrollHeight>lam.clientHeight+1){ e.style.setProperty('--ah', base+'px'); e.style.setProperty('--k', 1); }
  }
}

/* ---------- números que suben ---------- */
function cuenta(){
  var nueva=(tit ? tit.textContent : '')!==ultimo; ultimo=tit ? tit.textContent : '';
  var els=lam.querySelectorAll('[data-cuenta]');
  Array.prototype.forEach.call(els, function(el){
    var fin=parseFloat(el.getAttribute('data-cuenta')), dec=+(el.getAttribute('data-dec')||0);
    var pre=el.getAttribute('data-pre')||'', suf=el.getAttribute('data-suf')||'';
    if(!nueva || isNaN(fin) || window.matchMedia('(prefers-reduced-motion: reduce)').matches){ el.textContent=pre+fmt(fin,dec)+suf; return; }
    var t0=null, dur=1400, ret=+(el.getAttribute('data-ret')||0);
    function paso(t){
      if(t0===null) t0=t+ret*1000;
      var p=Math.max(0,Math.min(1,(t-t0)/dur)), e=1-Math.pow(1-p,3);
      el.textContent=pre+fmt(fin*e,dec)+suf;
      if(p<1 && document.body.contains(el)) requestAnimationFrame(paso);
    }
    el.textContent=pre+fmt(0,dec)+suf; requestAnimationFrame(paso);
  });
}

var obs=new MutationObserver(function(){ ajusta(); cuenta(); });
obs.observe(lam,{ childList:true });
if(window.ResizeObserver){ new ResizeObserver(function(){ ajusta(); }).observe(esc); }
window.addEventListener('resize', ajusta);
document.addEventListener('fullscreenchange', function(){ setTimeout(ajusta,60); });
new MutationObserver(function(){ setTimeout(ajusta,60); }).observe(esc,{ attributes:true, attributeFilter:['class'] });
ajusta(); cuenta();
/* las fuentes y los dibujos pueden cambiar el alto un momento después */
setTimeout(ajusta,400); setTimeout(ajusta,1500);

/* ---------- girar las escenas 3D ---------- */
var arr=null;
lam.addEventListener('pointerdown', function(ev){
  var e=ev.target.closest ? ev.target.closest('.pz-esc') : null;
  if(!e || e.hasAttribute('data-fija')) return;
  var m=e.querySelector('.pz-mundo'); if(!m) return;
  arr={ e:e, m:m, x:ev.clientX, g:parseFloat(m.getAttribute('data-ry')||0) };
  e.classList.add('quieta');
  try{ e.setPointerCapture(ev.pointerId); }catch(x){}
});
lam.addEventListener('pointermove', function(ev){
  if(!arr) return;
  var g=Math.max(-50, Math.min(50, arr.g+(ev.clientX-arr.x)*0.35));
  arr.m.setAttribute('data-ry', g); arr.m.style.setProperty('--ry', g+'deg');
});
function suelta(){ arr=null; }
lam.addEventListener('pointerup', suelta); lam.addEventListener('pointercancel', suelta);

/* ---------- simuladores ---------- */
lam.addEventListener('input', function(ev){
  var t=ev.target;
  if(t.id==='pzInv'){
    var pct=+t.value, ventas=2670, sig=650, ini=150;
    var fin=Math.round(pct/100*sig), prod=ventas+fin-ini;
    set('pzInvV', pct+' %'); set('pzFin', fmt(fin,0)); set('pzProd', fmt(prod,0)); set('pzVen', fmt(ventas,0));
    var c=document.getElementById('pzInvBar'); if(c){ c.style.setProperty('--h', Math.round(prod/2650*200)+'px'); }
    var f=document.getElementById('pzFinBar'); if(f){ f.style.setProperty('--h', Math.max(6, Math.round(fin/650*200))+'px'); }
  }
  if(t.id==='pzUtil'){
    var u=+t.value, lim=82500, a=Math.min(u,lim), b=Math.max(0,u-lim);
    var i1=a*0.10, i2=b*0.295, tot=i1+i2;
    set('pzUtilV','S/ '+fmt(u,0)); set('pzI1','S/ '+fmt(i1,2)); set('pzI2','S/ '+fmt(i2,2)); set('pzIT','S/ '+fmt(tot,2));
    set('pzEf', u>0 ? fmt(tot/u*100,1)+' %' : '0 %');
    var w1=u>0 ? a/u*100 : 100, w2=100-w1;
    var s1=document.getElementById('pzT1'), s2=document.getElementById('pzT2');
    if(s1){ s1.style.width=w1+'%'; s1.textContent=w1>14 ? '10 %' : ''; }
    if(s2){ s2.style.width=w2+'%'; s2.textContent=w2>14 ? '29.5 %' : ''; }
  }
});
function set(id, v){ var el=document.getElementById(id); if(el) el.textContent=v; }
})();
