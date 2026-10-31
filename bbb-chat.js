/* ============================================================
   bbb-chat.js — participación en el chat de BigBlueButton.
   Sin instalar nada: el docente usa «Copiar» en el menú del chat de
   BigBlueButton y pega el texto en la sesión. Este archivo solo
   lee ese texto y clasifica cada mensaje; no envía nada a ningún lado.

   BBBChat.lee(texto)                 -> [{ autor, hora, texto }]
   BBBChat.clasifica(texto, opciones) -> { valido, motivo, contenido }
   BBBChat.analiza(mensajes, opciones)-> mensajes con .valido y .dup
   BBBChat.EXCLUSION                  lista de cortesía por defecto
   ============================================================ */
(function(raiz){
'use strict';

/* frases que no suman: saludos, cortesía, confirmaciones, despedidas, asistencia y risas */
var EXCLUSION=[
  'hola','holi','buenas','buenos dias','buen dia','buenas tardes','buenas noches','saludos','que tal','como estan',
  'ok','okey','okay','oki','vale','listo','ya','si','no','gracias','muchas gracias','de nada','por favor','igual','claro',
  'chau','chao','adios','hasta luego','hasta manana','nos vemos','que descanse','buena noche','feliz noche',
  'presente','aqui','conectado','se escucha','se le escucha','esta bien','de acuerdo','entendido','perfecto',
  'jaja','jeje','jiji','jaja jaja','xd',
  'nu','uy','ay','uf','ah','oh','eh','m','wow','sip','sep','yes','oka'
];
/* palabras que acompañan pero no son contenido */
var VACIAS=['profe','profesor','profesora','profesores','miss','teacher','estimado','estimada','estimados','estimadas',
  'companero','companera','companeros','companeras','todos','todas','a','al','el','la','los','las','lo','de','del',
  'y','e','o','u','con','en','para','que','un','una','unos','unas','me','te','se','le','les','mi','tu','su','muy',
  'mucho','mucha','muchos','muchas','usted','ustedes','nos'];
/* texto de la interfaz que a veces se cuela al copiar */
var BASURA=[/^\(edited\)$/i, /^\(editado\)$/i, /^int[eé]ntalo de nuevo$/i, /^try again$/i];

function sinTildes(s){ return String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,''); }
/* minúsculas, sin tildes, sin signos ni emojis; las letras repetidas se reducen (holaaa -> hola, okkk -> ok) */
function normaliza(s){
  return sinTildes(s).toLowerCase()
    .replace(/https?:\/\/\S+/g,' enlace ')
    .replace(/[^a-z0-9ñ]+/g,' ')
    .replace(/([a-zñ])\1+/g,'$1')
    .replace(/\s+/g,' ').trim();
}
function esRisa(w){ return /^(ja|je|ji|jo|ha|he|ka)+j?$/.test(w) || /^(xd)+$/.test(w); }

/* ---- leer el chat copiado de BigBlueButton ----
   Cada mensaje viene así (la primera línea son las iniciales del avatar):
       ma
       MARIA DEL CARMEN TICONA
       0:14:10
       Impuesto a la renta, regimenes tributarios                          */
function esHora(l){ return /^\d{1,2}:\d{2}(:\d{2})?(\s*[ap]\.?\s?m\.?)?$/i.test(l); }
function lee(texto){
  var L=String(texto||'').replace(/\r/g,'').split('\n').map(function(x){ return x.trim(); });
  var horas=[];
  L.forEach(function(l,i){ if(esHora(l) && i>0 && L[i-1] && !esHora(L[i-1])) horas.push(i); });
  var out=[];
  horas.forEach(function(h,n){
    var autor=L[h-1], fin = n+1<horas.length ? horas[n+1]-1 : L.length;   /* fin: la línea del siguiente autor */
    var cuerpo=L.slice(h+1, fin);
    /* la línea de iniciales del siguiente mensaje no es parte del texto */
    if(n+1<horas.length){
      var sigAutor=L[horas[n+1]-1]||'', ult=cuerpo.length ? cuerpo[cuerpo.length-1] : '';
      if(ult && ult.length<=3 && sinTildes(sigAutor).toLowerCase().indexOf(sinTildes(ult).toLowerCase())===0) cuerpo.pop();
    }
    cuerpo=cuerpo.filter(function(x){ return x && !BASURA.some(function(re){ return re.test(x); }); });
    if(!autor || !cuerpo.length) return;
    out.push({ autor:autor.replace(/\s+/g,' '), hora:L[h], texto:cuerpo.join(' ') });
  });
  return out;
}

/* ---- ¿la intervención es válida? ---- */
function clasifica(texto, op){
  op=op||{};
  var excl=(op.exclusion||EXCLUSION).map(normaliza).filter(Boolean)
            .sort(function(a,b){ return b.split(' ').length-a.split(' ').length; });   /* primero las frases largas */
  var minimo = op.minimo>0 ? op.minimo : 1;
  var t=' '+normaliza(texto)+' ';
  if(!t.trim()) return { valido:false, motivo:'Solo emojis o signos', contenido:[] };
  excl.forEach(function(f){
    var re=new RegExp(' '+f.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?= )','g');
    t=t.replace(re,' ');
  });
  var resto=t.trim() ? t.trim().split(' ') : [];
  resto=resto.filter(function(w){ return !esRisa(w); });
  var contenido=resto.filter(function(w){ return VACIAS.indexOf(w)<0; });
  /* una sola letra o número suelto es la respuesta a una pregunta (A, B, C, 1700) */
  if(!contenido.length && resto.length===1 && /^([a-e]|\d+)$/.test(resto[0])) contenido=resto;
  if(!contenido.length) return { valido:false, motivo:'Saludo, cortesía o confirmación', contenido:[] };
  if(contenido.length<minimo) return { valido:false, motivo:'Menos de '+minimo+' palabras con contenido', contenido:contenido };
  return { valido:true, motivo:'Tiene contenido', contenido:contenido };
}

/* clave de una persona: mismas palabras aunque cambien mayúsculas, tildes u orden */
function clavePersona(n){ return normaliza(n).split(' ').filter(Boolean).sort().join(' '); }
function claveMensaje(m){ return clavePersona(m.autor)+'|'+m.hora+'|'+normaliza(m.texto); }

/* marca cada mensaje; los idénticos seguidos del mismo autor cuentan una vez */
function analiza(mensajes, op){
  var ultimo={};
  return (mensajes||[]).map(function(m){
    var c=clasifica(m.texto, op), p=clavePersona(m.autor), n=normaliza(m.texto);
    var dup = ultimo[p]===n && !!n;
    ultimo[p]=n;
    return { autor:m.autor, hora:m.hora, texto:m.texto, clave:claveMensaje(m), persona:p,
             valido:c.valido && !dup, motivo: dup ? 'Repetido seguido' : c.motivo, dup:dup };
  });
}
/* une capturas sin duplicar (autor + hora + texto) */
function une(viejos, nuevos){
  var vistos={}, out=[];
  (viejos||[]).concat(nuevos||[]).forEach(function(m){
    var k=claveMensaje(m); if(vistos[k]) return; vistos[k]=1; out.push(m);
  });
  function seg(h){ var p=String(h).split(':').map(Number); return p.length===3 ? p[0]*3600+p[1]*60+p[2] : p[0]*60+(p[1]||0); }
  return out.sort(function(a,b){ return seg(a.hora)-seg(b.hora); });
}

var API={ EXCLUSION:EXCLUSION, VACIAS:VACIAS, normaliza:normaliza, lee:lee, clasifica:clasifica,
          analiza:analiza, une:une, clavePersona:clavePersona, claveMensaje:claveMensaje };
if(typeof module!=='undefined' && module.exports) module.exports=API;
else raiz.BBBChat=API;
})(typeof window!=='undefined' ? window : this);
