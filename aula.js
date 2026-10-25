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
function listaDocentes(){ return (cfg && cfg.docentes) || DOCENTES; }

/* una página puede pedir su propia clave de docente: Aula.iniciar({ clave:'LOGICO' }) */
function claveDoc(){ return (cfg && cfg.clave) || CLAVE; }
function marcaDoc(){ return (cfg && cfg.clave) ? 'docente_equipo_'+cfg.clave : 'docente_equipo'; }

var cfg=null, sala=null, yo=null, docente=false, tAbierta=null, practica=false;
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
  fallos=0; empuja(true);
  if(cfg.alModo) cfg.alModo(false);
  escucha(); escuchaRecurso();
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
  fallos=0; arranca(); escuchaRecurso();
  if(pin()) latidoSala();
  if(cfg.musica) musica(leeLocal('musica')!=='0');
  if(cfg.alModo) cfg.alModo(true);
}
function sale(){
  practica=false;
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
  fuera(); estado('solo','Modo individual'); pintaMuro();
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
                             estado:cfg.resumen(), actualizado:new Date().toISOString() }])
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
function dirige(d){
  if(!sala || !docente) return;
  batuta=d||null;
  fetch(TABLA+'?on_conflict=sala,alumno', {
    method:'POST', headers:hdr({ Prefer:'resolution=merge-duplicates,return=minimal' }),
    body:JSON.stringify([{ sala:salaBatuta(), alumno:'docente', caso:'',
                           estado:d||{modo:'libre'}, actualizado:new Date().toISOString() }])
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
      if(!fila){ if(selloBatuta!==''){ selloBatuta=''; batuta=null; cfg.batuta({modo:'libre'}); } return; }
      var sello=String(fila.actualizado)+'|'+JSON.stringify(fila.estado||{});
      if(sello===selloBatuta) return;
      selloBatuta=sello; batuta=fila.estado||{};
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
  var ahora=Date.now(), h='';
  gente.forEach(function(g){
    var e=g.estado||{};
    var seg=Math.max(0, Math.round((ahora-new Date(g.actualizado).getTime())/1000));
    var hace = seg<60 ? ('hace '+seg+' s') : ('hace '+Math.round(seg/60)+' min');
    h+='<div class="aula-vtna'+(g.alumno===yo?' yo':'')+(e.listo?' listo':'')+
         (cfg.pantalla?' clic" role="button" tabindex="0" title="Ver su pantalla" data-al="'+esc(g.alumno):'')+'">'+
         '<div class="vh"><span class="vn">'+esc(g.alumno)+(g.alumno===yo?' (tú)':'')+'</span>'+
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
    b.innerHTML='<button class="o-btn o-btn-primary" id="aulaRepoBtn" type="button">⬇ Descargar reportes</button>'+
                '<span class="aula-repo-tx" id="aulaRepoTx">Excel con el avance y las respuestas de cada alumno de la sala.</span>';
    m.parentNode.insertBefore(b, m);
    $('aulaRepoBtn').addEventListener('click', descargaReporte);
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
function descargaReporte(){
  if(!docente || !sala) return;
  var btn=$('aulaRepoBtn'), tx=$('aulaRepoTx');
  btn.disabled=true; tx.textContent='Preparando el reporte…';
  /* para el reporte se mira todo el día, no solo las últimas horas del muro */
  var desde=new Date(Date.now()-24*3600*1000).toISOString();
  var nombre='reporte-'+String(cfg.sala).toLowerCase()+'-'+sala.toLowerCase()+'-'+fechaLocal(new Date().toISOString()).slice(0,10);
  fetch(TABLA+'?select=alumno,caso,estado,actualizado&sala=eq.'+encodeURIComponent(cfg.sala+'-'+sala)+
        '&actualizado=gte.'+desde+'&order=alumno.asc&limit=300', { headers:hdr() })
    .then(function(r){ return r.ok ? r.json() : Promise.reject(r.status); })
    .then(function(rows){
      rows=rows||[];
      if(!rows.length){ tx.textContent='Todavía no hay alumnos en la sala '+sala+' para el reporte.'; return; }
      var rep=armaReporte(rows);
      return cargaXlsx().then(function(X){
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
      });
    })
    .catch(function(e){ tx.textContent='No se pudo descargar el reporte ('+e+'). Vuelve a intentarlo.'; })
    .then(function(){ btn.disabled=false; });
}

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
  /* el enlace del caso práctico que publica el docente */
  guardaRecurso:function(r){ return publicaRecurso(r); },
  get recurso(){ return recurso; },
  /* los nombres de quienes están en la sala, para sortear parejas y equipos */
  get participantes(){ return gente.map(function(g){ return g.alumno; }); }
};
})();
