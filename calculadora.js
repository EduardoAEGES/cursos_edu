/* =====================================================================
   calculadora.js — calculadora básica flotante.

   Se arrastra por su cabecera, funciona con el teclado y recuerda si
   quedó abierta. La página solo tiene que cargar el archivo.
   ===================================================================== */
(function(){
'use strict';

var css=''+
'.ca-btn{ position:fixed; right:16px; bottom:16px; z-index:70; width:52px; height:52px;'+
'  border-radius:50%; border:0; cursor:pointer; background:#1F5FA8; color:#fff; font-size:21px;'+
'  box-shadow:0 6px 18px rgba(0,0,0,.28); display:grid; place-items:center; }'+
'.ca-btn:hover{ filter:brightness(1.1); }'+
'.ca-p{ position:fixed; right:16px; bottom:78px; z-index:71; width:252px; max-width:calc(100vw - 24px);'+
'  background:#fff; border:1px solid #D6DBE2; border-radius:12px; box-shadow:0 16px 40px rgba(0,0,0,.26);'+
'  overflow:hidden; font-family:inherit; }'+
'.ca-p[hidden]{ display:none !important; }'+
'.ca-h{ display:flex; align-items:center; gap:8px; padding:8px 11px; background:#1F5FA8; color:#fff;'+
'  cursor:move; touch-action:none; user-select:none; }'+
'.ca-h b{ font-size:12.5px; flex:1; }'+
'.ca-h button{ border:0; background:transparent; color:#fff; cursor:pointer; font-size:18px;'+
'  line-height:1; padding:2px 5px; border-radius:5px; }'+
'.ca-h button:hover{ background:rgba(255,255,255,.18); }'+
'.ca-v{ padding:10px 12px 8px; text-align:right; background:#F7F9FC; border-bottom:1px solid #E4E8ED; }'+
'.ca-op{ font-size:11.5px; color:#6B7785; min-height:15px; font-variant-numeric:tabular-nums; }'+
'.ca-n{ font-size:27px; font-weight:800; color:#16467C; font-variant-numeric:tabular-nums;'+
'  overflow:hidden; text-overflow:ellipsis; white-space:nowrap; line-height:1.2; }'+
'.ca-t{ display:grid; grid-template-columns:repeat(4,1fr); gap:1px; background:#E4E8ED; }'+
'.ca-t button{ border:0; background:#fff; cursor:pointer; font:inherit; font-size:17px;'+
'  font-weight:700; color:#26303D; padding:13px 0; }'+
'.ca-t button:hover{ background:#EEF2F7; }'+
'.ca-t button:active{ background:#DDE5EE; }'+
'.ca-t .fn{ background:#F3F5F8; color:#6B7785; font-size:15px; }'+
'.ca-t .op{ color:#1F5FA8; }'+
'.ca-t .ig{ background:#1F5FA8; color:#fff; }'+
'.ca-t .ig:hover{ background:#2A6FBD; }'+
'.ca-pie{ font-size:10.5px; color:#8A93A0; text-align:center; padding:6px 8px; }';

function crea(){
  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

  var btn=document.createElement('button');
  btn.className='ca-btn'; btn.type='button';
  btn.setAttribute('aria-label','Calculadora');
  btn.textContent='🧮';

  var p=document.createElement('div');
  p.className='ca-p'; p.hidden=true;
  p.setAttribute('role','dialog'); p.setAttribute('aria-label','Calculadora');

  var TECLAS=[
    ['C','fn','c'], ['←','fn','borra'], ['%','fn','%'], ['÷','op','/'],
    ['7','','7'], ['8','','8'], ['9','','9'], ['×','op','*'],
    ['4','','4'], ['5','','5'], ['6','','6'], ['−','op','-'],
    ['1','','2'.replace('2','1')], ['2','','2'], ['3','','3'], ['+','op','+'],
    ['0','','0'], [',','','.'], ['±','fn','neg'], ['=','ig','=']
  ];
  var ht='';
  TECLAS.forEach(function(t){
    ht+='<button type="button" class="'+t[1]+'" data-k="'+t[2]+'">'+t[0]+'</button>';
  });
  p.innerHTML=
    '<div class="ca-h"><b>Calculadora</b><button type="button" data-ca="cerrar" aria-label="Cerrar">×</button></div>'+
    '<div class="ca-v"><div class="ca-op" id="caOp"></div>'+
      '<div class="ca-n" id="caN" aria-live="polite">0</div></div>'+
    '<div class="ca-t">'+ht+'</div>'+
    '<div class="ca-pie">También funciona con el teclado</div>';

  document.body.appendChild(btn);
  document.body.appendChild(p);

  var vis=p.querySelector('#caN'), lin=p.querySelector('#caOp');
  var ent='0', acc=null, op=null, nuevo=true;

  function fmt(n){
    if(n===null||n===undefined) return '';
    if(!isFinite(n)) return 'error';
    var r=Math.round(n*1e10)/1e10;
    var s=String(r);
    if(s.indexOf('e')>=0) return s;
    var pr=s.split('.');
    pr[0]=pr[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return pr.join(',').replace(/,(\d+)$/, function(m,d){ return pr.length>1 ? ','+d : m; });
  }
  function muestra(){
    if(ent==='ERR'){ vis.textContent='error'; lin.textContent=''; return; }
    var pr=ent.split('.');
    pr[0]=pr[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    vis.textContent=pr.join(',');
    lin.textContent = (acc===null) ? '' : (fmt(acc)+' '+simbolo(op));
  }
  function simbolo(o){ return o==='*'?'×':(o==='/'?'÷':(o==='-'?'−':(o||''))); }
  function valor(){ return parseFloat(ent.replace(/,/g,'')) || 0; }
  function opera(a, b, o){
    if(o==='+') return a+b;
    if(o==='-') return a-b;
    if(o==='*') return a*b;
    if(o==='/') return b===0 ? NaN : a/b;
    return b;
  }
  function pon(n){
    if(!isFinite(n)){ ent='ERR'; acc=null; op=null; nuevo=true; return; }
    var r=Math.round(n*1e10)/1e10;
    ent=String(r); nuevo=true;
  }
  function tecla(k){
    if(ent==='ERR' && k!=='c'){ ent='0'; acc=null; op=null; nuevo=true; }
    if(k>='0' && k<='9'){
      if(nuevo || ent==='0'){ ent=k; nuevo=false; }
      else if(ent.replace(/[^0-9]/g,'').length<14) ent+=k;
    }
    else if(k==='.'){
      if(nuevo){ ent='0.'; nuevo=false; }
      else if(ent.indexOf('.')<0) ent+='.';
    }
    else if(k==='c'){ ent='0'; acc=null; op=null; nuevo=true; }
    else if(k==='borra'){
      if(nuevo){ ent='0'; }
      else { ent=ent.slice(0,-1); if(ent===''||ent==='-') ent='0'; }
    }
    else if(k==='neg'){
      ent = (ent.charAt(0)==='-') ? ent.slice(1) : ('-'+ent);
    }
    else if(k==='%'){
      var v=valor();
      pon(acc!==null && (op==='+'||op==='-') ? acc*v/100 : v/100);
    }
    else if(k==='+'||k==='-'||k==='*'||k==='/'){
      if(acc!==null && op && !nuevo) acc=opera(acc, valor(), op);
      else acc=valor();
      op=k; nuevo=true;
      if(!isFinite(acc)){ ent='ERR'; acc=null; op=null; muestra(); return; }
      ent=String(Math.round(acc*1e10)/1e10);
    }
    else if(k==='='){
      if(acc!==null && op){ pon(opera(acc, valor(), op)); acc=null; op=null; }
      else nuevo=true;
    }
    muestra();
  }
  p.querySelector('.ca-t').addEventListener('click', function(ev){
    var b=ev.target.closest('button[data-k]');
    if(b) tecla(b.getAttribute('data-k'));
  });

  function abre(v){
    p.hidden=!v;
    btn.textContent = v ? '✕' : '🧮';
    try{ localStorage.setItem('calcbasica', v?'1':'0'); }catch(e){}
  }
  btn.addEventListener('click', function(){ abre(p.hidden); });
  p.querySelector('[data-ca="cerrar"]').addEventListener('click', function(){ abre(false); });

  document.addEventListener('keydown', function(e){
    if(p.hidden) return;
    var t=e.target, dentro=t && t.closest && t.closest('.ca-p');
    var esCampo = t && (t.tagName==='INPUT' || t.tagName==='TEXTAREA' || t.isContentEditable);
    if(esCampo && !dentro) return;          /* no robar el teclado a los campos del asiento */
    var k=e.key;
    if(k==='Escape'){ abre(false); return; }
    if(k>='0' && k<='9'){ tecla(k); e.preventDefault(); return; }
    if(k==='.'||k===','){ tecla('.'); e.preventDefault(); return; }
    if(k==='+'||k==='-'||k==='*'||k==='/'){ tecla(k); e.preventDefault(); return; }
    if(k==='Enter'||k==='='){ tecla('='); e.preventDefault(); return; }
    if(k==='Backspace'){ tecla('borra'); e.preventDefault(); return; }
    if(k==='%'){ tecla('%'); e.preventDefault(); return; }
    if(k==='Delete'||k.toLowerCase()==='c'){ tecla('c'); e.preventDefault(); }
  });

  /* arrastrar por la cabecera */
  var cab=p.querySelector('.ca-h'), mov=null;
  cab.addEventListener('pointerdown', function(ev){
    if(ev.target.closest('button')) return;
    var r=p.getBoundingClientRect();
    mov={ dx:ev.clientX-r.left, dy:ev.clientY-r.top, w:r.width, h:r.height, id:ev.pointerId };
    try{ cab.setPointerCapture(ev.pointerId); }catch(e){}
    ev.preventDefault();
  });
  cab.addEventListener('pointermove', function(ev){
    if(!mov || ev.pointerId!==mov.id) return;
    p.style.left=Math.max(6, Math.min(window.innerWidth-mov.w-6, ev.clientX-mov.dx))+'px';
    p.style.top =Math.max(6, Math.min(window.innerHeight-mov.h-6, ev.clientY-mov.dy))+'px';
    p.style.right='auto'; p.style.bottom='auto';
  });
  cab.addEventListener('pointerup', function(ev){ if(mov && ev.pointerId===mov.id) mov=null; });
  cab.addEventListener('pointercancel', function(){ mov=null; });

  muestra();
  try{ if(localStorage.getItem('calcbasica')==='1') abre(true); }catch(e){}
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', crea);
else crea();
})();
