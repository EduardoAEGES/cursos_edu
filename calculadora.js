/* =====================================================================
   calculadora.js — calculadora flotante con paréntesis y porcentaje.

   Escribe la operación completa y la evalúa: 1500*18% da 270, y
   1500+18% da 1770. Se arrastra por su cabecera y responde al teclado.
   ===================================================================== */
(function(){
'use strict';

var css=''+
'.ca-btn{ position:fixed; right:16px; bottom:16px; z-index:70; width:54px; height:54px;'+
'  border-radius:50%; border:1px solid #F0871F; cursor:pointer; color:#FFD9A8; font-size:23px;'+
'  background:radial-gradient(circle at 34% 28%, #46225E 0%, #21102F 62%, #120A1B 100%);'+
'  box-shadow:0 6px 18px rgba(0,0,0,.45), 0 0 16px rgba(240,135,31,.42);'+
'  display:grid; place-items:center; }'+
'.ca-btn:hover{ box-shadow:0 6px 20px rgba(0,0,0,.5), 0 0 26px rgba(240,135,31,.75); }'+
'.ca-p{ position:fixed; right:16px; bottom:82px; z-index:71; width:280px; max-width:calc(100vw - 24px);'+
'  background:#1A0F26; border:1px solid #4A2A66; border-radius:13px;'+
'  box-shadow:0 18px 44px rgba(0,0,0,.6), 0 0 0 1px rgba(240,135,31,.18);'+
'  overflow:hidden; font-family:inherit; color:#EDE6DA; }'+
'.ca-p[hidden]{ display:none !important; }'+
'.ca-h{ display:flex; align-items:center; gap:8px; padding:9px 11px; color:#FFD9A8;'+
'  background:linear-gradient(180deg,#3B1B52 0%,#261236 100%); border-bottom:1px solid #F0871F;'+
'  cursor:move; touch-action:none; user-select:none; }'+
'.ca-h b{ font-size:13px; flex:1; letter-spacing:.6px; font-weight:700; }'+
'.ca-h button{ border:0; background:transparent; color:#FFD9A8; cursor:pointer; font-size:18px;'+
'  line-height:1; padding:2px 5px; border-radius:5px; }'+
'.ca-h button:hover{ background:rgba(240,135,31,.28); }'+
'.ca-v{ padding:10px 12px 8px; text-align:right; background:#120A1B;'+
'  border-bottom:1px solid #3A2150; }'+
'.ca-e{ font-size:15px; color:#B9A7CE; font-variant-numeric:tabular-nums; min-height:20px;'+
'  overflow-x:auto; white-space:nowrap; direction:rtl; }'+
'.ca-n{ font-size:26px; font-weight:800; color:#FFB25C; font-variant-numeric:tabular-nums;'+
'  text-shadow:0 0 12px rgba(240,135,31,.45);'+
'  overflow:hidden; text-overflow:ellipsis; white-space:nowrap; line-height:1.25; }'+
'.ca-n.err{ color:#FF7A6B; font-size:18px; text-shadow:none; }'+
'.ca-t{ display:grid; grid-template-columns:repeat(5,1fr); gap:1px; background:#3A2150; }'+
'.ca-t button{ border:0; background:#241534; cursor:pointer; font:inherit; font-size:16px;'+
'  font-weight:700; color:#EDE6DA; padding:12px 0; }'+
'.ca-t button:hover{ background:#33204A; }'+
'.ca-t button:active{ background:#42285E; }'+
'.ca-t .fn{ background:#1D1129; color:#A78BC4; font-size:14px; }'+
'.ca-t .fn:hover{ background:#2A1A3C; }'+
'.ca-t .op{ color:#FFB25C; }'+
'.ca-t .ig{ background:linear-gradient(180deg,#F0871F 0%,#C9660B 100%); color:#1A0F26; }'+
'.ca-t .ig:hover{ filter:brightness(1.12); }'+
'.ca-pie{ font-size:10.5px; color:#9A86B4; text-align:center; padding:7px 8px; background:#160D20; }';

/* ---------- evaluación ---------- */
function calcula(txt){
  var s=String(txt).replace(/\s+/g,'').replace(/,/g,'.')
        .replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-');
  if(!s) return null;
  var i=0;
  function fin(){ return i>=s.length; }
  function ver(){ return s.charAt(i); }
  function numero(){
    var ini=i;
    while(!fin() && (ver()>='0' && ver()<='9')) i++;
    if(ver()==='.'){ i++; while(!fin() && (ver()>='0' && ver()<='9')) i++; }
    if(i===ini) throw 0;
    return parseFloat(s.slice(ini,i));
  }
  /* primario: número, paréntesis o raíz */
  function primario(){
    if(ver()==='('){ i++; var v=suma().v; if(ver()!==')') throw 0; i++; return {v:v, pct:false}; }
    if(ver()==='√'){ i++; var f=factor(); if(f.v<0) throw 'raiz'; return {v:Math.sqrt(f.v), pct:false}; }
    if(ver()==='-'){ i++; var u=primario(); return {v:-u.v, pct:u.pct}; }
    if(ver()==='+'){ i++; return primario(); }
    return {v:numero(), pct:false};
  }
  function posfijo(t){
    while(!fin() && ver()==='%'){ i++; t={v:t.v/100, pct:true}; }
    return t;
  }
  function factor(){
    var t=posfijo(primario());
    if(!fin() && ver()==='^'){
      i++;
      var e=factor();
      t={v:Math.pow(t.v, e.v), pct:false};
    }
    return t;
  }
  function producto(){
    var t=factor();
    while(!fin() && (ver()==='*' || ver()==='/')){
      var o=ver(); i++;
      var d=factor();
      if(o==='/' && d.v===0) throw 'cero';
      t={v:(o==='*' ? t.v*d.v : t.v/d.v), pct:false};
    }
    return t;
  }
  /* en una suma, 18% significa el 18 % de lo acumulado */
  function suma(){
    var t=producto();
    while(!fin() && (ver()==='+' || ver()==='-')){
      var o=ver(); i++;
      var d=producto();
      var val = d.pct ? t.v*d.v : d.v;
      t={v:(o==='+' ? t.v+val : t.v-val), pct:false};
    }
    return t;
  }
  var r=suma();
  if(!fin()) throw 0;
  if(!isFinite(r.v)) throw 0;
  return r.v;
}

function miles(n){
  var neg=n<0, x=Math.abs(n);
  var r=Math.round(x*1e10)/1e10;
  var s=String(r);
  if(s.indexOf('e')>=0) return (neg?'-':'')+s;
  var p=s.split('.');
  p[0]=p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (neg?'-':'')+p.join('.');
}

function crea(){
  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

  var btn=document.createElement('button');
  btn.className='ca-btn'; btn.type='button';
  btn.setAttribute('aria-label','Calculadora');
  btn.textContent='🎃';

  var p=document.createElement('div');
  p.className='ca-p'; p.hidden=true;
  p.setAttribute('role','dialog'); p.setAttribute('aria-label','Calculadora');

  var TECLAS=[
    ['(','fn','('], [')','fn',')'], ['%','fn','%'], ['√','fn','√'], ['C','fn','C'],
    ['1','','1'],   ['2','','2'],   ['3','','3'],   ['÷','op','/'], ['←','fn','B'],
    ['4','','4'],   ['5','','5'],   ['6','','6'],   ['×','op','*'], ['x²','fn','^2'],
    ['7','','7'],   ['8','','8'],   ['9','','9'],   ['−','op','-'], ['xʸ','fn','^'],
    ['0','','0'],   ['.','','.'],   ['±','fn','N'], ['+','op','+'], ['=','ig','=']
  ];
  var ht='';
  TECLAS.forEach(function(t){
    ht+='<button type="button" class="'+t[1]+'" data-k="'+t[2]+'">'+t[0]+'</button>';
  });
  p.innerHTML=
    '<div class="ca-h"><b>🕯️ Calculadora</b><button type="button" data-ca="cerrar" aria-label="Cerrar">×</button></div>'+
    '<div class="ca-v"><div class="ca-e" id="caE"></div>'+
      '<div class="ca-n" id="caN" aria-live="polite">0</div></div>'+
    '<div class="ca-t">'+ht+'</div>'+
    '<div class="ca-pie">1500×18% = 270 · 1500+18% = 1770</div>';

  document.body.appendChild(btn);
  document.body.appendChild(p);

  var eDiv=p.querySelector('#caE'), nDiv=p.querySelector('#caN');
  var exp='';

  function bonita(t){
    return t.replace(/\*/g,'×').replace(/\//g,'÷').replace(/-/g,'−');
  }
  function muestra(){
    eDiv.textContent=bonita(exp);
    if(!exp){ nDiv.textContent='0'; nDiv.className='ca-n'; return; }
    try{
      var v=calcula(exp);
      nDiv.textContent = (v===null) ? '0' : miles(v);
      nDiv.className='ca-n';
    }catch(e){
      nDiv.textContent='…';
      nDiv.className='ca-n';
    }
  }
  function tecla(k){
    if(k==='C'){ exp=''; }
    else if(k==='B'){ exp=exp.slice(0,-1); }
    else if(k==='='){
      try{
        var v=calcula(exp);
        if(v===null){ muestra(); return; }
        exp=String(Math.round(v*1e10)/1e10);
        eDiv.textContent=''; nDiv.textContent=miles(v); nDiv.className='ca-n';
        return;
      }catch(e){
        nDiv.textContent = e==='cero' ? 'no se puede dividir entre cero'
                        : (e==='raiz' ? 'no hay raíz de un número negativo'
                                      : 'operación incompleta');
        nDiv.className='ca-n err';
        return;
      }
    }
    else if(k==='N'){
      /* cambia el signo del último número escrito */
      var m=exp.match(/(\d+\.?\d*)$/);
      if(m){
        var ini=exp.length-m[1].length;
        var antes=exp.slice(0,ini);
        if(antes.slice(-2)==='(-') exp=antes.slice(0,-2)+m[1];
        else exp=antes+'(-'+m[1];
      }
    }
    else exp+=k;
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
    var t=e.target, esCampo = t && (t.tagName==='INPUT' || t.tagName==='TEXTAREA' || t.isContentEditable);
    if(esCampo) return;                 /* no robar el teclado a los campos del asiento */
    var k=e.key;
    if(k==='Escape'){ abre(false); return; }
    if((k>='0' && k<='9') || k==='.' || k===',' ){ tecla(k===','?'.':k); e.preventDefault(); return; }
    if(k==='+'||k==='-'||k==='*'||k==='/'||k==='('||k===')'||k==='%'||k==='^'){ tecla(k); e.preventDefault(); return; }
    if(k==='Enter'||k==='='){ tecla('='); e.preventDefault(); return; }
    if(k==='Backspace'){ tecla('B'); e.preventDefault(); return; }
    if(k==='Delete'||k.toLowerCase()==='c'){ tecla('C'); e.preventDefault(); }
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
