/* =====================================================================
   aula.js — sala en vivo y modo docente para las prácticas de asientos.

   La página solo necesita dos contenedores:
       <div id="aula"></div>     (los controles)
       <div id="muro"></div>     (las ventanitas)

   y arrancarlo con:
       Aula.iniciar({
         sala: 'G',                       prefijo de la sala en la base
         resumen: function(){ ... },      qué se envía de este alumno
         ventana: function(est, quien){ } html de una ventanita
         alModo: function(esDocente){ }   se llama al entrar o salir
         codigo: 'EEFF'                   código de sala de la clase
                                          (si falta, se usa el prefijo)
       });
       Aula.empuja();                     tras cada cambio del alumno

   Opcional: pantalla: function(est, quien, contenedor){ }
       Si la página la define, el docente puede hacer clic en la ventanita
       de un alumno y ver su pantalla en grande; se vuelve a dibujar con
       cada actualización de la sala (cada 3 s) mientras esté abierta.

   Opcional: reporte: function(est, quien){ return { fila:{...}, detalle:[{...}] }; }
       Encima del muro, el docente tiene el botón «Descargar reportes»: baja
       un Excel con una hoja «Resumen» (una fila por alumno) y, si la página
       lo da, una hoja «Detalle» (una fila por respuesta). Sin esta función
       se arma un resumen con los datos sueltos que envía cada alumno.

   El docente entra una vez con su clave y su equipo lo recuerda: al recargar
   la página entra solo como docente, sin DNI ni clave. Con «Salir» se olvida.

   El docente puede sacar de la sala a quien no sea de su clase: cada
   ventanita lleva una ✕ arriba a la derecha. Borra su fila de la sala, no su
   registro ni su avance, y el equipo del docente lo recuerda 12 horas: aunque
   la base no deje borrar la fila, ya no vuelve a aparecer en el muro.

   Opcional: ficha: { clave:'mi_pagina_v1', lee:function(d){}, da:function(){} }
       Enciende el registro con DNI. El alumno entra con su DNI; la primera vez
       escribe además sus apellidos y nombres y queda registrado. A partir de
       ahí solo pone el DNI: la página recupera su nombre y su avance desde
       Supabase, aunque cierre la sesión o entre desde otro equipo.
         clave : nombre con que se guarda el avance de esta página
         lee(d): la página recibe el avance guardado y lo aplica
         da()  : la página devuelve lo que hay que guardar
       Necesita las funciones entra_alumno, lee_avance y graba_avance en la
       base; están en supabase-alumnos-avance.sql.

   Opcional: batuta: function(d){ }   y   Aula.dirige(d)
       El docente marca el paso de la clase. Aula.dirige({modo:'guiado', lamina:3})
       publica el estado de la clase en la sala; cada alumno lo recibe en su
       función batuta a los pocos segundos. Con esto la página puede tener un
       modo guiado (todos en la diapositiva del docente) y otro libre (cada
       uno avanza solo). Al salir el docente, la sala vuelve sola al modo libre.

   Opcional: simple: true
       El alumno entra solo con su nombre, y hasta sin él (queda como
       «Participante 123»). No se pide código de sala: se usa el de la clase.

   Opcional: musica: true
       Al entrar como docente suena de fondo, a volumen bajo y solo en su
       equipo, una pista al azar de la carpeta sonidos/ del repositorio
       (menos sonido_fallo y ono-bebe). Aula.cambiaMusica() pasa a otra
       pista al azar; la página lo llama al cambiar de caso o de parte.
   ===================================================================== */
