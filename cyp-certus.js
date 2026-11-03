/* ============================================================
   cyp-certus.js — Análisis de Costos y Presupuestos con el diseño Certus 2026.
   La misma idea de pl-certus.js, sin el pie del equipo de Pensamiento Lógico:
   cuando una lámina deja espacio vacío, la llena con una tarjeta de
   «Recuerda» del tema de la sesión, con íconos y personajes Certus.
   ============================================================ */
(function(){
'use strict';
var lam=document.getElementById('lam'), esc=document.getElementById('esc');
if(!lam || !esc) return;

/* ---------- recordatorios de cada sesión ---------- */
var COMUN=[
  ['tip','¿Tienes una duda? Pulsa <b>🙋 Avisar al docente</b>: levanta la mano sin interrumpir.'],
  ['tip','Usa la <b>calculadora flotante</b> para revisar tus cuentas antes de responder.'],
  ['tip','Lee el enunciado <b>dos veces</b> y subraya los datos antes de calcular.'],
  ['tip','Si te equivocas, revisa el paso a paso: <b>el error también enseña</b>.'],
  ['tip','Explicarle a tu compañero es la mejor forma de aprender: <b>trabaja en equipo</b>.']
];
var CONTA=[
  ['r','Todo el análisis se hace <b>sin IGV</b>: precio con IGV ÷ <b>1.18</b>.'],
  ['r','Margen de contribución = precio sin IGV − <b>costo variable</b> unitario.'],
  ['r','Punto de equilibrio = costos fijos ÷ margen de contribución, <b>redondeado hacia arriba</b>.']
];
var R={
  'cyp-s12-1':[
    ['r','El beneficio de una acción es el <b>margen</b> de las unidades adicionales, no la venta.'],
    ['r','ICB = beneficio ÷ costo. Si es <b>1 o más</b>, la acción se mantiene.'],
    ['r','Un ICB menor que 1 dice: <b>revisar o eliminar</b> la acción.']],
  'cyp-s12-2':[
    ['r','Ventas netas = unidades × precio <b>sin IGV</b>.'],
    ['r','Costo de ventas = unidades vendidas × <b>costo unitario total</b>.'],
    ['r','Régimen MYPE: <b>10 %</b> hasta 15 UIT (S/ 82,500) y <b>29.5 %</b> sobre el exceso.'],
    ['r','Gasto del año = gasto del mes × <b>12</b>.']],
  'cyp-s13-1':[
    ['r','Inversión = activos fijos + intangibles + <b>capital de trabajo</b>.'],
    ['r','A la nueva línea solo se le cargan los costos fijos <b>nuevos</b>.'],
    ['r','Margen de seguridad = (demanda − equilibrio) ÷ <b>demanda</b>.']],
  'cyp-s13-2':[
    ['r','La utilidad por margen de contribución y la del Estado de Resultados deben dar <b>casi lo mismo</b>.'],
    ['r','Fijos + variables tienen que sumar <b>100 %</b>.'],
    ['r','La inversión debe ser <b>menor</b> que la utilidad neta para financiarla con recursos propios.']],
  'cyp-s14-1':[
    ['r','% de la mezcla = ventas del producto ÷ <b>total de ventas</b>.'],
    ['r','Margen ponderado = suma de (% de la mezcla × <b>margen</b>).'],
    ['r','En el gráfico, el equilibrio está donde se cruzan <b>ingresos y costo total</b>.']],
  'cyp-s14-2':[
    ['r','Margen bruto, operativo y neto se leen como <b>«de cada S/ 100 vendidos…»</b>.'],
    ['r','La utilidad neta del año pasa al <b>patrimonio</b>.'],
    ['r','Activo = <b>pasivo + patrimonio</b>.']]
};
var archivo=(location.pathname.split('/').pop()||'').replace(/\.html?$/,'');
var propios=R[archivo] || CONTA;
var ICONOS=['foco','libreta','lapiz','lista','barras','crece','pantalla','pastel','reloj','laptop',
            'celular','cuaderno','tarjeta','billetes','porcentaje','linea','flecha','globo','nube','formulario'];
var PERSONAJES=['profe-idea','tutor-explica','alumno-senala','profe-presenta','tutor-bien'];

/* el número de diapositiva que se ve (del contador «3 / 12») */
function diapo(){
  var c=document.getElementById('cu'), m=c && /(\d+)/.exec(c.textContent);
  return m ? (+m[1]-1) : 0;
}
/* cada diapositiva tiene siempre la misma tarjeta: no cambia al responder */
function tarjeta(n, alto, angosta){
  var esComun=(n%3===2), pool=esComun ? COMUN : propios;
  var r=pool[n % pool.length];
  var ic=[ICONOS[(n*7+3) % ICONOS.length], ICONOS[(n*11+5) % ICONOS.length], ICONOS[(n*13+9) % ICONOS.length]];
  /* tamaño de la tarjeta según el hueco: mini (una línea), chica, mediana o alta con personaje */
  var tam = alto<110 ? 'mini' : (alto<200 ? 'chico' : (alto<270 ? '' : 'alto'));
  var nIc = tam==='alto' ? (alto>=330 ? 3 : 2) : 1;
  var d=document.createElement('div');
  d.className='relleno'+(tam ? ' '+tam : '')+(angosta ? ' col' : '');
  d.innerHTML=
    '<div class="rl-tx"><span class="rl-et'+(r[0]==='tip'?' tip':'')+'">'+(r[0]==='tip' ? '✨ Tip de clase' : '💡 Recuerda')+'</span>'+
    '<p class="rl-q">'+r[1]+'</p></div>'+
    '<div class="rl-pie">'+
      (tam==='alto' ? '<img class="rl-pj" src="personajes/'+PERSONAJES[n % PERSONAJES.length]+'.webp" alt="" loading="lazy">' : '')+
      '<div class="rl-ic">'+ic.slice(0,nIc).map(function(i){ return '<img src="marca/iconos/'+i+'.png" alt="" loading="lazy">'; }).join('')+'</div>'+
    '</div>';
  d.style.minHeight=Math.round(alto)+'px';
  return d;
}

var ocupado=false;
function zoomDe(el){ var z=parseFloat(getComputedStyle(el).zoom); return (z && isFinite(z)) ? z : 1; }
function rellena(){
  if(ocupado) return;
  ocupado=true;
  try{
    var viejos=lam.querySelectorAll('.relleno');
    for(var k=0;k<viejos.length;k++) viejos[k].remove();
    if(!lam.firstElementChild || lam.querySelector('.portada,.tapa')) return;
    var z=zoomDe(lam), n=diapo();

    /* 1. lámina partida en dos: si la teoría queda corta junto a la actividad */
    var t2=lam.querySelector('.teo2');
    if(t2 && t2.children.length>1){
      var teo=t2.children[0], act=t2.children[1];
      var rt=teo.getBoundingClientRect(), ra=act.getBoundingClientRect();
      var lado = Math.abs(rt.top-ra.top)<40;            /* están lado a lado, no apiladas */
      var hueco=(ra.bottom-rt.bottom)/z - 18;
      if(lado && hueco>=110) teo.appendChild(tarjeta(n, Math.min(hueco, 420), teo.getBoundingClientRect().width/z<620));
    }

    /* 2. espacio libre al final de la lámina */
    if(lam.scrollHeight<=lam.clientHeight+2){
      var ult=null, hijos=lam.children;
      for(var j=hijos.length-1;j>=0;j--){ if(!hijos[j].classList.contains('relleno')){ ult=hijos[j]; break; } }
      if(ult){
        var rl=lam.getBoundingClientRect(), padB=parseFloat(getComputedStyle(lam).paddingBottom)||0;
        var libre=(rl.bottom - ult.getBoundingClientRect().bottom)/z - padB - 26;
        if(libre>=64) lam.appendChild(tarjeta(n+1, Math.min(libre, 380), false));
      }
    }
  }finally{ ocupado=false; }
}

var tRel=null;
function programa(){ clearTimeout(tRel); tRel=setTimeout(function(){ requestAnimationFrame(rellena); }, 60); }
new MutationObserver(function(muts){
  if(ocupado) return;
  /* solo cuando la página vuelve a dibujar la lámina, no por nuestras tarjetas */
  for(var k=0;k<muts.length;k++){
    var nodos=muts[k].addedNodes;
    for(var j=0;j<nodos.length;j++){
      if(nodos[j].nodeType===1 && !nodos[j].classList.contains('relleno')){ programa(); return; }
    }
  }
}).observe(lam, { childList:true });
if(window.ResizeObserver) new ResizeObserver(programa).observe(lam);
window.addEventListener('load', programa);
programa();
})();
