/* ============================================================
   pl-certus.js — Pensamiento Lógico con el diseño Certus 2026.
   Va en todas las sesiones del curso, después del script de la página:
   - agrega el pie de página del equipo académico en la lámina;
   - cuando una lámina deja espacio vacío, lo llena con una tarjeta de
     «Recuerda» del tema de la sesión, con íconos y personajes Certus.
   No toca las actividades ni las respuestas: solo agrega elementos al final.
   ============================================================ */
(function(){
'use strict';
var lam=document.getElementById('lam'), esc=document.getElementById('esc');
if(!lam || !esc) return;

/* ---------- pie de página ---------- */
var pie=document.createElement('div');
pie.className='pie-equipo';
pie.innerHTML='<span>Elaborado por el equipo académico de <b>CERTUS</b>: Luis, Mirko y Eduardo</span>'+
              '<span class="pe-der">Pensamiento Lógico <i>·</i> certus.edu.pe</span>';
var avance=esc.querySelector('.avance');
esc.insertBefore(pie, avance || null);

/* ---------- recordatorios de cada sesión ---------- */
var COMUN=[
  ['tip','¿Tienes una duda? Pulsa <b>🙋 Avisar al docente</b>: levanta la mano sin interrumpir.'],
  ['tip','Usa la <b>calculadora flotante</b> para revisar tus cuentas antes de responder.'],
  ['tip','Lee el enunciado <b>dos veces</b> y subraya los datos antes de calcular.'],
  ['tip','Si te equivocas, revisa el paso a paso: <b>el error también enseña</b>.'],
  ['tip','Explicarle a tu compañero es la mejor forma de aprender: <b>trabaja en equipo</b>.']
];
var LOGICA=[
  ['r','<b>p → q</b> solo es falso cuando <b>p es V y q es F</b>. En los demás casos es verdadero.'],
  ['r','Contraposición: <b>p → q</b> dice lo mismo que <b>~q → ~p</b>. Niega las dos y cámbialas de lugar.'],
  ['r','<b>Modus ponens (MPP):</b> de p → q y p, concluyo <b>q</b>.'],
  ['r','<b>Modus tollens (MTT):</b> de p → q y ~q, concluyo <b>~p</b>.'],
  ['r','Cuidado con las falacias: de p → q y <b>q</b> no puedo concluir p; de p → q y <b>~p</b> no puedo concluir ~q.'],
  ['r','La justificación dice la ley y las líneas: <b>MTT, 1, 3</b> = modus tollens con las líneas (1) y (3).'],
  ['r','<b>p ∧ q</b> es verdadera solo si las dos son V. <b>p ∨ q</b> es falsa solo si las dos son F.']
];
var R={
  'sesion-2-pensamiento-logico': LOGICA,
  'pl-semana-2-reforzamiento': LOGICA,
  'pl-semana-2-parte-1':[
    ['r','Los <b>enteros</b> incluyen los negativos: una deuda de S/ 50 se escribe <b>−50</b>.'],
    ['r','En una fracción, el <b>denominador</b> (abajo) dice en cuántas partes se divide el todo.'],
    ['r','Para hallar <b>3/4 de 200</b>: divide entre 4 y multiplica por 3 → 200 ÷ 4 × 3 = <b>150</b>.'],
    ['r','Con el <b>mismo denominador</b>, solo se suman los numeradores: 2/7 + 3/7 = <b>5/7</b>.'],
    ['r','Para multiplicar fracciones: <b>arriba por arriba y abajo por abajo</b>, y luego simplifica.'],
    ['r','Para pasar de decimal a porcentaje, multiplica por 100: 0.25 = <b>25 %</b>.']],
  'pl-semana-2-parte-2':[
    ['r','Solo se suman los <b>términos semejantes</b>: misma letra y mismo exponente.'],
    ['r','Para despejar x, lo que <b>suma pasa restando</b> y lo que <b>multiplica pasa dividiendo</b>.'],
    ['r','Pólya en 4 pasos: <b>comprender, planificar, ejecutar y revisar</b>.'],
    ['r','Revisa siempre: <b>reemplaza x</b> en la ecuación y comprueba que se cumple.'],
    ['r','«El doble de un número» es <b>2x</b>; «un número aumentado en 5» es <b>x + 5</b>.']],
  'pl-semana-2-parte-3':[
    ['r','Primero el <b>modelo general</b> (CT = CF + CV) y después <b>reemplaza los datos</b>.'],
    ['r','En caja, lo que <b>se cobra suma</b> y lo que <b>se paga resta</b>.'],
    ['r','Sumar 30 % al costo es <b>x + 0.30x = 1.30x</b>; descontar 13 % es <b>x − 0.13x = 0.87x</b>.'],
    ['r','«El doble de Taquilla» es <b>2T</b> y «S/ 500 más que Taquilla» es <b>T + 500</b>.'],
    ['r','Costo total = <b>costo fijo + costo variable × cantidad</b>.'],
    ['r','Revisa siempre: reemplaza tu respuesta en el <b>modelo</b> y comprueba el total.']],
  'pl-semana-3-parte-1':[
    ['r','<b>Costo total:</b> CT = CF + CV, donde CV = costo variable unitario × cantidad.'],
    ['r','<b>Ingreso:</b> I = precio × cantidad.'],
    ['r','<b>Utilidad:</b> U = I − CT. Si sale negativa, hay pérdida.'],
    ['r','El <b>costo fijo</b> se paga aunque no se produzca nada: alquiler, sueldos fijos.'],
    ['r','En el <b>punto de equilibrio</b>, I = CT y la utilidad es cero.']],
  'pl-semana-3-parte-2':[
    ['r','Un sistema de dos ecuaciones busca el <b>único par (x, y)</b> que cumple las dos.'],
    ['r','<b>Sustitución:</b> despeja una variable y reemplázala en la otra ecuación.'],
    ['r','<b>Reducción:</b> multiplica para que una variable se elimine al sumar las ecuaciones.'],
    ['r','La <b>demanda</b> baja cuando el precio sube; la <b>oferta</b> sube cuando el precio sube.'],
    ['r','El <b>equilibrio</b> de mercado está donde la oferta es igual a la demanda.']],
  'pl-semana-4-parte-1':[
    ['r','Un punto se escribe <b>(x, y)</b>: primero el eje horizontal, después el vertical.'],
    ['r','Cuadrantes: I (+,+), II (−,+), III (−,−), IV (+,−).'],
    ['r','Para graficar una recta, basta con <b>dos puntos</b>: arma una tabla de valores.'],
    ['r','El punto <b>(0, b)</b> es donde la recta corta al eje y.']],
  'pl-semana-4-parte-2':[
    ['r','<b>Pendiente:</b> m = (y₂ − y₁) / (x₂ − x₁).'],
    ['r','Si m &gt; 0 la recta <b>sube</b>; si m &lt; 0 <b>baja</b>; si m = 0 es horizontal.'],
    ['r','<b>Función lineal:</b> f(x) = mx + b. La m es lo que cambia por cada unidad; la b es el valor inicial.'],
    ['r','En un modelo de costos, la pendiente es el <b>costo por unidad</b> y b es el <b>costo fijo</b>.']],
  'pl-semana-5-parte-1':[
    ['r','<b>Punto y pendiente:</b> y − y₁ = m(x − x₁).'],
    ['r','Con <b>dos puntos</b>, primero calcula la pendiente y luego usa uno de los puntos.'],
    ['r','Forma pendiente-intersección: <b>y = mx + b</b>.'],
    ['r','Comprueba tu recta reemplazando los puntos: <b>los dos deben cumplirla</b>.']],
  'pl-semana-5-parte-2':[
    ['r','En el <b>equilibrio</b>, cantidad ofertada = cantidad demandada.'],
    ['r','El <b>a %</b> de N es <b>a/100 × N</b>: el 20 % de 300 es 60.'],
    ['r','Los <b>descuentos sucesivos no se suman</b>: 20 % y luego 10 % es un 28 % en total.'],
    ['r','Aumentar 18 % es multiplicar por <b>1.18</b>; descontar 15 % es multiplicar por <b>0.85</b>.']],
  'pl-semana-6-parte-1':[
    ['r','<b>Variación porcentual</b> = (valor final − valor inicial) / valor inicial × 100.'],
    ['r','Si la variación sale <b>positiva subió</b>; si sale <b>negativa bajó</b>.'],
    ['r','Siempre se divide entre el <b>valor inicial</b>, no entre el final.'],
    ['r','Valor final = valor inicial × (1 + variación). Valor inicial = final ÷ (1 + variación).']],
  'pl-semana-6-parte-2':[
    ['r','<b>Precio de venta</b> = valor de venta × 1.18 (incluye el IGV de 18 %).'],
    ['r','<b>Valor de venta</b> = precio de venta ÷ 1.18.'],
    ['r','<b>IGV</b> = valor de venta × 0.18, o precio de venta − valor de venta.'],
    ['r','En la factura: valor de venta + IGV = <b>importe total</b>.']],
  'pl-semana-7-parte-1':[
    ['r','En el <b>interés compuesto</b>, los intereses se suman al capital y también ganan intereses.'],
    ['r','Elementos: <b>C</b> capital, <b>i</b> tasa, <b>n</b> períodos y <b>S</b> monto final.'],
    ['r','La <b>tasa activa</b> la cobra el banco por prestar; la <b>pasiva</b> la paga por tus ahorros.'],
    ['r','La tasa y el tiempo deben estar en la <b>misma unidad</b>: mensual con meses, anual con años.']],
  'pl-semana-7-parte-2':[
    ['r','<b>Monto:</b> S = C (1 + i)ⁿ.'],
    ['r','<b>Capital:</b> C = S / (1 + i)ⁿ.'],
    ['r','En la <b>línea de tiempo</b>, marca hoy como 0 y cada período hacia la derecha.'],
    ['r','Antes de calcular, convierte la tasa a decimal: 2 % = <b>0.02</b>.']],
  'pl-semana-8-parte-1':[
    ['r','En una <b>ecuación de valor</b>, todo el dinero se compara en la <b>misma fecha focal</b>.'],
    ['r','Llevar dinero al futuro: <b>multiplica</b> por (1 + i)ⁿ.'],
    ['r','Traer dinero al presente: <b>divide</b> entre (1 + i)ⁿ.'],
    ['r','Lo que se debe, llevado a la fecha focal, es igual a lo que se paga, llevado a esa fecha.']],
  'pl-semana-8-parte-2':[
    ['r','Pasos: dibuja la línea de tiempo, elige la fecha focal, lleva todo a esa fecha e iguala.'],
    ['r','Al pagar en dos partes, la incógnita <b>x</b> va en la línea de tiempo como cualquier pago.'],
    ['r','La fecha focal no cambia el resultado si la tasa es la misma; elige la que <b>simplifique</b> las cuentas.'],
    ['r','Repasa: S = C(1 + i)ⁿ y C = S / (1 + i)ⁿ son la misma fórmula despejada.']]
};
var archivo=(location.pathname.split('/').pop()||'').replace(/\.html?$/,'');
/* la versión demo de una sesión usa los recordatorios de la sesión original */
var propios=R[archivo] || R[archivo.replace(/-demo$/,'')] || LOGICA;
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
