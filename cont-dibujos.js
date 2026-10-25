/* ============================================================
   cont-dibujos.js — Contabilidad, sesiones 2 a 8 (diseño Certus).
   Va ANTES del script de la página, porque las diapositivas lo usan:
     TAPA(titulo, bajada, etiquetas)      portada de la sesión
     GLOBO(personaje, etiqueta, texto)     personaje Certus con globo
     CASO(dibujo, etiqueta, titulo, texto, datos)   tarjeta de caso con dibujo
     EVID(entrega, califica)               qué se entrega y cómo se califica
     SINTAXIS(titulo, filas)               repaso breve de fórmulas de Excel
   CARPETA: enlace a la carpeta del curso. Mientras esté vacío, la tarjeta
   indica que el material está en el campus digital.
   ============================================================ */
(function(){
'use strict';
var CARPETA='';
var N='#071767', R='#FC0045', A='#13A8AF', M='#C600A3', C='#D5DDEF', V='#1D6F42', F='#F1F5FD';

var DIB={
  excel:
   '<svg viewBox="0 0 220 170" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="10" width="204" height="150" rx="12" fill="#fff" stroke="'+C+'" stroke-width="3"/>'+
   '<rect x="8" y="10" width="204" height="28" rx="12" fill="'+V+'"/><rect x="8" y="26" width="204" height="12" fill="'+V+'"/>'+
   '<text x="22" y="30" font-family="Arial" font-size="15" font-weight="700" fill="#fff">X  Excel</text>'+
   '<rect x="18" y="46" width="184" height="20" rx="5" fill="#EEF6F1" stroke="#CFE5D8"/>'+
   '<text x="26" y="61" font-family="Consolas,monospace" font-size="13" font-weight="700" fill="'+V+'">fx  =B2/1.18</text>'+
   '<g stroke="'+C+'" stroke-width="2"><line x1="18" y1="78" x2="202" y2="78"/><line x1="18" y1="100" x2="202" y2="100"/><line x1="18" y1="122" x2="202" y2="122"/><line x1="18" y1="144" x2="202" y2="144"/>'+
   '<line x1="70" y1="72" x2="70" y2="150"/><line x1="136" y1="72" x2="136" y2="150"/></g>'+
   '<rect x="137" y="101" width="64" height="20" fill="#FFF4CC" stroke="'+R+'" stroke-width="2.5"/></svg>',
  caja:
   '<svg viewBox="0 0 220 170" xmlns="http://www.w3.org/2000/svg"><rect x="30" y="70" width="160" height="80" rx="10" fill="'+N+'"/>'+
   '<rect x="44" y="84" width="132" height="22" rx="4" fill="#E7F8FF"/><text x="54" y="100" font-family="Consolas,monospace" font-size="14" font-weight="700" fill="'+N+'">S/ 3,200.00</text>'+
   '<rect x="60" y="30" width="100" height="44" rx="6" fill="#fff" stroke="'+C+'" stroke-width="3"/>'+
   '<rect x="72" y="40" width="34" height="18" rx="3" fill="#7FB069"/><rect x="112" y="40" width="34" height="18" rx="3" fill="#9CCC65"/>'+
   '<g fill="#F2C14E"><circle cx="66" cy="128" r="9"/><circle cx="88" cy="128" r="9"/><circle cx="110" cy="128" r="9"/></g>'+
   '<rect x="132" y="118" width="44" height="20" rx="4" fill="'+R+'"/><text x="138" y="133" font-family="Arial" font-size="12" font-weight="800" fill="#fff">ARQUEO</text></svg>',
  banco:
   '<svg viewBox="0 0 220 170" xmlns="http://www.w3.org/2000/svg"><path d="M20 62 L110 18 L200 62 Z" fill="'+N+'"/>'+
   '<rect x="26" y="62" width="168" height="10" fill="'+N+'"/><g fill="#fff" stroke="'+C+'" stroke-width="2">'+
   '<rect x="40" y="76" width="16" height="56"/><rect x="76" y="76" width="16" height="56"/><rect x="128" y="76" width="16" height="56"/><rect x="164" y="76" width="16" height="56"/></g>'+
   '<rect x="20" y="132" width="180" height="14" fill="'+N+'"/><text x="94" y="52" font-family="Arial" font-size="16" font-weight="900" fill="#fff">S/</text>'+
   '<g stroke="'+R+'" stroke-width="4" fill="none"><path d="M98 104 l8 8 l16 -18"/></g></svg>',
  factura:
   '<svg viewBox="0 0 220 170" xmlns="http://www.w3.org/2000/svg"><rect x="46" y="10" width="128" height="150" rx="8" fill="#fff" stroke="'+N+'" stroke-width="3"/>'+
   '<rect x="46" y="10" width="128" height="30" rx="8" fill="'+N+'"/><text x="60" y="31" font-family="Arial" font-size="14" font-weight="900" fill="#fff">FACTURA</text>'+
   '<text x="60" y="56" font-family="Arial" font-size="10" font-weight="700" fill="'+N+'">F001-000320 · RUC 20...</text>'+
   '<g fill="'+C+'"><rect x="60" y="66" width="98" height="6" rx="3"/><rect x="60" y="78" width="80" height="6" rx="3"/><rect x="60" y="90" width="90" height="6" rx="3"/></g>'+
   '<g font-family="Arial" font-size="11" font-weight="700" fill="'+N+'"><text x="60" y="118">Valor venta</text><text x="132" y="118">440.68</text>'+
   '<text x="60" y="133">IGV 18 %</text><text x="132" y="133">79.32</text></g>'+
   '<rect x="56" y="139" width="108" height="16" rx="3" fill="'+R+'"/><text x="62" y="151" font-family="Arial" font-size="11" font-weight="800" fill="#fff">TOTAL  S/ 520.00</text></svg>',
  libro:
   '<svg viewBox="0 0 220 170" xmlns="http://www.w3.org/2000/svg"><path d="M110 30 Q70 16 22 26 L22 146 Q70 136 110 150 Z" fill="#fff" stroke="'+N+'" stroke-width="3"/>'+
   '<path d="M110 30 Q150 16 198 26 L198 146 Q150 136 110 150 Z" fill="#fff" stroke="'+N+'" stroke-width="3"/>'+
   '<text x="36" y="52" font-family="Arial" font-size="12" font-weight="900" fill="'+R+'">DIARIO</text><text x="128" y="52" font-family="Arial" font-size="12" font-weight="900" fill="'+R+'">MAYOR</text>'+
   '<g stroke="'+C+'" stroke-width="3"><line x1="36" y1="66" x2="96" y2="66"/><line x1="36" y1="82" x2="96" y2="82"/><line x1="36" y1="98" x2="96" y2="98"/><line x1="36" y1="114" x2="96" y2="114"/></g>'+
   '<line x1="154" y1="62" x2="154" y2="124" stroke="'+N+'" stroke-width="3"/><line x1="128" y1="70" x2="182" y2="70" stroke="'+N+'" stroke-width="3"/>'+
   '<text x="134" y="92" font-family="Arial" font-size="11" font-weight="700" fill="'+N+'">Debe</text><text x="160" y="92" font-family="Arial" font-size="11" font-weight="700" fill="'+N+'">Haber</text></svg>',
  regimen:
   '<svg viewBox="0 0 220 170" xmlns="http://www.w3.org/2000/svg">'+
   '<g font-family="Arial" font-weight="900" font-size="13">'+
   '<rect x="14" y="110" width="44" height="40" rx="6" fill="'+A+'"/><text x="19" y="135" fill="#fff">NRUS</text>'+
   '<rect x="64" y="84" width="44" height="66" rx="6" fill="'+M+'"/><text x="73" y="122" fill="#fff">RER</text>'+
   '<rect x="114" y="58" width="44" height="92" rx="6" fill="'+R+'"/><text x="121" y="108" fill="#fff">RMT</text>'+
   '<rect x="164" y="26" width="44" height="124" rx="6" fill="'+N+'"/><text x="175" y="92" fill="#fff">RG</text></g>'+
   '<line x1="8" y1="152" x2="214" y2="152" stroke="'+N+'" stroke-width="3"/>'+
   '<text x="14" y="18" font-family="Arial" font-size="12" font-weight="800" fill="'+N+'">Más ingresos → otro régimen</text></svg>',
  cartera:
   '<svg viewBox="0 0 220 170" xmlns="http://www.w3.org/2000/svg"><rect x="16" y="18" width="188" height="134" rx="10" fill="#fff" stroke="'+C+'" stroke-width="3"/>'+
   '<rect x="16" y="18" width="188" height="26" rx="10" fill="'+N+'"/><text x="28" y="36" font-family="Arial" font-size="13" font-weight="900" fill="#fff">CARTERA DE CLIENTES</text>'+
   '<g font-family="Arial" font-size="11" font-weight="700"><text x="28" y="64" fill="'+N+'">Vencido</text><text x="28" y="88" fill="'+N+'">0 – 15 días</text><text x="28" y="112" fill="'+N+'">16 – 30 días</text><text x="28" y="136" fill="'+N+'">31 a más</text></g>'+
   '<rect x="100" y="54" width="92" height="13" rx="3" fill="'+R+'"/><rect x="100" y="78" width="40" height="13" rx="3" fill="'+M+'"/>'+
   '<rect x="100" y="102" width="30" height="13" rx="3" fill="'+A+'"/><rect x="100" y="126" width="22" height="13" rx="3" fill="'+N+'"/></svg>',
  balanza:
   '<svg viewBox="0 0 220 170" xmlns="http://www.w3.org/2000/svg"><rect x="104" y="40" width="12" height="104" fill="'+N+'"/><rect x="70" y="140" width="80" height="14" rx="6" fill="'+N+'"/>'+
   '<line x1="30" y1="46" x2="190" y2="46" stroke="'+N+'" stroke-width="6" stroke-linecap="round"/><circle cx="110" cy="40" r="9" fill="'+R+'"/>'+
   '<path d="M30 46 L12 96 L48 96 Z M190 46 L172 96 L208 96 Z" fill="none" stroke="'+N+'" stroke-width="2"/>'+
   '<path d="M8 96 a22 10 0 0 0 44 0 Z" fill="'+A+'"/><path d="M168 96 a22 10 0 0 0 44 0 Z" fill="'+M+'"/>'+
   '<g font-family="Arial" font-size="12" font-weight="800" fill="'+N+'"><text x="10" y="126">Activo</text><text x="150" y="126">Pasivo + Pat.</text></g></svg>',
  informe:
   '<svg viewBox="0 0 220 170" xmlns="http://www.w3.org/2000/svg"><rect x="54" y="18" width="128" height="146" rx="10" fill="#fff" stroke="'+C+'" stroke-width="3"/>'+
   '<rect x="38" y="8" width="128" height="146" rx="10" fill="#fff" stroke="'+N+'" stroke-width="3"/>'+
   '<text x="52" y="34" font-family="Arial" font-size="12" font-weight="800" fill="'+R+'">INFORME</text>'+
   '<g fill="'+C+'"><rect x="52" y="42" width="98" height="6" rx="3"/><rect x="52" y="54" width="80" height="6" rx="3"/></g>'+
   '<g fill="'+A+'"><rect x="58" y="110" width="16" height="30"/><rect x="82" y="92" width="16" height="48"/><rect x="106" y="76" width="16" height="64"/></g><rect x="130" y="100" width="16" height="40" fill="'+R+'"/>'+
   '<line x1="52" y1="140" x2="152" y2="140" stroke="'+N+'" stroke-width="2"/></svg>',
  expo:
   '<svg viewBox="0 0 220 170" xmlns="http://www.w3.org/2000/svg"><rect x="70" y="14" width="140" height="92" rx="8" fill="#fff" stroke="'+N+'" stroke-width="3"/>'+
   '<text x="84" y="38" font-family="Arial" font-size="13" font-weight="800" fill="'+N+'">Caso del grupo</text>'+
   '<g fill="'+A+'"><rect x="86" y="70" width="14" height="24"/><rect x="108" y="56" width="14" height="38"/></g><rect x="130" y="46" width="14" height="48" fill="'+R+'"/>'+
   '<circle cx="34" cy="62" r="16" fill="'+N+'"/><rect x="18" y="80" width="32" height="56" rx="12" fill="'+R+'"/>'+
   '<line x1="48" y1="92" x2="88" y2="62" stroke="'+N+'" stroke-width="4" stroke-linecap="round"/>'+
   '<circle cx="186" cy="138" r="18" fill="none" stroke="'+R+'" stroke-width="4"/><text x="174" y="143" font-family="Arial" font-size="11" font-weight="900" fill="'+R+'">3-5</text></svg>'
};
var PJ={ pres:'personajes/profe-presenta.webp', idea:'personajes/profe-idea.webp', ok:'personajes/profe-completa.webp',
         tutor:'personajes/tutor-explica.webp', bien:'personajes/tutor-bien.webp', alum:'personajes/alumno-senala.webp' };
window.PJ=PJ;
window.GLOBO=function(img, et, txt){
  return '<div class="perso"><img src="'+(PJ[img]||img)+'" alt="" loading="lazy">'+
         '<div class="globo"><span class="et">'+et+'</span>'+txt+'</div></div>';
};
window.TAPA=function(titulo, bajada, vias){
  return '<div class="tapa"><div class="fil"><img class="cl" src="marca/certus-blanco.png" alt="Certus">'+
         '<span>Contabilidad · Segundo ciclo</span></div><h2>'+titulo+'</h2><p>'+bajada+'</p>'+
         (vias ? '<div class="via">'+vias.map(function(v){ return '<b>'+v+'</b>'; }).join('')+'</div>' : '')+'</div>';
};
function datos(d){
  return d && d.length ? '<div class="cs-datos">'+d.map(function(x){ return '<span>'+x+'</span>'; }).join('')+'</div>' : '';
}
window.CASO=function(dib, et, titulo, texto, d){
  var bt = CARPETA ? '<a class="cs-bt" href="'+CARPETA+'" target="_blank" rel="noopener">&#128193; Abrir el material</a>'
                   : '<span class="cs-nota">&#128193; El caso y su anexo están en el campus digital</span>';
  return '<div class="caso"><div class="cs-dib">'+(DIB[dib]||DIB.excel)+'</div><div class="cs-tx">'+
         '<span class="cs-et">'+et+'</span><h4>'+titulo+'</h4><p>'+texto+'</p>'+datos(d)+bt+'</div></div>';
};
window.EVID=function(entrega, califica){
  function ul(l){ return '<ul>'+l.map(function(x){ return '<li>'+x+'</li>'; }).join('')+'</ul>'; }
  return '<div class="evid"><div><h5>Qué se entrega</h5>'+ul(entrega)+'</div><div><h5>Cómo se califica</h5>'+ul(califica)+'</div></div>';
};
window.SINTAXIS=function(titulo, filas){
  return '<div class="sintaxis"><div class="sx-cab">&#9638; '+titulo+'</div><div class="sx">'+
         filas.map(function(f){ return '<div><code>'+f[0]+'</code></div><div class="ex">'+f[1]+'</div>'; }).join('')+'</div></div>';
};
})();
