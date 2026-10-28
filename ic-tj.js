/* ============================================================
   ic-tj.js — Investigación Cuantitativa, semanas 11 a 15.
   Va ANTES del script de la página, porque las diapositivas lo usan:
     TAPA(titulo, bajada, vias)    portada con el logo de Thomas Jefferson
     GLOBO(personaje, et, texto)   personaje TJ con globo de diálogo
     SINTAXIS(titulo, filas)       repaso breve de fórmulas de Excel
     TABLA(cab, filas, nota)       tabla de datos del caso (números a la derecha)
   ============================================================ */
(function(){
'use strict';
var PJ={ pres:'personajes/tj-docente-presenta.webp', idea:'personajes/tj-docente-puntero.webp',
         full:'personajes/tj-alumna-sorpresa.webp', bien:'personajes/tj-alumno-senala.webp',
         alum:'personajes/tj-alumno-sentado.webp' };
window.PJ=PJ;
window.GLOBO=function(img, et, txt){
  return '<div class="perso"><img src="'+(PJ[img]||img)+'" alt="" loading="lazy">'+
         '<div class="globo"><span class="et">'+et+'</span>'+txt+'</div></div>';
};
/* con personaje: la tapa lo lleva a la derecha y el caso va en una línea aparte */
window.TAPA=function(titulo, bajada, vias, pj, caso){
  return '<div class="tapa'+(pj?' conpj':'')+'"><div class="fil"><img src="marca/logo-tj.png" alt="Thomas Jefferson" class="tj-logo">'+
         '<span>Instituto de Diseño y Comunicación · Investigación Cuantitativa</span></div>'+
         '<h2>'+titulo+'</h2><p>'+bajada+'</p>'+
         (caso ? '<p class="caso-tp">'+caso+'</p>' : '')+
         (vias ? '<div class="via">'+vias.map(function(v){ return '<b>'+v+'</b>'; }).join('')+'</div>' : '')+
         (pj ? '<img class="tapa-pj" src="'+(PJ[pj]||pj)+'" alt="" loading="lazy">' : '')+'</div>';
};
window.SINTAXIS=function(titulo, filas){
  return '<div class="sintaxis"><div class="sx-cab">&#9638; '+titulo+'</div><div class="sx">'+
         filas.map(function(f){ return '<div><code>'+f[0]+'</code></div><div class="ex">'+f[1]+'</div>'; }).join('')+
         '</div></div>';
};
/* filas que empiezan con «*» se pintan como total */
window.TABLA=function(cab, filas, nota){
  /* solo los números se alinean a la derecha; el texto largo puede partirse en líneas */
  function celda(x, j, tag){ var num=j>0 && /^[\s\d.,%?\u2212+\-S\/]*$/.test(String(x)); return '<'+tag+(num?' class="n"':'')+'>'+x+'</'+tag+'>'; }
  return '<div class="tabenv"><table class="t chica"><thead><tr>'+
         cab.map(function(x,j){ return celda(x,j,'th'); }).join('')+'</tr></thead><tbody>'+
         filas.map(function(f){
           var tot=String(f[0]).charAt(0)==='*';
           return '<tr'+(tot?' class="tot"':'')+'>'+f.map(function(x,j){
             return celda(j===0&&tot ? String(x).slice(1) : x, j, 'td'); }).join('')+'</tr>';
         }).join('')+'</tbody></table></div>'+(nota ? '<p class="hint" style="margin-top:-6px">'+nota+'</p>' : '');
};
})();

/* ---------- sesiones «grandes»: cada lámina se amplía hasta llenar el espacio ----------
   Solo en las páginas con <body class="ic-grande">. Busca el mayor zoom con el que el
   contenido cabe sin desplazarse (entre 0.8 y 1.8), en pantalla normal y completa. */
(function(){
'use strict';
if(!document.body || !document.body.classList.contains('ic-grande')) return;
var lam=document.getElementById('lam');
if(!lam) return;
var ocupado=false, t=null;
function cabe(){
  if(lam.scrollHeight>lam.clientHeight+1 || lam.scrollWidth>lam.clientWidth+1) return false;
  /* la hoja, las tablas y el crucigrama se desplazan por dentro: tampoco deben cortarse */
  var cajas=lam.querySelectorAll('.hojaenv,.tabenv,.cruz,.sp-tab');
  for(var i=0;i<cajas.length;i++){ if(cajas[i].scrollWidth>cajas[i].clientWidth+1) return false; }
  return true;
}
function pon(z){ for(var i=0;i<lam.children.length;i++) lam.children[i].style.zoom=z; }
function ajusta(){
  if(ocupado || !lam.children.length || !lam.clientHeight) return;
  ocupado=true;
  try{
    var lo=0.8, hi=1.8;
    pon(1);
    if(cabe()) lo=1; else hi=1;
    for(var k=0;k<7;k++){ var m=(lo+hi)/2; pon(m); if(cabe()) lo=m; else hi=m; }
    pon(lo);
  }finally{ ocupado=false; }
}
function programa(){ clearTimeout(t); t=setTimeout(function(){ requestAnimationFrame(ajusta); }, 40); }
new MutationObserver(function(){ if(!ocupado) programa(); }).observe(lam, { childList:true });
window.addEventListener('resize', programa);
document.addEventListener('fullscreenchange', programa);
var esc=document.getElementById('esc');
if(esc) new MutationObserver(programa).observe(esc, { attributes:true, attributeFilter:['class'] });
lam.addEventListener('load', programa, true);     /* las imágenes cambian el alto al cargar */
programa();
})();
