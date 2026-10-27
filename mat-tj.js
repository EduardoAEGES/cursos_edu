/* ============================================================
   mat-tj.js — Matemáticas Aplicadas con el diseño Thomas Jefferson.
   Es la misma idea de pl-certus.js, sin el pie del equipo de Certus:
   cuando una lámina deja espacio vacío, lo llena con una tarjeta de
   «Recuerda» del tema de la sesión, con íconos y personajes TJ.
   No toca las actividades ni las respuestas: solo agrega elementos al final.
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
var MATE=[
  ['r','Todos los montos del informe van <b>sin IGV</b>: precio de carta ÷ <b>1.18</b>.'],
  ['r','Una fórmula de Excel siempre empieza con <b>=</b>. El <b>$</b> fija la celda al copiar.'],
  ['r','Para leer un porcentaje usa la frase: <b>«de cada S/ 100…»</b>.'],
  ['r','Lo que no se puede dejar en blanco es la <b>explicación</b>: si un dato se estima, se declara el supuesto.']
];
var R={
  'mat-s11-lunes':[
    ['r','<b>Capital de trabajo</b> = activo corriente − pasivo corriente.'],
    ['r','<b>Razón corriente</b> = activo corriente ÷ pasivo corriente. Mayor que 1: alcanza para pagar.'],
    ['r','<b>Prueba ácida</b> = (activo corriente − inventarios) ÷ pasivo corriente.'],
    ['r','<b>Endeudamiento</b> = pasivo total ÷ activo total × 100.'],
    ['r','Análisis vertical: cada partida ÷ <b>ventas netas</b> × 100. En Excel: <b>=B4/$B$3*100</b>.'],
    ['r','<b>Inversión inicial</b> se paga una vez, en el Mes 0. <b>Gasto mensual</b> se repite cada mes.']],
  'mat-s11-jueves':[
    ['r','En el ESF, <b>total activo = total pasivo + patrimonio</b>. Si no cuadra, no se copia al Word.'],
    ['r','Rótulo y título <b>arriba</b> de la tabla; nota al <b>pie</b>, empezando con «Nota.».'],
    ['r','En el cuerpo va lo que se <b>analiza</b>; en el Anexo A.2, lo que <b>respalda</b>.']],
  'mat-s12-lunes':[
    ['r','Costo de un insumo = <b>precio × cantidad</b>, con la cantidad en la misma unidad del precio.'],
    ['r','<b>Margen unitario</b> = precio sin IGV − costo unitario.'],
    ['r','¿Sube si vendo una unidad más? Es <b>costo variable</b>.'],
    ['r','Sueldos, alquiler y limpieza son <b>gastos operativos</b>: no entran al costo unitario.'],
    ['r','<b>Margen bruto</b> = utilidad bruta ÷ ventas netas × 100.']],
  'mat-s12-jueves':[
    ['r','La Tabla 12 va en el punto <b>2.5.3</b> y la Tabla A5 en el <b>Anexo A.2</b>.'],
    ['r','En alimentos, el costo suele estar entre el <b>30 % y el 50 %</b> del precio sin IGV.']],
  'mat-s13-lunes':[
    ['r','Sin campaña = <b>promedio mensual × índice estacional</b>.'],
    ['r','Con campaña = <b>sin campaña × (1 + aumento)</b>.'],
    ['r','El flujo de una campaña solo lleva lo <b>adicional</b>.'],
    ['r','FCN = ingresos − costo de ventas − gastos − inversión.'],
    ['r','<b>Recargo</b> = ganancia ÷ costo. <b>Margen</b> = ganancia ÷ precio.']],
  'mat-s13-jueves':[
    ['r','En el diagrama, las flechas <b>hacia arriba</b> son entradas y <b>hacia abajo</b> salidas.'],
    ['r','El último flujo acumulado es la <b>suma de todos los flujos netos</b>.']],
  'mat-s14-lunes':[
    ['r','Factor = <b>1 ÷ (1 + i)ᵗ</b>. Valor actual = flujo × factor.'],
    ['r','<b>VAN mayor que cero</b>: la campaña rinde más que lo que cuesta el dinero.'],
    ['r','<b>TIR mayor que la tasa</b>: conviene. En Excel: <b>=TIR(B3:E3)</b>.'],
    ['r','<b>B/C mayor que 1</b>: por cada sol de costo entra más de un sol.'],
    ['r','Para elegir entre dos campañas <b>manda el VAN</b>, porque está en soles.']],
  'mat-s14-jueves':[
    ['r','La conclusión tiene tres partes: <b>veredicto, cifras y de qué depende</b>.'],
    ['r','Comprueba el VAN con <b>=VNA(tasa; Mes1:Mes3) + Mes0</b>.']],
  'mat-s15-lunes':[
    ['r','<b>Margen de contribución</b> = precio − costo variable.'],
    ['r','<b>Punto de equilibrio</b> = costos fijos ÷ margen de contribución.'],
    ['r','Equilibrio en soles = costos fijos ÷ <b>razón de contribución</b>.']],
  'mat-s15-jueves':[
    ['r','Una misma cifra no puede decir dos cosas distintas en dos tablas del informe.'],
    ['r','Cada tabla lleva nota con <b>fuente, supuestos y «sin IGV»</b>.']],
  'mat-s16-lunes':[
    ['r','<b>Margen de seguridad</b> = (ventas esperadas − equilibrio) ÷ ventas esperadas × 100.'],
    ['r','Toda respuesta en la sustentación lleva <b>un número y su origen</b>.']],
  'mat-s16-jueves':[
    ['r','El orden: <b>margen → flujos → VAN → recuperación → equilibrio → seguridad</b>.'],
    ['r','En la sustentación <b>nadie lee</b>: si necesitas leer una cifra, repásala.']],

  /* Investigación Cuantitativa, semanas 11 a 15 */
  'ic-s11-martes':[
    ['r','<b>H0</b> dice «no hay relación». Se rechaza si <b>p-valor &lt; α</b>.'],
    ['r','Esperada = <b>total fila × total columna ÷ total</b>.'],
    ['r','Grados de libertad = <b>(filas − 1) × (columnas − 1)</b>.'],
    ['r','La ji-cuadrada prueba <b>asociación</b>, no causalidad.']],
  'ic-s11-miercoles':[
    ['r','Prueba T: una variable <b>numérica</b> y <b>dos grupos</b>.'],
    ['r','En Excel: <b>=PRUEBA.T(rango1; rango2; 2; 3)</b> devuelve el p-valor.'],
    ['r','Con menos datos, el error estándar <b>crece</b> y t <b>baja</b>.']],
  'ic-s12-martes':[
    ['r','U&amp;A: <b>quién</b> (perfil), <b>qué hace</b> (uso) y <b>por qué</b> (actitud).'],
    ['r','Para comparar grupos de distinto tamaño usa el <b>% de columna</b>.'],
    ['r','<b>Heavy user</b>: consume a diario o cada semana.']],
  'ic-s12-miercoles':[
    ['r','<b>Índice</b> = % en heavy ÷ % en la base × 100. Más de 100: sobrerrepresentado.'],
    ['r','60 % vs 40 % son <b>20 puntos porcentuales</b>, no 20 %.'],
    ['r','Porcentajes de categorías: <b>ji-cuadrada</b>. Promedios: <b>prueba T</b>.']],
  'ic-s13-martes':[
    ['r','<b>T2B</b> = (casilla 5 + casilla 4) ÷ total × 100.'],
    ['r','Se mejora primero lo que <b>importa mucho</b> y <b>gusta poco</b>.'],
    ['r','Concepto: la <b>idea</b>. Producto: la <b>receta</b>.']],
  'ic-s13-miercoles':[
    ['r','La receta con media más alta se compara contra <b>cada una</b> de las otras.'],
    ['r','Si hay empate, deciden el <b>T2B, los atributos y el costo</b>.']],
  'ic-s14-martes':[
    ['r','<b>Punto de diferencia</b>: donde tu marca destaca sola.'],
    ['r','<b>Punto de paridad</b>: donde todas las marcas se parecen.'],
    ['r','Lee la batería <b>por fila</b>: ¿quién lidera cada atributo?']],
  'ic-s14-miercoles':[
    ['r','Mapa en Excel: gráfico de <b>dispersión</b>, un punto por marca.'],
    ['r','Los ejes se cruzan en el <b>promedio del mercado</b>.'],
    ['r','Distancia al ideal = <b>√((x₁ − x₂)² + (y₁ − y₂)²)</b>.']],
  'ic-s15-martes':[
    ['r','<b>NPS</b> = % promotores (9–10) − % detractores (0–6).'],
    ['r','Los <b>pasivos</b> (7–8) no suman ni restan, pero cuentan en el total.'],
    ['r','El NPS va de <b>−100 a 100</b>.']],
  'ic-s15-miercoles':[
    ['r','Margen de error = <b>1.96 × √(p × q ÷ n)</b>.'],
    ['r','Resultado = <b>dato</b>. Conclusión = <b>qué significa</b>. Recomendación = <b>qué hacer</b>.'],
    ['r','El título del gráfico <b>dice la conclusión</b>.']]
};
var archivo=(location.pathname.split('/').pop()||'').replace(/\.html?$/,'');
var propios=R[archivo] || MATE;
var ICONOS=['foco','libreta','lapiz','lista','barras','crece','pantalla','pastel','reloj','laptop',
            'celular','cuaderno','tarjeta','billetes','porcentaje','linea','flecha','globo','nube','formulario'];
var PERSONAJES=['tj-docente-presenta','tj-docente-puntero','tj-alumno-senala','tj-alumna-sorpresa','tj-alumno-sentado'];

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

    /* 3. si una tarjeta hizo desbordar la lámina, se achica; si aun así no cabe, se quita */
    var sobra=lam.scrollHeight-lam.clientHeight;
    if(sobra>1){
      var ts=lam.querySelectorAll('.relleno');
      for(var t=ts.length-1;t>=0 && sobra>1;t--){
        var alto=ts[t].getBoundingClientRect().height/z, nuevo=alto-sobra/z-4;
        if(nuevo>=64){ ts[t].style.minHeight=Math.round(nuevo)+'px'; ts[t].style.height=Math.round(nuevo)+'px'; ts[t].style.overflow='hidden'; }
        else ts[t].remove();
        sobra=lam.scrollHeight-lam.clientHeight;
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
