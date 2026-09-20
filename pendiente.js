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
      'padding:20px;background:rgba(2,6,23,.72);backdrop-filter:blur(3px);opacity:0;transition:opacity .18s ease}' +
    '.pnd-overlay.pnd-on{opacity:1}' +
    '.pnd-box{position:relative;max-width:420px;width:100%;text-align:center;border-radius:20px;padding:34px 26px 28px;' +
      'background:#1e293b;color:#e2e8f0;border:1px solid rgba(255,255,255,.1);' +
      'box-shadow:0 24px 60px rgba(0,0,0,.55);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;' +
      'transform:translateY(14px) scale(.96);transition:transform .22s cubic-bezier(.2,.9,.3,1.2)}' +
    '.pnd-overlay.pnd-on .pnd-box{transform:none}' +
    '.pnd-emoji{font-size:52px;line-height:1;display:block;animation:pnd-bob 1.6s ease-in-out infinite}' +
    '@keyframes pnd-bob{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-8px) rotate(4deg)}}' +
    '.pnd-box h3{margin:14px 0 8px;font-size:21px;line-height:1.2;' +
      'background:linear-gradient(90deg,#38bdf8,#f472b6);-webkit-background-clip:text;background-clip:text;color:transparent}' +
    '.pnd-box p{margin:0;color:#94a3b8;font-size:15px;line-height:1.5}' +
    '.pnd-dots::after{content:"";animation:pnd-dots 1.4s steps(4,end) infinite}' +
    '@keyframes pnd-dots{0%{content:""}25%{content:" ."}50%{content:" . ."}75%{content:" . . ."}100%{content:" . . . ."}}' +
    '.pnd-acciones{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:22px}' +
    '.pnd-btn{font:inherit;font-weight:700;font-size:14px;border-radius:999px;padding:11px 22px;cursor:pointer;' +
      'text-decoration:none;border:none;background:linear-gradient(135deg,#38bdf8,#f472b6);color:#0f172a;' +
      'transition:transform .15s ease,filter .15s ease}' +
    '.pnd-btn:hover{transform:translateY(-2px);filter:brightness(1.07)}' +
    '.pnd-btn-ghost{background:transparent;border:1px solid #94a3b8;color:#94a3b8}' +
    '.pnd-btn-ghost:hover{border-color:#38bdf8;color:#38bdf8}' +
    '.pnd-cerrar{position:absolute;top:12px;right:14px;background:transparent;border:none;color:#94a3b8;' +
      'font-size:20px;line-height:1;cursor:pointer}' +
    '.pnd-cerrar:hover{color:#e2e8f0}' +
    '.pnd-badge{display:inline-block;margin-top:6px;font-size:11px;font-weight:800;letter-spacing:.08em;' +
      'text-transform:uppercase;color:#94a3b8;border:1px solid #94a3b8;border-radius:999px;padding:2px 10px}';

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

    var cerrarBtn = document.createElement('button');
    cerrarBtn.className = 'pnd-cerrar';
    cerrarBtn.type = 'button';
    cerrarBtn.setAttribute('aria-label', 'Cerrar');
    cerrarBtn.textContent = '✕';

    var emoji = document.createElement('span');
    emoji.className = 'pnd-emoji';
    emoji.textContent = '🛠️';

    var h3 = document.createElement('h3');
    h3.textContent = TITULO;

    var p = document.createElement('p');
    p.textContent = MENSAJE + ' ';
    var dots = document.createElement('span');
    dots.className = 'pnd-dots';
    p.appendChild(dots);

    var badge = document.createElement('span');
    badge.className = 'pnd-badge';
    badge.textContent = 'En preparación';

    var acciones = document.createElement('div');
    acciones.className = 'pnd-acciones';

    var ok = document.createElement('button');
    ok.className = 'pnd-btn';
    ok.type = 'button';
    ok.textContent = 'Entendido';
    acciones.appendChild(ok);

    if (destino) {
      var ver = document.createElement('a');
      ver.className = 'pnd-btn pnd-btn-ghost';
      ver.href = destino;
      ver.textContent = 'Entrar igual';
      acciones.appendChild(ver);
    }

    box.appendChild(cerrarBtn);
    box.appendChild(emoji);
    box.appendChild(h3);
    box.appendChild(p);
    box.appendChild(badge);
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
