/* Matematicas Aplicadas - motor compartido de las sesiones web (semanas 11 a 16).
   Extraido de la sesion 9. Cada pagina define sus diapositivas y actividades
   y llama a MatSesion.monta({ D:..., ACT:..., LS:..., sala:... }).

   Ayudas que la pagina puede usar al armar sus datos:
     P      - rutas de los personajes Thomas Jefferson
     globo  - un personaje con su globo de dialogo
     globo2 - dos personajes con un globo
     drive  - boton que abre la carpeta de Drive del curso
     proy   - bloque de indicaciones del avance del proyecto               */
(function(){
'use strict';
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
                        .replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
var P={ pres:'personajes/tj-docente-presenta.webp', idea:'personajes/tj-docente-puntero.webp',
        full:'personajes/tj-alumna-sorpresa.webp',   expl:'personajes/tj-docente-puntero.webp',
        bien:'personajes/tj-alumno-senala.webp',     alum:'personajes/tj-alumno-sentado.webp' };
window.P=P;
window.esc2=esc;
window.globo=function(img, et, txt){
  return '<div class="perso"><img src="'+img+'" alt="" loading="lazy">'+
         '<div class="globo"><span class="et">'+esc(et)+'</span>'+txt+'</div></div>';
};
window.globo2=function(a, b, et, txt){
  return '<div class="perso duo"><img src="'+a+'" alt="" loading="lazy">'+
         '<img class="b" src="'+b+'" alt="" loading="lazy">'+
         '<div class="globo"><span class="et">'+esc(et)+'</span>'+txt+'</div></div>';
};
/* carpeta de Drive del curso: ahi estan los Excel, el Word y las fichas */
window.DRIVE='https://drive.google.com/drive/folders/1jc1pA2ajtidFlx3K0FVnEq6uiPLIKry2?usp=drive_link';
window.drive=function(et, txt){
  return '<div class="dri"><div class="tx"><b>'+esc(et||'Archivos de la sesion')+'</b>'+
         '<span>'+(txt||'Abre la carpeta del curso en Drive y trabaja sobre el archivo que indique el docente.')+'</span></div>'+
         '<a class="o-btn o-btn-primary" href="'+window.DRIVE+'" target="_blank" rel="noopener">'+
         '&#128193; Abrir la carpeta de Drive</a></div>';
};
/* bloque del avance del proyecto: pasos puntuales y el boton de Drive */
window.proy=function(et, pasos, nota){
  return '<div class="proy"><h4>&#128204; '+esc(et)+'</h4><ol>'+
         pasos.map(function(p){ return '<li>'+p+'</li>'; }).join('')+'</ol>'+
         (nota?'<p class="nt">'+nota+'</p>':'')+
         '<a class="o-btn o-btn-primary" href="'+window.DRIVE+'" target="_blank" rel="noopener">'+
         '&#128193; Abrir la carpeta de Drive</a></div>';
};
})();

