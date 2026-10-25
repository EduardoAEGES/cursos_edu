/* ============================================================
   cont-certus.js — Contabilidad con el diseño Certus 2026.
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
  ['r','El IGV es <b>18 %</b> del valor de venta. Precio de venta ÷ <b>1.18</b> = valor de venta.'],
  ['r','<b>Factura</b>: a quien tiene RUC, da crédito fiscal. <b>Boleta</b>: consumidor final.'],
  ['r','Todo asiento cuadra: <b>Debe = Haber</b>.'],
  ['r','Ecuación contable: <b>Activo = Pasivo + Patrimonio</b>.']
];
var R={
  'cont-s2':[
    ['r','<b>Ente</b>: la empresa es distinta de su dueño. Los gastos personales no son de la empresa.'],
    ['r','<b>Moneda común</b>: todo se registra en soles, convirtiendo al tipo de cambio.'],
    ['r','RER: renta de <b>1.5 %</b> de los ingresos netos de cada mes.'],
    ['r','Una <b>S.A.C.</b> nunca puede estar en el Nuevo RUS.'],
    ['r','Elementos 1 a 3: <b>activo</b> · 4: <b>pasivo</b> · 5: <b>patrimonio</b> · 6: <b>gastos</b> · 7: <b>ingresos</b>.']],
  'cont-s3':[
    ['r','La <b>guía de remisión</b> sustenta el traslado; no es comprobante de pago.'],
    ['r','Venta: <b>12</b> al Debe, <b>40</b> y <b>70</b> al Haber.'],
    ['r','Compra: <b>60</b> y <b>40</b> al Debe, <b>42</b> al Haber. Luego el destino: <b>20</b> contra <b>61</b>.'],
    ['r','Equivalentes de efectivo: inversiones que vencen en <b>tres meses o menos</b>.']],
  'cont-s4':[
    ['r','Sobrante o faltante = efectivo + documentos válidos − <b>fondo fijo</b>.'],
    ['r','Un gasto sin comprobante <b>no sustenta</b> el arqueo.'],
    ['r','Lo que está en el banco y no en el libro <b>se registra en el libro</b>.'],
    ['r','Lo que está en el libro y no en el banco se explica como <b>partida conciliatoria</b>.']],
  'cont-s5':[
    ['r','Saldo <b>vencido</b>: ya pasó su fecha de pago. Saldo <b>por vencer</b>: todavía no.'],
    ['r','La <b>letra de cambio</b> la acepta el deudor; el <b>pagaré</b> lo emite el deudor.'],
    ['r','IGV = 16 % de impuesto + 2 % de <b>IPM</b>.']],
  'cont-s6':[
    ['r','Por vencer = saldo del cliente × <b>% por vencer</b> de su tipo.'],
    ['r','Cobranza: <b>10</b> al Debe, <b>12</b> al Haber.'],
    ['r','Pago a proveedor: <b>42</b> al Debe, <b>10</b> al Haber.'],
    ['r','Capacidad de pago = lo que se <b>cobra</b> − lo que se <b>debe pagar</b> en el mes.']],
  'cont-s7':[
    ['r','La <b>depreciación acumulada</b> resta del activo fijo.'],
    ['r','Moneda extranjera × <b>tipo de cambio</b> antes de sumarla.'],
    ['r','Impuesto a la renta: <b>29.5 %</b> de la utilidad antes de impuestos.'],
    ['r','<b>PDT 621</b>: IGV y renta mensual · <b>PLAME</b>: planilla · <b>Form. 710</b>: renta anual.']],
  'cont-s8':[
    ['r','Utilidad bruta → operativa → antes de impuestos → <b>neta</b>.'],
    ['r','La utilidad neta del ER se traslada al <b>patrimonio</b> del ESF.'],
    ['r','Margen neto = utilidad neta ÷ <b>ventas</b>.']]
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
