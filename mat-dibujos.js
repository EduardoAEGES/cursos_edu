/* ============================================================
   mat-dibujos.js — Matemáticas Aplicadas, sesiones 11 a 16.
   Va ANTES del script de la página, porque las diapositivas lo usan:
     CASO(dibujo, etiqueta, titulo, texto, datos)  tarjeta de práctica con dibujo y botón a Drive
     PROY(dibujo, titulo, texto, datos)            lo mismo, para un avance del proyecto
     SINTAXIS(titulo, filas)                       repaso breve de fórmulas de Excel
   Dibujos: excel, word, mano, flujo, torta, campana, balanza, informe, ensayo, lupa.
   ============================================================ */
(function(){
'use strict';
var DRIVE='https://drive.google.com/drive/folders/1jc1pA2ajtidFlx3K0FVnEq6uiPLIKry2?usp=drive_link';
var R='#E31E24', G='#505050', C='#DCDCE0', V='#1D6F42', F='#F4F4F6';

var DIB={
  excel:
   '<svg viewBox="0 0 220 170" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="10" width="204" height="150" rx="12" fill="#fff" stroke="'+C+'" stroke-width="3"/>'+
   '<rect x="8" y="10" width="204" height="28" rx="12" fill="'+V+'"/><rect x="8" y="26" width="204" height="12" fill="'+V+'"/>'+
   '<text x="22" y="30" font-family="Arial" font-size="15" font-weight="700" fill="#fff">X  Excel</text>'+
   '<rect x="18" y="46" width="184" height="20" rx="5" fill="#EEF6F1" stroke="#CFE5D8"/>'+
   '<text x="26" y="61" font-family="Consolas,monospace" font-size="13" font-weight="700" fill="'+V+'">fx  =B2/$B$3*100</text>'+
   '<g stroke="'+C+'" stroke-width="2"><line x1="18" y1="78" x2="202" y2="78"/><line x1="18" y1="100" x2="202" y2="100"/><line x1="18" y1="122" x2="202" y2="122"/><line x1="18" y1="144" x2="202" y2="144"/>'+
   '<line x1="70" y1="72" x2="70" y2="150"/><line x1="136" y1="72" x2="136" y2="150"/></g>'+
   '<rect x="137" y="101" width="64" height="20" fill="#FFF4CC" stroke="'+R+'" stroke-width="2.5"/>'+
   '<text x="148" y="116" font-family="Arial" font-size="13" font-weight="700" fill="'+G+'">44.88</text></svg>',
  word:
   '<svg viewBox="0 0 220 170" xmlns="http://www.w3.org/2000/svg"><rect x="40" y="8" width="140" height="156" rx="10" fill="#fff" stroke="'+C+'" stroke-width="3"/>'+
   '<rect x="12" y="34" width="54" height="44" rx="8" fill="#2B579A"/><text x="27" y="64" font-family="Arial" font-size="24" font-weight="900" fill="#fff">W</text>'+
   '<g fill="'+C+'"><rect x="78" y="26" width="86" height="7" rx="3"/><rect x="78" y="40" width="70" height="7" rx="3"/></g>'+
   '<text x="60" y="66" font-family="Arial" font-size="11" font-weight="700" fill="'+G+'">Tabla 11</text>'+
   '<rect x="60" y="72" width="104" height="48" fill="'+F+'" stroke="'+G+'" stroke-width="1.5"/>'+
   '<g stroke="'+G+'" stroke-width="1"><line x1="60" y1="84" x2="164" y2="84"/><line x1="60" y1="96" x2="164" y2="96"/><line x1="60" y1="108" x2="164" y2="108"/><line x1="112" y1="72" x2="112" y2="120"/></g>'+
   '<text x="60" y="134" font-family="Arial" font-size="9" font-style="italic" fill="'+G+'">Nota. Elaboración propia.</text>'+
   '<g fill="'+C+'"><rect x="60" y="142" width="104" height="6" rx="3"/><rect x="60" y="152" width="80" height="6" rx="3"/></g></svg>',
  mano:
   '<svg viewBox="0 0 220 170" xmlns="http://www.w3.org/2000/svg"><rect x="14" y="16" width="120" height="146" rx="8" fill="#fff" stroke="'+C+'" stroke-width="3" transform="rotate(-4 74 89)"/>'+
   '<g font-family="Comic Sans MS,Arial" font-size="15" fill="'+G+'" transform="rotate(-4 74 89)"><text x="28" y="48">86,800</text><text x="28" y="72">− 53,000</text>'+
   '<line x1="28" y1="80" x2="110" y2="80" stroke="'+G+'" stroke-width="2"/><text x="28" y="102" fill="'+R+'" font-weight="700">33,800</text><text x="28" y="134">÷ = 1.64</text></g>'+
   '<rect x="146" y="40" width="62" height="96" rx="10" fill="'+G+'"/><rect x="154" y="50" width="46" height="20" rx="4" fill="#E9F5E9"/>'+
   '<text x="160" y="65" font-family="Consolas,monospace" font-size="12" font-weight="700" fill="'+G+'">1.64</text>'+
   '<g fill="#fff"><circle cx="162" cy="84" r="5"/><circle cx="177" cy="84" r="5"/><circle cx="192" cy="84" r="5"/><circle cx="162" cy="100" r="5"/><circle cx="177" cy="100" r="5"/><circle cx="192" cy="100" r="5"/><circle cx="162" cy="116" r="5"/><circle cx="177" cy="116" r="5"/></g><circle cx="192" cy="116" r="5" fill="'+R+'"/>'+
   '<rect x="120" y="120" width="10" height="56" rx="3" fill="#F2C14E" transform="rotate(38 125 148)"/></svg>',
  flujo:
   '<svg viewBox="0 0 220 170" xmlns="http://www.w3.org/2000/svg"><line x1="14" y1="96" x2="208" y2="96" stroke="'+G+'" stroke-width="3"/>'+
   '<g font-family="Arial" font-size="12" font-weight="700" fill="'+G+'"><text x="22" y="114">Mes 0</text><text x="70" y="114">Mes 1</text><text x="118" y="114">Mes 2</text><text x="166" y="114">Mes 3</text></g>'+
   '<g stroke-width="5" stroke-linecap="round"><line x1="38" y1="96" x2="38" y2="150" stroke="'+R+'"/><line x1="86" y1="96" x2="86" y2="66" stroke="'+V+'"/><line x1="134" y1="96" x2="134" y2="26" stroke="'+V+'"/><line x1="182" y1="96" x2="182" y2="54" stroke="'+V+'"/></g>'+
   '<path d="M30 140 L38 154 L46 140" fill="none" stroke="'+R+'" stroke-width="4"/><path d="M78 74 L86 60 L94 74" fill="none" stroke="'+V+'" stroke-width="4"/>'+
   '<path d="M126 34 L134 20 L142 34" fill="none" stroke="'+V+'" stroke-width="4"/><path d="M174 62 L182 48 L190 62" fill="none" stroke="'+V+'" stroke-width="4"/>'+
   '<g font-family="Arial" font-size="11" font-weight="700"><text x="44" y="146" fill="'+R+'">−1,500</text><text x="92" y="66" fill="'+V+'">376</text><text x="140" y="30" fill="'+V+'">1,333</text><text x="188" y="56" fill="'+V+'">608</text></g></svg>',
  torta:
   '<svg viewBox="0 0 220 170" xmlns="http://www.w3.org/2000/svg"><ellipse cx="110" cy="146" rx="92" ry="14" fill="#E4E4E8"/>'+
   '<rect x="38" y="78" width="144" height="64" rx="10" fill="#F6E3B4"/><ellipse cx="110" cy="80" rx="72" ry="18" fill="#FFF7E6"/>'+
   '<rect x="38" y="104" width="144" height="10" fill="#E9C46A"/><path d="M42 84 q12 14 24 0 q12 14 24 0 q12 14 24 0 q12 14 24 0 q12 14 24 0 q12 14 22 0" fill="none" stroke="#fff" stroke-width="7"/>'+
   '<g fill="#7FB069"><circle cx="86" cy="72" r="8"/><circle cx="110" cy="68" r="8"/><circle cx="134" cy="72" r="8"/></g>'+
   '<rect x="150" y="18" width="58" height="34" rx="8" fill="'+R+'"/><text x="157" y="40" font-family="Arial" font-size="14" font-weight="800" fill="#fff">S/ 33.72</text>'+
   '<line x1="160" y1="52" x2="140" y2="70" stroke="'+R+'" stroke-width="3"/></svg>',
  campana:
   '<svg viewBox="0 0 220 170" xmlns="http://www.w3.org/2000/svg"><path d="M40 70 L120 34 L120 132 L40 98 Z" fill="'+R+'"/><rect x="20" y="70" width="24" height="28" rx="5" fill="'+G+'"/>'+
   '<rect x="120" y="30" width="14" height="106" rx="6" fill="'+G+'"/><path d="M52 98 L62 140 L78 140 L70 104 Z" fill="'+G+'"/>'+
   '<g stroke="'+R+'" stroke-width="5" stroke-linecap="round"><line x1="150" y1="60" x2="178" y2="44"/><line x1="152" y1="84" x2="190" y2="84"/><line x1="150" y1="108" x2="178" y2="124"/></g></svg>',
  balanza:
   '<svg viewBox="0 0 220 170" xmlns="http://www.w3.org/2000/svg"><rect x="104" y="40" width="12" height="104" fill="'+G+'"/><rect x="70" y="140" width="80" height="14" rx="6" fill="'+G+'"/>'+
   '<line x1="30" y1="46" x2="190" y2="46" stroke="'+G+'" stroke-width="6" stroke-linecap="round"/><circle cx="110" cy="40" r="9" fill="'+R+'"/>'+
   '<path d="M30 46 L12 96 L48 96 Z M190 46 L172 96 L208 96 Z" fill="none" stroke="'+G+'" stroke-width="2"/>'+
   '<path d="M8 96 a22 10 0 0 0 44 0 Z" fill="'+R+'"/><path d="M168 96 a22 10 0 0 0 44 0 Z" fill="'+V+'"/>'+
   '<g font-family="Arial" font-size="12" font-weight="800" fill="'+G+'"><text x="4" y="126">Costos</text><text x="168" y="126">Ingresos</text></g></svg>',
  informe:
   '<svg viewBox="0 0 220 170" xmlns="http://www.w3.org/2000/svg"><rect x="54" y="18" width="128" height="146" rx="10" fill="#fff" stroke="'+C+'" stroke-width="3"/>'+
   '<rect x="38" y="8" width="128" height="146" rx="10" fill="#fff" stroke="'+G+'" stroke-width="3"/>'+
   '<text x="52" y="34" font-family="Arial" font-size="12" font-weight="800" fill="'+R+'">INFORME</text>'+
   '<g fill="'+C+'"><rect x="52" y="42" width="98" height="6" rx="3"/><rect x="52" y="54" width="80" height="6" rx="3"/></g>'+
   '<g fill="'+R+'"><rect x="58" y="110" width="16" height="30"/><rect x="82" y="92" width="16" height="48"/><rect x="106" y="76" width="16" height="64"/><rect x="130" y="100" width="16" height="40" fill="'+G+'"/></g>'+
   '<line x1="52" y1="140" x2="152" y2="140" stroke="'+G+'" stroke-width="2"/></svg>',
  ensayo:
   '<svg viewBox="0 0 220 170" xmlns="http://www.w3.org/2000/svg"><rect x="70" y="14" width="140" height="92" rx="8" fill="#fff" stroke="'+G+'" stroke-width="3"/>'+
   '<text x="84" y="36" font-family="Arial" font-size="12" font-weight="800" fill="'+G+'">VAN = S/ 741.85</text>'+
   '<g fill="'+R+'"><rect x="86" y="70" width="14" height="24"/><rect x="108" y="56" width="14" height="38"/><rect x="130" y="46" width="14" height="48"/></g><rect x="152" y="62" width="14" height="32" fill="'+G+'"/>'+
   '<circle cx="34" cy="62" r="16" fill="'+G+'"/><rect x="18" y="80" width="32" height="56" rx="12" fill="'+R+'"/>'+
   '<line x1="48" y1="92" x2="88" y2="62" stroke="'+G+'" stroke-width="4" stroke-linecap="round"/>'+
   '<circle cx="186" cy="138" r="18" fill="none" stroke="'+R+'" stroke-width="4"/><line x1="186" y1="138" x2="186" y2="126" stroke="'+R+'" stroke-width="4"/><line x1="186" y1="138" x2="195" y2="142" stroke="'+R+'" stroke-width="4"/></svg>',
  lupa:
   '<svg viewBox="0 0 220 170" xmlns="http://www.w3.org/2000/svg"><rect x="20" y="20" width="120" height="130" rx="10" fill="#fff" stroke="'+C+'" stroke-width="3"/>'+
   '<g fill="'+C+'"><rect x="34" y="40" width="90" height="7" rx="3"/><rect x="34" y="56" width="70" height="7" rx="3"/><rect x="34" y="72" width="84" height="7" rx="3"/><rect x="34" y="88" width="60" height="7" rx="3"/></g>'+
   '<circle cx="138" cy="96" r="36" fill="rgba(255,255,255,.7)" stroke="'+G+'" stroke-width="8"/><line x1="164" y1="122" x2="200" y2="156" stroke="'+R+'" stroke-width="14" stroke-linecap="round"/>'+
   '<path d="M120 96 l12 12 l22 -24" fill="none" stroke="'+V+'" stroke-width="6" stroke-linecap="round"/></svg>'
};

function datos(d){
  return d && d.length ? '<div class="cs-datos">'+d.map(function(x){ return '<span>'+x+'</span>'; }).join('')+'</div>' : '';
}
function tarjeta(clase, dib, et, titulo, texto, d, boton){
  return '<div class="caso'+clase+'"><div class="cs-dib">'+(DIB[dib]||DIB.excel)+'</div><div class="cs-tx">'+
         '<span class="cs-et">'+et+'</span><h4>'+titulo+'</h4><p>'+texto+'</p>'+datos(d)+
         '<a class="cs-bt" href="'+DRIVE+'" target="_blank" rel="noopener">&#128193; '+boton+'</a></div></div>';
}
window.CASO=function(dib, et, titulo, texto, d){
  return tarjeta('', dib, et, titulo, texto, d, 'Abrir el caso en Drive');
};
window.PROY=function(dib, titulo, texto, d){
  return tarjeta(' proy', dib, '&#128204; Avance del proyecto', titulo, texto, d, 'Abrir los archivos del proyecto');
};

/* personajes Thomas Jefferson y globo de diálogo */
var PJ={ pres:'personajes/tj-docente-presenta.webp', idea:'personajes/tj-docente-puntero.webp',
         full:'personajes/tj-alumna-sorpresa.webp', bien:'personajes/tj-alumno-senala.webp',
         alum:'personajes/tj-alumno-sentado.webp' };
window.PJ=PJ;
window.GLOBO=function(img, et, txt){
  return '<div class="perso"><img src="'+(PJ[img]||img)+'" alt="" loading="lazy">'+
         '<div class="globo"><span class="et">'+et+'</span>'+txt+'</div></div>';
};
window.TAPA=function(titulo, bajada, vias){
  return '<div class="tapa"><div class="fil"><img src="marca/logo-tj.png" alt="Thomas Jefferson" class="tj-logo">'+
         '<span>Instituto de Diseño y Comunicación · Matemáticas Aplicadas</span></div>'+
         '<h2>'+titulo+'</h2><p>'+bajada+'</p>'+
         (vias ? '<div class="via">'+vias.map(function(v){ return '<b>'+v+'</b>'; }).join('')+'</div>' : '')+'</div>';
};
window.SINTAXIS=function(titulo, filas){
  return '<div class="sintaxis"><div class="sx-cab">&#9638; '+titulo+'</div><div class="sx">'+
         filas.map(function(f){ return '<div><code>'+f[0]+'</code></div><div class="ex">'+f[1]+'</div>'; }).join('')+
         '</div></div>';
};
})();
