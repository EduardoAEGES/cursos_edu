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
  function celda(x, j, tag){ return '<'+tag+(j>0?' class="n"':'')+'>'+x+'</'+tag+'>'; }
  return '<div class="tabenv"><table class="t chica"><thead><tr>'+
         cab.map(function(x,j){ return celda(x,j,'th'); }).join('')+'</tr></thead><tbody>'+
         filas.map(function(f){
           var tot=String(f[0]).charAt(0)==='*';
           return '<tr'+(tot?' class="tot"':'')+'>'+f.map(function(x,j){
             return celda(j===0&&tot ? String(x).slice(1) : x, j, 'td'); }).join('')+'</tr>';
         }).join('')+'</tbody></table></div>'+(nota ? '<p class="hint" style="margin-top:-6px">'+nota+'</p>' : '');
};
})();
