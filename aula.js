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
       });
       Aula.empuja();                     tras cada cambio del alumno
   ===================================================================== */
(function(){
'use strict';

var SUPA='https://klmjmlhwuzhymrplemgw.supabase.co';
var ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsbWptbGh3dXpoeW1ycGxlbWd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1OTMyNjQsImV4cCI6MjA4NzE2OTI2NH0.xFWMvUJa9n9TBcBG1WSeqCGiWBaCAtCU9aY7GXk4W6E';
var TABLA=SUPA+'/rest/v1/sala_asientos';
var CLAVE='46069339';

var cfg=null, sala=null, yo=null, docente=false;
var tSala=null, tEnvio=null, gente=[], fallos=0, grande=false;

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

/* ---------------- controles ---------------- */
function pintaControles(){
  $('aula').innerHTML=
    '<div class="aula-filas">'+
      '<div class="aula-fila" id="aulaAlumno">'+
        '<span class="aula-rol">Alumno</span>'+
        '<label class="aula-campo" id="aulaCnom">Tu nombre'+
          '<input id="aulaNombre" type="text" maxlength="40" placeholder="Nombre y apellido" autocomplete="off"></label>'+
        '<label class="aula-campo">Código de sala'+
          '<input id="aulaSala" type="text" maxlength="20" placeholder="PCGE" autocomplete="off"></label>'+
        '<button class="o-btn o-btn-primary" id="aulaEntrar" type="button">Entrar a la sala</button>'+
      '</div>'+
      '<div class="aula-fila" id="aulaDocente">'+
        '<span class="aula-rol doc">Docente</span>'+
        '<label class="aula-campo">Código de sala'+
          '<input id="aulaSalaD" type="text" maxlength="20" placeholder="PCGE" autocomplete="off"></label>'+
        '<label class="aula-campo" id="aulaCclave">Clave'+
          '<input id="aulaClave" type="password" inputmode="numeric" placeholder="Clave" autocomplete="off"></label>'+
        '<button class="o-btn" id="aulaEntrarD" type="button">Entrar como docente</button>'+
      '</div>'+
      '<div class="aula-fila" id="aulaDentro" hidden>'+
        '<span class="aula-rol" id="aulaQuien"></span>'+
        '<button class="o-btn" id="aulaSalir" type="button">Salir</button>'+
        '<button class="o-btn" id="aulaGrande" type="button" hidden>🔍 Ventanas grandes</button>'+
        '<button class="o-btn" id="aulaRefresca" type="button" hidden>↻ Actualizar</button>'+
      '</div>'+
      '<span class="aula-estado solo" id="aulaEstado">Modo individual</span>'+
    '</div>';

  $('aulaNombre').value=leeLocal('nombre');
  $('aulaSala').value=leeLocal('sala')||'PCGE';
  $('aulaSalaD').value=leeLocal('sala')||'PCGE';

  $('aulaEntrar').addEventListener('click', entraAlumno);
  $('aulaEntrarD').addEventListener('click', entraDocente);
  $('aulaSalir').addEventListener('click', sale);
  $('aulaRefresca').addEventListener('click', trae);
  $('aulaGrande').addEventListener('click', function(){
    grande=!grande;
    $('muro').classList.toggle('grande', grande);
    $('aulaGrande').textContent = grande ? '🔎 Ventanas pequeñas' : '🔍 Ventanas grandes';
  });
  ['aulaNombre','aulaSala'].forEach(function(id){
    $(id).addEventListener('keydown', function(e){ if(e.key==='Enter') entraAlumno(); });
  });
  ['aulaSalaD','aulaClave'].forEach(function(id){
    $(id).addEventListener('keydown', function(e){ if(e.key==='Enter') entraDocente(); });
  });
}
function estado(clase, txt){
  var e=$('aulaEstado');
  e.className='aula-estado '+clase;
  e.textContent=txt;
}
function dentro(txt){
  $('aulaAlumno').hidden=true; $('aulaDocente').hidden=true;
  $('aulaDentro').hidden=false;
  $('aulaQuien').textContent=txt;
  $('aulaGrande').hidden=!docente;
  $('aulaRefresca').hidden=!docente;
}
function fuera(){
  $('aulaAlumno').hidden=false; $('aulaDocente').hidden=false;
  $('aulaDentro').hidden=true;
}

/* ---------------- entrar y salir ---------------- */
function entraAlumno(){
  var n=$('aulaNombre').value.trim(), s=($('aulaSala').value.trim()||'PCGE').toUpperCase();
  $('aulaCnom').classList.toggle('falta', n.length<2);
  if(n.length<2){ $('aulaNombre').focus(); estado('malo','Escribe tu nombre para entrar'); return; }
  yo=n; sala=s; docente=false;
  guardaLocal('nombre',n); guardaLocal('sala',s);
  dentro(n);
  estado('vivo','Conectando…');
  fallos=0; empuja(true);
  if(cfg.alModo) cfg.alModo(false);
}
function entraDocente(){
  var s=($('aulaSalaD').value.trim()||'PCGE').toUpperCase();
  var c=$('aulaClave').value.trim();
  if(c!==CLAVE){
    $('aulaCclave').classList.add('falta');
    $('aulaClave').value=''; $('aulaClave').focus();
    estado('malo','Clave incorrecta');
    return;
  }
  $('aulaCclave').classList.remove('falta');
  yo=null; sala=s; docente=true;
  guardaLocal('sala',s);
  dentro('Docente');
  estado('vivo','Conectando…');
  fallos=0; arranca();
  if(cfg.alModo) cfg.alModo(true);
}
function sale(){
  sala=null; yo=null; docente=false; gente=[];
  if(tSala){ clearInterval(tSala); tSala=null; }
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
  if(!sala || !yo || docente) return;
  clearTimeout(tEnvio);
  tEnvio=setTimeout(function(){
    fetch(TABLA+'?on_conflict=sala,alumno', {
      method:'POST', headers:hdr({ Prefer:'resolution=merge-duplicates,return=minimal' }),
      body:JSON.stringify([{ sala:cfg.sala+'-'+sala, alumno:yo, caso:'',
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
  fetch(TABLA+'?select=alumno,estado,actualizado&sala=eq.'+encodeURIComponent(cfg.sala+'-'+sala)+
        '&actualizado=gte.'+desde+'&order=alumno.asc&limit=80', { headers:hdr() })
    .then(function(r){ return r.ok ? r.json() : Promise.reject(r.status); })
    .then(function(rows){
      fallos=0; gente=rows||[];
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

/* ---------------- muro ---------------- */
function pintaMuro(){
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
    h+='<div class="aula-vtna'+(g.alumno===yo?' yo':'')+(e.listo?' listo':'')+'">'+
         '<div class="vh"><span class="vn">'+esc(g.alumno)+(g.alumno===yo?' (tú)':'')+'</span>'+
         '<span class="vs">'+esc(hace)+'</span></div>'+
         cfg.ventana(e, g.alumno)+
       '</div>';
  });
  $('muro').innerHTML=h;
}

window.Aula={
  iniciar:function(opciones){
    cfg=opciones;
    pintaControles(); pintaMuro();
  },
  empuja:function(){ empuja(); },
  refresca:function(){ pintaMuro(); },
  get esDocente(){ return docente; },
  get enSala(){ return !!sala; }
};
})();
