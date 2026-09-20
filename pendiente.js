/* ------------------------------------------------------------------
   Aviso de "pronto se implementará"
   - Muestra un pop up cuando algo todavía no está implementado o vacío.
   - Reproduce un sonido al mostrarlo.

   Cómo usarlo:
     1) Incluir en la página:  <script src="pendiente.js" defer></script>
     2) En cualquier elemento que aún no tenga contenido:
          <a class="course" data-pendiente href="mi-curso.html"> … </a>
        Al hacer clic se muestra el aviso (y no se navega, salvo que el
        visitante elija "Entrar igual" en el pop up).
     3) Para que el aviso salga solo al abrir una página vacía:
          <body data-pendiente-auto>

   Sonido: se busca el archivo indicado en SONIDO_SRC. Si no está, se
   genera un sonido equivalente con el navegador para no quedar en
   silencio. Para usar el de myinstants («Ono bebé»), descarga el mp3
   desde https://www.myinstants.com/es/instant/ono-bebe-68745/ y guárdalo
   en esta misma carpeta como  sonidos/ono-bebe.mp3
   ------------------------------------------------------------------ */
(function () {
  'use strict';

  var SONIDO_SRC = 'sonidos/ono-bebe.mp3';
  var TITULO = 'Pronto se implementará';
  var MENSAJE = 'Eduardo está pensando, estudiando, ensayando, creando o trabajando';

  /* ---------- estilos ---------- */
  var CSS = '' +
    '.pnd-overlay{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;' +
      'padding:16px;background:rgba(0,0,0,.45);opacity:0;transition:opacity .15s ease}' +
    '.pnd-overlay.pnd-on{opacity:1}' +
    '.pnd-box{position:relative;max-width:460px;width:100%;border-radius:6px;background:#fff;color:#1F1F1F;' +
      'box-shadow:0 14px 44px rgba(0,0,0,.3);font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;' +
      'font-size:13px;line-height:1.5;transform:translateY(10px);transition:transform .18s ease}' +
    '.pnd-overlay.pnd-on .pnd-box{transform:none}' +
    '.pnd-head{display:flex;align-items:center;gap:10px;padding:13px 18px;border-bottom:1px solid #DEE2E6}' +
    '.pnd-head h3{margin:0;font-size:15px;font-weight:600;color:#1F1F1F}' +
    '.pnd-body{padding:20px 18px;display:flex;gap:14px;align-items:flex-start}' +
    '.pnd-emoji{flex:none;width:42px;height:42px;border-radius:6px;background:#F4F1F5;display:grid;' +
      'place-items:center;font-size:22px}' +
    '.pnd-txt{flex:1;min-width:0}' +
    '.pnd-txt p{margin:0;color:#6C757D}' +
    '.pnd-dots::after{content:"";animation:pnd-dots 1.4s steps(4,end) infinite}' +
    '@keyframes pnd-dots{0%{content:""}25%{content:" ."}50%{content:" . ."}75%{content:" . . ."}100%{content:" . . . ."}}' +
    '.pnd-badge{display:inline-block;margin-top:10px;font-size:11px;font-weight:600;padding:2px 9px;' +
      'border-radius:999px;border:1px solid #D6D6D6;background:#F6F6F6;color:#6C757D}' +
    '.pnd-acciones{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;padding:12px 18px;' +
      'border-top:1px solid #DEE2E6;background:#FBFBFB;border-radius:0 0 6px 6px}' +
    '.pnd-btn{font:inherit;font-weight:500;font-size:12.5px;border-radius:4px;padding:8px 16px;cursor:pointer;' +
      'text-decoration:none;border:1px solid #714B67;background:#714B67;color:#fff;display:inline-flex;align-items:center}' +
    '.pnd-btn:hover{background:#5C3D54;border-color:#5C3D54;color:#fff}' +
    '.pnd-btn-ghost{background:#fff;border-color:#CFCFCF;color:#4C4C4C}' +
    '.pnd-btn-ghost:hover{background:#F4F1F5;border-color:#714B67;color:#714B67}' +
    '.pnd-cerrar{position:absolute;top:10px;right:12px;background:transparent;border:none;color:#6C757D;' +
      'font-size:18px;line-height:1;cursor:pointer;padding:4px}' +
    '.pnd-cerrar:hover{color:#1F1F1F}' +
    '@media (max-width:420px){.pnd-acciones{justify-content:stretch}.pnd-acciones .pnd-btn{flex:1;justify-content:center}}';

  function ponerEstilos() {
    if (document.getElementById('pnd-css')) return;
    var st = document.createElement('style');
    st.id = 'pnd-css';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  /* ---------- sonido ---------- */
  var audio = null;
  var audioRoto = false;

  function sonidoSintetico() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      var ctx = new AC();
      var t = ctx.currentTime;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(680, t);
      osc.frequency.exponentialRampToValueAtTime(240, t + 0.28);
      osc.frequency.exponentialRampToValueAtTime(520, t + 0.5);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.32, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.62);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.65);
    } catch (e) { /* sin sonido */ }
  }

  function sonar() {
    if (audioRoto) { sonidoSintetico(); return; }
    if (!audio) {
      audio = new Audio(SONIDO_SRC);
      audio.preload = 'auto';
      audio.addEventListener('error', function () { audioRoto = true; });
    }
    try {
      audio.currentTime = 0;
      var p = audio.play();
      if (p && p.catch) {
        p.catch(function () {
          if (audioRoto) sonidoSintetico();
          else esperarGesto();
        });
      }
    } catch (e) {
      sonidoSintetico();
    }
  }

  // Si el navegador bloquea el audio por no haber interacción previa,
  // se reproduce en el primer clic o tecla del visitante.
  var esperando = false;
  function esperarGesto() {
    if (esperando) return;
    esperando = true;
    var una = function () {
      esperando = false;
      document.removeEventListener('pointerdown', una, true);
      document.removeEventListener('keydown', una, true);
      sonar();
    };
    document.addEventListener('pointerdown', una, true);
    document.addEventListener('keydown', una, true);
  }

  /* ---------- pop up ---------- */
  var overlay = null;

  function cerrar() {
    if (!overlay) return;
    overlay.classList.remove('pnd-on');
    var o = overlay;
    overlay = null;
    setTimeout(function () { if (o && o.parentNode) o.parentNode.removeChild(o); }, 200);
    document.removeEventListener('keydown', alTeclado);
  }

  function alTeclado(e) { if (e.key === 'Escape') cerrar(); }

  function mostrar(destino) {
    ponerEstilos();
    cerrar();

    overlay = document.createElement('div');
    overlay.className = 'pnd-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    var box = document.createElement('div');
    box.className = 'pnd-box';

    var head = document.createElement('div');
    head.className = 'pnd-head';
    var h3 = document.createElement('h3');
    h3.textContent = TITULO;
    head.appendChild(h3);

    var cerrarBtn = document.createElement('button');
    cerrarBtn.className = 'pnd-cerrar';
    cerrarBtn.type = 'button';
    cerrarBtn.setAttribute('aria-label', 'Cerrar');
    cerrarBtn.textContent = '\u2715';

    var body = document.createElement('div');
    body.className = 'pnd-body';

    var emoji = document.createElement('div');
    emoji.className = 'pnd-emoji';
    emoji.textContent = '\ud83d\udee0\ufe0f';

    var txt = document.createElement('div');
    txt.className = 'pnd-txt';
    var p = document.createElement('p');
    p.textContent = MENSAJE + ' ';
    var dots = document.createElement('span');
    dots.className = 'pnd-dots';
    p.appendChild(dots);
    var badge = document.createElement('span');
    badge.className = 'pnd-badge';
    badge.textContent = 'En preparación';
    txt.appendChild(p);
    txt.appendChild(badge);

    body.appendChild(emoji);
    body.appendChild(txt);

    var acciones = document.createElement('div');
    acciones.className = 'pnd-acciones';

    if (destino) {
      var ver = document.createElement('a');
      ver.className = 'pnd-btn pnd-btn-ghost';
      ver.href = destino;
      ver.textContent = 'Entrar igual';
      acciones.appendChild(ver);
    }

    var ok = document.createElement('button');
    ok.className = 'pnd-btn';
    ok.type = 'button';
    ok.textContent = 'Entendido';
    acciones.appendChild(ok);

    box.appendChild(cerrarBtn);
    box.appendChild(head);
    box.appendChild(body);
    box.appendChild(acciones);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    requestAnimationFrame(function () { if (overlay) overlay.classList.add('pnd-on'); });
    ok.focus();

    cerrarBtn.addEventListener('click', cerrar);
    ok.addEventListener('click', cerrar);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) cerrar(); });
    document.addEventListener('keydown', alTeclado);

    sonar();
  }

  /* ---------- enganches ---------- */
  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('[data-pendiente]') : null;
    if (!el) return;
    e.preventDefault();
    mostrar(el.getAttribute('data-pendiente-href') || null);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var el = e.target && e.target.closest ? e.target.closest('[data-pendiente]') : null;
    if (!el) return;
    e.preventDefault();
    mostrar(el.getAttribute('data-pendiente-href') || null);
  });

  function arrancar() {
    if (document.body && document.body.hasAttribute('data-pendiente-auto')) mostrar(null);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar);
  else arrancar();

  window.Pendiente = { mostrar: mostrar, cerrar: cerrar };
})();
