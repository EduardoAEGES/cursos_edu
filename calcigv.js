/* =====================================================================
   calcigv.js — calculadora flotante de IGV.

   Se arrastra por su cabecera, recuerda si quedó abierta y copia el
   resultado al tocarlo. La página solo tiene que cargar el archivo.
   ===================================================================== */
(function(){
'use strict';
var TASA=0.18;

function fmt(n){
  if(!isFinite(n)) return '—';
  var neg=n<0, p=Math.abs(n).toFixed(2).split('.');
  return (neg?'-':'')+p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')+'.'+p[1];
}
function num(t){
  var s=String(t||'').replace(/[\s,]/g,'').replace(/S\/?/gi,'');
  if(s==='') return null;
  var n=parseFloat(s);
  return isNaN(n)?null:n;
}
var css=''+
'.ci-btn{ position:fixed; right:16px; bottom:16px; z-index:70; width:52px; height:52px;'+
'  border-radius:50%; border:0; cursor:pointer; background:#1F5FA8; color:#fff; font-size:22px;'+
'  box-shadow:0 6px 18px rgba(0,0,0,.28); display:grid; place-items:center; }'+
'.ci-btn:hover{ filter:brightness(1.1); }'+
'.ci-panel{ position:fixed; right:16px; bottom:78px; z-index:71; width:290px; max-width:calc(100vw - 24px);'+
'  background:#fff; border:1px solid #D6DBE2; border-radius:12px; box-shadow:0 16px 40px rgba(0,0,0,.26);'+
'  font-family:inherit; overflow:hidden; }'+
'.ci-panel[hidden]{ display:none !important; }'+
'.ci-h{ display:flex; align-items:center; gap:8px; padding:9px 11px; background:#1F5FA8; color:#fff;'+
'  cursor:move; touch-action:none; user-select:none; }'+
'.ci-h b{ font-size:13px; flex:1; }'+
'.ci-h button{ border:0; background:transparent; color:#fff; cursor:pointer; font-size:18px;'+
'  line-height:1; padding:2px 5px; border-radius:5px; }'+
'.ci-h button:hover{ background:rgba(255,255,255,.18); }'+
'.ci-b{ padding:11px; display:grid; gap:11px; max-height:min(66vh,430px); overflow-y:auto; }'+
'.ci-g{ border:1px solid #E4E8ED; border-radius:9px; padding:9px 10px; display:grid; gap:6px; }'+
'.ci-t{ font-size:10.5px; font-weight:800; letter-spacing:.05em; text-transform:uppercase; color:#6B7785; }'+
'.ci-g label{ display:grid; gap:3px; font-size:11.5px; color:#6B7785; }'+
'.ci-g input{ font:inherit; font-size:15px; font-weight:700; text-align:right; padding:6px 8px;'+
'  border-radius:7px; border:1.5px solid #E8CE8A; background:#FFF8E1; color:#4A3C0E;'+
'  font-variant-numeric:tabular-nums; width:100%; box-sizing:border-box; }'+
'.ci-g input:focus{ outline:2px solid #1F5FA8; outline-offset:1px; }'+
'.ci-r{ display:flex; justify-content:space-between; align-items:center; gap:8px; font-size:12.5px;'+
'  padding:5px 7px; border-radius:7px; background:#F5F7FA; cursor:pointer; }'+
'.ci-r:hover{ background:#EAF0F7; }'+
'.ci-r .v{ font-weight:800; font-variant-numeric:tabular-nums; color:#1F5FA8; }'+
'.ci-r.g{ background:#E6F4EA; }'+
'.ci-r.g .v{ color:#14532D; }'+
'.ci-copia{ font-size:11px; color:#6B7785; text-align:center; }'+
'.ci-copia.ok{ color:#14532D; font-weight:700; }'+
'@media (prefers-reduced-motion: reduce){ .ci-btn, .ci-panel{ transition:none; } }';

function crea(){
  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

  var btn=document.createElement('button');
  btn.className='ci-btn'; btn.type='button';
  btn.setAttribute('aria-label','Calculadora de IGV');
  btn.textContent='🧮';

  var p=document.createElement('div');
  p.className='ci-panel'; p.hidden=true;
  p.setAttribute('role','dialog'); p.setAttribute('aria-label','Calculadora de IGV');
  p.innerHTML=
    '<div class="ci-h"><b>Calculadora de IGV</b>'+
      '<button type="button" data-ci="cerrar" aria-label="Cerrar">×</button></div>'+
    '<div class="ci-b">'+
      '<div class="ci-g"><div class="ci-t">Tengo el valor de venta</div>'+
        '<label>Valor de venta<input type="text" inputmode="decimal" data-ci="vv" placeholder="0.00"></label>'+
        '<div class="ci-r" data-v="vv-igv"><span>IGV 18 %</span><span class="v">—</span></div>'+
        '<div class="ci-r g" data-v="vv-tot"><span>Importe total</span><span class="v">—</span></div>'+
      '</div>'+
      '<div class="ci-g"><div class="ci-t">Tengo el total con IGV</div>'+
        '<label>Importe total<input type="text" inputmode="decimal" data-ci="tot" placeholder="0.00"></label>'+
        '<div class="ci-r g" data-v="tot-vv"><span>Valor de venta</span><span class="v">—</span></div>'+
        '<div class="ci-r" data-v="tot-igv"><span>IGV 18 %</span><span class="v">—</span></div>'+
      '</div>'+
      '<div class="ci-g"><div class="ci-t">Cobro parcial</div>'+
        '<label>Importe total<input type="text" inputmode="decimal" data-ci="pt" placeholder="0.00"></label>'+
        '<label>Porcentaje cobrado<input type="text" inputmode="decimal" data-ci="pc" placeholder="40"></label>'+
        '<div class="ci-r g" data-v="pa-cob"><span>Se cobra</span><span class="v">—</span></div>'+
        '<div class="ci-r" data-v="pa-sal"><span>Queda pendiente</span><span class="v">—</span></div>'+
      '</div>'+
      '<div class="ci-copia" data-ci="aviso">Toca un resultado para copiarlo</div>'+
    '</div>';

  document.body.appendChild(btn);
  document.body.appendChild(p);

  function g(k){ return p.querySelector('[data-ci="'+k+'"]'); }
  function pon(k, n){ p.querySelector('[data-v="'+k+'"] .v').textContent = (n===null?'—':fmt(n)); }

  function calcula(){
    var vv=num(g('vv').value);
    pon('vv-igv', vv===null?null:vv*TASA);
    pon('vv-tot', vv===null?null:vv*(1+TASA));
    var t=num(g('tot').value);
    pon('tot-vv', t===null?null:t/(1+TASA));
    pon('tot-igv', t===null?null:t-t/(1+TASA));
    var pt=num(g('pt').value), pcv=num(g('pc').value);
    if(pt===null || pcv===null){ pon('pa-cob',null); pon('pa-sal',null); }
    else { pon('pa-cob', pt*pcv/100); pon('pa-sal', pt-pt*pcv/100); }
  }
  ['vv','tot','pt','pc'].forEach(function(k){
    g(k).addEventListener('input', calcula);
  });

  /* copiar al tocar el resultado */
  p.addEventListener('click', function(ev){
    var r=ev.target.closest('.ci-r');
    if(!r) return;
    var t=r.querySelector('.v').textContent;
    if(t==='—') return;
    var av=g('aviso');
    function ok(){ av.textContent='Copiado: '+t; av.className='ci-copia ok';
      setTimeout(function(){ av.textContent='Toca un resultado para copiarlo'; av.className='ci-copia'; }, 1600); }
    try{
      if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, function(){});
      else {
        var ta=document.createElement('textarea');
        ta.value=t; ta.style.position='fixed'; ta.style.opacity='0';
        document.body.appendChild(ta); ta.select();
        document.execCommand('copy'); ta.remove(); ok();
      }
    }catch(e){}
  });

  function abre(v){
    p.hidden=!v;
    btn.textContent = v ? '✕' : '🧮';
    try{ localStorage.setItem('calcigv', v?'1':'0'); }catch(e){}
    if(v) g('vv').focus();
  }
  btn.addEventListener('click', function(){ abre(p.hidden); });
  g('cerrar').addEventListener('click', function(){ abre(false); });
  document.addEventListener('keydown', function(e){ if(e.key==='Escape' && !p.hidden) abre(false); });

  /* arrastrar por la cabecera */
  var cab=p.querySelector('.ci-h'), mov=null;
  cab.addEventListener('pointerdown', function(ev){
    if(ev.target.closest('button')) return;
    var r=p.getBoundingClientRect();
    mov={ dx:ev.clientX-r.left, dy:ev.clientY-r.top, w:r.width, h:r.height, id:ev.pointerId };
    try{ cab.setPointerCapture(ev.pointerId); }catch(e){}
    ev.preventDefault();
  });
  cab.addEventListener('pointermove', function(ev){
    if(!mov || ev.pointerId!==mov.id) return;
    var x=Math.max(6, Math.min(window.innerWidth-mov.w-6, ev.clientX-mov.dx));
    var y=Math.max(6, Math.min(window.innerHeight-mov.h-6, ev.clientY-mov.dy));
    p.style.left=x+'px'; p.style.top=y+'px';
    p.style.right='auto'; p.style.bottom='auto';
  });
  cab.addEventListener('pointerup', function(ev){ if(mov && ev.pointerId===mov.id) mov=null; });
  cab.addEventListener('pointercancel', function(){ mov=null; });

  try{ if(localStorage.getItem('calcigv')==='1') abre(true); }catch(e){}
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', crea);
else crea();
})();