window.MatSesion={ monta:function(SES){

'use strict';
var $=function(id){ return document.getElementById(id); };
function qq(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); }
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
                        .replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

var P={ pres:'personajes/tj-docente-presenta.webp', idea:'personajes/tj-docente-puntero.webp',
        full:'personajes/tj-alumna-sorpresa.webp',   expl:'personajes/tj-docente-puntero.webp',
        bien:'personajes/tj-alumno-senala.webp',     alum:'personajes/tj-alumno-sentado.webp' };
function globo(img, et, txt){
  return '<div class="perso"><img src="'+img+'" alt="" loading="lazy">'+
         '<div class="globo"><span class="et">'+esc(et)+'</span>'+txt+'</div></div>';
}
function globo2(a, b, et, txt){
  return '<div class="perso duo"><img src="'+a+'" alt="" loading="lazy">'+
         '<img class="b" src="'+b+'" alt="" loading="lazy">'+
         '<div class="globo"><span class="et">'+esc(et)+'</span>'+txt+'</div></div>';
}

/* ============ mini hoja de cálculo: fórmulas tipo Excel ============ */
/* Soporta: + - * / ^ % ( ) , referencias A1, rangos A1:B4, comparaciones,
   texto entre comillas y las funciones de uso diario, en español e inglés. */
function HojaFx(leeCelda){

  function letras(n){ var s=''; n++; while(n>0){ var r=(n-1)%26; s=String.fromCharCode(65+r)+s; n=(n-1-r)/26; } return s; }
  function col(s){ var n=0; for(var i=0;i<s.length;i++) n=n*26+(s.charCodeAt(i)-64); return n-1; }

  function aNumero(v){
    if(typeof v==='number') return v;
    if(v===null || v===undefined) return 0;
    var s=String(v).trim();
    if(s==='') return 0;
    s=s.replace(/\s/g,'').replace(/^S\/\.?/i,'');
    /* 1,234.56 -> 1234.56 ; 1,234 -> 1234 (la coma solo separa miles) */
    if(/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s=s.replace(/,/g,'');
    if(/%$/.test(s)){ var b=parseFloat(s.slice(0,-1)); return isNaN(b)?NaN:b/100; }
    var n=parseFloat(s);
    return (isNaN(n) || !/^-?\d*\.?\d+([eE][-+]?\d+)?$/.test(s)) ? NaN : n;
  }
  function num(v){ var n=aNumero(v); if(isNaN(n)) throw new Error('#VALOR'); return n; }
  function bool(v){ if(typeof v==='boolean') return v; var n=aNumero(v); return isNaN(n) ? String(v)!=='' : n!==0; }

  var FN={
    SUMA:  function(a){ var s=0; a.forEach(function(v){ var n=aNumero(v); if(!isNaN(n)) s+=n; }); return s; },
    PROMEDIO: function(a){ var v=a.map(aNumero).filter(function(n){ return !isNaN(n); });
                           if(!v.length) throw new Error('#DIV/0'); return v.reduce(function(x,y){return x+y;},0)/v.length; },
    MIN:   function(a){ var v=a.map(aNumero).filter(function(n){return !isNaN(n);}); if(!v.length) return 0; return Math.min.apply(null,v); },
    MAX:   function(a){ var v=a.map(aNumero).filter(function(n){return !isNaN(n);}); if(!v.length) return 0; return Math.max.apply(null,v); },
    CONTAR:function(a){ return a.map(aNumero).filter(function(n){return !isNaN(n);}).length; },
    PRODUCTO:function(a){ var p=1; a.forEach(function(v){ var n=aNumero(v); if(!isNaN(n)) p*=n; }); return p; },
    ABS:   function(a){ return Math.abs(num(a[0])); },
    ENTERO:function(a){ return Math.floor(num(a[0])); },
    REDONDEAR: function(a){
      var d=a.length>1 ? num(a[1]) : 0, f=Math.pow(10,d);
      var x=num(a[0])*f;
      /* Excel redondea el 0.5 hacia afuera */
      return (x<0 ? -Math.round(-x) : Math.round(x))/f; },
    SI:    function(a){ return bool(a[0]) ? a[1] : (a.length>2 ? a[2] : false); },
    Y:     function(a){ return a.every(bool); },
    O:     function(a){ return a.some(bool); },
    NO:    function(a){ return !bool(a[0]); },
    SIERROR: function(a){ return a[0]; }   /* el error se captura antes */
  };
  /* nombres en inglés y variantes con punto */
  var ALIAS={ SUM:'SUMA', AVERAGE:'PROMEDIO', COUNT:'CONTAR', PRODUCT:'PRODUCTO',
              ROUND:'REDONDEAR', IF:'SI', AND:'Y', OR:'O', NOT:'NO',
              INT:'ENTERO', 'SI.ERROR':'SIERROR', IFERROR:'SIERROR' };

  /* ---------- analizador ---------- */
  function evalua(txt, pide){
    var s=txt, i=0;
    function esp(){ while(i<s.length && /\s/.test(s[i])) i++; }
    function ojo(){ esp(); return s[i]; }
    function come(t){ esp(); if(s.substr(i,t.length).toUpperCase()===t){ i+=t.length; return true; } return false; }

    function expr(){
      var a=suma();
      for(;;){
        esp();
        var op=null;
        if(s.substr(i,2)==='<>'||s.substr(i,2)==='>='||s.substr(i,2)==='<='){ op=s.substr(i,2); i+=2; }
        else if(s[i]==='='||s[i]==='>'||s[i]==='<'){ op=s[i]; i++; }
        else return a;
        var b=suma(), x=aNumero(a), y=aNumero(b), cmp;
        if(isNaN(x)||isNaN(y)) cmp=String(a).trim().toUpperCase().localeCompare(String(b).trim().toUpperCase());
        else cmp = x<y ? -1 : x>y ? 1 : 0;
        a = op==='=' ? cmp===0 : op==='<>' ? cmp!==0 : op==='>' ? cmp>0 :
            op==='<' ? cmp<0 : op==='>=' ? cmp>=0 : cmp<=0;
      }
    }
    function suma(){
      var a=mult();
      for(;;){ esp();
        if(s[i]==='+'){ i++; a=num(a)+num(mult()); }
        else if(s[i]==='-'){ i++; a=num(a)-num(mult()); }
        else if(s[i]==='&'){ i++; a=String(fmt(a))+String(fmt(mult())); }
        else return a; }
    }
    function mult(){
      var a=pot();
      for(;;){ esp();
        if(s[i]==='*'){ i++; a=num(a)*num(pot()); }
        else if(s[i]==='/'){ i++; var d=num(pot()); if(d===0) throw new Error('#DIV/0'); a=num(a)/d; }
        else return a; }
    }
    function pot(){ var a=unario(); esp(); if(s[i]==='^'){ i++; return Math.pow(num(a), num(pot())); } return a; }
    function unario(){ esp();
      if(s[i]==='-'){ i++; return -num(unario()); }
      if(s[i]==='+'){ i++; return num(unario()); }
      return porciento(); }
    function porciento(){ var a=atomo(); esp(); if(s[i]==='%'){ i++; return num(a)/100; } return a; }

    function atomo(){
      esp();
      if(s[i]==='('){ i++; var v=expr(); esp(); if(s[i]!==')') throw new Error('#FALTA )'); i++; return v; }
      if(s[i]==='"'){ i++; var t=''; while(i<s.length && s[i]!=='"'){ t+=s[i++]; } i++; return t; }
      var m=/^([A-Za-zÁÉÍÓÚÑ_][A-Za-z0-9ÁÉÍÓÚÑ_.]*)\s*\(/.exec(s.slice(i));
      if(m){
        var nom=m[1].toUpperCase(); nom=ALIAS[nom]||nom;
        if(!FN[nom]) throw new Error('#NOMBRE');
        i+=m[0].length;
        var args=[];
        esp();
        if(s[i]===')'){ i++; }
        else{
          for(;;){
            args.push(arg());
            esp();
            if(s[i]===','||s[i]===';'){ i++; continue; }
            if(s[i]===')'){ i++; break; }
            throw new Error('#FALTA )');
          }
        }
        var llanos=[];
        args.forEach(function(a){ if(a && a.rango) llanos=llanos.concat(a.valores); else llanos.push(a); });
        return FN[nom](llanos);
      }
      var r=/^(\$?)([A-Za-z]{1,2})(\$?)(\d{1,4})/.exec(s.slice(i));
      if(r){
        var ini=i; i+=r[0].length;
        esp();
        if(s[i]===':'){
          var j=i+1, resto=s.slice(j);
          var r2=/^\s*(\$?)([A-Za-z]{1,2})(\$?)(\d{1,4})/.exec(resto);
          if(r2){
            i=j+r2[0].length;
            return { rango:true, valores:rango(r[2],+r[4],r2[2],+r2[4]) };
          }
        }
        i=ini+r[0].length;
        return pide(r[2].toUpperCase()+r[4]);
      }
      var n=/^\d*\.?\d+([eE][-+]?\d+)?/.exec(s.slice(i));
      if(n){ i+=n[0].length; return parseFloat(n[0]); }
      throw new Error('#ERROR');
    }
    function arg(){ return expr(); }
    function rango(c1,f1,c2,f2){
      var a=col(c1.toUpperCase()), b=col(c2.toUpperCase());
      var x1=Math.min(a,b), x2=Math.max(a,b), y1=Math.min(f1,f2), y2=Math.max(f1,f2);
      if((x2-x1+1)*(y2-y1+1) > 400) throw new Error('#RANGO');
      var out=[];
      for(var y=y1;y<=y2;y++) for(var x=x1;x<=x2;x++) out.push(pide(letras(x)+y));
      return out;
    }

    var v=expr();
    esp();
    if(i<s.length) throw new Error('#ERROR');
    if(v && v.rango) throw new Error('#VALOR');
    return v;
  }

  function fmt(v){
    if(typeof v==='boolean') return v?'VERDADERO':'FALSO';
    if(typeof v==='number'){
      if(!isFinite(v)) return '#NUM';
      var r=Math.round(v*100)/100;
      return r.toLocaleString('es-PE',{minimumFractionDigits:2, maximumFractionDigits:2});
    }
    return String(v);
  }

  return { evalua:evalua, fmt:fmt, aNumero:aNumero, letras:letras };
}

/* ================= sonido ================= */
var son=true, ac=null;
try{ son = localStorage.getItem((SES.LS+'_son'))!=='0'; }catch(e){}
function nota(f,ini,dur,vol,tipo){
  if(!son) return;
  try{
    if(!ac) ac=new (window.AudioContext||window.webkitAudioContext)();
    var o=ac.createOscillator(), g=ac.createGain(), t=ac.currentTime+ini;
    o.type=tipo||'sine'; o.frequency.value=f;
    g.gain.setValueAtTime(0.0001,t);
    g.gain.exponentialRampToValueAtTime(vol||0.08, t+0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
    o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t+dur+0.02);
  }catch(e){}
}
function bien(){ nota(660,0,.12,.05,'triangle'); nota(880,.09,.16,.05,'triangle'); }
var FALLO=['sonidos/SONIDO_FALLO.mp3','sonidos/sonido_fallo.mp3','sonidos/sonido_fallo.wav'];
var fallo=new Audio(), falloI=0;
fallo.preload='auto'; fallo.volume=0.7;
fallo.addEventListener('error', function(){
  falloI++; if(falloI<FALLO.length) fallo.src=FALLO[falloI]; else fallo=null; });
fallo.src=FALLO[0];
function mal(){
  if(!son) return;
  if(!fallo){ nota(200,0,.18,.05,'square'); return; }
  try{ fallo.currentTime=0; var p=fallo.play();
       if(p && p.catch) p.catch(function(){ nota(200,0,.18,.05,'square'); });
  }catch(e){ nota(200,0,.18,.05,'square'); }
}
function fanfarria(){ [523,659,784,1047].forEach(function(f,n){ nota(f,n*0.1,.26,.06,'triangle'); }); }
function pintaSon(){ var b=$('btnSon');
  b.textContent = son ? '🔊 Sonido' : '🔇 Sin sonido';
  b.setAttribute('aria-pressed', son?'true':'false'); }
$('btnSon').addEventListener('click', function(){
  son=!son; try{ localStorage.setItem((SES.LS+'_son'), son?'1':'0'); }catch(e){}
  pintaSon(); if(son) bien(); });
pintaSon();

/* ================= las actividades ================= */
var ACT=SES.ACT;

/* ================= las diapositivas ================= */
var D=SES.D;

/* ================= estado ================= */
var LS=SES.LS;
/* en el mismo orden en que aparecen las diapositivas */
var CLAVES=Object.keys(ACT);   /* cada sesion declara las actividades que tiene */
function vacio(){ var g={ visto:{}, mal:{}, hoja:{} };
                  CLAVES.forEach(function(k){ g[k]={}; }); return g; }
var G=vacio();
try{
  var d=JSON.parse(localStorage.getItem(LS)||'null');
  if(d && typeof d==='object') for(var k in G) if(d[k]!==undefined) G[k]=d[k];
}catch(e){}
function graba(){
  try{ localStorage.setItem(LS, JSON.stringify(G)); }catch(e){}
  if(window.Aula && Aula.enSala) Aula.empuja();
}
/* el avance guardado se suma al de este equipo: nunca se pierde una respuesta */
function fusiona(d){
  if(!d || typeof d!=='object') return;
  ['visto','mal','hoja'].forEach(function(k){
    if(d[k] && typeof d[k]==='object') for(var x in d[k]) G[k][x]=d[k][x];
  });
  CLAVES.forEach(function(k){
    if(d[k] && typeof d[k]==='object') for(var x in d[k]) G[k][x]=d[k][x];
  });
  try{ localStorage.setItem(LS, JSON.stringify(G)); }catch(e){}
  yaCruz={};
  pinta(true);
  sopla('Recuperamos tu avance: '+totalOk()+' de '+totalMax()+' respuestas');
}

function cuantas(k){
  var A=ACT[k];
  if(A.tipo==='par')  return A.huecos.length;
  if(A.tipo==='arr')  return A.fichas.length;
  if(A.tipo==='cruz') return A.palabras.length;
  if(A.tipo==='cuadro') return A.fichas.length;
  if(A.tipo==='tabla'){
    var n=0;
    A.filas.forEach(function(fi){ fi.forEach(function(c){ if(c.e!==undefined||c.ops) n++; }); });
    return n;
  }
  if(A.tipo==='hoja'){
    var n=0;
    A.filas.forEach(function(fi){ fi.forEach(function(c){ if(c.e!==undefined) n++; }); });
    return n;
  }
  return A.lista.length;
}
function hechas(k){ return Object.keys(G[k]||{}).length; }
function lista(k){ return hechas(k)>=cuantas(k); }
function totalOk(){ var s=0; CLAVES.forEach(function(k){ s+=hechas(k); }); return s; }
function totalMax(){ var s=0; CLAVES.forEach(function(k){ s+=cuantas(k); }); return s; }
var i=0;

/* ================= arrastre ================= */
var elegida=null;
function montaArrastre(cont, alSoltar){
  var ghost=null;
  qq('.ficha[data-f]', cont).forEach(function(f){
    f.addEventListener('pointerdown', function(ev){
      if(f.classList.contains('puesta')) return;
      ev.preventDefault();
      var r=f.getBoundingClientRect();
      ghost=f.cloneNode(true); ghost.classList.add('fantasma');
      ghost.style.width=r.width+'px';
      ghost.style.left=(ev.clientX-r.width/2)+'px';
      ghost.style.top=(ev.clientY-r.height/2)+'px';
      document.body.appendChild(ghost);
      f.setPointerCapture(ev.pointerId);
      f.style.opacity='.35'; f.dataset.arrastro='';
    });
    f.addEventListener('pointermove', function(ev){
      if(!ghost) return;
      var r=ghost.getBoundingClientRect();
      ghost.style.left=(ev.clientX-r.width/2)+'px';
      ghost.style.top=(ev.clientY-r.height/2)+'px';
      ghost.style.display='none';
      var bajo=document.elementFromPoint(ev.clientX, ev.clientY);
      ghost.style.display=''; f.dataset.arrastro='1';
      qq('.caja,.par,.cua', cont).forEach(function(z){ z.classList.remove('encima'); });
      var z=bajo && bajo.closest ? bajo.closest('.caja,.par,.cua') : null;
      if(z) z.classList.add('encima');
    });
    f.addEventListener('pointerup', function(ev){
      if(!ghost) return;
      ghost.style.display='none';
      var bajo=document.elementFromPoint(ev.clientX, ev.clientY);
      ghost.remove(); ghost=null; f.style.opacity='';
      qq('.caja,.par,.cua', cont).forEach(function(z){ z.classList.remove('encima'); });
      var z=bajo && bajo.closest ? bajo.closest('.caja,.par,.cua') : null;
      if(z) alSoltar(f.dataset.f, z.dataset.z, f);
    });
    f.addEventListener('pointercancel', function(){
      if(ghost){ ghost.remove(); ghost=null; } f.style.opacity=''; });
    f.addEventListener('click', function(){
      if(f.dataset.arrastro==='1'){ f.dataset.arrastro=''; return; }
      if(f.classList.contains('puesta')) return;
      qq('.ficha.sel', cont).forEach(function(x){ x.classList.remove('sel'); });
      if(elegida===f.dataset.f){ elegida=null; return; }
      elegida=f.dataset.f; f.classList.add('sel');
    });
  });
  qq('.caja,.par,.cua', cont).forEach(function(z){
    z.addEventListener('click', function(){
      if(!elegida) return;
      var f=cont.querySelector('.ficha[data-f="'+elegida+'"]');
      var id=elegida; elegida=null;
      qq('.ficha.sel', cont).forEach(function(x){ x.classList.remove('sel'); });
      alSoltar(id, z.dataset.z, f);
    });
  });
}
function sacude(el){ if(!el) return; el.classList.add('temblor');
  setTimeout(function(){ el.classList.remove('temblor'); }, 450); }

/* ================= vistas ================= */
function cabTarea(k){
  var A=ACT[k];
  var sol = !soyDocente() ? '' :
    '<button type="button" class="solu" data-sol="'+k+'">'+
    (lista(k)?'Borrar Respuestas':'Resolver Todo')+'</button>';
  return '<div class="tarea'+(lista(k)?' ok':'')+'"><h4><span>'+esc(A.titulo)+' - '+
         hechas(k)+' de '+cuantas(k)+'</span>'+sol+'</h4><div class="c">';
}
/* botón de una sola respuesta: solo lo ve el docente */
function btnR(k, n, et){
  if(!soyDocente()) return '';
  return '<button type="button" class="verr" data-vr="'+k+'" data-vn="'+esc(String(n))+'">'+
         (et||'Ver Respuesta')+'</button>';
}
/* el docente deja resuelto un solo ítem de la actividad */
function resuelveUno(k, n){
  var A=ACT[k];
  if(A.tipo==='arr' || A.tipo==='cuadro'){
    A.fichas.forEach(function(x){ if(x.g===n) G[k][x.id]=x.g; });
  }
  else if(A.tipo==='tabla'){
    var p=String(n).split('-'), c=A.filas[+p[0]][+p[1]];
    G[k][n] = c.ops ? c.ok : 1;
  }
  else if(A.tipo==='par' || A.tipo==='cruz'){ G[k][n]=1; }
  else if(A.tipo==='quiz'){ G[k][+n]=A.lista[+n].ok; }
  else{ G[k][+n]=1; }
}
/* y aquí la actividad entera */
function resuelve(k){
  var A=ACT[k];
  if(A.tipo==='arr' || A.tipo==='cuadro') A.fichas.forEach(function(x){ G[k][x.id]=x.g; });
  else if(A.tipo==='par')  A.huecos.forEach(function(x){ G[k][x.id]=1; });
  else if(A.tipo==='cruz') A.palabras.forEach(function(w){ G[k][w.p]=1; });
  else if(A.tipo==='tabla'){
    A.filas.forEach(function(fi,r){ fi.forEach(function(c,j){
      if(c.e!==undefined) G[k][r+'-'+j]=1;
      else if(c.ops) G[k][r+'-'+j]=c.ok;
    }); });
  }
  else if(A.tipo==='quiz') A.lista.forEach(function(x,n){ G[k][n]=x.ok; });
  else                     A.lista.forEach(function(x,n){ G[k][n]=1; });
}
function vArr(k){
  var A=ACT[k], g=G[k]||{};
  var libres=A.fichas.filter(function(f){ return !g[f.id]; });
  var h=cabTarea(k)+'<div class="banco">'+
    (libres.length ? libres.map(function(f){
      return '<button type="button" class="ficha" data-f="'+f.id+'">'+esc(f.t)+'</button>';
    }).join('') : '<span style="color:#8A8A92;font-size:15px">No queda ninguna ficha.</span>')+
    '</div><div class="cajas'+(A.cajas.length===2?' c2':'')+'">';
  A.cajas.forEach(function(c){
    var falta=A.fichas.some(function(f){ return f.g===c.id && !g[f.id]; });
    h+='<div class="caja" data-z="'+c.id+'"><h5>'+esc(c.t)+
       (falta?' '+btnR(k, c.id):'')+'</h5><div class="z">'+
       A.fichas.filter(function(f){ return g[f.id]===c.id; }).map(function(f){
         return '<span class="ficha puesta">'+esc(f.t)+'</span>'; }).join('')+
       '</div></div>';
  });
  h+='</div>';
  if(lista(k) && A.fin) h+=A.fin;
  return h+'</div></div>';
}
function vPar(k){
  var A=ACT[k], g=G[k]||{};
  var libres=A.fichas.filter(function(f){ return !g[f.id]; });
  var h=cabTarea(k)+'<div class="banco">'+
    (libres.length ? libres.map(function(f){
      return '<button type="button" class="ficha" data-f="'+f.id+'">'+esc(f.t)+'</button>';
    }).join('') : '<span style="color:#8A8A92;font-size:15px">No queda ninguna ficha.</span>')+
    '</div><div class="pares">';
  A.huecos.forEach(function(x,n){
    var puesto=g[x.id], nom='';
    A.fichas.forEach(function(f){ if(f.id===x.id) nom=f.t; });
    h+='<div class="par'+(puesto?' ok':'')+'" data-z="h'+n+'" data-ok="'+x.id+'">'+
       '<span class="q">'+esc(x.q)+'</span>'+
       '<span class="hueco">'+(puesto?'<b>'+esc(nom)+'</b>':'suelta aquí '+btnR(k, x.id))+
       '</span></div>';
  });
  h+='</div>';
  if(lista(k) && A.fin) h+=A.fin;
  return h+'</div></div>';
}
function vQuiz(k){
  var A=ACT[k], g=G[k]||{};
  var h=cabTarea(k);
  A.lista.forEach(function(p,n){
    var resuelto=(g[n]!==undefined);
    h+='<p class="preg">'+(n+1)+'. '+esc(p.q)+'</p><div class="ops">';
    p.ops.forEach(function(o,j){
      var cls = resuelto && j===p.ok ? ' buena' : (G.mal[k+'|'+n+'|'+j] ? ' mala' : '');
      h+='<button type="button" data-q="'+k+'" data-k="'+n+'" data-j="'+j+'"'+
         ((resuelto||cls===' mala')?' disabled':'')+' class="'+cls.trim()+'">'+esc(o)+'</button>';
    });
    h+='</div>';
    if(resuelto) h+='<p class="pq">'+esc(p.pq)+'</p>';
    else if(soyDocente()) h+='<p class="pq">'+btnR(k, n)+'</p>';
  });
  if(lista(k) && A.fin) h+=A.fin;
  return h+'</div></div>';
}

/* ---- crucigrama ---- */
var CZ=null;
function armaCruz(k){
  var A=ACT[k];
  var cel={}, num={}, orden=[];
  A.palabras.forEach(function(w,n){
    for(var j=0;j<w.p.length;j++){
      var r=w.r+(w.dir==='V'?j:0), c=w.c+(w.dir==='H'?j:0);
      var id=r+','+c;
      if(!cel[id]) cel[id]={ r:r, c:c, letra:w.p.charAt(j), de:[] };
      cel[id].de.push(n);
    }
  });
  /* numeración de izquierda a derecha y de arriba a abajo */
  var inicios=A.palabras.map(function(w,n){ return {n:n, r:w.r, c:w.c}; })
    .sort(function(a,b){ return a.r-b.r || a.c-b.c; });
  var sig=1, vistos={};
  inicios.forEach(function(x){
    var id=x.r+','+x.c;
    if(vistos[id]===undefined){ vistos[id]=sig++; }
    num[x.n]=vistos[id];
  });
  CZ={ cel:cel, num:num, clave:k };
  return CZ;
}
function vCruz(k){
  var A=ACT[k], g=G[k]||{}, z=armaCruz(k);
  var h=cabTarea(k)+'<div class="cruz"><p class="desliza">Desliza el tablero de lado para verlo completo</p>'+
          '<table class="cuad"><tbody>';
  for(var r=0;r<A.filas;r++){
    h+='<tr>';
    for(var c=0;c<A.cols;c++){
      var cl=z.cel[r+','+c];
      if(!cl){ h+='<td></td>'; continue; }
      var inicio=null;
      A.palabras.forEach(function(w,n){ if(w.r===r && w.c===c && inicio===null) inicio=z.num[n]; });
      var resuelta=cl.de.some(function(n){ return g[A.palabras[n].p]; });
      var todas=cl.de.every(function(n){ return g[A.palabras[n].p]; });
      h+='<td class="v'+(todas?' lista':'')+'" data-r="'+r+'" data-c="'+c+'">'+
         (inicio!==null?'<span class="n">'+inicio+'</span>':'')+
         '<input type="text" maxlength="1" inputmode="text" autocomplete="off" aria-label="fila '+(r+1)+' columna '+(c+1)+'"'+
         (todas?' value="'+cl.letra+'" readonly':(resuelta?' value="'+cl.letra+'" readonly':''))+'>'+
         '</td>';
    }
    h+='</tr>';
  }
  h+='</tbody></table></div><div class="pistas">';
  ['H','V'].forEach(function(dir){
    h+='<div><h5>'+(dir==='H'?'Horizontales':'Verticales')+'</h5><ol>';
    A.palabras.map(function(w,n){ return {w:w,n:n}; })
      .filter(function(x){ return x.w.dir===dir; })
      .sort(function(a,b){ return z.num[a.n]-z.num[b.n]; })
      .forEach(function(x){
        var hecha=!!g[x.w.p];
        h+='<li value="'+z.num[x.n]+'" class="'+(hecha?'ok':'')+'">'+esc(x.w.pista)+
           ' <span style="opacity:.6">('+x.w.p.length+' letras)</span>'+
           (hecha?'':'<button type="button" class="pist" data-pi="'+x.w.p+'">Pista</button>'+
                     btnR(k, x.w.p))+'</li>';
      });
    h+='</ol></div>';
  });
  h+='</div>';
  if(lista(k) && A.fin) h+=A.fin;
  return h+'</div></div>';
}
function vSel(k){
  var A=ACT[k], g=G[k]||{};
  var h=cabTarea(k)+'<div class="lineas">';
  A.lista.forEach(function(x,n){
    var ok=(g[n]!==undefined);
    h+='<div class="linea'+(ok?' bien':'')+'">'+
       '<span class="q">'+(n+1)+'. '+esc(x.q)+
         (ok?'<small class="pre">'+esc(x.pq)+'</small>':'')+'</span>'+
       '<span class="r"><select class="cel'+(ok?' bien':'')+'" data-s="'+k+'" data-n="'+n+'"'+
         (ok?' disabled':'')+' aria-label="'+esc(x.q)+'">'+
         '<option value="">elige&hellip;</option>'+
         x.ops.map(function(o,j){
           return '<option value="'+j+'"'+(ok&&j===x.ok?' selected':'')+'>'+esc(o)+'</option>'; }).join('')+
       '</select>'+(ok?'':btnR(k, n))+'</span></div>';
  });
  h+='</div>';
  if(lista(k) && A.fin) h+=A.fin;
  return h+'</div></div>';
}
/* ---- mini hoja de cálculo ---- */
var FX=HojaFx(function(ref){ return pideCelda(ref); });
var HOJA=null;   /* { k, celdas, memo, curso } mientras se calcula */

function LET(j){ return FX.letras(j); }
function txtCelda(k, id){
  var t=(G.hoja||{})[k+'|'+id];
  return (t===undefined || t===null) ? '' : String(t);
}
/* qué hay escrito en cada celda de la hoja que se está calculando */
function crudoDe(k, id){
  var A=ACT[k];
  for(var r=0;r<A.filas.length;r++){
    var fila=A.filas[r];
    for(var j=0;j<fila.length;j++){
      if(LET(j)+(r+1)!==id) continue;
      var c=fila[j];
      if(c.e!==undefined) return txtCelda(k, id);
      if(c.form!==undefined) return c.form;
      if(c.n!==undefined) return c.n;
      return c.x===undefined ? '' : c.x;
    }
  }
  return '';
}
function pideCelda(ref){
  if(!HOJA) return 0;
  if(Object.prototype.hasOwnProperty.call(HOJA.memo, ref)) return HOJA.memo[ref];
  if(HOJA.curso[ref]) throw new Error('#CIRCULAR');
  HOJA.curso[ref]=1;
  var crudo=crudoDe(HOJA.k, ref), v;
  if(crudo===undefined || crudo==='') v=0;
  else if(typeof crudo==='number') v=crudo;
  else if(/^\s*=/.test(String(crudo))) v=FX.evalua(String(crudo).replace(/^\s*=/,''), pideCelda);
  else { var n=FX.aNumero(crudo); v = isNaN(n) ? String(crudo) : n; }
  delete HOJA.curso[ref];
  HOJA.memo[ref]=v;
  return v;
}
function abreHoja(k){ HOJA={ k:k, memo:{}, curso:{} }; }
function valorCelda(k, id){
  try{ return { v:pideCelda(id) }; }
  catch(e){ return { err:String(e.message||'#ERROR') }; }
}

function vHoja(k){
  var A=ACT[k], g=G[k]||{};
  var h=cabTarea(k);
  if(A.intro) h+='<p class="hint">'+A.intro+'</p>';
  h+='<div class="hojaenv"><table class="hoja"><thead><tr><th class="esq"></th>';
  A.cols.forEach(function(c,j){ h+='<th style="width:'+c.w+'px">'+LET(j)+'</th>'; });
  h+='</tr></thead><tbody>';
  abreHoja(k);
  A.filas.forEach(function(fila,r){
    h+='<tr'+(r===0?' class="enc"':'')+'><th class="nf">'+(r+1)+'</th>';
    fila.forEach(function(c,j){
      var id=LET(j)+(r+1);
      if(c.e!==undefined){
        var hecho=(g[id]!==undefined), t=txtCelda(k,id), muestra=t;
        if(t && /^\s*=/.test(t)){ var rv=valorCelda(k,id); muestra = rv.err ? rv.err : FX.fmt(rv.v); }
        h+='<td class="libre'+(hecho?' ok':'')+'" data-cel="'+id+'">'+
           '<input type="text" class="hc" spellcheck="false" autocomplete="off" inputmode="text" '+
           'data-k="'+k+'" data-id="'+id+'" aria-label="celda '+id+'" '+
           (hecho?'readonly ':'')+(c.ph?'placeholder="'+esc(c.ph)+'" ':'')+
           'value="'+esc(muestra)+'"></td>';
      }else if(c.form!==undefined){
        var rf=valorCelda(k,id);
        h+='<td class="dada'+(rf.err?' malf':'')+'" data-cel="'+id+'" data-fx="'+id+'" title="'+esc(c.form)+'"><span class="q">'+
           esc(rf.err ? rf.err : FX.fmt(rf.v))+'</span></td>';
      }else if(c.n!==undefined){
        h+='<td class="dada num" data-cel="'+id+'"><span class="q">'+esc(FX.fmt(c.n))+'</span></td>';
      }else{
        h+='<td'+(r===0?'':' class="rot"')+' data-cel="'+id+'"><span class="q">'+esc(c.x||'')+'</span></td>';
      }
    });
    h+='</tr>';
  });
  h+='</tbody></table></div>';
  h+='<p class="avisofx">Toca una celda del cuadro para meterla en la f&oacute;rmula. '+
     'Con Mays&uacute;s + clic armas un rango.</p>';
  h+='<div class="hbar"><button type="button" class="o-btn o-btn-primary" data-chk="'+k+'">'+
     'Comprobar la hoja</button><span class="fx">Escribe la f&oacute;rmula empezando con <b>=</b>. '+
     'Puedes usar <b>SUMA</b>, <b>REDONDEAR</b>, <b>SI</b>, <b>MAX</b>, <b>MIN</b> y <b>PROMEDIO</b>.</span></div>';
  if(A.ayuda) h+='<p class="pista-fx">'+A.ayuda+'</p>';
  if(lista(k) && A.fin) h+=A.fin;
  return h+'</div></div>';
}

/* ---- calcular: el alumno escribe el resultado ---- */
function leeNum(t){
  var x=String(t==null?'':t).trim().replace(/\s/g,'').replace(/^S\/\.?/i,'').replace(/%$/,'');
  if(/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(x)) x=x.replace(/,/g,'');
  else if(/^-?\d+,\d{1,2}$/.test(x)) x=x.replace(',','.');   /* por si usan coma decimal */
  var n=parseFloat(x);
  return (isNaN(n) || !/^-?\d*\.?\d+$/.test(x)) ? null : n;
}
function vCal(k){
  var A=ACT[k], g=G[k]||{};
  var h=cabTarea(k);
  if(A.intro) h+='<p class="hint">'+A.intro+'</p>';
  h+='<div class="lineas">';
  A.lista.forEach(function(x,n){
    var ok=(g[n]!==undefined);
    h+='<div class="linea'+(ok?' bien':'')+'">'+
       '<span class="q"><b>'+(n+1)+'. '+esc(x.q)+'</b>'+
         (x.f ? '<small class="fx2">'+x.f+'</small>' : '')+
         (x.d ? '<small class="fx2"><i>'+x.d+'</i></small>' : '')+
         (ok  ? '<small class="pre">'+esc(x.pq)+'</small>' : '')+'</span>'+
       '<span class="r">'+
         '<input class="cel'+(ok?' bien':'')+'" type="text" inputmode="decimal" '+
           'data-c="'+k+'" data-n="'+n+'" autocomplete="off" '+
           (ok ? 'readonly value="'+esc(FX.fmt(x.e))+'"' : (x.ph?'placeholder="'+esc(x.ph)+'"':''))+
           ' aria-label="'+esc(x.q)+'">'+
         (x.u ? '<span class="u">'+esc(x.u)+'</span>' : '')+
         (ok ? '' : btnR(k, n))+
       '</span></div>';
  });
  h+='</div>';
  if(A.ayuda) h+='<p class="pista-fx">'+A.ayuda+'</p>';
  if(lista(k) && A.fin) h+=A.fin;
  return h+'</div></div>';
}

/* ---- cuadro de estados financieros: se arma arrastrando las partidas ---- */
function mil(n){
  var neg = n<0, r=Math.round(Math.abs(n)*100)/100;
  var s=r.toLocaleString('es-PE',{ minimumFractionDigits:(r%1?2:0), maximumFractionDigits:2 });
  return neg ? '('+s+')' : s;
}
function cuaLinea(A, id){
  var r=null;
  A.cols.forEach(function(c){ c.bloques.forEach(function(b){
    b.lineas.forEach(function(l){ if(l.id===id) r=l; }); }); });
  return r;
}
function cuaTot(A, id){
  var r=null;
  A.cols.forEach(function(c){
    c.bloques.forEach(function(b){ if(b.tot && b.tot.id===id) r=b.tot; });
    if(c.gran && c.gran.id===id) r=c.gran;
  });
  return r;
}
function cuaDe(A, b){ return (b.tot && b.tot.de) || b.lineas.map(function(l){ return l.id; }); }
function cuaValor(A, g, id){
  var L=cuaLinea(A, id);
  if(L){
    if(L.calc) return Math.round(cuaValor(A, g, L.calc.de)*L.calc.pct*100)/100;
    var s=0;
    A.fichas.forEach(function(f){ if(g[f.id]===id) s+=f.v; });
    return s;
  }
  var T=cuaTot(A, id);
  if(!T) return 0;
  var de = T.de || [];
  if(!T.de){ A.cols.forEach(function(c){ c.bloques.forEach(function(b){
      if(b.tot && b.tot.id===id) de=cuaDe(A, b); }); }); }
  var tot=0;
  de.forEach(function(x){
    var ln=cuaLinea(A, x);
    tot += cuaValor(A, g, x) * (ln && ln.s===-1 ? -1 : 1);
  });
  return tot;
}
function vCuadro(k){
  var A=ACT[k], g=G[k]||{};
  var libres=A.fichas.filter(function(f){ return !g[f.id]; });
  var h=cabTarea(k);
  if(A.intro) h+='<p class="hint">'+A.intro+'</p>';
  h+='<div class="cuadro"><div class="banco">'+
    (libres.length ? libres.map(function(f){
      return '<button type="button" class="ficha" data-f="'+f.id+'">'+esc(f.t)+
             '<span class="im">'+mil(f.v)+'</span></button>';
    }).join('') : '<span style="color:#8A8A92;font-size:17px">No queda ninguna partida.</span>')+
    '</div><div class="cols'+(A.cols.length===2?' c2':'')+'">';
  A.cols.forEach(function(c){
    h+='<div class="col"><h5 class="ctit'+(c.c==='na'?' na':'')+'">'+esc(c.t)+'</h5>';
    c.bloques.forEach(function(b){
      if(b.t) h+='<h6>'+esc(b.t)+'</h6>';
      b.lineas.forEach(function(l){
        var puestas=A.fichas.filter(function(f){ return g[f.id]===l.id; });
        var v=cuaValor(A, g, l.id);
        var falta=A.fichas.some(function(f){ return f.g===l.id && !g[f.id]; });
        var lleno=(l.calc || (puestas.length && !falta));
        var det = puestas.length && !(puestas.length===1 && puestas[0].t===l.t)
                ? '<small>'+puestas.map(function(f){ return esc(f.t); }).join(' + ')+'</small>' : '';
        h+='<div class="cua'+(lleno?' ok':'')+(l.calc?' fijo':'')+'"'+
           (l.calc?'':' data-z="'+l.id+'"')+'>'+
           '<span class="n">'+(l.s===-1?'<i class="sg">(&minus;)</i> ':'')+esc(l.t)+det+
             (l.calc ? '<small>se calcula solo</small>' : '')+'</span>'+
           '<span class="v'+((puestas.length||l.calc)?'':' vac')+'">'+
             ((puestas.length||l.calc) ? (l.s===-1?'('+mil(Math.abs(v))+')':mil(v)) : '—')+'</span>'+
           (falta && !l.calc ? btnR(k, l.id) : '')+
           '</div>';
      });
      if(b.tot) h+='<div class="sub"><span>'+esc(b.tot.t)+'</span><b>'+
                   mil(cuaValor(A, g, b.tot.id))+'</b></div>';
    });
    if(c.gran) h+='<div class="gran"><span>'+esc(c.gran.t)+'</span><b>'+
                  mil(cuaValor(A, g, c.gran.id))+'</b></div>';
    h+='</div>';
  });
  h+='</div>';
  if(A.cuadra && libres.length<A.fichas.length){
    var a=cuaValor(A, g, A.cuadra[0]), b2=cuaValor(A, g, A.cuadra[1]);
    var ok=lista(k) && Math.abs(a-b2)<0.005;
    h+='<div class="cuadra '+(ok?'si':'no')+'">'+
       (ok ? '&#10003; El estado cuadra: '+mil(a)+' de un lado y '+mil(b2)+' del otro'
           : 'Los dos lados tienen que terminar en el mismo total. Van '+mil(a)+' y '+mil(b2))+'</div>';
  }
  h+='</div>';
  if(lista(k) && A.fin) h+=A.fin;
  return h+'</div></div>';
}

/* ---- tabla de trabajo: cada recuadro se revisa solo ---- */
/* los decimales de la respuesta son los que muestra la pista de la celda */
function fmtCel(c){
  if(c.ph && /^\d+(\.\d+)?$/.test(c.ph)){
    var d=(c.ph.split('.')[1]||'').length;
    return c.e.toLocaleString('es-PE',{ minimumFractionDigits:d, maximumFractionDigits:d });
  }
  return FX.fmt(c.e);
}
function vTabla(k){
  var A=ACT[k], g=G[k]||{};
  var h=cabTarea(k);
  if(A.intro) h+='<p class="hint">'+A.intro+'</p>';
  h+='<div class="tabwrap"><table class="hoja2"><thead><tr>'+
     A.cols.map(function(c,j){
       return '<th'+((A.tipos&&A.tipos[j]==='n')?' class="n"':'')+'>'+esc(c)+'</th>'; }).join('')+
     '</tr></thead><tbody>';
  A.filas.forEach(function(fi,r){
    var tot=fi.some(function(c){ return c.cl==='tot'; });
    h+='<tr'+(tot?' class="tot"':'')+'>';
    fi.forEach(function(c,j){
      var num=(A.tipos&&A.tipos[j]==='n');
      var id=r+'-'+j, hecho=(g[id]!==undefined);
      if(c.e===undefined && !c.ops){
        h+='<td'+(num?' class="n"':'')+'>'+(c.t||'')+'</td>';
        return;
      }
      h+='<td class="ed'+(num?' n':'')+(hecho?' bien':'')+'">';
      if(c.ops){
        h+='<select class="cel'+(hecho?' bien':'')+'" data-ts="'+k+'" data-tn="'+id+'"'+
           (hecho?' disabled':'')+'>'+
           '<option value="">elige&hellip;</option>'+
           c.ops.map(function(o,q){
             return '<option value="'+q+'"'+(hecho&&q===c.ok?' selected':'')+'>'+esc(o)+'</option>';
           }).join('')+'</select>';
      }else{
        h+='<input class="cel'+(hecho?' bien':'')+'" type="text" inputmode="decimal" '+
           'data-tc="'+k+'" data-tn="'+id+'" autocomplete="off" '+
           (hecho ? 'readonly value="'+esc(fmtCel(c))+'"'
                  : (c.ph?'placeholder="'+esc(c.ph)+'"':''))+'>';
      }
      if(!hecho) h+=btnR(k, id, 'Ver');
      if(hecho && c.pq) h+='<small class="pre">'+esc(c.pq)+'</small>';
      h+='</td>';
    });
    h+='</tr>';
  });
  h+='</tbody></table></div>';
  if(A.ayuda) h+='<p class="pista-fx">'+A.ayuda+'</p>';
  if(lista(k) && A.fin) h+=A.fin;
  return h+'</div></div>';
}

function vista(k){
  var t=ACT[k].tipo;
  return t==='arr' ? vArr(k) : t==='par' ? vPar(k) : t==='cruz' ? vCruz(k)
       : t==='sel' ? vSel(k) : t==='hoja' ? vHoja(k) : t==='cal' ? vCal(k)
       : t==='cuadro' ? vCuadro(k) : t==='tabla' ? vTabla(k) : vQuiz(k);
}

/* ================= dibujo ================= */
function pinta(quieto){
  var s=D[i];
  /* al responder dentro de la misma diapositiva no se pierde el sitio */
  var alto = quieto ? $('lam').scrollTop : 0;
  G.visto[i]=1; graba();
  $('eti').textContent=s.et;
  $('tit').textContent=s.t;
  $('cu').textContent=(i+1)+' / '+D.length;
  var h=s.h||'';
  if(s.clave) h+=vista(s.clave);
  $('lam').innerHTML=h;
  $('lam').scrollTop=alto;
  $('ant').disabled=(i===0);
  $('sig').disabled=(i===D.length-1);
  var ok=totalOk(), mx=totalMax();
  $('riel').style.width=Math.round(ok/mx*100)+'%';
  $('marcador').textContent=ok+' de '+mx;
  $('rotulo').textContent='Diapositiva '+(i+1)+' de '+D.length;
  $('pts').innerHTML=D.map(function(x,n){
    var cl = n===i ? 'on' : (x.clave && lista(x.clave) ? 'hecho' : (G.visto[n]?'visto':''));
    return '<button type="button" data-p="'+n+'" class="'+cl+'" aria-label="'+esc(x.t)+'" title="'+esc(x.t)+'"></button>';
  }).join('');
  qq('#pts button').forEach(function(b){
    b.addEventListener('click', function(){
      if(atado()){ sopla('La clase va al ritmo del docente'); return; }
      i=+b.dataset.p; elegida=null; pinta(); enfoca();
      if(modoClase==='guiado') difunde();
    });
  });
  cablea();
  if($('lineaT')) pintaLinea();
  if($('equiCuerpo')) pintaEqui();
  pintaModo();
}

var yaCruz={};
function cablea(){
  var lam=$('lam'), s=D[i];
  if(!s.clave) return;
  var k=s.clave, A=ACT[k];

  if(A.tipo==='arr'){
    montaArrastre(lam, function(fid, zona, el){
      var f=null; A.fichas.forEach(function(x){ if(x.id===fid) f=x; });
      if(!f || !zona) return;
      if(f.g===zona){ G[k][fid]=zona; graba(); if(lista(k)) fanfarria(); else bien(); pinta(true); }
      else{ mal(); sacude(el); }
    });
  }
  if(A.tipo==='cuadro'){
    montaArrastre(lam, function(fid, zona, el){
      var f=null; A.fichas.forEach(function(x){ if(x.id===fid) f=x; });
      if(!f || !zona) return;
      if(f.g===zona){ G[k][fid]=zona; graba(); if(lista(k)) fanfarria(); else bien(); pinta(true); }
      else{ mal(); sacude(el); }
    });
  }
  if(A.tipo==='par'){
    montaArrastre(lam, function(fid, zona, el){
      var caja=lam.querySelector('.par[data-z="'+zona+'"]');
      if(!caja) return;
      if(caja.dataset.ok===fid){ G[k][fid]=1; graba(); if(lista(k)) fanfarria(); else bien(); pinta(true); }
      else{ mal(); sacude(el); }
    });
  }
  qq('#lam button[data-q]', lam).forEach(function(b){
    b.addEventListener('click', function(){
      var cl=b.dataset.q, n=+b.dataset.k, j=+b.dataset.j, p=ACT[cl].lista[n];
      if(j===p.ok){ G[cl][n]=j; graba(); if(lista(cl)) fanfarria(); else bien(); pinta(true); }
      else{ G.mal[cl+'|'+n+'|'+j]=1; graba(); mal();
            b.classList.add('mala','temblor'); b.disabled=true;
            setTimeout(function(){ b.classList.remove('temblor'); }, 450); }
    });
  });

  qq('#lam select[data-s]', lam).forEach(function(sl){
    sl.addEventListener('change', function(){
      if(sl.value==='') return;
      var cl=sl.dataset.s, n=+sl.dataset.n, p=ACT[cl].lista[n];
      if(+sl.value===p.ok){ G[cl][n]=1; graba(); if(lista(cl)) fanfarria(); else bien(); pinta(true); }
      else{ mal(); sacude(sl.closest('.linea'));
            sl.classList.add('mal'); sl.value='';
            setTimeout(function(){ sl.classList.remove('mal'); }, 900); }
    });
  });

  qq('#lam input[data-c]', lam).forEach(function(x){
    function revisa(){
      if(x.readOnly) return;
      var cl=x.dataset.c, n=+x.dataset.n, p=ACT[cl].lista[n];
      var v=leeNum(x.value);
      if(x.value.trim()==='') { x.classList.remove('mal'); return; }
      if(v===null){ mal(); x.classList.add('mal','temblor');
        setTimeout(function(){ x.classList.remove('temblor'); }, 450); return; }
      if(Math.abs(v-p.e) <= (p.tol===undefined ? 0.05 : p.tol)){
        G[cl][n]=1; graba(); if(lista(cl)) fanfarria(); else bien(); pinta(true);
      }else{
        mal(); x.classList.add('mal','temblor');
        setTimeout(function(){ x.classList.remove('temblor'); }, 450);
      }
    }
    x.addEventListener('change', revisa);
    x.addEventListener('keydown', function(e){ if(e.key==='Enter'){ e.preventDefault(); revisa(); } });
    x.addEventListener('input', function(){ x.classList.remove('mal'); });
  });

  /* celdas de la tabla de trabajo */
  qq('#lam input[data-tc]', lam).forEach(function(x){
    function revisa(){
      if(x.readOnly) return;
      var cl=x.dataset.tc, id=x.dataset.tn, p=id.split('-');
      var c=ACT[cl].filas[+p[0]][+p[1]];
      if(x.value.trim()===''){ x.classList.remove('mal'); return; }
      var v=leeNum(x.value);
      if(v===null){ mal(); x.classList.add('mal','temblor');
        setTimeout(function(){ x.classList.remove('temblor'); }, 450); return; }
      if(Math.abs(v-c.e) <= (c.tol===undefined ? 0.05 : c.tol)){
        G[cl][id]=1; graba(); if(lista(cl)) fanfarria(); else bien(); pinta(true);
      }else{
        mal(); x.classList.add('mal','temblor');
        setTimeout(function(){ x.classList.remove('temblor'); }, 450);
      }
    }
    x.addEventListener('change', revisa);
    x.addEventListener('keydown', function(e){ if(e.key==='Enter'){ e.preventDefault(); revisa(); } });
    x.addEventListener('input', function(){ x.classList.remove('mal'); });
  });
  qq('#lam select[data-ts]', lam).forEach(function(sl){
    sl.addEventListener('change', function(){
      if(sl.value==='') return;
      var cl=sl.dataset.ts, id=sl.dataset.tn, p=id.split('-');
      var c=ACT[cl].filas[+p[0]][+p[1]];
      if(+sl.value===c.ok){ G[cl][id]=+sl.value; graba();
        if(lista(cl)) fanfarria(); else bien(); pinta(true); }
      else{ mal(); sacude(sl.closest('td')); sl.classList.add('mal'); sl.value='';
            setTimeout(function(){ sl.classList.remove('mal'); }, 900); }
    });
  });

  if(A.tipo==='hoja') cableaHoja(k, A, lam);
  if(A.tipo==='cruz') cableaCruz(k, A, lam);

  /* el docente resuelve un ítem suelto, o la actividad entera */
  qq('#lam button[data-vr]', lam).forEach(function(b){
    b.addEventListener('click', function(ev){
      ev.stopPropagation();
      if(!soyDocente()) return;
      resuelveUno(b.dataset.vr, b.dataset.vn);
      if(ACT[b.dataset.vr].tipo==='cruz') yaCruz={};
      graba(); if(lista(b.dataset.vr)) fanfarria(); else bien(); pinta(true);
    });
  });
  var bs=lam.querySelector('button[data-sol]');
  if(bs) bs.addEventListener('click', function(){
    if(!soyDocente()) return;
    if(lista(k)){ G[k]={}; if(A.tipo==='cruz') yaCruz={}; }
    else{ resuelve(k); fanfarria(); }
    graba(); pinta(true);
  });
  /* pista del crucigrama: descubre una letra que todavía falte */
  qq('#lam button[data-pi]', lam).forEach(function(b){
    b.addEventListener('click', function(){
      var pal=b.dataset.pi, w=null;
      A.palabras.forEach(function(x){ if(x.p===pal) w=x; });
      if(!w) return;
      for(var j=0;j<w.p.length;j++){
        var td=lam.querySelector('.cuad td[data-r="'+(w.r+(w.dir==='V'?j:0))+
                                 '"][data-c="'+(w.c+(w.dir==='H'?j:0))+'"]');
        var inp=td && td.querySelector('input');
        if(inp && !inp.value){
          inp.value=w.p.charAt(j); bien();
          inp.dispatchEvent(new Event('input',{bubbles:true}));
          inp.focus();
          return;
        }
      }
      sopla('Esa palabra ya está completa');
    });
  });
}

/* lo que hay escrito antes del cursor, sin espacios al final */
function antesDelCursor(inp){
  var v=inp.value;
  var pos = (inp.selectionStart===null || inp.selectionStart===undefined) ? v.length : inp.selectionStart;
  return v.slice(0, pos).replace(/\s+$/,'');
}
function enFormula(inp){ return !!(inp && inp.value && /^\s*=/.test(inp.value)); }
/* ¿la fórmula espera una referencia? (justo después de = o de un operador) */
function esperaRef(inp){
  if(!enFormula(inp)) return false;
  var antes=antesDelCursor(inp);
  /* el % va detrás del número, así que ahí ya no se espera nada */
  return /(^\s*=|[+\-*/^(,;:&<>=])$/.test(antes);
}
/* ¿lo último escrito es el nombre de una celda? entonces se puede cambiar o ampliar */
function terminaEnRef(inp){
  if(!enFormula(inp)) return false;
  return /[A-Za-z]{1,2}\d{1,4}$/.test(antesDelCursor(inp));
}
/* mete el nombre de la celda donde está el cursor, como hace Excel */
function meteRef(inp, ref, modo){
  var v=inp.value;
  var a = inp.selectionStart===null ? v.length : inp.selectionStart;
  var b = inp.selectionEnd===null   ? v.length : inp.selectionEnd;
  var izq=v.slice(0,a), der=v.slice(b), m=/([A-Za-z]{1,2}\d{1,4})$/.exec(izq);
  if(modo==='extender' && m){
    izq = izq.slice(0, izq.length-m[1].length) + m[1].toUpperCase() + ':' + ref;
  }else if(modo==='reemplazar' && m){
    izq = izq.slice(0, izq.length-m[1].length) + ref;
  }else{
    izq += ref;
  }
  inp.value = izq + der;
  var p = izq.length;
  try{ inp.setSelectionRange(p,p); }catch(e){}
}

/* ---- la hoja: escribir, recalcular y comprobar ---- */
function cableaHoja(k, A, lam){
  var inps=qq('#lam td.libre input', lam);
  var tabla=lam.querySelector('table.hoja');
  var aviso=lam.querySelector('.avisofx');

  function pintaApunta(){
    var act=document.activeElement;
    var on = !!(act && act.classList && act.classList.contains('hc') &&
                (esperaRef(act) || terminaEnRef(act)));
    if(tabla) tabla.classList.toggle('apunta', on);
    if(aviso) aviso.classList.toggle('ve', on);
  }

  function recalcula(salvo){
    abreHoja(k);
    inps.forEach(function(x){
      if(x===salvo) return;
      var t=txtCelda(k, x.dataset.id);
      if(t && /^\s*=/.test(t)){
        var r=valorCelda(k, x.dataset.id);
        x.value = r.err ? r.err : FX.fmt(r.v);
        x.classList.toggle('malf', !!r.err);
      }else{
        x.value = t;
        x.classList.remove('malf');
      }
    });
    /* las celdas fijas con fórmula también se refrescan */
    A.filas.forEach(function(fila,r){
      fila.forEach(function(c,j){
        if(c.form===undefined) return;
        var id=LET(j)+(r+1);
        var td=lam.querySelector('td.dada[data-fx="'+id+'"]');
        if(!td) return;
        var rr=valorCelda(k, id);
        td.querySelector('.q').textContent = rr.err ? rr.err : FX.fmt(rr.v);
        td.classList.toggle('malf', !!rr.err);
      });
    });
  }

  inps.forEach(function(x){
    if(x.readOnly) return;
    x.addEventListener('focus', function(){
      var t = txtCelda(k, x.dataset.id);
      x.value = t;
      /* se selecciona al entrar, como en Excel, pero sin comerse lo que ya escribió */
      setTimeout(function(){ if(x.value===t){ try{ x.select(); }catch(e){} } pintaApunta(); }, 0);
    });
    x.addEventListener('input', function(){
      G.hoja[k+'|'+x.dataset.id] = x.value;
      pintaApunta();
    });
    ['keyup','click','select'].forEach(function(ev){
      x.addEventListener(ev, pintaApunta);
    });
    x.addEventListener('blur', function(){
      G.hoja[k+'|'+x.dataset.id] = x.value;
      graba();
      recalcula(null);
      pintaApunta();
    });
    x.addEventListener('keydown', function(e){
      if(e.key==='Enter'){ e.preventDefault(); x.blur(); }
      else if(e.key==='Escape'){ e.preventDefault(); x.blur(); }
    });
  });

  /* tocar una celda del cuadro mete su nombre en la fórmula que se está escribiendo */
  qq('#lam table.hoja td[data-cel]', lam).forEach(function(td){
    td.addEventListener('pointerdown', function(ev){
      var act=document.activeElement;
      if(!act || !act.classList || !act.classList.contains('hc')) return;
      if(td.contains(act)) return;                 /* es la celda que estoy editando */
      var modo = esperaRef(act) ? 'insertar'
               : (terminaEnRef(act) ? (ev.shiftKey ? 'extender' : 'reemplazar') : null);
      if(!modo) return;                            /* la fórmula no admite una celda aquí */
      ev.preventDefault(); ev.stopPropagation();   /* no se pierde el foco */
      meteRef(act, td.dataset.cel, modo);
      G.hoja[k+'|'+act.dataset.id] = act.value;
      td.classList.add('senalada');
      setTimeout(function(){ td.classList.remove('senalada'); }, 420);
      pintaApunta();
    });
  });

  var btn=lam.querySelector('button[data-chk]');
  if(btn) btn.addEventListener('click', function(){ compruebaHoja(k, A, lam, recalcula); });

  recalcula(null);
}

function compruebaHoja(k, A, lam, recalcula){
  recalcula(null);
  abreHoja(k);
  var nuevas=0, fallas=0, faltan=0, primerFallo=null;
  A.filas.forEach(function(fila,r){
    fila.forEach(function(c,j){
      if(c.e===undefined) return;
      var id=LET(j)+(r+1);
      if(G[k][id]!==undefined) return;                 /* ya estaba bien */
      var td=lam.querySelector('td.libre[data-cel="'+id+'"]');
      var t=txtCelda(k, id).trim();
      td.classList.remove('mal');
      if(t===''){ faltan++; return; }
      if(c.f && !/^=/.test(t)){
        fallas++; td.classList.add('mal');
        if(!primerFallo) primerFallo='En '+id+' escribe la f&oacute;rmula, no el resultado. Empieza con =';
        return;
      }
      var rv=valorCelda(k, id);
      if(rv.err){
        fallas++; td.classList.add('mal');
        if(!primerFallo) primerFallo='La f&oacute;rmula de '+id+' no se entiende ('+esc(rv.err)+').';
        return;
      }
      var acierta;
      if(typeof c.e==='string'){
        acierta = String(rv.v).trim().toUpperCase() === c.e.trim().toUpperCase();
      }else{
        var n=FX.aNumero(rv.v);
        acierta = !isNaN(n) && Math.abs(n-c.e) < 0.05;
      }
      if(acierta){ G[k][id]=1; nuevas++; td.classList.add('ok'); }
      else{ fallas++; td.classList.add('mal');
            if(!primerFallo) primerFallo='El resultado de '+id+' todav&iacute;a no cuadra.'; }
    });
  });
  graba();
  if(nuevas && !fallas) { if(lista(k)) fanfarria(); else bien(); }
  else if(fallas) mal();
  if(fallas) sopla(primerFallo ? primerFallo.replace(/&oacute;/g,'ó').replace(/&iacute;/g,'í') : 'Revisa las celdas en rojo');
  else if(!nuevas && faltan) sopla('Todavía te faltan '+faltan+(faltan===1?' celda':' celdas'));
  pinta(true);
}

function cableaCruz(k, A, lam){
  var g=G[k]||{};
  function campo(r,c){ var td=lam.querySelector('.cuad td[data-r="'+r+'"][data-c="'+c+'"]');
                       return td ? td.querySelector('input') : null; }
  function letras(w){
    var s='';
    for(var j=0;j<w.p.length;j++){
      var e=campo(w.r+(w.dir==='V'?j:0), w.c+(w.dir==='H'?j:0));
      s += (e && e.value ? e.value.toUpperCase() : ' ');
    }
    return s;
  }
  function revisa(w){
    if(g[w.p]) return;
    var s=letras(w);
    if(s.indexOf(' ')>=0){ yaCruz[w.p]=''; return; }
    if(yaCruz[w.p]===s) return;
    yaCruz[w.p]=s;
    if(s===w.p){ G[k][w.p]=1; graba(); if(lista(k)) fanfarria(); else bien(); pinta(true); }
    else{
      mal();
      for(var j=0;j<w.p.length;j++){
        var td=lam.querySelector('.cuad td[data-r="'+(w.r+(w.dir==='V'?j:0))+'"][data-c="'+(w.c+(w.dir==='H'?j:0))+'"]');
        if(td) sacude(td);
      }
    }
  }
  qq('.cuad input', lam).forEach(function(inp){
    var td=inp.parentNode, r=+td.dataset.r, c=+td.dataset.c;
    inp.addEventListener('focus', function(){
      qq('.cuad td.foco', lam).forEach(function(x){ x.classList.remove('foco'); });
      td.classList.add('foco');
    });
    inp.addEventListener('input', function(){
      var v=inp.value.replace(/[^A-Za-zÑñ]/g,'').toUpperCase();
      inp.value=v.slice(-1);
      if(inp.value){
        /* salta a la siguiente casilla libre de la misma palabra */
        var sig=campo(r,c+1) || campo(r+1,c);
        if(sig && !sig.readOnly) sig.focus();
      }
      A.palabras.forEach(function(w){
        var dentro=false;
        for(var j=0;j<w.p.length;j++){
          if(w.r+(w.dir==='V'?j:0)===r && w.c+(w.dir==='H'?j:0)===c){ dentro=true; break; }
        }
        if(dentro) revisa(w);
      });
    });
    inp.addEventListener('keydown', function(e){
      var d={ArrowRight:[0,1],ArrowLeft:[0,-1],ArrowDown:[1,0],ArrowUp:[-1,0]}[e.key];
      if(d){ var x=campo(r+d[0], c+d[1]); if(x){ e.preventDefault(); x.focus(); } return; }
      if(e.key==='Backspace' && !inp.value){
        var a=campo(r,c-1) || campo(r-1,c);
        if(a && !a.readOnly){ e.preventDefault(); a.value=''; a.focus(); }
      }
    });
  });
}

/* ================= línea de tiempo del caso 1 ================= */
var LT={ focal:6, montos:[{m:3, v:8000, t:'Letra 1'}, {m:9, v:12000, t:'Letra 2'}], i:0.02 };
function pintaLinea(){
  var c=$('lineaT'); if(!c) return;
  var meses=[0,1,2,3,4,5,6,7,8,9,10,11,12];
  var h='<div class="lt">';
  meses.forEach(function(m){
    var mo=null; LT.montos.forEach(function(x){ if(x.m===m) mo=x; });
    var foc=(m===LT.focal);
    var cl='lts'+(foc?' foc':'')+(mo?' con':'');
    var dir='', val='';
    if(mo){
      var n=Math.abs(m-LT.focal);
      var v = m<LT.focal ? mo.v*Math.pow(1+LT.i,n) : (m>LT.focal ? mo.v/Math.pow(1+LT.i,n) : mo.v);
      dir = m<LT.focal ? '&rarr;' : (m>LT.focal ? '&larr;' : '=');
      val = '<span class="eq">'+dir+' '+(Math.round(v*100)/100).toLocaleString('es-PE',
            {minimumFractionDigits:2, maximumFractionDigits:2})+'</span>';
    }
    h+='<button type="button" class="'+cl+'" data-mes="'+m+'" '+
       'aria-label="Poner la fecha focal en el mes '+m+'">'+
       (mo?'<span class="fle">&uarr;</span><span class="mo">'+
           mo.v.toLocaleString('es-PE')+'</span><span class="et">'+esc(mo.t)+'</span>'+val:'')+
       '<span class="eje"></span><span class="ms">'+m+'</span>'+
       (foc?'<span class="pin">fecha focal</span>':'')+
       '</button>';
  });
  h+='</div>';
  var tot=0;
  LT.montos.forEach(function(x){
    var n=Math.abs(x.m-LT.focal);
    tot += x.m<LT.focal ? x.v*Math.pow(1+LT.i,n) : (x.m>LT.focal ? x.v/Math.pow(1+LT.i,n) : x.v);
  });
  h+='<div class="ltres">Pago único en el <b>mes '+LT.focal+'</b>: <b>S/ '+
      (Math.round(tot*100)/100).toLocaleString('es-PE',{minimumFractionDigits:2,maximumFractionDigits:2})+
      '</b> <span>con la tasa de 2 % mensual</span></div>';
  c.innerHTML=h;
  qq('#lineaT button[data-mes]').forEach(function(b){
    b.addEventListener('click', function(){
      LT.focal=+b.dataset.mes; if(son) nota(620,0,.09,.04,'triangle'); pintaLinea();
    });
  });
}

/* ================= calculadora de equivalencia ================= */
var EQ={ monto:10000, mes:9, focal:6, tasa:2, tea:26.82 };
function pintaEqui(){
  var c=$('equiCuerpo'); if(!c) return;
  var n=Math.abs(EQ.mes-EQ.focal), i=EQ.tasa/100;
  var f=Math.pow(1+i,n);
  var lleva=(EQ.mes<EQ.focal), igual=(EQ.mes===EQ.focal);
  var v = igual ? EQ.monto : (lleva ? EQ.monto*f : EQ.monto/f);
  var tem=(Math.pow(1+EQ.tea/100, 1/12)-1)*100;
  function num(id, et, val, paso){
    return '<label class="eqc"><span>'+et+'</span>'+
           '<input type="number" step="'+(paso||'1')+'" id="'+id+'" value="'+val+'"></label>';
  }
  c.innerHTML=
    '<div class="eqf">'+
      num('eqMonto','Monto S/', EQ.monto, '0.01')+
      num('eqMes','Vence en el mes', EQ.mes)+
      num('eqFocal','Fecha focal, mes', EQ.focal)+
      num('eqTasa','Tasa mensual %', EQ.tasa, '0.01')+
    '</div>'+
    '<div class="eqr">'+
      '<div class="eqp"><span>n</span><b>'+n+(n===1?' mes':' meses')+'</b></div>'+
      '<div class="eqp"><span>(1 + i)ⁿ</span><b>'+f.toFixed(6)+'</b></div>'+
      '<div class="eqp"><span>Operación</span><b>'+
        (igual ? 'ninguna, n = 0' : (lleva ? 'se multiplica' : 'se divide'))+'</b></div>'+
      '<div class="eqp fin"><span>Valor en el mes '+EQ.focal+'</span><b>S/ '+
        (Math.round(v*100)/100).toLocaleString('es-PE',
          {minimumFractionDigits:2,maximumFractionDigits:2})+'</b></div>'+
    '</div>'+
    '<div class="eqf b2">'+
      num('eqTea','TEA %', EQ.tea, '0.01')+
      '<div class="eqp fin"><span>TEM = (1 + TEA)<sup>1/12</sup> &minus; 1</span><b>'+
        tem.toFixed(4)+' %</b></div>'+
      '<div class="eqp"><span>Redondeada a 2 decimales</span><b>'+tem.toFixed(2)+' %</b></div>'+
      '<div class="eqp"><span>Si la dividieras entre 12</span><b>'+(EQ.tea/12).toFixed(2)+' %</b></div>'+
    '</div>';
  [['eqMonto','monto'],['eqMes','mes'],['eqFocal','focal'],['eqTasa','tasa'],['eqTea','tea']]
  .forEach(function(p){
    var x=$(p[0]); if(!x) return;
    x.addEventListener('input', function(){
      var v=parseFloat(x.value); if(isNaN(v)) return;
      EQ[p[1]]=v; var foco=document.activeElement && document.activeElement.id;
      var sel=x.selectionStart; pintaEqui();
      var y=$(foco); if(y){ y.focus(); try{ y.setSelectionRange(sel,sel); }catch(e){} }
    });
  });
}

/* ================= modo de clase ================= */
/* guiado: todos van en la diapositiva del docente - libre: cada uno avanza solo */
var modoClase='libre';
try{ if(localStorage.getItem((SES.LS+'_modo'))==='guiado') modoClase='guiado'; }catch(e){}

function soyDocente(){ return !!(window.Aula && Aula.esDocente); }
function enSala(){ return !!(window.Aula && Aula.enSala); }
function atado(){ return modoClase==='guiado' && enSala() && !soyDocente(); }

var tSoplo=null;
function sopla(txt){
  var e=$('soplo');
  e.hidden=false; e.textContent=txt;
  requestAnimationFrame(function(){ e.classList.add('ve'); });
  clearTimeout(tSoplo);
  tSoplo=setTimeout(function(){
    e.classList.remove('ve');
    setTimeout(function(){ e.hidden=true; }, 300);
  }, 2600);
}

function pintaModo(){
  var doc=soyDocente(), guiado=(modoClase==='guiado'), preso=atado();
  var b=$('btnBatuta');
  b.hidden=!doc;
  if(doc){
    b.classList.toggle('on', guiado);
    b.setAttribute('aria-pressed', guiado?'true':'false');
    $('txBatuta').textContent = guiado ? 'Modo guiado' : 'Modo libre';
    b.title = guiado
      ? 'Los alumnos están en tu misma diapositiva. Toca para dejarlos avanzar solos.'
      : 'Cada alumno avanza solo. Toca para llevarlos a tu ritmo.';
  }
  $('pilModo').hidden=!preso;
  $('esc').classList.toggle('atado', preso);
  $('ant').disabled = preso || (i===0);
  $('sig').disabled = preso || (i===D.length-1);
  qq('#pts button').forEach(function(x){ x.disabled=preso; });
}

/* el docente publica dónde está la clase */
function difunde(){
  if(!soyDocente() || !window.Aula || !Aula.dirige) return;
  Aula.dirige(modoClase==='guiado' ? { modo:'guiado', lamina:i } : { modo:'libre' });
}
function cambiaModo(){
  if(!soyDocente()) return;
  modoClase = (modoClase==='guiado') ? 'libre' : 'guiado';
  try{ localStorage.setItem((SES.LS+'_modo'), modoClase); }catch(e){}
  pintaModo(); difunde();
  sopla(modoClase==='guiado'
        ? 'Modo guiado - La clase va contigo, diapositiva '+(i+1)
        : 'Modo libre - Cada alumno avanza a su ritmo');
}
$('btnBatuta').addEventListener('click', cambiaModo);
/* el alumno recibe la orden del docente */
function recibeBatuta(d){
  var antes=modoClase;
  modoClase = (d && d.modo==='guiado') ? 'guiado' : 'libre';
  if(modoClase==='guiado' && d && typeof d.lamina==='number'){
    var k=Math.max(0, Math.min(D.length-1, d.lamina));
    if(k!==i){
      i=k; elegida=null; pinta(); enfoca();
      nota(880,0,.1,.04,'triangle');
      sopla('El docente pasó a la diapositiva '+(i+1)+' de '+D.length);
      return;
    }
  }
  pintaModo();
  if(antes==='guiado' && modoClase==='libre') sopla('Ya puedes avanzar a tu ritmo');
  if(antes==='libre' && modoClase==='guiado') sopla('Vas al ritmo del docente');
}

/* ================= navegación ================= */
/* deja la diapositiva centrada en la pantalla cuando se sale de cuadro */
function enfoca(){
  var e=$('esc');
  if(e.classList.contains('full')) return;
  var r=e.getBoundingClientRect();
  if(r.top>=-2 && r.bottom<=window.innerHeight+4) return;
  var y=window.pageYOffset + r.top - Math.max(8, (window.innerHeight-r.height)/2);
  try{ window.scrollTo({ top:Math.max(0,y), behavior:'smooth' }); }
  catch(x){ window.scrollTo(0, Math.max(0,y)); }
}
function va(n){
  if(atado()){ sopla('La clase va al ritmo del docente'); return; }
  var k=Math.max(0, Math.min(D.length-1, n));
  if(k!==i){ i=k; elegida=null; pinta(); enfoca();
             if(modoClase==='guiado') difunde(); }
}
$('ant').addEventListener('click', function(){ va(i-1); });
$('sig').addEventListener('click', function(){ va(i+1); });
function full(){
  var e=$('esc'), dentro;
  e.classList.toggle('full');
  dentro=e.classList.contains('full');
  document.body.style.overflow = dentro ? 'hidden' : '';
  $('btnFull').textContent = dentro ? '✕ Salir de pantalla completa' : '⛶ Pantalla completa';
  $('btnFull2').innerHTML = dentro ? '&#10005;' : '&#9974;';
  $('btnFull2').title = dentro ? 'Salir de pantalla completa' : 'Pantalla completa';
  if(dentro) participaDentro(); else participaFuera();
  var raiz=document.documentElement;
  if(dentro && !document.fullscreenElement && raiz.requestFullscreen){
    try{ var pr=raiz.requestFullscreen(); if(pr && pr.catch) pr.catch(function(){}); }catch(x){}
  }else if(!dentro && document.fullscreenElement && document.exitFullscreen){
    try{ document.exitFullscreen(); }catch(x){}
  }
}
$('btnFull').addEventListener('click', full);
$('btnFull2').addEventListener('click', full);
document.addEventListener('fullscreenchange', function(){
  /* si el navegador sale de pantalla completa por su cuenta, el escenario vuelve a su sitio */
  if(!document.fullscreenElement && $('esc').classList.contains('full')) full();
});

/* ---------- los participantes, flotando en una esquina ---------- */
function cuentaPart(){
  var m=$('muro'), n = m ? m.querySelectorAll('.aula-vtna').length : 0;
  $('nPart').textContent=n;
  $('salaPart').textContent = n===1 ? 'El aula - 1 participante'
                                    : 'El aula - '+n+' participantes';
}
function participaDentro(){
  var hoja=$('hojaMuro');
  if(!hoja || hoja.hidden){ $('flotaPart').hidden=true; $('panelPart').hidden=true; return; }
  $('nidoPart').appendChild(hoja);
  hoja.style.margin='0';
  $('flotaPart').hidden=false;
  cuentaPart();
}
function participaFuera(){
  var hoja=$('hojaMuro');
  if(hoja && hoja.parentNode===$('nidoPart')){
    hoja.style.margin='18px 0 0';
    $('anclaMuro').appendChild(hoja);
  }
  $('flotaPart').hidden=true;
  $('panelPart').hidden=true;
  $('flotaPart').setAttribute('aria-expanded','false');
}
$('flotaPart').addEventListener('click', function(){
  var p=$('panelPart'); p.hidden=!p.hidden;
  $('flotaPart').setAttribute('aria-expanded', p.hidden?'false':'true');
  if(!p.hidden) cuentaPart();
});
$('cierraPart').addEventListener('click', function(){
  $('panelPart').hidden=true;
  $('flotaPart').setAttribute('aria-expanded','false');
});
if(window.MutationObserver && $('muro')){
  new MutationObserver(function(){ if(!$('flotaPart').hidden) cuentaPart(); })
    .observe($('muro'), {childList:true, subtree:true});
}
document.addEventListener('keydown', function(e){
  if(e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  if(e.key==='ArrowRight'||e.key==='PageDown'){ e.preventDefault(); va(i+1); }
  else if(e.key==='ArrowLeft'||e.key==='PageUp'){ e.preventDefault(); va(i-1); }
  else if(e.key==='Home'){ e.preventDefault(); va(0); }
  else if(e.key==='End'){ e.preventDefault(); va(D.length-1); }
  else if(e.key==='Escape' && $('esc').classList.contains('full')){ full(); }
});
(function(){
  var x0=null, y0=null, z=$('esc');
  z.addEventListener('touchstart', function(e){
    if(e.touches.length!==1) return;
    x0=e.touches[0].clientX; y0=e.touches[0].clientY;
  }, {passive:true});
  z.addEventListener('touchend', function(e){
    if(x0===null) return;
    if(e.target && e.target.closest && e.target.closest('.cruz')){ x0=null; return; }
    var t=e.changedTouches[0], dx=t.clientX-x0, dy=t.clientY-y0;
    if(Math.abs(dx)>62 && Math.abs(dx)>Math.abs(dy)*1.7) va(i + (dx<0?1:-1));
    x0=null; y0=null;
  }, {passive:true});
})();

/* ================= el aula ================= */
function resumenAula(){
  return { lamina:(i+1)+' / '+D.length, titulo:D[i].t, ok:totalOk(), total:totalMax(),
           rejilla:CLAVES.map(function(k,n){ return {b:n, n:hechas(k), t:cuantas(k)}; }) };
}
/* nombre corto y nombre largo de cada actividad, para que el docente sepa qué mira */
function etiActividad(n){
  var k=CLAVES[n];
  for(var j=0;j<D.length;j++) if(D[j].clave===k) return D[j].et;
  return 'A'+(n+1);
}
function tituloActividad(n){
  var k=CLAVES[n], A=k && ACT[k];
  return (A && A.titulo) ? A.titulo : ('Actividad '+(n+1));
}
function diapoDe(n){
  var k=CLAVES[n];
  for(var j=0;j<D.length;j++) if(D[j].clave===k) return j+1;
  return 0;
}

function ventanaAula(e){
  var ok=e.ok||0, tot=e.total||0, pct = tot ? Math.round(ok/tot*100) : 0;
  var h='<div class="vmini">'+
        '<div class="lin"><span>Va en la diapositiva</span><b>'+esc(e.lamina||'—')+'</b></div>'+
        '<div class="vtit">'+esc(e.titulo||'—')+'</div>'+
        '<div class="vbar"><i style="width:'+pct+'%"></i></div>'+
        '<div class="lin"><span>Respuestas correctas</span><b>'+ok+' de '+tot+'</b></div>'+
        '<div class="rej">';
  (e.rejilla||[]).forEach(function(r){
    var cl = (r.t && r.n>=r.t) ? ' full' : (r.n ? ' algo' : '');
    h+='<div class="cel2'+cl+'" title="'+esc(tituloActividad(r.b))+'">'+
       '<span>'+esc(etiActividad(r.b))+'</span><b>'+r.n+'/'+r.t+'</b></div>';
  });
  return h+'</div></div>';
}

function pantalla(e, alumno, cont){
  var ok=e.ok||0, tot=e.total||0, pct = tot ? Math.round(ok/tot*100) : 0;
  var aqui = parseInt(String(e.lamina||'').split('/')[0], 10) || 0;
  var h='<div class="apdet">'+
    '<div class="apcab">'+
      '<span class="dato">Alumno<b>'+esc(alumno||'—')+'</b></span>'+
      '<span class="dato">Está en<b>Diapositiva '+esc(e.lamina||'—')+'</b></span>'+
      '<span class="dato">Diapositiva<b>'+esc(e.titulo||'—')+'</b></span>'+
      '<span class="dato">Avance<b>'+ok+' de '+tot+' - '+pct+' %</b></span>'+
    '</div>'+
    '<div class="apbar"><i style="width:'+pct+'%"></i></div>'+
    '<table><thead><tr><th>#</th><th>Actividad</th><th class="n">Respuestas</th>'+
      '<th>Avance</th><th class="n">Estado</th></tr></thead><tbody>';
  (e.rejilla||[]).forEach(function(r){
    var p = r.t ? Math.round(r.n/r.t*100) : 0;
    var lleno = r.t && r.n>=r.t;
    var cl = lleno ? ' class="ok"' : (r.n ? '' : ' class="nada"');
    var dia = diapoDe(r.b);
    h+='<tr'+cl+(dia===aqui?' data-aqui="1"':'')+'>'+
       '<td>'+(dia||'—')+'</td>'+
       '<td>'+esc(tituloActividad(r.b))+(dia===aqui?' &nbsp;<b style="color:#505050">- Aquí está</b>':'')+'</td>'+
       '<td class="n">'+r.n+' / '+r.t+'</td>'+
       '<td class="mini"><span><i style="width:'+p+'%"></i></span></td>'+
       '<td class="n">'+(lleno?'Completa':(r.n?p+' %':'Sin empezar'))+'</td>'+
       '</tr>';
  });
  h+='</tbody></table>'+
     '<div class="apacc"><button type="button" class="o-btn o-btn-secondary" id="apSaca">'+
     '&#10005; Sacar de la sala a '+esc(alumno||'')+'</button></div>'+
     '</div>';
  cont.innerHTML=h;
  var b=cont.querySelector('#apSaca');
  if(b) b.addEventListener('click', function(){
    if(window.Aula && Aula.saca) Aula.saca(alumno);
  });
}
if(window.Aula){
  Aula.iniciar({ sala:SES.sala, codigo:SES.codigo||'MAT', resumen:resumenAula, ventana:ventanaAula,
    pantalla:pantalla, musica:true, batuta:recibeBatuta,
    ficha:{ clave:LS, lee:fusiona, da:function(){ return G; },
            limpia:function(){ G=vacio(); yaCruz={}; i=0;
              try{ localStorage.removeItem(LS); }catch(e){}
              pinta(); } },
    alModo:function(doc){
      $('hojaMuro').hidden=!doc;
      if($('esc').classList.contains('full')){ if(doc) participaDentro(); else participaFuera(); }
      var dentro=Aula.enSala;
      $('mazo').hidden=!dentro;
      $('puerta').querySelector('h2').textContent = dentro ? 'Estás dentro' : 'Antes de empezar, regístrate';
      $('puerta').querySelector('p').hidden=dentro;
      if(!doc) modoClase='libre';   /* solo la batuta del docente puede atar al alumno */
      if(dentro){ pinta(); setTimeout(enfoca, 120); }
      pintaModo();
      if(doc) difunde();
    } });
}else{
  $('mazo').hidden=false;
}
if(window.Reinicio) Reinicio.monta({
  donde:'reinicio', claves:[LS], texto:'Reiniciar mis respuestas',
  aviso:'Se borrarán tus respuestas de esta sesión.',
  hecho:function(){ G=vacio(); yaCruz={}; i=0; pinta();
                    if(window.Aula && Aula.guardaFicha) Aula.guardaFicha(); }
});

pinta();

}};
