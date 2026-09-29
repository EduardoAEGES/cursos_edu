/* =====================================================================
   reiniciar.js — botón para empezar de nuevo, con confirmación.

   La página solo necesita un contenedor vacío y una llamada:

       Reinicio.monta({
         donde : 'idDelContenedor' | elemento,
         claves: ['pr_avance','pr_caso'],   lo que se borra del navegador
         texto : 'Reiniciar todo',          opcional
         aviso : '¿Borrar todo tu avance?', opcional
         hecho : function(){ ... }          qué hacer después de borrar
       });

   Pide confirmación en dos pasos y se arrepiente solo a los 8 segundos,
   para que nadie pierda su trabajo por un clic distraído.
   ===================================================================== */
(function(){
'use strict';

var css=''+
'.rei{ display:inline-flex; align-items:center; gap:7px; flex-wrap:wrap; }'+
'.rei button{ font:inherit; font-size:12.5px; font-weight:700; cursor:pointer;'+
'  border:1px solid var(--o-border,#D6DBE2); background:#fff; color:var(--o-muted,#6B7785);'+
'  border-radius:8px; padding:7px 13px; line-height:1.3; }'+
'.rei button:hover{ border-color:#B42318; color:#B42318; background:#FDECEA; }'+
'.rei .rei-si{ background:#B42318; border-color:#B42318; color:#fff; }'+
'.rei .rei-si:hover{ background:#8F1B12; border-color:#8F1B12; color:#fff; }'+
'.rei .rei-no:hover{ border-color:var(--o-border,#D6DBE2); color:var(--o-muted,#6B7785); background:#F4F6F8; }'+
'.rei .rei-txt{ font-size:12px; font-weight:600; color:#B42318; line-height:1.4; }'+
'.rei .rei-txt.ok{ color:#14532D; }';

var puesto=false;
function estilos(){
  if(puesto) return;
  puesto=true;
  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
}

function nota(f, dur, vol){
  try{
    var ac=nota.ac || (nota.ac=new (window.AudioContext||window.webkitAudioContext)());
    var o=ac.createOscillator(), g=ac.createGain(), t=ac.currentTime;
    o.type='triangle'; o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(f*0.6, t+dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol||0.05, t+0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
    o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t+dur+0.02);
  }catch(e){}
}

function monta(op){
  estilos();
  var caja = (typeof op.donde==='string') ? document.getElementById(op.donde) : op.donde;
  if(!caja) return;
  caja.classList.add('rei');

  var texto = op.texto || 'Reiniciar';
  var aviso = op.aviso || 'Se borrará todo lo que llevas en esta actividad.';
  var reloj = null;

  function quieto(){
    if(reloj){ clearTimeout(reloj); reloj=null; }
    caja.innerHTML='<button type="button" class="rei-ini">↺ '+texto+'</button>';
    caja.querySelector('.rei-ini').addEventListener('click', pregunta);
  }

  function pregunta(){
    caja.innerHTML=
      '<span class="rei-txt">'+aviso+'</span>'+
      '<button type="button" class="rei-si">Sí, reiniciar</button>'+
      '<button type="button" class="rei-no">Cancelar</button>';
    caja.querySelector('.rei-si').addEventListener('click', borra);
    caja.querySelector('.rei-no').addEventListener('click', quieto);
    reloj=setTimeout(quieto, 8000);
  }

  function borra(){
    if(reloj){ clearTimeout(reloj); reloj=null; }
    (op.claves||[]).forEach(function(k){
      try{ localStorage.removeItem(k); }catch(e){}
    });
    try{ if(op.hecho) op.hecho(); }catch(e){}
    nota(520, 0.28, 0.05);
    caja.innerHTML='<span class="rei-txt ok">Listo, empezaste de nuevo.</span>';
    setTimeout(quieto, 2600);
  }

  quieto();
}

window.Reinicio={ monta:monta };
})();
