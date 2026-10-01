/* =====================================================================
   dinamica.js — la dinámica de las cuentas del PCGE 2019.

   Qué es cada elemento, por qué una cuenta va al debe o al haber, y
   cuáles son las cuentas que rompen la regla de su elemento.

   Necesita pcge2019.js cargado antes.

   Uso:
       document.getElementById('guia').innerHTML = Dinamica.guia();
       Dinamica.explica('40111','h','el IGV por pagar');
   ===================================================================== */
(function(){
'use strict';

var ELEMENTOS=[
  { n:'1', nom:'Activo disponible y exigible', nat:'Deudora',
    def:'Lo que la empresa tiene en dinero y lo que le deben: caja, bancos, cuentas por cobrar.',
    exc:['122','132','19'] },
  { n:'2', nom:'Activo realizable', nat:'Deudora',
    def:'Lo que la empresa tiene para vender o consumir: mercaderías, productos terminados, materias primas.',
    exc:['29'] },
  { n:'3', nom:'Activo inmovilizado', nat:'Deudora',
    def:'Lo que la empresa usa por varios años: inmuebles, maquinaria, equipo, intangibles.',
    exc:['39'] },
  { n:'4', nom:'Pasivo', nat:'Acreedora',
    def:'Lo que la empresa debe: a proveedores, al banco, a la SUNAT, a los trabajadores.',
    exc:['4011c','422','432'] },
  { n:'5', nom:'Patrimonio', nat:'Acreedora',
    def:'Lo que aportaron los socios y lo que la empresa ha ganado y no ha repartido.',
    exc:['592'] },
  { n:'6', nom:'Gastos por naturaleza', nat:'Deudora',
    def:'En qué se consume la riqueza: compras, sueldos, servicios, depreciación, costo de ventas.',
    exc:['61c'] },
  { n:'7', nom:'Ingresos', nat:'Acreedora',
    def:'De dónde viene la riqueza: ventas de bienes y servicios, y otros ingresos.',
    exc:['74','709'] },
  { n:'8', nom:'Saldos intermediarios de gestión', nat:'—',
    def:'Cuentas de resultado que se usan para armar el estado de resultados. No se mueven en el asiento del día a día.',
    exc:[] },
  { n:'9', nom:'Cuentas analíticas de explotación', nat:'Deudora',
    def:'El mismo gasto del elemento 6, pero ordenado por destino: administración, ventas, producción.',
    exc:[] },
  { n:'0', nom:'Cuentas de orden', nat:'—',
    def:'Registro de control de bienes y compromisos que no son activo ni pasivo, como garantías recibidas.',
    exc:[] }
];

/* cuentas que rompen la regla de su elemento */
var EXCEPCIONES={
  '122':{ nom:'Anticipos de clientes', nat:'Acreedora',
          por:'Está entre las cuentas por cobrar, pero no es un derecho: es plata recibida por adelantado, '+
              'así que la empresa todavía debe la mercadería o el servicio.' },
  '132':{ nom:'Anticipos recibidos (relacionadas)', nat:'Acreedora',
          por:'Lo mismo que la 122, pero cuando quien adelanta el dinero es una empresa relacionada.' },
  '19': { nom:'Estimación de cuentas de cobranza dudosa', nat:'Acreedora',
          por:'Es una cuenta correctora: no suma al activo, lo rebaja, porque calcula la parte que no se va a cobrar.' },
  '29': { nom:'Desvalorización de inventarios', nat:'Acreedora',
          por:'Correctora del inventario: rebaja el valor de las existencias que perdieron precio.' },
  '39': { nom:'Depreciación y amortización acumulados', nat:'Acreedora',
          por:'Correctora del activo fijo: acumula el desgaste, así que resta del valor del bien.' },
  '4011c':{ nom:'4011 IGV en las compras (crédito fiscal)', nat:'Deudora',
          por:'El elemento 4 es pasivo, pero el IGV de las compras es un derecho contra la SUNAT: se descuenta '+
              'del IGV de las ventas. Por eso va al debe. El IGV de las ventas, en cambio, sí es pasivo.' },
  '422':{ nom:'Anticipos a proveedores', nat:'Deudora',
          por:'Está entre las cuentas por pagar, pero es plata ya entregada: el proveedor nos debe la entrega.' },
  '432':{ nom:'Anticipos otorgados (relacionadas)', nat:'Deudora',
          por:'Lo mismo que la 422, con una empresa relacionada.' },
  '592':{ nom:'Pérdidas acumuladas', nat:'Deudora',
          por:'Está en el patrimonio, pero lo rebaja: es lo que la empresa perdió en ejercicios anteriores.' },
  '61c':{ nom:'61 Variación de inventarios en la compra', nat:'Acreedora',
          por:'El elemento 6 es gasto, pero al comprar mercadería la 61 se abona para llevar el bien al almacén '+
              '(la 20 al debe). Se carga recién cuando la mercadería sale.' },
  '74': { nom:'Descuentos, rebajas y bonificaciones concedidos', nat:'Deudora',
          por:'Está en los ingresos, pero los rebaja: es lo que la empresa dejó de cobrar.' },
  '709':{ nom:'Devoluciones sobre ventas', nat:'Deudora',
          por:'Está en los ingresos, pero los rebaja: es la venta que se anuló porque el cliente devolvió.' }
};
/* prefijos que se comprueban contra el código, del más largo al más corto */
var PREFIJOS=['4011','709','122','132','422','432','592','19','29','39','61','74'];

/* 'venta' o 'compra': cambia el lado natural del IGV y de la variación de inventarios */
var CTX='venta';
function contexto(c){ CTX = (c==='compra') ? 'compra' : 'venta'; }

function elDe(cod){ return String(cod).charAt(0); }
function bloque(n){
  var r=null; ELEMENTOS.forEach(function(e){ if(e.n===n) r=e; }); return r;
}
function cuenta(cod){
  if(window.PCGE){
    for(var i=0;i<window.PCGE.length;i++) if(window.PCGE[i][0]===cod) return window.PCGE[i][1];
  }
  return '';
}
function esc(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* naturaleza de una cuenta concreta, con sus excepciones */
function natural(cod){
  cod=String(cod);
  var el=bloque(elDe(cod));
  var base = el ? el.nat : '—';
  var exc=null, i;
  for(i=0;i<PREFIJOS.length;i++){
    if(cod.indexOf(PREFIJOS[i])===0){
      /* el IGV y la variación de inventarios dependen de si es compra o venta:
         en la venta no son excepción; en la compra sí, y por eso cambian de lado */
      if(PREFIJOS[i]==='4011' || PREFIJOS[i]==='61'){
        if(CTX!=='compra') break;          /* en la venta no son excepción */
        exc=EXCEPCIONES[PREFIJOS[i]+'c'];  /* en la compra sí: 4011c y 61c */
        break;
      }
      exc=EXCEPCIONES[PREFIJOS[i]];
      break;
    }
  }
  var nat = exc ? exc.nat : base;
  return {
    el: el ? el.n : '',
    elNom: el ? el.nom : '',
    elDef: el ? el.def : '',
    nat: nat,
    sube: nat==='Deudora' ? 'DEBE' : (nat==='Acreedora' ? 'HABER' : '—'),
    baja: nat==='Deudora' ? 'HABER' : (nat==='Acreedora' ? 'DEBE' : '—'),
    excepcion: exc
  };
}

/* por qué esta cuenta va a este lado en este asiento */
function explica(cod, lado, motivo){
  var n=natural(cod), nom=cuenta(cod);
  var LADO = lado==='d' ? 'DEBE' : 'HABER';
  var sube = (LADO===n.sube);
  var h='<span class="dn-cta">'+esc(cod)+(nom?' · '+esc(nom):'')+'</span>';
  h+='<span class="dn-el">Elemento '+esc(n.el)+' · '+esc(n.elNom)+'. '+esc(n.elDef)+'</span>';
  if(n.excepcion){
    h+='<span class="dn-exc"><b>Ojo, es una excepción.</b> '+esc(n.excepcion.por)+
       ' Por eso su naturaleza es <b>'+esc(n.nat.toLowerCase())+'</b> y aumenta en el <b>'+esc(n.sube)+'</b>.</span>';
  } else {
    h+='<span class="dn-nat">Naturaleza <b>'+esc(n.nat.toLowerCase())+'</b>: aumenta en el <b>'+
       esc(n.sube)+'</b> y disminuye en el <b>'+esc(n.baja)+'</b>.</span>';
  }
  h+='<span class="dn-por">Aquí va al <b>'+esc(LADO)+'</b> porque <b>'+(sube?'aumenta':'disminuye')+'</b>'+
     (motivo ? ': '+esc(motivo) : '')+'.</span>';
  return h;
}

/* tabla de los elementos, con sus excepciones */
function tabla(){
  var h='<div class="dn-envoltura"><table class="dn-tabla"><thead><tr>'+
        '<th>Elem.</th><th>Denominación</th><th>Debe</th><th>Haber</th><th>Excepciones</th>'+
        '</tr></thead><tbody>';
  ELEMENTOS.forEach(function(e){
    var d = e.nat==='Deudora' ? '+' : (e.nat==='Acreedora' ? '−' : '');
    var a = e.nat==='Deudora' ? '−' : (e.nat==='Acreedora' ? '+' : '');
    var cl = e.nat==='—' ? ' class="gris"' : '';
    h+='<tr'+cl+'><td class="ne">'+esc(e.n)+'</td><td class="de">'+esc(e.nom)+'</td>'+
       (d ? '<td class="'+(d==='+'?'mas':'menos')+'">('+d+')</td>' : '<td class="vac"></td>')+
       (a ? '<td class="'+(a==='+'?'mas':'menos')+'">('+a+')</td>' : '<td class="vac"></td>')+
       '<td class="ex">'+(e.exc.length
          ? e.exc.map(function(x){ return esc(x.replace('c',' (compra)')); }).join(', ')
          : '—')+'</td></tr>';
  });
  h+='</tbody></table></div>';
  return h;
}

/* guía completa: tabla, qué es cada elemento y las excepciones explicadas */
function guia(){
  var h='<p class="dn-intro">Cada cuenta pertenece a un <b>elemento</b>, y el elemento manda: '+
        'dice si la cuenta aumenta en el debe o en el haber. '+
        'Un puñado de cuentas rompe la regla de su elemento; esas son las excepciones.</p>';
  h+=tabla();
  h+='<div class="dn-defs">';
  ELEMENTOS.forEach(function(e){
    if(e.nat==='—') return;
    h+='<div class="dn-def"><span class="dd-n">'+esc(e.n)+'</span>'+
       '<span class="dd-t"><b>'+esc(e.nom)+'</b> — '+esc(e.def)+'<br>'+
       '<span class="dd-r">Naturaleza '+esc(e.nat.toLowerCase())+': aumenta en el <b>'+
       (e.nat==='Deudora'?'DEBE':'HABER')+'</b> y disminuye en el <b>'+
       (e.nat==='Deudora'?'HABER':'DEBE')+'</b>.</span></span></div>';
  });
  h+='</div>';
  h+='<h3 class="dn-sub">Las cuentas que rompen la regla</h3><div class="dn-defs">';
  PREFIJOS.slice().sort().forEach(function(p){
    var k = (p==='4011') ? '4011c' : (p==='61' ? '61c' : p);
    var e=EXCEPCIONES[k];
    if(!e) return;
    h+='<div class="dn-def"><span class="dd-n exc">'+esc(p==='4011'?'4011':p)+'</span>'+
       '<span class="dd-t"><b>'+esc(e.nom)+'</b> — '+esc(e.por)+'<br>'+
       '<span class="dd-r">Naturaleza '+esc(e.nat.toLowerCase())+': aumenta en el <b>'+
       (e.nat==='Deudora'?'DEBE':'HABER')+'</b>.</span></span></div>';
  });
  h+='</div>';
  return h;
}

/* modelo: un comprobante y su asiento tipo, para guiarse */
var MODELO={
  emisor:'LOS GORRIONES S.A.', rucE:'RUC 20334020184',
  dir:'Av. Parra 415 — Cercado — Arequipa',
  tipo:'FACTURA ELECTRÓNICA', serie:'E001-0101', fecha:'05/02/2026',
  cliente:'PIRQA CONSTRUCTORES S.A.C.', rucC:'RUC 20603383258',
  pago:'Crédito 30 días',
  item:['8.00','UNIDAD','LAPTOP CORE I5 16GB RAM 512GB SSD','2,650.00'],
  cifras:[ ['Valor de venta','21,200.00'], ['IGV 18 %','3,816.00'],
           ['Importe total','25,016.00'] ],
  lineas:[
    { g:'Por la venta', c:'1212',  l:'d', m:'25,016.00', q:'el cliente nos debe el importe total' },
    { g:'Por la venta', c:'40111', l:'h', m:'3,816.00',  q:'el IGV que se debe a la SUNAT' },
    { g:'Por la venta', c:'70121', l:'h', m:'21,200.00', q:'el valor de venta es el ingreso' },
    { g:'Por el cobro', c:'1041',  l:'d', m:'25,016.00', q:'entra el dinero al banco' },
    { g:'Por el cobro', c:'1212',  l:'h', m:'25,016.00', q:'ya no nos deben nada' }
  ],
  cobro:'Cobrada el 07/03/2026 con transferencia a la cuenta corriente.'
};
function modelo(propio){
  var m=propio||MODELO;
  var h='<div class="md">';
  /* el comprobante */
  h+='<div class="md-doc"><div class="dh"><div><b>'+esc(m.emisor)+'</b>'+
     '<span>'+esc(m.rucE)+'</span><span>'+esc(m.dir)+'</span></div>'+
     '<div class="caja"><div class="t">'+esc(m.tipo)+'</div><div class="n">'+esc(m.serie)+'</div></div></div>'+
     '<div class="dd"><span>Fecha</span><b>'+esc(m.fecha)+'</b>'+
     '<span>'+esc(m.rotParte||'Señor(es)')+'</span><b>'+esc(m.parte||m.cliente)+'</b>'+
     '<span>RUC</span><b>'+esc(m.rucParte||m.rucC)+'</b>'+
     '<span>Forma de pago</span><b>'+esc(m.pago)+'</b></div>'+
     '<table class="di"><thead><tr><th>Cant.</th><th>U.M.</th><th>Descripción</th><th>V. unitario</th></tr></thead>'+
     '<tbody><tr><td>'+esc(m.item[0])+'</td><td>'+esc(m.item[1])+'</td><td>'+esc(m.item[2])+'</td>'+
     '<td class="n">'+esc(m.item[3])+'</td></tr></tbody></table>'+
     '<div class="dt">';
  m.cifras.forEach(function(c, i){
    h+='<div class="f'+(i===2?' g':'')+'"><span>'+esc(c[0])+'</span>'+
       '<span class="n">'+esc(c[1])+'</span></div>';
  });
  h+='</div><div class="md-co">'+esc(m.pie||m.cobro||'')+'</div></div>';
  /* el asiento tipo */
  h+='<div class="md-as"><div class="md-t">Así queda el asiento</div>'+
     '<table class="md-tabla"><thead><tr><th>Código</th><th>Cuenta</th>'+
     '<th class="d">Debe</th><th class="h">Haber</th></tr></thead><tbody>';
  var gAct='';
  m.lineas.forEach(function(l){
    if(l.g!==gAct){ gAct=l.g; h+='<tr class="g"><td colspan="4">'+esc(l.g)+'</td></tr>'; }
    var nomL=(m.nombres && m.nombres[l.c]) || cuenta(l.c) || 'Terceros';
    h+='<tr><td class="cc">'+esc(l.c)+'</td><td>'+esc(nomL)+
       '<span class="por">'+esc(l.l==='d'?'al debe':'al haber')+' porque '+
       (natural(l.c).sube===(l.l==='d'?'DEBE':'HABER')?'aumenta':'disminuye')+': '+esc(l.q)+'</span></td>'+
       '<td class="n">'+(l.l==='d'?esc(l.m):'')+'</td>'+
       '<td class="n">'+(l.l==='h'?esc(l.m):'')+'</td></tr>';
  });
  h+='</tbody></table>'+
     '<p class="md-p">En cada asiento la suma del <b>debe</b> tiene que ser igual a la del <b>haber</b>.</p>'+
     '</div></div>';
  return h;
}

/* ¿la cuenta escrita sirve para la esperada?
   Vale el código completo y también cualquier nivel superior:
   para 1212 valen 12, 121 y 1212.                              */
function esLaCuenta(escrito, esperado){
  escrito=String(escrito||'').trim();
  esperado=String(esperado||'');
  if(!escrito) return false;
  if(escrito===esperado) return true;
  return escrito.length>=2 && escrito.length<esperado.length && esperado.indexOf(escrito)===0;
}

/* una sola línea: a qué lado va y por qué */
function motivo(cod, lado, q){
  var n=natural(cod), LADO = lado==='d' ? 'DEBE' : 'HABER';
  return '<b>'+esc(cod)+'</b> va al <b>'+LADO+'</b> porque '+
         (LADO===n.sube ? 'aumenta' : 'disminuye')+(q ? ': '+esc(q) : '')+'.';
}

/* lista de referencia con las cuentas que hacen falta en un caso */
function lista(codigos, titulo){
  var h='<div class="dn-lista">';
  if(titulo) h+='<div class="dl-t">'+esc(titulo)+'</div>';
  codigos.forEach(function(cod){
    var n=natural(cod), nm=cuenta(cod)||(cod==='70121'?'Terceros':'');
    h+='<div class="dl-i"><span class="dl-c">'+esc(cod)+'</span>'+
       '<span class="dl-n"><b>'+esc(nm)+'</b><span class="dl-e">Elemento '+esc(n.el)+' · '+
       esc(n.elNom)+' · naturaleza '+esc(n.nat.toLowerCase())+
       (n.excepcion?' (excepción)':'')+', aumenta en el <b>'+esc(n.sube)+'</b></span></span></div>';
  });
  h+='</div>';
  return h;
}

window.Dinamica={ guia:guia, tabla:tabla, explica:explica, natural:natural,
                  modelo:modelo, motivo:motivo, lista:lista, esLaCuenta:esLaCuenta,
                  contexto:contexto };
})();