(function(){
'use strict';

var SUPA='https://klmjmlhwuzhymrplemgw.supabase.co';
var ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsbWptbGh3dXpoeW1ycGxlbWd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1OTMyNjQsImV4cCI6MjA4NzE2OTI2NH0.xFWMvUJa9n9TBcBG1WSeqCGiWBaCAtCU9aY7GXk4W6E';
var TABLA=SUPA+'/rest/v1/sala_asientos';
var CLAVE='46069339';
/* nombres de docentes que se sugieren al escribir (opcional: se puede escribir otro).
   Una página puede dar su propia lista: Aula.iniciar({ docentes:['...'] }) */
var DOCENTES=['ANCAJIMA OLIVARES PEDRO','ARANA KAIK EDMUNDO JAVIER','BUSTILLOS HUAYHUA REYNALDO JUNIOR',
  'CARDENAS MARTINEZ JULIO CESAR','CASTILLA ALBARRAN YSAIAS','CASUSOL CUMPA JORGE LUIS',
  'CERDA MEDINA JOEL EDSON','CONCHA BEDOYA KATIUSKA YOLANDA','CONDOR SURICHAQUI LUIS ENRIQUE',
  'CUNO SOSA WILLIAM BERMAN','FLORES ESPINOZA LEONCIO','FLORES MUÑOZ RONY NAZARENO',
  'FRANCO CASAS HUMBERTO GUILLERMO','GARRIAZO PINEDA ALEXANDER WENCESLAO','GUANILO ARANDA CLARA ELVADINA',
  'LEON ALVARADO MELISSA RUTH','LEON CAPCHA JOSE ROMULO','LOAYZA MARTINEZ MARITZA IVONNE',
  'MAGUIÑA PRUDENCIO EGEL GODOFREDO','MAMANI ROQUE EDUARDO LUIS','MAMANI TIPULA ERNESTO ELIAS',
  'MARTINEZ ALEGRE LUIS ARTURO','MOORE DELGADO JAVIER'];
/* docentes que solo aparecen al entrar desde Pensamiento Lógico (piloto): la URL trae ?piloto=1 */
var DOCENTES_PILOTO=['SANCHEZ CESPEDES MIRKO NAPOLEÓN'];
function esPiloto(){ return /[?&]piloto=1(&|$)/.test(location.search); }
/* desde el piloto la sesión no lleva al repositorio ni al curso original:
   se quitan esos enlaces y "Volver al curso" regresa a las semanas del piloto */
function encierraPiloto(){
  var PILOTO='pensamiento-logico-piloto.html';
  document.querySelectorAll('.o-navbar .apps, .o-navbar .menu, .o-navbar .right').forEach(function(el){ el.remove(); });
  document.querySelectorAll('.o-navbar a.brand').forEach(function(a){
    var sp=document.createElement('span'); sp.className='brand'; sp.textContent='Pensamiento Lógico'; a.replaceWith(sp);
  });
  document.querySelectorAll('.o-crumb').forEach(function(c){
    var b=c.querySelector('b'); c.textContent=''; if(b) c.appendChild(b);
  });
  document.querySelectorAll('a[href]').forEach(function(a){
    var h=a.getAttribute('href').split('#')[0].split('?')[0];
    if(h==='pensamiento-logico.html'){ a.setAttribute('href',PILOTO); if(/Volver al curso/.test(a.textContent)) a.textContent='Volver a las semanas'; }
    else if(h==='index.html') a.remove();
  });
}
if(esPiloto()){
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',encierraPiloto); else encierraPiloto();
}
function listaDocentes(){
  var l=(cfg && cfg.docentes) || DOCENTES;
  return esPiloto() ? l.concat(DOCENTES_PILOTO.filter(function(n){ return l.indexOf(n)<0; })) : l;
}

/* una página puede pedir su propia clave de docente: Aula.iniciar({ clave:'LOGICO' }) */
function claveDoc(){ return (cfg && cfg.clave) || CLAVE; }
function marcaDoc(){ return (cfg && cfg.clave) ? 'docente_equipo_'+cfg.clave : 'docente_equipo'; }

var cfg=null, sala=null, yo=null, docente=false, tAbierta=null, practica=false;
var mano='', manoT=0, msgs=[], ultimoMsg=0, conocidos={}, primeraCarga=true, descartes={};
var comentOn=true, bajadas={}, tMano=null;
/* cuánto dura cada aviso a la vista: lo bueno y los mensajes 1 minuto, la duda 2 minutos */
var TTL={ ok:60000, msg:60000, duda:120000 };
var tSala=null, tEnvio=null, gente=[], fallos=0, grande=false, mirando=null;
var recurso=null, selloRecurso='', tRecurso=null;
var batuta=null, tBatuta=null, selloBatuta='';
var dni='', tFicha=null, buscando=false, modoAlta=false;
var RPC=SUPA+'/rest/v1/rpc/';

var BASE=(function(){
  var s=document.currentScript && document.currentScript.src;
  return s ? s.replace(/[^\/]*$/,'') : '';
})();

function $(id){ return document.getElementById(id); }
function esc(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function hdr(extra){
  var o={ apikey:ANON, Authorization:'Bearer '+ANON, 'Content-Type':'application/json' };
  if(extra) for(var k in extra) o[k]=extra[k];
  return o;
}
function guardaLocal(k,v){ try{ localStorage.setItem('aula_'+k, v); }catch(e){} }
function leeLocal(k){ try{ return localStorage.getItem('aula_'+k)||''; }catch(e){ return ''; } }

/* código de sala propio de esta clase (nunca el de otra) */
function codigoClase(){
  return String((cfg && (cfg.codigo || cfg.sala)) || 'AULA').toUpperCase();
}
/* cada clase recuerda su propia sala: no se mezcla con la de otro curso */
function claveSala(){ return 'sala_' + ((cfg && cfg.sala) || 'x'); }

/* ---------------- código de sesión de 4 dígitos ----------------
   Aula.iniciar({ pin:true }): el docente abre la sesión y crea el código;
   los alumnos solo entran con un código que algún docente tenga abierto.
   Así varios docentes usan la misma página a la vez, cada uno con su sala. */
function pin(){ return !!(cfg && cfg.pin); }
function pinBueno(v){ return /^[0-9]{4}$/.test(String(v||'').trim()); }
function pinNuevo(){ return String(1000 + Math.floor(Math.random()*9000)); }
function salaAbierta(c){ return cfg.sala+'-'+c+'-ABIERTA'; }
/* ¿hay un docente con la sesión abierta en ese código? */
function miraSala(c){
  var desde=new Date(Date.now()-6*3600*1000).toISOString();
  return fetch(TABLA+'?select=alumno,actualizado&sala=eq.'+encodeURIComponent(salaAbierta(c))+
               '&actualizado=gte.'+desde+'&limit=1', { headers:hdr() })
    .then(function(r){ return r.ok ? r.json() : Promise.reject(r.status); })
    .then(function(rows){ return !!(rows && rows.length); });
}
/* el docente publica que su sesión está abierta, y lo repite cada dos minutos */
function abreSala(c){
  return fetch(TABLA+'?on_conflict=sala,alumno', {
    method:'POST', headers:hdr({ Prefer:'resolution=merge-duplicates,return=minimal' }),
    body:JSON.stringify([{ sala:salaAbierta(c), alumno:'docente', caso:'',
                           estado:{ abierta:1 }, actualizado:new Date().toISOString() }])
  }).then(function(r){ return r.ok ? true : Promise.reject(r.status); });
}
function latidoSala(){
  if(tAbierta) return;
  tAbierta=setInterval(function(){
    if(docente && sala && pin()) abreSala(sala).catch(function(){});
  }, 120000);
}
/* el código que creó este equipo: al recargar puede volver a abrirlo */
function pinMio(){ return leeLocal('pin_'+((cfg && cfg.sala)||'x')); }

/* ---------------- controles ---------------- */
function pintaControles(){
  $('aula').innerHTML=
    '<div class="aula-filas">'+
      '<div class="aula-fila" id="aulaEntrada">'+
        (conFicha() ? '<label class="aula-campo" id="aulaCdni">Tu DNI'+
          '<input id="aulaDni" type="text" inputmode="numeric" maxlength="8" '+
          'placeholder="8 dígitos" autocomplete="off"></label>' : '')+
        '<label class="aula-campo" id="aulaCnom"'+(conFicha()?' hidden':'')+'>'+
          (conFicha()?'Apellidos y nombres':(simple()?'Tu nombre (opcional)':'Tu nombre'))+
          '<input id="aulaNombre" type="text" maxlength="60" placeholder="'+
          (conFicha()?'Apellidos y nombres':'Nombre y apellido')+'" autocomplete="off"></label>'+
        '<label class="aula-campo" id="aulaCsala"'+((simple() && !pin())?' hidden':'')+'>'+
          (pin()?'Código de la sesión':'Código de sala')+
          (pin() ? '<input id="aulaSala" type="text" inputmode="numeric" maxlength="4" '+
                   'placeholder="4 dígitos" autocomplete="off">'
                 : '<input id="aulaSala" type="text" maxlength="20" placeholder="'+
                   esc(codigoClase())+'" autocomplete="off">')+'</label>'+
        '<button class="o-btn o-btn-primary" id="aulaEntrar" type="button">'+
          (conFicha()?'Ingresar':'Entrar a la sala')+'</button>'+
        (pin() ? '<button class="o-btn o-btn-secondary" id="aulaPractica" type="button" '+
                 'title="Navega y practica sin código: no se guarda nada">Practicar sin código</button>' : '')+
        (conFicha() ? '<button class="o-btn o-btn-secondary" id="aulaNuevo" type="button">Es mi primera vez</button>'+
          '<button class="o-btn o-btn-secondary" id="aulaVuelve" type="button" hidden>Ya estoy registrado</button>'+
          '<span class="aula-ficha" id="aulaFicha"></span>' : '')+
        '<label class="aula-sw"><input type="checkbox" id="aulaSw">'+
          '<span class="riel"><span class="bola"></span></span>'+
          '<span class="tx">Entrar como docente</span></label>'+
      '</div>'+
      '<div class="aula-fila" id="aulaDentro" hidden>'+
        '<span class="aula-rol" id="aulaQuien"></span>'+
        '<button class="o-btn o-btn-secondary" id="aulaSalir" type="button">Salir</button>'+

        '<button class="o-btn" id="aulaGrande" type="button" hidden>🔍 Ventanas grandes</button>'+
        '<button class="o-btn" id="aulaRefresca" type="button" hidden>↻ Actualizar</button>'+
        '<button class="o-btn" id="aulaComent" type="button" hidden title="Activar o desactivar los mensajes de los alumnos">💬 Comentarios: sí</button>'+
        '<span class="aula-mus" id="aulaMus" hidden>'+
          '<button class="o-btn" id="aulaMusOn" type="button" aria-pressed="false">🎵 Música</button>'+
          '<button class="o-btn" id="aulaMusSig" type="button" title="Otra pista al azar">⏭</button>'+
          '<input id="aulaMusVol" type="range" min="0" max="100" step="1" aria-label="Volumen de la música">'+
        '</span>'+
      '</div>'+
      '<span class="aula-estado solo" id="aulaEstado">Modo individual</span>'+
    '</div>'+
    '<div class="aula-velo" id="aulaVelo" hidden>'+
      '<div class="aula-modal" role="dialog" aria-modal="true" aria-label="Entrar como docente">'+
        '<div class="am-h">Entrar como docente</div>'+
        '<p class="am-p">'+(pin()
          ? 'Escribe tu clave y crea el código de 4 dígitos de esta sesión. Tus alumnos entran con ese código.'
          : 'Escribe la clave para ver el avance del aula y la solución.')+'</p>'+
        '<label class="aula-campo" id="aulaCdoc">Apellidos y nombres (opcional)'+
          '<input id="aulaDocNom" type="text" maxlength="60" placeholder="Apellidos y nombres" list="aulaDocLista" autocomplete="off"></label>'+
        '<datalist id="aulaDocLista">'+listaDocentes().map(function(n){ return '<option value="'+esc(n)+'">'; }).join('')+'</datalist>'+
        '<label class="aula-campo" id="aulaCclave">Clave'+
          '<span class="aula-ojo"><input id="aulaClave" type="password" inputmode="'+((cfg && cfg.clave) ? 'text' : 'numeric')+'" placeholder="Clave" autocomplete="off">'+
          '<button type="button" id="aulaVer" class="am-ojo" aria-label="Mostrar la clave" aria-pressed="false" title="Mostrar la clave">&#128065;</button></span></label>'+
        (pin() ? '<label class="aula-campo" id="aulaCpin">Código de la sesión (4 dígitos)'+
                   '<input id="aulaPin" type="text" inputmode="numeric" maxlength="4" '+
                   'placeholder="4 dígitos" autocomplete="off"></label>'+
                 '<button class="o-btn" id="aulaOtroPin" type="button">&#8635; Otro código</button>' : '')+
        '<p class="am-err" id="aulaErr"></p>'+
        '<div class="am-b">'+
          '<button class="o-btn" id="aulaCancela" type="button">Cancelar</button>'+
          '<button class="o-btn o-btn-primary" id="aulaEntrarD" type="button">Entrar</button>'+
        '</div>'+
      '</div>'+
    '</div>';

  if(!conFicha()) $('aulaNombre').value=leeLocal('nombre');
  $('aulaSala').value = pin() ? (pinBueno(leeLocal(claveSala())) ? leeLocal(claveSala()) : '')
                              : (simple() ? codigoClase() : (leeLocal(claveSala())||codigoClase()));

  $('aulaEntrar').addEventListener('click', entraAlumno);
  if(pin()) $('aulaPractica').addEventListener('click', entraPractica);
  $('aulaSalir').addEventListener('click', sale);
  $('aulaRefresca').addEventListener('click', trae);
  $('aulaGrande').addEventListener('click', function(){
    grande=!grande;
    $('muro').classList.toggle('grande', grande);
    $('aulaGrande').textContent = grande ? '🔎 Ventanas pequeñas' : '🔍 Ventanas grandes';
  });
  $('aulaComent').addEventListener('click', alternaComent);
  $('aulaMusVol').value=volMusica()*100;
  $('aulaMusOn').addEventListener('click', function(){ musica(!suena); });
  $('aulaMusSig').addEventListener('click', function(){ if(!suena) musica(true); else otraPista(); });
  $('aulaMusVol').addEventListener('input', function(){
    guardaLocal('musica_vol', $('aulaMusVol').value);
    if(pista) pista.volume=volMusica();
  });
  ['aulaNombre','aulaSala'].forEach(function(id){
    $(id).addEventListener('keydown', function(e){ if(e.key==='Enter') entraAlumno(); });
  });
  if(conFicha()){
    $('aulaDni').value=leeLocal('dni');
    pintaAlta();
    $('aulaDni').addEventListener('input', function(){
      var v=$('aulaDni').value.replace(/\D/g,'').slice(0,8);
      if(v!==$('aulaDni').value) $('aulaDni').value=v;
      $('aulaCdni').classList.remove('falta');
      if(dniBueno(v)) buscaDni(); else if(!modoAlta) avisaFicha('','');
    });
    $('aulaDni').addEventListener('keydown', function(e){
      if(e.key==='Enter'){ e.preventDefault(); entraAlumno(); }
    });
    $('aulaNuevo').addEventListener('click', function(){ abreAlta(true); });
    $('aulaVuelve').addEventListener('click', function(){ abreAlta(false); });
    if(dniBueno($('aulaDni').value)) setTimeout(buscaDni, 300);
  }

  /* el interruptor abre la ventana de la clave */
  $('aulaSw').addEventListener('change', function(){
    if($('aulaSw').checked) abreClave(true); else abreClave(false);
  });
  if(pin() && $('aulaOtroPin')) $('aulaOtroPin').addEventListener('click', function(){
    $('aulaPin').value=pinNuevo(); $('aulaCpin').classList.remove('falta'); $('aulaErr').textContent='';
  });
  $('aulaCancela').addEventListener('click', function(){ $('aulaSw').checked=false; abreClave(false); });
  $('aulaEntrarD').addEventListener('click', entraDocente);
  $('aulaClave').addEventListener('keydown', function(e){ if(e.key==='Enter') entraDocente(); });
  $('aulaDocNom').addEventListener('keydown', function(e){ if(e.key==='Enter') entraDocente(); });
  /* el ojito muestra u oculta lo que se escribe en la clave */
  $('aulaVer').addEventListener('click', function(e){ e.preventDefault(); verClave($('aulaClave').type==='password'); });
  $('aulaVelo').addEventListener('click', function(e){
    if(e.target===$('aulaVelo')){ $('aulaSw').checked=false; abreClave(false); }
  });
  document.addEventListener('keydown', function(e){
    if(e.key==='Escape' && !$('aulaVelo').hidden){ $('aulaSw').checked=false; abreClave(false); }
  });
}
function abreClave(v){
  $('aulaVelo').hidden=!v;
  $('aulaErr').textContent='';
  $('aulaCclave').classList.remove('falta');
  if(v && pin() && $('aulaPin')){
    $('aulaCpin').classList.remove('falta');
    if(!pinBueno($('aulaPin').value)) $('aulaPin').value = pinMio() || pinNuevo();
  }
  verClave(false);
  if(v){
    $('aulaDocNom').value=leeLocal('docente_nombre');
    $('aulaClave').value=''; setTimeout(function(){ $('aulaClave').focus(); }, 30);
  }
}
function verClave(ver){
  $('aulaClave').type = ver ? 'text' : 'password';
  $('aulaVer').setAttribute('aria-pressed', ver ? 'true' : 'false');
  $('aulaVer').setAttribute('aria-label', ver ? 'Ocultar la clave' : 'Mostrar la clave');
  $('aulaVer').title = ver ? 'Ocultar la clave' : 'Mostrar la clave';
  $('aulaVer').classList.toggle('ver', ver);
}
function estado(clase, txt){
  var e=$('aulaEstado');
  e.className='aula-estado '+clase;
  e.textContent=txt;
}
function dentro(txt){
  $('aulaEntrada').hidden=true;
  $('aulaDentro').hidden=false;
  $('aulaQuien').textContent=txt;
  $('aulaSalir').textContent = (conFicha() && !docente) ? 'Cerrar sesión' : 'Salir';
  $('aulaGrande').hidden=!docente;
  $('aulaRefresca').hidden=!docente;
  $('aulaMus').hidden=!(docente && cfg.musica);
  pintaComent();
}
function fuera(){
  $('aulaEntrada').hidden=false;
  $('aulaDentro').hidden=true;
  $('aulaSw').checked=false;
}

/* ---------------- entrar y salir ---------------- */
function entraAlumno(){
  var s=($('aulaSala').value.trim()||codigoClase()).toUpperCase();
  if(pin()){
    s=$('aulaSala').value.replace(/\D/g,'');
    $('aulaCsala').classList.toggle('falta', !pinBueno(s));
    if(!pinBueno(s)){
      $('aulaSala').focus();
      estado('malo','El código de la sesión son 4 números. Pídeselo al docente.');
      return;
    }
    estado('','Buscando la sesión '+s+'…');
    miraSala(s).then(function(abierta){
      if(!abierta){
        $('aulaCsala').classList.add('falta'); $('aulaSala').focus();
        estado('malo','Nadie abrió la sesión '+s+'. El docente entra primero y te da el código.');
        return;
      }
      $('aulaCsala').classList.remove('falta');
      sigueAlumno(s);
    }).catch(function(){ sigueAlumno(s); });   /* si la base no responde, nadie se queda fuera */
    return;
  }
  sigueAlumno(s);
}
/* práctica libre: se navega por toda la sesión, pero no hay sala ni se guarda nada */
function entraPractica(){
  practica=true; sala=null; yo=null; docente=false; dni='';
  dentro('Modo práctica · tus respuestas no se guardan');
  estado('solo','Práctica libre: nada se guarda ni se comparte con el docente');
  if(cfg.alModo) cfg.alModo(false);
}
function sigueAlumno(s){
  if(!conFicha()){
    var n0=$('aulaNombre').value.trim();
    if(simple() && n0.length<2){
      n0=leeLocal('anonimo') || ('Participante '+(100+Math.floor(Math.random()*900)));
      guardaLocal('anonimo', n0);
    }
    $('aulaCnom').classList.toggle('falta', n0.length<2);
    if(n0.length<2){ $('aulaNombre').focus(); estado('malo','Escribe tu nombre para entrar'); return; }
    adentro(n0, s, ''); return;
  }

  var d=$('aulaDni').value.replace(/\D/g,'');
  $('aulaCdni').classList.toggle('falta', !dniBueno(d));
  if(!dniBueno(d)){
    $('aulaDni').focus();
    avisaFicha('malo','Tu DNI son 8 números, sin puntos ni espacios.');
    return;
  }

  /* --- registrarse --- */
  if(modoAlta){
    var n=$('aulaNombre').value.trim();
    $('aulaCnom').classList.toggle('falta', n.length<3);
    if(n.length<3){ $('aulaNombre').focus(); avisaFicha('malo','Escribe tus apellidos y nombres.'); return; }
    avisaFicha('', 'Registrando…');
    rpc('entra_alumno', { p_dni:d, p_nombres:n })
      .then(function(filas){
        var r=unaFila(filas);
        modoAlta=false; pintaAlta();
        cambiaDueno(d);
        adentro(r.nombres || n, s, d);
        avisaFicha('ok', r.nuevo ? 'Registrado. Desde ahora entras solo con tu DNI.'
                                 : 'Ese DNI ya estaba registrado: te ingresamos.');
        return traeAvance();
      })
      .then(function(hubo){ if(hubo) estado('vivo','En vivo · recuperamos tu avance'); })
      .catch(function(){ sinRegistro($('aulaNombre').value.trim(), s); });
    return;
  }

  /* --- ingresar --- */
  avisaFicha('', 'Comprobando tu DNI…');
  rpc('entra_alumno', { p_dni:d })
    .then(function(filas){
      var r=unaFila(filas);
      if(!r.nombres){
        abreAlta(true, 'Ese DNI todavía no está registrado. Escribe tus apellidos y nombres '+
                       'para registrarte: solo se hace una vez.');
        return null;
      }
      cambiaDueno(d);
      adentro(r.nombres, s, d);
      avisaFicha('ok', 'Hola, <b>'+esc(r.nombres)+'</b>. Tu avance se guarda con tu DNI.');
      return traeAvance();
    })
    .then(function(hubo){ if(hubo) estado('vivo','En vivo · recuperamos tu avance'); })
    .catch(function(){ sinRegistro('', s); });
}
/* si la base no responde, nadie se queda fuera: se entra sin registro */
function sinRegistro(n, s){
  if(n.length<3){
    abreAlta(true, 'No se pudo conectar con el registro. Escribe tus apellidos y nombres '+
                   'para entrar; tu avance quedará guardado en este equipo.');
    return;
  }
  adentro(n, s, '');
  avisaFicha('malo','Sin conexión con el registro: tu avance se guarda solo en este equipo.');
}
function adentro(n, s, d){
  yo=n; sala=s; docente=false; dni=d||'';
  guardaLocal('nombre',n); guardaLocal(claveSala(),s);
  if(dni) guardaLocal('dni', dni);
  dentro((dni ? (n+' · DNI '+dni) : n) + (pin() ? ' · sesión '+s : ''));
  estado('vivo','Conectando…');
  fallos=0; reiniciaAvisos(); empuja(true);
  if(cfg.alModo) cfg.alModo(false);
  escucha(); escuchaRecurso(); pintaAvisos();
}
function entraDocente(){
  var c=$('aulaClave').value.trim();
  if(c!==claveDoc()){
    $('aulaCclave').classList.add('falta');
    $('aulaErr').textContent='Clave incorrecta. Vuelve a intentarlo.';
    $('aulaClave').value=''; $('aulaClave').focus();
    return;
  }
  /* el nombre del docente es opcional: si lo escribe, el equipo lo recuerda */
  if(!$('aulaVelo').hidden) guardaLocal('docente_nombre', $('aulaDocNom').value.trim().replace(/\s+/g,' '));
  if(pin()){
    var p=$('aulaPin').value.replace(/\D/g,'');
    $('aulaCpin').classList.toggle('falta', !pinBueno(p));
    if(!pinBueno(p)){
      $('aulaErr').textContent='El código de la sesión son 4 números.';
      $('aulaPin').focus(); return;
    }
    $('aulaErr').textContent='Abriendo la sesión '+p+'…';
    miraSala(p).then(function(ocupada){
      if(ocupada && p!==pinMio()){
        $('aulaCpin').classList.add('falta');
        $('aulaErr').textContent='Otro docente ya tiene abierto el código '+p+'. Pulsa «Otro código».';
        return;
      }
      return abreSala(p).then(function(){ guardaLocal('pin_'+cfg.sala, p); dentroDocente(p); });
    }).catch(function(){ dentroDocente(p); });   /* sin base, el docente igual trabaja */
    return;
  }
  dentroDocente(($('aulaSala').value.trim()||codigoClase()).toUpperCase());
}
function dentroDocente(s){
  abreClave(false);
  guardaLocal(marcaDoc(),'1');   /* este equipo queda como del docente */
  yo=null; sala=s; docente=true;
  guardaLocal(claveSala(),s);
  var nd=leeLocal('docente_nombre');
  dentro('Docente' + (nd ? ' · '+nd : '') + (pin() ? ' · código '+s : ''));
  estado('vivo','Conectando…');
  fallos=0; reiniciaAvisos(); leeComent(); pintaComent(); arranca(); escuchaRecurso(); pintaAvisos();
  if(pin()) latidoSala();
  if(cfg.musica) musica(leeLocal('musica')!=='0');
  if(cfg.alModo) cfg.alModo(true);
}
function sale(){
  practica=false; reiniciaAvisos();
  if(tAbierta){ clearInterval(tAbierta); tAbierta=null; }
  if(conFicha() && !docente && dni &&
     !window.confirm('¿Cerrar tu sesión?\n\nTu avance ya quedó guardado con tu DNI '+dni+
                     '. Lo recuperas al volver a ingresar, aquí o en otro equipo.\n\n'+
                     'Este equipo quedará limpio para el siguiente alumno.')) return;
  cierraPantalla();
  callaMusica();
  /* al irse el docente, la clase vuelve sola al modo libre */
  if(docente && batuta) dirige({ modo:'libre' });
  if(docente) guardaLocal(marcaDoc(),'');   /* al salir, el equipo deja de entrar solo */
  var eraAlumno = !docente && !!dni;
  if(dni) guardaAvance(true);
  sala=null; yo=null; docente=false; gente=[]; dni='';
  if(eraAlumno) setTimeout(olvida, 400);   /* primero se guarda, después se limpia */
  batuta=null; selloBatuta='';
  if(tSala){ clearInterval(tSala); tSala=null; }
  if(tBatuta){ clearInterval(tBatuta); tBatuta=null; }
  if(tRecurso){ clearInterval(tRecurso); tRecurso=null; }
  recurso=null; selloRecurso='';
  if(cfg.recurso) cfg.recurso(null);
  fuera(); estado('solo','Modo individual'); pintaMuro(); pintaAvisos();
  if(cfg.alModo) cfg.alModo(false);
}
function arranca(){
  if(!docente) return;              /* el muro es solo del docente */
  trae();
  if(!tSala) tSala=setInterval(trae, 3000);
}

/* ---------------- sincronización ---------------- */
function empuja(ya){
  guardaAvance(ya);
  if(!sala || !yo || docente) return;
  clearTimeout(tEnvio);
  tEnvio=setTimeout(function(){
    fetch(TABLA+'?on_conflict=sala,alumno', {
      method:'POST', headers:hdr({ Prefer:'resolution=merge-duplicates,return=minimal' }),
      body:JSON.stringify([{ sala:cfg.sala+'-'+sala, alumno:yo, caso:dni,
                             estado:conAvisos(cfg.resumen()), actualizado:new Date().toISOString() }])
    }).then(function(r){
      if(!r.ok) return Promise.reject(r.status);
      fallos=0;
      estado('vivo','En vivo · tu avance se comparte con el docente');
    }).catch(falla);
  }, ya ? 0 : 900);
}
function trae(){
  if(!sala) return;
  var desde=new Date(Date.now()-3*3600*1000).toISOString();
  fetch(TABLA+'?select=alumno,caso,estado,actualizado&sala=eq.'+encodeURIComponent(cfg.sala+'-'+sala)+
        '&actualizado=gte.'+desde+'&order=alumno.asc&limit=80', { headers:hdr() })
    .then(function(r){ return r.ok ? r.json() : Promise.reject(r.status); })
    .then(function(rows){
      fallos=0; gente=quitaSacados(rows||[]);
      if(docente) detectaAvisos(gente);
      estado('vivo', (docente?'Docente · ':'En vivo · ')+gente.length+
             (gente.length===1?' alumno':' alumnos')+' en la sala '+sala);
      pintaMuro();
    })
    .catch(falla);
}
function falla(e){
  fallos++;
  if(fallos<2) return;
  var m;
  if(e===404)                  m='la tabla sala_asientos todavía no existe en Supabase';
  else if(e===401 || e===403)  m='la tabla existe pero le faltan los permisos de lectura y escritura';
  else if(e===409)             m='falta el índice único (sala, alumno) en la tabla';
  else if(e===400)             m='la tabla existe pero le falta alguna columna';
  else                         m='no se pudo conectar ('+e+')';
  estado('malo','Sala no disponible: '+m+' · sigues trabajando en tu equipo');
}

/* ---------------- la ficha del alumno (DNI) ---------------- */
/* simple: sin código de sala (se usa el de la clase) y el nombre es opcional */
function simple(){ return !!(cfg && cfg.simple); }
function conFicha(){ return !!(cfg && cfg.ficha && cfg.ficha.clave); }
function claveFicha(){ return String(cfg.ficha.clave); }
function dniBueno(v){ return /^[0-9]{8}$/.test(String(v||'').trim()); }
function avisaFicha(clase, txt){
  var e=$('aulaFicha'); if(!e) return;
  e.className='aula-ficha '+(clase||'');
  e.innerHTML=txt||'';
}
/* entra_alumno devuelve un objeto; las versiones viejas devolvían una lista */
function unaFila(res){
  if(res && typeof res.length==='number') return res[0] || {};
  return res || {};
}
function rpc(fn, cuerpo){
  return fetch(RPC+fn, { method:'POST', headers:hdr(), body:JSON.stringify(cuerpo) })
    .then(function(r){ return r.ok ? r.json() : r.text().then(function(t){
      return Promise.reject(new Error(r.status+' '+t.slice(0,120))); }); });
}
/* el formulario tiene dos caminos: ingresar o registrarse */
function pintaAlta(){
  if(!conFicha()) return;
  $('aulaCnom').hidden=!modoAlta;
  $('aulaNuevo').hidden=modoAlta;
  $('aulaVuelve').hidden=!modoAlta;
  $('aulaEntrar').textContent = modoAlta ? 'Registrarme y entrar' : 'Ingresar';
}
function abreAlta(v, aviso){
  modoAlta=!!v;
  pintaAlta();
  avisaFicha(v?'nuevo':'', aviso || (v
    ? 'Escribe tus apellidos y nombres. Solo se hace una vez: después entras con tu DNI.'
    : ''));
  if(v) setTimeout(function(){ $('aulaNombre').focus(); }, 40);
}
/* al escribir los 8 dígitos saluda si ya está registrado; si falla, se calla */
function buscaDni(){
  if(!conFicha() || modoAlta) return;
  var v=$('aulaDni').value.replace(/\D/g,'').slice(0,8);
  if(!dniBueno(v) || buscando) return;
  buscando=true;
  rpc('entra_alumno', { p_dni:v })
    .then(function(filas){
      buscando=false;
      if(modoAlta) return;
      var r=unaFila(filas);
      if(r.nombres) avisaFicha('ok', 'Hola de nuevo, <b>'+esc(r.nombres)+'</b>. Ingresa y sigues donde quedaste.');
      else avisaFicha('', '');
    })
    .catch(function(){ buscando=false; });
}
/* si el avance de este equipo es de otro DNI, se limpia antes de cargar el suyo */
function cambiaDueno(d){
  var antes=leeLocal('dueno');
  if(antes && antes!==d && cfg.ficha.limpia){ try{ cfg.ficha.limpia(); }catch(e){} }
  guardaLocal('dueno', d);
}
function olvida(){
  if(!conFicha()) return;
  guardaLocal('dni',''); guardaLocal('dueno','');
  /* el equipo queda listo para el siguiente alumno */
  if($('aulaDni')){ $('aulaDni').value=''; $('aulaCdni').classList.remove('falta'); }
  if($('aulaNombre')) $('aulaNombre').value='';
  modoAlta=false; pintaAlta();
  avisaFicha('', 'Sesión cerrada. Tu avance quedó guardado con tu DNI.');
  if(cfg.ficha.limpia){ try{ cfg.ficha.limpia(); }catch(e){} }
}
/* trae el avance guardado y se lo pasa a la página */
function traeAvance(){
  if(!conFicha() || !dni || !cfg.ficha.lee) return Promise.resolve(false);
  return rpc('lee_avance', { p_dni:dni, p_clave:claveFicha() })
    .then(function(d){
      if(d && typeof d==='object' && Object.keys(d).length){ cfg.ficha.lee(d); return true; }
      return false;
    })
    .catch(function(){ return false; });
}
/* guarda el avance, sin apurarse */
function guardaAvance(ya){
  if(!conFicha() || !dni || !cfg.ficha.da) return;
  clearTimeout(tFicha);
  tFicha=setTimeout(function(){
    var d;
    try{ d=cfg.ficha.da(); }catch(e){ return; }
    rpc('graba_avance', { p_dni:dni, p_clave:claveFicha(), p_datos:d||{} }).catch(function(){});
  }, ya ? 0 : 1500);
}

/* ---------------- la batuta del docente ---------------- */
/* va en una sala aparte, para que no se mezcle con las filas de los alumnos */
function salaBatuta(){ return cfg.sala+'-'+sala+'-BATUTA'; }
/* el recurso de la sesión: un enlace que el docente publica para toda la clase.
   Usa la misma tabla de la sala, en una fila aparte, así que no hace falta nada nuevo. */
function salaRecurso(){ return cfg.sala+'-RECURSO'; }
function publicaRecurso(r){
  if(!docente) return Promise.reject('solo el docente');
  recurso = r || null;
  return fetch(TABLA+'?on_conflict=sala,alumno', {
    method:'POST', headers:hdr({ Prefer:'resolution=merge-duplicates,return=minimal' }),
    body:JSON.stringify([{ sala:salaRecurso(), alumno:'docente', caso:'',
                           estado:r||{}, actualizado:new Date().toISOString() }])
  }).then(function(res){
    if(!res.ok) return Promise.reject(res.status);
    if(cfg.recurso) cfg.recurso(recurso);
    return recurso;
  });
}
function oyeRecurso(){
  if(!cfg.recurso) return;
  fetch(TABLA+'?select=estado,actualizado&sala=eq.'+encodeURIComponent(salaRecurso())+'&limit=1',
        { headers:hdr() })
    .then(function(r){ return r.ok ? r.json() : Promise.reject(r.status); })
    .then(function(rows){
      var fila=rows && rows[0], e=(fila && fila.estado) || null;
      var sello=JSON.stringify(e);
      if(sello===selloRecurso) return;
      selloRecurso=sello; recurso=e;
      cfg.recurso(recurso);
    })
    .catch(function(){});
}
function conBatuta(d){
  var o={}, k, src=d||{ modo:'libre' };
  for(k in src) o[k]=src[k];
  o.coment=comentOn?1:0;
  o.bajadas=bajadas;
  return o;
}
function dirige(d){
  if(!sala || !docente) return;
  batuta=d||null;
  fetch(TABLA+'?on_conflict=sala,alumno', {
    method:'POST', headers:hdr({ Prefer:'resolution=merge-duplicates,return=minimal' }),
    body:JSON.stringify([{ sala:salaBatuta(), alumno:'docente', caso:'',
                           estado:conBatuta(d), actualizado:new Date().toISOString() }])
  }).catch(function(){});
  /* un latido cada minuto y medio: así la orden no se queda vieja */
  if(!tBatuta) tBatuta=setInterval(function(){
    if(docente && sala && batuta) dirige(batuta);
  }, 90000);
}
function escuchaRecurso(){
  if(!cfg.recurso) return;
  if(tRecurso){ clearInterval(tRecurso); tRecurso=null; }
  oyeRecurso();
  tRecurso=setInterval(oyeRecurso, 8000);
}
function escucha(){
  if(!cfg.batuta) return;
  if(tBatuta){ clearInterval(tBatuta); tBatuta=null; }
  oye();
  tBatuta=setInterval(oye, 3000);
}
function oye(){
  if(!sala || docente || !cfg.batuta) return;
  var desde=new Date(Date.now()-3*3600*1000).toISOString();
  fetch(TABLA+'?select=estado,actualizado&sala=eq.'+encodeURIComponent(salaBatuta())+
        '&actualizado=gte.'+desde+'&limit=1', { headers:hdr() })
    .then(function(r){ return r.ok ? r.json() : Promise.reject(r.status); })
    .then(function(rows){
      var fila=rows && rows[0];
      if(!fila){ if(selloBatuta!==''){ selloBatuta=''; batuta=null; recibeFlags({}); cfg.batuta({modo:'libre'}); } return; }
      var sello=String(fila.actualizado)+'|'+JSON.stringify(fila.estado||{});
      if(sello===selloBatuta) return;
      selloBatuta=sello; batuta=fila.estado||{};
      recibeFlags(batuta);
      cfg.batuta(batuta);
    })
    .catch(function(){});
}

/* ---------------- muro ---------------- */
function pintaMuro(){
  pintaReporte();
  if(!docente){ $('muro').innerHTML=''; return; }
  if(!sala){
    $('muro').innerHTML='<div class="aula-vacio">Entra con tu clave de docente para ver el avance del aula.</div>';
    return;
  }
  if(!gente.length){
    $('muro').innerHTML='<div class="aula-vacio">Todavía no hay nadie en la sala <b>'+esc(sala)+'</b>.</div>';
    return;
  }
  var ahora=Date.now(), h=avisosHtml();
  gente.forEach(function(g){
    var e=g.estado||{};
    var seg=Math.max(0, Math.round((ahora-new Date(g.actualizado).getTime())/1000));
    var hace = seg<60 ? ('hace '+seg+' s') : ('hace '+Math.round(seg/60)+' min');
    h+='<div class="aula-vtna'+(g.alumno===yo?' yo':'')+(e.listo?' listo':'')+
         (cfg.pantalla?' clic" role="button" tabindex="0" title="Ver su pantalla" data-al="'+esc(g.alumno):'')+'">'+
         '<div class="vh"><span class="vn">'+esc(g.alumno)+(g.alumno===yo?' (tú)':'')+'</span>'+insignia(g)+
         '<span class="vs">'+esc(hace)+'</span>'+
         '<button class="aula-saca" type="button" title="Sacar de la sala" '+
           'aria-label="Sacar a '+esc(g.alumno)+' de la sala" data-saca="'+esc(g.alumno)+'">&#10005;</button>'+
         '</div>'+
         cfg.ventana(e, g.alumno)+
       '</div>';
  });
  $('muro').innerHTML=h;
  Array.prototype.forEach.call($('muro').querySelectorAll('.aula-saca'), function(b){
    b.addEventListener('click', function(ev){
      ev.stopPropagation(); ev.preventDefault();
      sacaAlumno(b.getAttribute('data-saca'));
    });
    b.addEventListener('keydown', function(ev){ ev.stopPropagation(); });
  });
  cableaAvisos();
  if(cfg.pantalla){
    Array.prototype.forEach.call($('muro').querySelectorAll('.aula-vtna.clic'), function(v){
      v.addEventListener('click', function(){ abrePantalla(v.getAttribute('data-al')); });
      v.addEventListener('keydown', function(e){
        if(e.key==='Enter' || e.key===' '){ e.preventDefault(); abrePantalla(v.getAttribute('data-al')); }
      });
    });
  }
  refrescaPantalla();
}

/* ---------------- sacar a alguien de la sala ---------------- */
/* el equipo del docente recuerda a quién sacó (12 horas): aunque la base no
   deje borrar la fila, esa persona ya no vuelve a aparecer en el muro */
function claveSacados(){ return 'sacados_'+cfg.sala+'-'+sala; }
function leeSacados(){
  var m={}; try{ m=JSON.parse(leeLocal(claveSacados())||'{}')||{}; }catch(e){ m={}; }
  var lim=Date.now()-12*3600*1000, k;
  for(k in m){ if(m[k]<lim) delete m[k]; }
  return m;
}
function quitaSacados(rows){
  if(!docente) return rows;
  var m=leeSacados();
  return rows.filter(function(g){ return !m[g.alumno]; });
}
function sacaAlumno(nombre){
  if(!docente || !sala || !nombre) return;
  if(!window.confirm('¿Sacar a ' + nombre + ' de la sala ' + sala + '?\n\n' +
     'Desaparece del muro y ya no vuelve a aparecer en este equipo. No se borra su registro ni su avance.')) return;
  if(mirando===nombre) cierraPantalla();
  var m=leeSacados(); m[nombre]=Date.now(); guardaLocal(claveSacados(), JSON.stringify(m));
  gente=gente.filter(function(g){ return g.alumno!==nombre; });
  pintaMuro();
  estado('vivo','Sacando a '+nombre+'…');
  var fila=cfg.sala+'-'+sala;
  /* primero por la función con clave; si no está instalada, por la API directa */
  fetch(RPC+'saca_alumno', { method:'POST', headers:hdr(),
    body:JSON.stringify({ p_sala:fila, p_alumno:nombre, p_clave_docente:CLAVE }) })
    .then(function(r){ return r.ok ? r.json() : Promise.reject(r.status); })
    .then(function(){ trae(); })
    .catch(function(){
      fetch(TABLA+'?sala=eq.'+encodeURIComponent(fila)+'&alumno=eq.'+encodeURIComponent(nombre),
            { method:'DELETE', headers:hdr({ Prefer:'return=minimal' }) })
        .then(function(r){ return r.ok ? true : Promise.reject(r.status); })
        .then(function(){ trae(); })
        .catch(function(){
          estado('malo','No se pudo sacar a '+nombre+'. Falta instalar saca_alumno en la base.');
          trae();
        });
    });
}

/* ---------------- reportes para el docente ---------------- */
var XLSX_URL='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', xlsxCarga=null;
function pintaReporte(){
  var m=$('muro'); if(!m) return;
  var b=$('aulaRepo');
  if(!b){
    b=document.createElement('div');
    b.className='aula-repo'; b.id='aulaRepo';
    b.innerHTML='<button class="o-btn o-btn-primary" id="aulaRepoBtn" type="button">⬇ Descargar Excel</button>'+
                '<button class="o-btn" id="aulaRepoVer" type="button">📊 Ver reporte para imprimir</button>'+
                '<span class="aula-repo-tx" id="aulaRepoTx">Avance de cada alumno con porcentajes y colores, en Excel o en PDF.</span>';
    m.parentNode.insertBefore(b, m);
    $('aulaRepoBtn').addEventListener('click', descargaReporte);
    $('aulaRepoVer').addEventListener('click', verReporte);
  }
  b.hidden=!(docente && sala);
}
function cargaXlsx(){
  if(window.XLSX) return Promise.resolve(window.XLSX);
  if(xlsxCarga) return xlsxCarga;
  xlsxCarga=new Promise(function(ok, no){
    var sc=document.createElement('script');
    sc.src=XLSX_URL; sc.async=true;
    sc.onload=function(){ window.XLSX ? ok(window.XLSX) : no('xlsx'); };
    sc.onerror=function(){ xlsxCarga=null; no('xlsx'); };
    document.head.appendChild(sc);
  });
  return xlsxCarga;
}
/* sin reporte propio: lo que el alumno envía que sea un dato suelto */
function filaSimple(e){
  var f={};
  for(var k in e){
    var v=e[k];
    if(v===null || typeof v==='object') continue;
    f[k]= typeof v==='boolean' ? (v?'Sí':'No') : v;
  }
  return f;
}
function fechaLocal(iso){
  var d=new Date(iso); if(isNaN(d)) return '';
  function d2(n){ return (n<10?'0':'')+n; }
  return d.getFullYear()+'-'+d2(d.getMonth()+1)+'-'+d2(d.getDate())+' '+d2(d.getHours())+':'+d2(d.getMinutes());
}
function armaReporte(rows){
  var resumen=[], detalle=[];
  rows.forEach(function(g){
    var e=g.estado||{}, r=null;
    try{ r=cfg.reporte ? cfg.reporte(e, g.alumno) : null; }catch(err){ r=null; }
    var base={ 'Alumno':g.alumno };
    if(g.caso) base['DNI']=g.caso;
    base['Último cambio']=fechaLocal(g.actualizado);
    var fila=(r && r.fila) || filaSimple(e);
    for(var k in fila) base[k]=fila[k];
    resumen.push(base);
    ((r && r.detalle) || []).forEach(function(d){
      var x={ 'Alumno':g.alumno };
      if(g.caso) x['DNI']=g.caso;
      for(var k2 in d) x[k2]=d[k2]; detalle.push(x);
    });
  });
  return { resumen:resumen, detalle:detalle };
}
function csv(filas){
  if(!filas.length) return '';
  var cols=[];
  filas.forEach(function(f){ for(var k in f) if(cols.indexOf(k)<0) cols.push(k); });
  function c(v){ v=(v===undefined||v===null)?'':String(v); return /[",;\n]/.test(v) ? '"'+v.replace(/"/g,'""')+'"' : v; }
  return [cols.map(c).join(',')].concat(filas.map(function(f){
    return cols.map(function(k){ return c(f[k]); }).join(',');
  })).join('\r\n');
}
function bajaArchivo(blob, nombre){
  var a=document.createElement('a');
  a.href=URL.createObjectURL(blob); a.download=nombre;
  document.body.appendChild(a); a.click();
  setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}
/* ===== reporte profesional: Excel con formato y versión para imprimir ===== */
var EXCELJS_URLS=['https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js',
                  'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js'], excelCarga=null;
function cargaExcelJS(){
  if(window.ExcelJS) return Promise.resolve(window.ExcelJS);
  if(excelCarga) return excelCarga;
  excelCarga=new Promise(function(ok, no){
    var n=0;
    (function prueba(){
      if(n>=EXCELJS_URLS.length){ excelCarga=null; no('exceljs'); return; }
      var sc=document.createElement('script');
      sc.src=EXCELJS_URLS[n++]; sc.async=true;
      sc.onload=function(){ window.ExcelJS ? ok(window.ExcelJS) : prueba(); };
      sc.onerror=prueba;
      document.head.appendChild(sc);
    })();
  });
  return excelCarga;
}
/* los alumnos de la sala, con su avance ya calculado */
function traeFilasReporte(){
  var desde=new Date(Date.now()-24*3600*1000).toISOString();   /* todo el día, no solo el muro */
  return fetch(TABLA+'?select=alumno,caso,estado,actualizado&sala=eq.'+encodeURIComponent(cfg.sala+'-'+sala)+
        '&actualizado=gte.'+desde+'&order=alumno.asc&limit=300', { headers:hdr() })
    .then(function(r){ return r.ok ? r.json() : Promise.reject(r.status); })
    .then(function(rows){ return quitaSacados(rows||[]); });
}
function nivel(p){
  if(p>=1)   return { t:'Completó',    f:'D8F3E6', c:'0F6B45' };
  if(p>=0.8) return { t:'Avanzado',    f:'E2F5EC', c:'1C7C54' };
  if(p>=0.5) return { t:'En proceso',  f:'FFF1CC', c:'8A5A00' };
  if(p>0)    return { t:'Inicio',      f:'FDE2E4', c:'A4161A' };
  return            { t:'Sin empezar', f:'F1F3F7', c:'6B7591' };
}
function datosReporte(rows){
  var acts=null;
  try{ acts=cfg.actividades ? cfg.actividades() : null; }catch(e){ acts=null; }
  var alumnos=rows.map(function(g){
    var e=g.estado||{}, ok=+e.ok||0, tot=+e.total||0;
    return { nombre:g.alumno, dni:g.caso||'', lamina:e.lamina||'', titulo:e.titulo||'',
             ok:ok, total:tot, pct:(tot ? ok/tot : 0), cambio:fechaLocal(g.actualizado), rej:e.rejilla||[] };
  });
  var nAct=acts ? acts.length : 0;
  alumnos.forEach(function(a){ nAct=Math.max(nAct, a.rej.length); });
  var columnas=[];
  for(var j=0;j<nAct;j++) columnas.push(acts && acts[j] ? acts[j] : { et:'A'+(j+1), t:'Actividad '+(j+1), max:0 });
  var celda=function(a,j){
    var r=null; a.rej.forEach(function(x){ if(x.b===j) r=x; });
    return r ? { n:r.n||0, t:r.t||0, p:(r.t ? (r.n||0)/r.t : 0) } : null;
  };
  var prom=alumnos.length ? alumnos.reduce(function(s,a){ return s+a.pct; },0)/alumnos.length : 0;
  var porAct=columnas.map(function(c,j){
    var vals=alumnos.map(function(a){ return celda(a,j); }).filter(Boolean);
    var p=vals.length ? vals.reduce(function(s,v){ return s+v.p; },0)/vals.length : 0;
    return { p:p, completos:vals.filter(function(v){ return v.t && v.n>=v.t; }).length };
  });
  return {
    titulo: document.title || 'Reporte del aula',
    sala: sala, docente: leeLocal('docente_nombre') || '',
    fecha: fechaLocal(new Date().toISOString()),
    conAvance: alumnos.some(function(a){ return a.total>0; }),
    alumnos: alumnos, columnas: columnas, celda: celda, porAct: porAct, promedio: prom,
    completaron: alumnos.filter(function(a){ return a.total && a.ok>=a.total; }).length,
    enProceso: alumnos.filter(function(a){ return a.ok>0 && a.ok<a.total; }).length,
    sinEmpezar: alumnos.filter(function(a){ return !a.ok; }).length,
    hayDni: alumnos.some(function(a){ return a.dni; })
  };
}
/* --- el Excel con colores, porcentajes y tres hojas --- */
function excelPro(X, d, rowsCrudas){
  var wb=new X.Workbook();
  wb.creator='Repositorio de Eduardo'; wb.created=new Date();
  var MAR='FF071767', FUC='FFFC0045', BORDE={ style:'thin', color:{ argb:'FFD5DDEF' } };
  var caja={ top:BORDE, left:BORDE, bottom:BORDE, right:BORDE };
  function titulo(ws, ncol, sub){
    ws.mergeCells(1,1,1,ncol); ws.mergeCells(2,1,2,ncol);
    var t=ws.getCell(1,1);
    t.value=d.titulo; t.font={ bold:true, size:16, color:{ argb:'FFFFFFFF' } };
    t.fill={ type:'pattern', pattern:'solid', fgColor:{ argb:MAR } };
    t.alignment={ vertical:'middle', indent:1 }; ws.getRow(1).height=30;
    var s=ws.getCell(2,1);
    s.value=sub; s.font={ italic:true, size:10, color:{ argb:'FF55607F' } };
    s.alignment={ indent:1 };
    for(var c=1;c<=ncol;c++) ws.getCell(1,c).border={ bottom:{ style:'medium', color:{ argb:FUC } } };
  }
  function cabecera(row){
    row.eachCell(function(c){
      c.font={ bold:true, color:{ argb:'FFFFFFFF' } };
      c.fill={ type:'pattern', pattern:'solid', fgColor:{ argb:MAR } };
      c.alignment={ vertical:'middle', horizontal:'center', wrapText:true }; c.border=caja;
    });
    row.height=34;
  }
  function pinta(c, p, conTexto){
    var nv=nivel(p);
    c.fill={ type:'pattern', pattern:'solid', fgColor:{ argb:'FF'+nv.f } };
    c.font={ bold:true, color:{ argb:'FF'+nv.c } };
    if(!conTexto){ c.numFmt='0%'; c.alignment={ horizontal:'center' }; }
  }
  var sub='Sala '+d.sala+(d.docente ? '  ·  Docente: '+d.docente : '')+'  ·  Generado: '+d.fecha;

  if(!d.conAvance){
    /* páginas sin avance medido: la tabla de siempre, con formato */
    var filas=armaReporte(rowsCrudas).resumen, cols=[];
    filas.forEach(function(f){ for(var k in f) if(cols.indexOf(k)<0) cols.push(k); });
    var wg=wb.addWorksheet('Resumen', { views:[{ state:'frozen', ySplit:4 }] });
    titulo(wg, cols.length, sub);
    cabecera(wg.getRow(4)); wg.getRow(4).values=cols; cabecera(wg.getRow(4));
    filas.forEach(function(f,i){
      var r=wg.addRow(cols.map(function(k){ return f[k]===undefined ? '' : f[k]; }));
      r.eachCell({ includeEmpty:true }, function(c){ c.border=caja;
        if(i%2) c.fill={ type:'pattern', pattern:'solid', fgColor:{ argb:'FFF6F8FD' } }; });
    });
    cols.forEach(function(k,j){ wg.getColumn(j+1).width=Math.max(12, Math.min(40, k.length+4)); });
    return wb;
  }

  /* hoja 1: resumen */
  var cabs=['N°','Alumno'].concat(d.hayDni?['DNI']:[]).concat(['Diapositiva actual','Correctas','Total','% Avance','Nivel','Último cambio']);
  var ws=wb.addWorksheet('Resumen', { views:[{ state:'frozen', ySplit:10 }] });
  titulo(ws, cabs.length, sub);
  /* indicadores del aula, uno por fila, encima de la tabla */
  [['Alumnos', d.alumnos.length, MAR, ''],
   ['Avance promedio', d.promedio, 'FF'+nivel(d.promedio).c, '0%'],
   ['Completaron (100 %)', d.completaron, 'FF0F6B45', ''],
   ['En proceso', d.enProceso, 'FF8A5A00', ''],
   ['Sin empezar', d.sinEmpezar, 'FF6B7591', '']].forEach(function(k,j){
    var l=ws.getCell(4+j,2), v=ws.getCell(4+j,3);
    l.value=k[0]; l.font={ bold:true, color:{ argb:'FF55607F' } };
    l.fill={ type:'pattern', pattern:'solid', fgColor:{ argb:'FFF1F5FD' } }; l.border=caja;
    v.value=k[1]; v.font={ bold:true, size:13, color:{ argb:k[2] } }; v.border=caja;
    v.alignment={ horizontal:'center' }; if(k[3]) v.numFmt=k[3];
  });
  ws.getRow(10).values=cabs; cabecera(ws.getRow(10));
  d.alumnos.forEach(function(a,i){
    var vals=[i+1, a.nombre].concat(d.hayDni?[a.dni]:[]).concat([a.lamina+(a.titulo ? ' — '+a.titulo : ''), a.ok, a.total, a.pct, nivel(a.pct).t, a.cambio]);
    var r=ws.addRow(vals);
    r.eachCell({ includeEmpty:true }, function(c){
      c.border=caja; c.alignment={ vertical:'middle', wrapText:true };
      if(i%2) c.fill={ type:'pattern', pattern:'solid', fgColor:{ argb:'FFF6F8FD' } };
    });
    var cp=r.getCell(cabs.indexOf('% Avance')+1), cn=r.getCell(cabs.indexOf('Nivel')+1);
    pinta(cp, a.pct); pinta(cn, a.pct, true); cn.alignment={ horizontal:'center' };
    r.getCell(1).alignment={ horizontal:'center' };
  });
  var pie=ws.addRow(['', 'Promedio del aula'].concat(d.hayDni?['']:[]).concat(['', '', '', d.promedio, nivel(d.promedio).t, '']));
  pie.eachCell({ includeEmpty:true }, function(c){ c.font={ bold:true }; c.border={ top:{ style:'medium', color:{ argb:MAR } } }; });
  pinta(pie.getCell(cabs.indexOf('% Avance')+1), d.promedio);
  ws.autoFilter={ from:{ row:10, column:1 }, to:{ row:10, column:cabs.length } };
  var anchos={ 'N°':5, 'Alumno':30, 'DNI':11, 'Diapositiva actual':42, 'Correctas':11, 'Total':9, '% Avance':11, 'Nivel':13, 'Último cambio':17 };
  cabs.forEach(function(k,j){ ws.getColumn(j+1).width=anchos[k]||14; });

  /* hoja 2: avance por actividad */
  var wa=wb.addWorksheet('Por actividad', { views:[{ state:'frozen', xSplit:1, ySplit:4 }] });
  titulo(wa, d.columnas.length+2, sub);
  wa.getRow(4).values=['Alumno'].concat(d.columnas.map(function(c,j){ return (j+1)+'. '+c.et; })).concat(['% Total']);
  cabecera(wa.getRow(4)); wa.getRow(4).height=48;
  d.columnas.forEach(function(c,j){ wa.getCell(4,j+2).note=c.t; wa.getColumn(j+2).width=13; });
  wa.getColumn(1).width=30; wa.getColumn(d.columnas.length+2).width=11;
  d.alumnos.forEach(function(a){
    var r=wa.addRow([a.nombre].concat(d.columnas.map(function(c,j){ var v=d.celda(a,j); return v ? v.p : ''; })).concat([a.pct]));
    r.eachCell({ includeEmpty:true }, function(c,k){
      c.border=caja;
      if(k===1) return;
      if(c.value!=='') pinta(c, c.value);
    });
  });
  var pa=wa.addRow(['Promedio del aula'].concat(d.porAct.map(function(x){ return x.p; })).concat([d.promedio]));
  pa.eachCell({ includeEmpty:true }, function(c,k){
    c.border={ top:{ style:'medium', color:{ argb:MAR } } };
    if(k===1){ c.font={ bold:true }; return; }
    pinta(c, c.value);
  });

  /* hoja 3: qué es cada actividad */
  var wd=wb.addWorksheet('Actividades', { views:[{ state:'frozen', ySplit:4 }] });
  titulo(wd, 6, sub);
  wd.getRow(4).values=['N°','Diapositiva','Actividad','Puntos','Promedio del aula','Completaron'];
  cabecera(wd.getRow(4));
  d.columnas.forEach(function(c,j){
    var r=wd.addRow([j+1, c.et, c.t, c.max||'', d.porAct[j].p, d.porAct[j].completos+' de '+d.alumnos.length]);
    r.eachCell({ includeEmpty:true }, function(x){ x.border=caja; x.alignment={ vertical:'middle', wrapText:true }; });
    pinta(r.getCell(5), d.porAct[j].p);
  });
  [5,22,50,9,17,14].forEach(function(w,j){ wd.getColumn(j+1).width=w; });
  return wb;
}
function descargaReporte(){
  if(!docente || !sala) return;
  var btn=$('aulaRepoBtn'), tx=$('aulaRepoTx');
  btn.disabled=true; tx.textContent='Preparando el reporte…';
  var nombre='reporte-'+String(cfg.sala).toLowerCase()+'-'+sala.toLowerCase()+'-'+fechaLocal(new Date().toISOString()).slice(0,10);
  traeFilasReporte()
    .then(function(rows){
      if(!rows.length){ tx.textContent='Todavía no hay alumnos en la sala '+sala+' para el reporte.'; return; }
      var rep=armaReporte(rows);
      return cargaExcelJS().then(function(X){
        return excelPro(X, datosReporte(rows), rows).xlsx.writeBuffer().then(function(buf){
          bajaArchivo(new Blob([buf], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), nombre+'.xlsx');
          tx.textContent='Listo: '+rows.length+(rows.length===1?' alumno':' alumnos')+' en '+nombre+'.xlsx';
        });
      }).catch(function(){ return cargaXlsx().then(function(X){
        var wb=X.utils.book_new();
        var h1=X.utils.json_to_sheet(rep.resumen);
        h1['!cols']=Object.keys(rep.resumen[0]).map(function(k){ return { wch:Math.max(12, Math.min(40, k.length+2)) }; });
        X.utils.book_append_sheet(wb, h1, 'Resumen');
        if(rep.detalle.length) X.utils.book_append_sheet(wb, X.utils.json_to_sheet(rep.detalle), 'Detalle');
        X.writeFile(wb, nombre+'.xlsx');
        tx.textContent='Listo: '+rows.length+(rows.length===1?' alumno':' alumnos')+' en '+nombre+'.xlsx';
      }, function(){
        /* sin la librería de Excel, igual se baja en CSV (Excel lo abre) */
        bajaArchivo(new Blob(['\ufeff'+csv(rep.resumen)], {type:'text/csv;charset=utf-8'}), nombre+'-resumen.csv');
        if(rep.detalle.length)
          bajaArchivo(new Blob(['\ufeff'+csv(rep.detalle)], {type:'text/csv;charset=utf-8'}), nombre+'-detalle.csv');
        tx.textContent='Listo en CSV: '+rows.length+(rows.length===1?' alumno':' alumnos')+'.';
      }); });
    })
    .catch(function(e){ tx.textContent='No se pudo descargar el reporte ('+e+'). Vuelve a intentarlo.'; })
    .then(function(){ btn.disabled=false; });
}

/* --- el mismo reporte en una página lista para imprimir o guardar en PDF --- */
function verReporte(){
  if(!docente || !sala) return;
  var w=window.open('', '_blank');   /* se abre ya, con el clic: así no lo bloquea el navegador */
  if(!w){ $('aulaRepoTx').textContent='El navegador bloqueó la ventana. Permite ventanas emergentes y vuelve a intentarlo.'; return; }
  w.document.write('<!doctype html><meta charset="utf-8"><title>Reporte</title><p style="font:16px system-ui;padding:24px">Preparando el reporte…</p>');
  traeFilasReporte().then(function(rows){
    w.document.open(); w.document.write(htmlReporte(datosReporte(rows), rows)); w.document.close();
  }).catch(function(e){
    w.document.body.innerHTML='<p style="font:16px system-ui;padding:24px">No se pudo armar el reporte ('+esc(String(e))+').</p>';
  });
}
function htmlReporte(d, rows){
  function hx(n){ return '#'+n; }
  function chip(p){ var nv=nivel(p); return '<span class="chip" style="background:'+hx(nv.f)+';color:'+hx(nv.c)+'">'+nv.t+'</span>'; }
  function barra(p){ var nv=nivel(p);
    return '<div class="bar"><i style="width:'+Math.round(p*100)+'%;background:'+hx(nv.c)+'"></i></div><b style="color:'+hx(nv.c)+'">'+Math.round(p*100)+'%</b>'; }
  var h='<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<title>'+esc(d.titulo)+' — Reporte</title><style>'+
    '*{box-sizing:border-box}body{margin:0;font-family:Inter,"Segoe UI",system-ui,sans-serif;color:#0B1B3F;background:#EEF1F7}'+
    '.hoja{max-width:1100px;margin:24px auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 8px 30px rgba(7,23,103,.12)}'+
    'header{background:#071767;color:#fff;padding:22px 28px;border-bottom:5px solid #FC0045}'+
    'header h1{margin:0;font-size:24px}header p{margin:6px 0 0;opacity:.85;font-size:14px}'+
    '.cuerpo{padding:22px 28px}.kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:22px}'+
    '.kpi{border:1px solid #D5DDEF;border-radius:12px;padding:12px 14px}.kpi small{display:block;font-size:11px;font-weight:800;'+
    'letter-spacing:.06em;text-transform:uppercase;color:#6B7591}.kpi b{font-size:26px}'+
    'h2{font-size:17px;margin:26px 0 10px;color:#071767}table{width:100%;border-collapse:collapse;font-size:13.5px}'+
    'th{background:#071767;color:#fff;text-align:left;padding:9px 10px;font-size:12px;letter-spacing:.03em}'+
    'td{border-bottom:1px solid #E3E8F3;padding:8px 10px;vertical-align:middle}tr:nth-child(even) td{background:#F8FAFE}'+
    '.bar{display:inline-block;width:110px;height:9px;border-radius:99px;background:#E8ECF4;overflow:hidden;vertical-align:middle;margin-right:8px}'+
    '.bar i{display:block;height:100%;border-radius:99px}.chip{display:inline-block;border-radius:99px;padding:3px 10px;font-size:12px;font-weight:800}'+
    '.scroll{overflow-x:auto}.mat{font-size:12px}.mat td.p{text-align:center;font-weight:800;font-size:11.5px;padding:7px 3px}'+
    '.mat th{text-align:center;font-size:10px;padding:7px 3px;line-height:1.25}.mat th:first-child,.mat td:first-child{text-align:left;min-width:120px}'+
    'tfoot td{font-weight:800;border-top:2px solid #071767;background:#fff!important}'+
    '.ley{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 0;font-size:12px;color:#55607F}'+
    '.acc{text-align:right;padding:14px 28px 0}.acc button{font:inherit;font-weight:800;background:#FC0045;color:#fff;border:0;border-radius:10px;padding:10px 18px;cursor:pointer}'+
    'footer{padding:14px 28px 22px;color:#8A93AC;font-size:12px}'+
    '@page{size:A4 landscape;margin:10mm}@media print{body{background:#fff}.scroll{overflow:visible}.hoja{margin:0;box-shadow:none;border-radius:0}.acc{display:none}'+
    '*{-webkit-print-color-adjust:exact;print-color-adjust:exact}tr{break-inside:avoid}}'+
    '@media(max-width:700px){.kpis{grid-template-columns:repeat(2,1fr)}}'+
    '</style></head><body><div class="hoja"><div class="acc"><button onclick="window.print()">🖨 Imprimir o guardar en PDF</button></div>'+
    '<header><h1>'+esc(d.titulo)+'</h1><p>Sala '+esc(d.sala)+(d.docente?' · Docente: '+esc(d.docente):'')+' · Generado: '+esc(d.fecha)+'</p></header><div class="cuerpo">';
  if(!rows.length) return h+'<p>Todavía no hay alumnos en la sala '+esc(d.sala)+'.</p></div></div></body></html>';
  if(!d.conAvance){
    var filas=armaReporte(rows).resumen, cols=[];
    filas.forEach(function(f){ for(var k in f) if(cols.indexOf(k)<0) cols.push(k); });
    h+='<table><thead><tr>'+cols.map(function(k){ return '<th>'+esc(k)+'</th>'; }).join('')+'</tr></thead><tbody>'+
       filas.map(function(f){ return '<tr>'+cols.map(function(k){ return '<td>'+esc(f[k]===undefined?'':String(f[k]))+'</td>'; }).join('')+'</tr>'; }).join('')+
       '</tbody></table>';
    return h+'</div><footer>Repositorio de Eduardo</footer></div></body></html>';
  }
  var nv=nivel(d.promedio);
  h+='<div class="kpis">'+
     '<div class="kpi"><small>Alumnos</small><b>'+d.alumnos.length+'</b></div>'+
     '<div class="kpi"><small>Avance promedio</small><b style="color:'+hx(nv.c)+'">'+Math.round(d.promedio*100)+'%</b></div>'+
     '<div class="kpi"><small>Completaron</small><b style="color:#0F6B45">'+d.completaron+'</b></div>'+
     '<div class="kpi"><small>En proceso</small><b style="color:#8A5A00">'+d.enProceso+'</b></div>'+
     '<div class="kpi"><small>Sin empezar</small><b style="color:#6B7591">'+d.sinEmpezar+'</b></div></div>';
  h+='<h2>Avance por alumno</h2><table><thead><tr><th>N°</th><th>Alumno</th>'+(d.hayDni?'<th>DNI</th>':'')+
     '<th>Va en</th><th>Correctas</th><th>% Avance</th><th>Nivel</th><th>Último cambio</th></tr></thead><tbody>';
  d.alumnos.forEach(function(a,i){
    h+='<tr><td>'+(i+1)+'</td><td><b>'+esc(a.nombre)+'</b></td>'+(d.hayDni?'<td>'+esc(a.dni)+'</td>':'')+
       '<td>'+esc(a.lamina)+(a.titulo?'<br><small style="color:#6B7591">'+esc(a.titulo)+'</small>':'')+'</td>'+
       '<td>'+a.ok+' de '+a.total+'</td><td style="white-space:nowrap">'+barra(a.pct)+'</td><td>'+chip(a.pct)+'</td>'+
       '<td>'+esc(a.cambio)+'</td></tr>';
  });
  h+='</tbody><tfoot><tr><td></td><td>Promedio del aula</td>'+(d.hayDni?'<td></td>':'')+'<td></td><td></td><td style="white-space:nowrap">'+
     barra(d.promedio)+'</td><td>'+chip(d.promedio)+'</td><td></td></tr></tfoot></table>';
  if(d.columnas.length){
    h+='<h2>Avance por actividad</h2><div class="scroll"><table class="mat"><thead><tr><th>Alumno</th>'+
       d.columnas.map(function(c,j){ return '<th title="'+esc(c.t)+'">'+(j+1)+'<br>'+esc(c.et)+'</th>'; }).join('')+'<th>Total</th></tr></thead><tbody>';
    d.alumnos.forEach(function(a){
      h+='<tr><td><b>'+esc(a.nombre)+'</b></td>';
      d.columnas.forEach(function(c,j){
        var v=d.celda(a,j);
        if(!v){ h+='<td class="p">—</td>'; return; }
        var n2=nivel(v.p);
        h+='<td class="p" style="background:'+hx(n2.f)+';color:'+hx(n2.c)+'">'+v.n+'/'+v.t+'</td>';
      });
      var nt=nivel(a.pct);
      h+='<td class="p" style="background:'+hx(nt.f)+';color:'+hx(nt.c)+'">'+Math.round(a.pct*100)+'%</td></tr>';
    });
    h+='</tbody><tfoot><tr><td>Promedio del aula</td>'+d.porAct.map(function(x){
         var n3=nivel(x.p); return '<td class="p" style="color:'+hx(n3.c)+'">'+Math.round(x.p*100)+'%</td>'; }).join('')+
       '<td class="p" style="color:'+hx(nv.c)+'">'+Math.round(d.promedio*100)+'%</td></tr></tfoot></table></div>';
    h+='<div class="ley">'+['Completó','Avanzado','En proceso','Inicio','Sin empezar'].map(function(t,k){
         var p=[1,0.85,0.6,0.2,0][k], n4=nivel(p);
         return '<span class="chip" style="background:'+hx(n4.f)+';color:'+hx(n4.c)+'">'+t+(k===1?' (80–99%)':k===2?' (50–79%)':k===3?' (1–49%)':'')+'</span>'; }).join('')+'</div>';
    h+='<h2>Actividades</h2><table><thead><tr><th>N°</th><th>Diapositiva</th><th>Actividad</th><th>Promedio del aula</th><th>Completaron</th></tr></thead><tbody>'+
       d.columnas.map(function(c,j){ return '<tr><td>'+(j+1)+'</td><td>'+esc(c.et)+'</td><td>'+esc(c.t)+'</td><td style="white-space:nowrap">'+
         barra(d.porAct[j].p)+'</td><td>'+d.porAct[j].completos+' de '+d.alumnos.length+'</td></tr>'; }).join('')+'</tbody></table>';
  }
  return h+'</div><footer>Repositorio de Eduardo · El porcentaje se calcula sobre las actividades de las diapositivas presentadas.</footer></div></body></html>';
}

/* ================= manito, mensajes y avisos al docente ================= */
function reiniciaAvisos(){
  clearTimeout(tMano); tMano=null;
  mano=''; manoT=0; msgs=[]; ultimoMsg=0; conocidos={}; primeraCarga=true; descartes={};
  comentOn=true; bajadas={};
}
/* el alumno publica su manito y sus últimos mensajes junto con su avance */
function conAvisos(est){
  var o={}, k, ahora=Date.now();
  for(k in est) o[k]=est[k];
  if(mano && ahora-manoT>TTL[mano]) quitaMano(true);          /* se bajó sola */
  msgs=msgs.filter(function(m){ return ahora-m.h<90000; });   /* los mensajes viejos ya no viajan */
  if(mano){ o.mano=mano; o.manoT=manoT; }
  if(msgs.length) o.msgs=msgs;
  return o;
}
/* el aviso se retira solo cuando se acaba su tiempo, o cuando el docente lo baja */
function quitaMano(sinEnviar){
  clearTimeout(tMano); tMano=null; mano='';
  if($('aulaAv')) pintaAvisos();
  if(!sinEnviar) empuja(true);
}
function tiempoCorto(ms){
  var seg=Math.max(0, Math.round((Date.now()-ms)/1000));
  return seg<60 ? 'hace '+seg+' s' : 'hace '+Math.round(seg/60)+' min';
}

/* ---- el alumno: botón flotante y panel ---- */
function montaAvisos(){
  if($('aulaAv')) return;
  var d=document.createElement('div');
  d.className='aula-av'; d.id='aulaAv'; d.hidden=true;
  d.innerHTML=
    '<button class="av-fab" id="avFab" type="button" aria-expanded="false" aria-controls="avPan">'+
      '<span id="avFabT">🙋 Avisar al docente</span></button>'+
    '<div class="av-pan" id="avPan" hidden role="dialog" aria-label="Avisar al docente">'+
      '<div class="av-t">Avisar al docente</div>'+
      '<div class="av-b">'+
        '<button type="button" id="avOk">👌 Listo, voy bien</button>'+
        '<button type="button" id="avDuda">✋ Tengo una duda</button>'+
      '</div>'+
      '<div id="avCom">'+
        '<label class="av-l">¿Quieres decir algo al docente?'+
          '<input id="avTxt" type="text" maxlength="140" placeholder="Escribe aquí tu mensaje" autocomplete="off"></label>'+
        '<div class="av-e"><button type="button" class="o-btn o-btn-primary" id="avEnv">Enviar</button></div>'+
      '</div>'+
      '<p class="av-sin" id="avSin" hidden>¿Quieres decir algo al docente? Levanta la mano: él verá tu aviso.</p>'+
      '<div class="av-eco" id="avEco" aria-live="polite"></div>'+
    '</div>';
  document.body.appendChild(d);
  $('avFab').addEventListener('click', function(){
    var abre=$('avPan').hidden;
    $('avPan').hidden=!abre;
    $('avFab').setAttribute('aria-expanded', abre?'true':'false');
    if(abre) setTimeout(function(){ $('avTxt').focus(); }, 30);
  });
  $('avOk').addEventListener('click', function(){ poneMano('ok'); });
  $('avDuda').addEventListener('click', function(){ poneMano('duda'); });
  $('avEnv').addEventListener('click', enviaMensaje);
  $('avTxt').addEventListener('keydown', function(e){
    e.stopPropagation();   /* que las flechas y letras no muevan las diapositivas */
    if(e.key==='Enter'){ e.preventDefault(); enviaMensaje(); }
  });
}
function pintaAvisos(){
  montaAvisos();
  var ve = !!sala && !docente;
  $('aulaAv').hidden=!ve;
  if(!ve){ $('avPan').hidden=true; }
  $('avCom').hidden=!comentOn;           /* el docente puede apagar los mensajes */
  $('avSin').hidden=comentOn;
  $('avOk').classList.toggle('on', mano==='ok');
  $('avDuda').classList.toggle('on', mano==='duda');
  $('avFabT').textContent = mano==='ok' ? '👌 Listo' : (mano==='duda' ? '✋ Duda enviada' : '🙋 Avisar al docente');
  $('avFab').classList.toggle('ok', mano==='ok');
  $('avFab').classList.toggle('duda', mano==='duda');
}
function poneMano(t){
  clearTimeout(tMano); tMano=null;
  mano = (mano===t) ? '' : t;      /* tocar otra vez la baja */
  manoT = Date.now();
  if(mano) tMano=setTimeout(function(){
    $('avEco').textContent = 'Tu aviso se retiró solo.';
    quitaMano();
  }, TTL[mano]);
  $('avEco').textContent = mano==='ok' ? 'El docente ve que estás bien durante 1 minuto.'
                         : mano==='duda' ? 'El docente ve tu mano. Se baja sola en 2 minutos.' : 'Bajaste la mano.';
  pintaAvisos(); empuja(true);
}
function enviaMensaje(){
  var t=$('avTxt').value.trim();
  if(!t || !comentOn) return;
  if(Date.now()-ultimoMsg<3000){ $('avEco').textContent='Espera unos segundos para enviar otro mensaje.'; return; }
  ultimoMsg=Date.now();
  msgs.push({ t:t.slice(0,140), h:ultimoMsg });
  msgs=msgs.slice(-5);
  $('avTxt').value='';
  $('avEco').textContent='Mensaje enviado. El docente lo ve durante 1 minuto.';
  empuja(true);
}

/* ---- el docente: insignias, lista de avisos y aviso emergente ---- */
function claveAviso(it){ return it.al+'|'+it.tipo+'|'+it.h; }
/* los avisos vigentes de un alumno: ni quitados por el docente ni pasados de su tiempo.
   El tiempo corre desde que este equipo los vio por primera vez, así no importa el reloj del alumno. */
function avisosDe(g){
  var e=g.estado||{}, items=[], ahora=Date.now();
  if(e.mano) items.push({ al:g.alumno, tipo:e.mano, t:'', h:e.manoT||0 });
  (e.msgs||[]).forEach(function(m){ items.push({ al:g.alumno, tipo:'msg', t:m.t, h:m.h||0 }); });
  return items.filter(function(it){
    var k=claveAviso(it);
    if(descartes[k]) return false;
    var visto=conocidos[k] || ahora;
    return ahora-visto <= (TTL[it.tipo] || 60000);
  });
}
function insignia(g){
  var h='', hay=avisosDe(g), nMsg=0;
  hay.forEach(function(it){
    if(it.tipo==='duda') h+='<span class="av-bd duda" title="Levantó la mano">✋</span>';
    else if(it.tipo==='ok') h+='<span class="av-bd ok" title="Dice que va bien">👌</span>';
    else nMsg++;
  });
  if(nMsg) h+='<span class="av-bd msg" title="Escribió un mensaje">💬 '+nMsg+'</span>';
  return h;
}
function listaAvisos(){
  var items=[];
  gente.forEach(function(g){ items=items.concat(avisosDe(g)); });
  var rango={ duda:0, msg:1, ok:2 };
  items.sort(function(a,b){ return (rango[a.tipo]-rango[b.tipo]) || (b.h-a.h); });
  return items;
}
function avisosHtml(){
  var items=listaAvisos();
  var h='<div class="aula-avisos"><div class="av-h"><b>Avisos de la clase</b><span class="av-hb">'+
        '<button type="button" id="avComent" class="'+(comentOn?'on':'')+'" title="Activar o desactivar los mensajes de los alumnos">'+
          '💬 Comentarios: '+(comentOn?'sí':'no')+'</button>'+
        (items.length ? '<button type="button" id="avLimpia">Marcar todo como visto</button>' : '')+
        '</span></div>';
  if(!items.length) h+='<div class="av-mas">Sin avisos por ahora. Las manos y los mensajes aparecen aquí.</div>';
  items.slice(0,12).forEach(function(it){
    var ico = it.tipo==='duda' ? '✋' : (it.tipo==='ok' ? '👌' : '💬');
    var txt = it.tipo==='duda' ? 'levantó la mano' : (it.tipo==='ok' ? 'dice que va bien' : esc(it.t));
    h+='<div class="av-it '+it.tipo+'" data-al="'+esc(it.al)+'" role="button" tabindex="0">'+
       '<span class="ai-i">'+ico+'</span>'+
       '<span class="ai-x"><b>'+esc(it.al)+'</b> '+txt+'</span>'+
       '<time>'+esc(tiempoCorto(conocidos[claveAviso(it)] || Date.now()))+'</time>'+   /* reloj de este equipo */
       '<button type="button" class="ai-v" data-vi="'+esc(claveAviso(it))+'" data-al="'+esc(it.al)+'" data-h="'+it.h+
         '" data-t="'+it.tipo+'">'+(it.tipo==='msg' ? 'Quitar' : 'Bajar mano')+'</button>'+
       '</div>';
  });
  if(items.length>12) h+='<div class="av-mas">y '+(items.length-12)+' más</div>';
  return h+'</div>';
}
function cableaAvisos(){
  var m=$('muro');
  Array.prototype.forEach.call(m.querySelectorAll('.ai-v'), function(b){
    b.addEventListener('click', function(ev){
      ev.stopPropagation();
      quitaAviso({ al:b.getAttribute('data-al'), tipo:b.getAttribute('data-t'), h:+b.getAttribute('data-h') });
      publicaBatuta(); pintaMuro();
    });
  });
  var l=m.querySelector('#avLimpia');
  if(l) l.addEventListener('click', function(){
    listaAvisos().forEach(quitaAviso); publicaBatuta(); pintaMuro();
  });
  var c=m.querySelector('#avComent');
  if(c) c.addEventListener('click', alternaComent);
  if(cfg.pantalla) Array.prototype.forEach.call(m.querySelectorAll('.av-it'), function(v){
    function abre(){ abrePantalla(v.getAttribute('data-al')); }
    v.addEventListener('click', abre);
    v.addEventListener('keydown', function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); abre(); } });
  });
}
/* quitar un aviso de la lista; si era una mano, el alumno la ve bajar */
function quitaAviso(it){
  descartes[claveAviso(it)]=1;
  if(it.tipo!=='msg'){
    bajadas[it.al]=it.h;
    var ks=Object.keys(bajadas);
    if(ks.length>20) delete bajadas[ks[0]];
  }
}
function claveComent(){ return 'coment_'+cfg.sala+'-'+sala; }
function leeComent(){ comentOn = leeLocal(claveComent())!=='0'; }
function alternaComent(){
  if(!docente) return;
  comentOn=!comentOn;
  guardaLocal(claveComent(), comentOn?'1':'0');
  pintaComent(); publicaBatuta(); pintaMuro();
  toastDocente(comentOn ? '💬 Los alumnos pueden escribir mensajes' : '🔇 Mensajes desactivados: solo podrán levantar la mano');
}
function pintaComent(){
  var b=$('aulaComent');
  if(!b) return;
  b.hidden=!docente;
  b.textContent='💬 Comentarios: '+(comentOn?'sí':'no');
  b.setAttribute('aria-pressed', comentOn?'true':'false');
}
/* vuelve a enviar la orden de la clase con los cambios de avisos */
function publicaBatuta(){ if(docente && sala) dirige(batuta || { modo:'libre' }); }
/* el alumno recibe del docente: si hay comentarios y qué manos bajó */
function recibeFlags(est){
  est=est||{};
  comentOn = est.coment!==0;
  var b=(est.bajadas||{})[yo];
  if(mano && b && b===manoT){
    quitaMano(); $('avEco').textContent='El docente bajó tu mano.';
  }
  pintaAvisos();
}

var tToast=null, acToast=null;
function pitido(){
  try{
    if(!acToast) acToast=new (window.AudioContext||window.webkitAudioContext)();
    var o=acToast.createOscillator(), g=acToast.createGain(), t=acToast.currentTime;
    o.type='sine'; o.frequency.value=740;
    g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.04,t+0.02);
    g.gain.exponentialRampToValueAtTime(0.0001,t+0.25);
    o.connect(g); g.connect(acToast.destination); o.start(t); o.stop(t+0.3);
  }catch(e){}
}
function toastDocente(txt){
  var e=$('aulaToast');
  if(!e){
    e=document.createElement('div'); e.className='aula-toast'; e.id='aulaToast'; e.hidden=true;
    e.setAttribute('role','status'); document.body.appendChild(e);
  }
  e.textContent=txt; e.hidden=false;
  requestAnimationFrame(function(){ e.classList.add('ve'); });
  clearTimeout(tToast);
  tToast=setTimeout(function(){ e.classList.remove('ve'); setTimeout(function(){ e.hidden=true; }, 300); }, 4200);
  pitido();
}
/* la primera lectura de la sala no avisa: solo lo que llega después */
function detectaAvisos(rows){
  var nuevos=[];
  rows.forEach(function(g){
    var e=g.estado||{}, k;
    if(e.mano){
      k=g.alumno+'|'+e.mano+'|'+e.manoT;
      if(!conocidos[k]){ conocidos[k]=Date.now(); nuevos.push({ al:g.alumno, tipo:e.mano, t:'' }); }
    }
    (e.msgs||[]).forEach(function(m){
      k=g.alumno+'|msg|'+m.h;
      if(!conocidos[k]){ conocidos[k]=Date.now(); nuevos.push({ al:g.alumno, tipo:'msg', t:m.t }); }
    });
  });
  if(primeraCarga){ primeraCarga=false; return; }
  if(!nuevos.length) return;
  var u=nuevos[nuevos.length-1];
  toastDocente(u.tipo==='duda' ? '✋ '+u.al+' levantó la mano'
             : u.tipo==='ok'   ? '👌 '+u.al+' dice que va bien'
             : '💬 '+u.al+': '+u.t+(nuevos.length>1 ? '  (+'+(nuevos.length-1)+' más)' : ''));
}

/* ================= elegir qué diapositivas se presentan hoy ================= */
/* la página pasa: diapos() -> [{n, et, t}], seleccion() -> lista de índices o null, alElegir(lista) */
function eligeDiapos(){
  if(!docente || !cfg.diapos) return;
  var lista=cfg.diapos(), actual=cfg.seleccion ? cfg.seleccion() : null;
  var v=$('aulaElige');
  if(!v){
    v=document.createElement('div'); v.className='aula-elige'; v.id='aulaElige';
    document.body.appendChild(v);
    v.addEventListener('click', function(e){ if(e.target===v) cierraElige(); });
    document.addEventListener('keydown', function(e){
      if(e.key==='Escape' && !$('aulaElige').hidden) cierraElige(); });
  }
  var h='<div class="ae-caja" role="dialog" aria-modal="true" aria-label="Elegir diapositivas">'+
    '<div class="ae-h"><b>Diapositivas de hoy</b><span id="aeCuenta"></span></div>'+
    '<p class="ae-p">Marca las que presentarás. Tú y tus alumnos solo verán esas; el resto se oculta.</p>'+
    '<div class="ae-acc"><button type="button" id="aeTodas">Marcar todas</button>'+
      '<button type="button" id="aeNinguna">Quitar todas</button></div>'+
    '<div class="ae-lista">';
  lista.forEach(function(d){
    var on = !actual || actual.indexOf(d.n)>=0;
    h+='<label class="ae-it"><input type="checkbox" data-n="'+d.n+'"'+(on?' checked':'')+'>'+
       '<span class="ae-n">'+(d.n+1)+'</span>'+
       '<span class="ae-t"><small>'+esc(d.et)+'</small>'+esc(d.t)+'</span></label>';
  });
  h+='</div><div class="ae-pie"><button type="button" class="o-btn" id="aeCancela">Cancelar</button>'+
     '<button type="button" class="o-btn o-btn-primary" id="aeAplica">Aplicar</button></div></div>';
  v.innerHTML=h; v.hidden=false;
  function marcadas(){
    return Array.prototype.filter.call(v.querySelectorAll('input[data-n]'), function(c){ return c.checked; })
      .map(function(c){ return +c.getAttribute('data-n'); });
  }
  function cuenta(){ $('aeCuenta').textContent=marcadas().length+' de '+lista.length; }
  v.addEventListener('change', cuenta); cuenta();
  $('aeTodas').addEventListener('click', function(){
    Array.prototype.forEach.call(v.querySelectorAll('input[data-n]'), function(c){ c.checked=true; }); cuenta(); });
  $('aeNinguna').addEventListener('click', function(){
    Array.prototype.forEach.call(v.querySelectorAll('input[data-n]'), function(c){ c.checked=false; }); cuenta(); });
  $('aeCancela').addEventListener('click', cierraElige);
  $('aeAplica').addEventListener('click', function(){
    var m=marcadas();
    if(!m.length){ $('aeCuenta').textContent='Marca al menos una'; return; }
    cierraElige();
    if(cfg.alElegir) cfg.alElegir(m);
  });
}
function cierraElige(){ var v=$('aulaElige'); if(v){ v.hidden=true; v.innerHTML=''; } }

/* ---------------- pantalla de un alumno (solo docente) ---------------- */
function abrePantalla(nombre){
  if(!cfg.pantalla || !docente) return;
  mirando=nombre;
  var v=$('aulaPant');
  if(!v){
    v=document.createElement('div');
    v.className='aula-pant'; v.id='aulaPant';
    v.innerHTML='<div class="ap-caja" role="dialog" aria-modal="true" aria-label="Pantalla del alumno">'+
      '<div class="ap-h"><span class="ap-n" id="aulaPantN"></span><span class="ap-s" id="aulaPantS"></span>'+
      '<button class="o-btn" id="aulaPantX" type="button">Cerrar ✕</button></div>'+
      '<div class="ap-c" id="aulaPantC"></div></div>';
    document.body.appendChild(v);
    $('aulaPantX').addEventListener('click', cierraPantalla);
    v.addEventListener('click', function(e){ if(e.target===v) cierraPantalla(); });
    document.addEventListener('keydown', function(e){ if(e.key==='Escape' && mirando) cierraPantalla(); });
  }
  v.hidden=false;
  document.body.style.overflow='hidden';
  $('aulaPantC').scrollTop=0;
  refrescaPantalla();
}
function cierraPantalla(){
  mirando=null;
  var v=$('aulaPant');
  if(v){ v.hidden=true; $('aulaPantC').innerHTML=''; }
  document.body.style.overflow='';
}
function refrescaPantalla(){
  if(!mirando || !$('aulaPant')) return;
  var g=null;
  gente.forEach(function(x){ if(x.alumno===mirando) g=x; });
  $('aulaPantN').textContent=mirando;
  if(!g){
    $('aulaPantS').textContent='ya no está en la sala';
    return;
  }
  var seg=Math.max(0, Math.round((Date.now()-new Date(g.actualizado).getTime())/1000));
  $('aulaPantS').textContent='● en vivo · último cambio '+(seg<60 ? 'hace '+seg+' s' : 'hace '+Math.round(seg/60)+' min');
  var c=$('aulaPantC'), arriba=c.scrollTop;
  cfg.pantalla(g.estado||{}, g.alumno, c);
  c.scrollTop=arriba;
}

/* ---------------- música de fondo (solo docente, solo en su equipo) ---------------- */
var REPO='https://api.github.com/repos/EduardoAEGES/cursos_edu/git/trees/main?recursive=1';
var pistas=null, pista=null, suena=false, ultima=-1;

function volMusica(){
  var v=parseFloat(leeLocal('musica_vol'));
  /* por defecto suena muy bajito: es fondo, no debe tapar al docente */
  return isNaN(v) ? 0.04 : Math.max(0, Math.min(1, v/100));
}
/* lista los audios de sonidos/ directamente del repositorio: basta subir un mp3 */
function buscaPistas(){
  if(pistas && pistas.length) return Promise.resolve(pistas);
  try{
    var c=JSON.parse(sessionStorage.getItem('aula_pistas')||'null');
    if(c && c.length){ pistas=c; return Promise.resolve(pistas); }
  }catch(e){}
  return fetch(REPO).then(function(r){ return r.ok ? r.json() : Promise.reject(r.status); })
    .then(function(d){
      pistas=(d.tree||[]).map(function(t){ return t.path; }).filter(function(p){
        return /^sonidos\//i.test(p) && /\.(mp3|wav|ogg|m4a|aac|webm)$/i.test(p) &&
               !/sonido[_ -]?fallo|ono-bebe/i.test(p);
      });
      try{ if(pistas.length) sessionStorage.setItem('aula_pistas', JSON.stringify(pistas)); }catch(e){}
      return pistas;
    })
    .catch(function(){ pistas=[]; return pistas; });
}
function otraPista(){
  if(!suena || !docente || !pistas || !pistas.length) return;
  var i=Math.floor(Math.random()*pistas.length);
  if(pistas.length>1 && i===ultima) i=(i+1+Math.floor(Math.random()*(pistas.length-1)))%pistas.length;
  ultima=i;
  if(!pista){
    pista=new Audio();
    pista.addEventListener('ended', otraPista);
  }
  pista.src=BASE+pistas[i].split('/').map(encodeURIComponent).join('/');
  pista.volume=volMusica();
  var p=pista.play();
  if(p && p.catch) p.catch(function(){});
  pintaMusica();
}
function musica(on){
  guardaLocal('musica', on?'1':'0');
  if(!on){ callaMusica(); return; }
  suena=true; pintaMusica();
  buscaPistas().then(function(){
    if(!pistas.length){ suena=false; pintaMusica(); return; }
    otraPista();
  });
}
function callaMusica(){
  suena=false;
  if(pista) pista.pause();
  pintaMusica();
}
function pintaMusica(){
  var b=$('aulaMusOn');
  if(!b) return;
  var vacia=pistas && !pistas.length;
  b.textContent = vacia ? '🎵 Sin audios en sonidos/' : (suena ? '🎵 Música: sí' : '🔇 Música: no');
  b.setAttribute('aria-pressed', suena?'true':'false');
  b.title = suena && ultima>=0 && pistas ? decodeURIComponent(pistas[ultima].replace(/^.*\//,'')) : '';
}

window.Aula={
  iniciar:function(opciones){
    cfg=opciones;
    pintaControles(); pintaMuro();
    /* en el equipo del docente se entra solo, sin DNI ni clave, aunque recargue */
    if(leeLocal(marcaDoc())==='1' && (!pin() || pinBueno(pinMio()))) setTimeout(function(){
      if(sala) return;
      $('aulaClave').value=claveDoc();
      if(pin() && $('aulaPin')) $('aulaPin').value=pinMio();
      entraDocente();
    }, 0);
  },
  empuja:function(){ empuja(); },
  dirige:function(d){ dirige(d); },
  guardaFicha:function(){ guardaAvance(true); },
  saca:function(nombre){ sacaAlumno(nombre); },
  get dni(){ return dni; },
  get batuta(){ return batuta; },
  refresca:function(){ pintaMuro(); },
  verPantalla:function(nombre){ abrePantalla(nombre); },
  cambiaMusica:function(){ otraPista(); },
  get esDocente(){ return docente; },
  get enSala(){ return !!sala; },
  get enPractica(){ return practica; },
  get sala(){ return sala; },
  eligeDiapositivas:function(){ eligeDiapos(); },
  /* el enlace del caso práctico que publica el docente */
  guardaRecurso:function(r){ return publicaRecurso(r); },
  get recurso(){ return recurso; },
  /* los nombres de quienes están en la sala, para sortear parejas y equipos */
  get participantes(){ return gente.map(function(g){ return g.alumno; }); }
};
})();
