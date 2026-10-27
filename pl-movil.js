/* ============================================================
   Modo celular de las sesiones de Pensamiento Lógico.
   - Pone la clase «movil» en <html> en teléfonos y tabletas en vertical;
     en computadora no hace nada y la página se ve igual que siempre.
   - Mientras se arrastra una ficha, si el dedo (o el ratón) llega al borde
     de arriba o de abajo de la lámina, la lámina se desliza sola, así se
     alcanza cualquier caja.
   Va en el <head>, antes del resto, para que la clase esté desde el inicio.
   ============================================================ */
(function(){
'use strict';
var raiz=document.documentElement;
var mq=window.matchMedia ? window.matchMedia('(max-width: 820px), (pointer: coarse) and (max-width: 1100px)') : null;
function aplica(){ raiz.classList.toggle('movil', !!(mq && mq.matches)); }
aplica();
if(mq){ if(mq.addEventListener) mq.addEventListener('change', aplica); else if(mq.addListener) mq.addListener(aplica); }

/* ---- la lámina se desliza sola al arrastrar cerca del borde ---- */
var vel=0, cuadro=null;
function lam(){ return document.getElementById('lam'); }
function arrastrando(){ return !!document.querySelector('.fantasma'); }
function paso(){
  cuadro=null;
  var l=lam();
  if(!vel || !l || !arrastrando()){ vel=0; return; }
  l.scrollTop+=vel;
  cuadro=requestAnimationFrame(paso);
}
document.addEventListener('pointermove', function(e){
  if(!arrastrando()){ vel=0; return; }
  var l=lam(); if(!l) return;
  var r=l.getBoundingClientRect(), m=Math.min(80, r.height/4);
  if(e.clientY < r.top+m)         vel=-Math.ceil((r.top+m-e.clientY)/5);
  else if(e.clientY > r.bottom-m) vel= Math.ceil((e.clientY-(r.bottom-m))/5);
  else vel=0;
  if(vel && !cuadro) cuadro=requestAnimationFrame(paso);
}, { passive:true });
['pointerup','pointercancel'].forEach(function(t){
  document.addEventListener(t, function(){ vel=0; }, { passive:true });
});
})();
