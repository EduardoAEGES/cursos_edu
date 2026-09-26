/* ==================================================================
   Ruta del curso — recorrido por carretera
   Monta la ruta a partir de un bloque JSON dentro de la página:

     <div class="ruta-monta" data-ls="clave" data-meta="texto de llegada">
       <script type="application/json">
         [ { "t":"Título", "d":"resumen", "ico":"tabla",
             "p":["punto uno","punto dos"], "href":"#destino", "enlace":"Ir a la sesión" } ]
       </script>
     </div>

   data-ls  clave con la que se recuerda el avance en el navegador
   data-meta  frase de llegada al final del recorrido (opcional)
   ================================================================== */
(function(){
  var ICONOS={
    flujo:'<path d="M4 9a8 8 0 0 1 14-4"/><path d="M18 3v4h-4"/><path d="M20 15a8 8 0 0 1-14 4"/><path d="M6 21v-4h4"/>',
    ajuste:'<path d="M4 7h10"/><path d="M18 7h2"/><circle cx="16" cy="7" r="2"/><path d="M4 17h6"/><path d="M14 17h6"/><circle cx="12" cy="17" r="2"/>',
    desvio:'<path d="M12 21V10"/><path d="M12 10 6 5"/><path d="M12 14l6-5"/><circle cx="12" cy="7" r="1.6"/>',
    balanza:'<path d="M12 4v16"/><path d="M6 20h12"/><path d="M4 8h16"/><path d="M4 8l-2 6a4 4 0 0 0 4 0z"/><path d="M20 8l2 6a4 4 0 0 1-4 0z"/>',
    barras:'<path d="M4 4v16h16"/><rect x="7" y="12" width="3" height="5"/><rect x="12" y="8" width="3" height="9"/><rect x="17" y="5" width="3" height="12"/>',
    capas:'<path d="M12 3 3 8l9 5 9-5z"/><path d="m3 13 9 5 9-5"/>',
    columnas:'<path d="M3 21h18"/><path d="m12 3 8 5H4z"/><path d="M7 11v7M12 11v7M17 11v7"/>',
    enlace:'<path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"/>',
    carpeta:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    nota:'<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-8"/><path d="M8 8h6M8 12h6M8 16h4"/><path d="m17 3 4 4-4 4-4 1 1-4z"/>',
    tabla:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 9v11M3 14h18"/>',
    pincel:'<path d="M4 20c2 1 5 0 5-3 0-1.5-1-2.5-2.5-2.5S4 15.5 4 17z"/><path d="M9 15 19 5a2 2 0 0 0-3-3L6 12"/>',
    formula:'<path d="M6 20c2 0 3-1 3-4V8c0-3 1-4 3-4"/><path d="M6 12h6"/><path d="m14 12 6 8M20 12l-6 8"/>',
    bifurca:'<path d="M6 3v6a4 4 0 0 0 4 4h8"/><path d="m15 10 3 3-3 3"/><path d="M6 13v8"/>',
    filtro:'<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
    engranaje:'<circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
    libro:'<path d="M4 4h7a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5H4z"/><path d="M20 4h-3a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2.5H20z"/>',
    carrito:'<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M3 4h2l2.6 11.4A2 2 0 0 0 9.5 17h8a2 2 0 0 0 2-1.6L21 8H6"/>',
    edificio:'<path d="M4 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16"/><path d="M15 10h3a2 2 0 0 1 2 2v9"/><path d="M8 7h3M8 11h3M8 15h3"/><path d="M3 21h18"/>',
    megafono:'<path d="M4 10v4a1 1 0 0 0 1 1h3l6 4V5L8 9H5a1 1 0 0 0-1 1z"/><path d="M18 9a4 4 0 0 1 0 6"/>',
    camion:'<path d="M3 6h10v10H3z"/><path d="M13 9h4l4 4v3h-8z"/><circle cx="7" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/>',
    factura:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
    ticket:'<path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H5a2 2 0 0 1-2-2 2 2 0 0 0 0-4z"/><path d="M9 6v10"/>',
    pila:'<rect x="3" y="14" width="18" height="6" rx="1"/><path d="M5 11h14M7 8h10"/>',
    personas:'<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 6a3 3 0 0 1 0 6"/><path d="M17 20a6 6 0 0 0-3-5"/>',
    dinero:'<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 10v4M18 10v4"/>',
    almacen:'<path d="m3 9 9-5 9 5v11H3z"/><path d="M9 20v-6h6v6"/>',
    llave:'<circle cx="8" cy="15" r="4"/><path d="m11 12 8-8 2 2-2 2 2 2-2 2-2-2-2 2"/>'
  };

  function svg(nombre){
    var d=ICONOS[nombre];
    if(!d) return '';
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" '+
           'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+d+'</svg>';
  }

  var CARRO='<svg viewBox="0 0 40 64" aria-hidden="true">'+
    '<rect x="2" y="13" width="6" height="12" rx="2" fill="#23272E"/>'+
    '<rect x="32" y="13" width="6" height="12" rx="2" fill="#23272E"/>'+
    '<rect x="2" y="39" width="6" height="12" rx="2" fill="#23272E"/>'+
    '<rect x="32" y="39" width="6" height="12" rx="2" fill="#23272E"/>'+
    '<rect x="6" y="4" width="28" height="56" rx="11" fill="#E8833A"/>'+
    '<rect x="11" y="12" width="18" height="9" rx="3" fill="#BCD9E6"/>'+
    '<rect x="9" y="25" width="22" height="14" rx="4" fill="#D0722A"/>'+
    '<path d="M11 43h18a7 7 0 0 1-3 9H14a7 7 0 0 1-3-9z" fill="#BCD9E6"/>'+
    '<circle cx="12" cy="57" r="2.2" fill="#FFF0B8"/><circle cx="28" cy="57" r="2.2" fill="#FFF0B8"/></svg>';

  function montar(caja){
    var datos;
    try{ datos=JSON.parse(caja.querySelector('script[type="application/json"]').textContent); }
    catch(e){ return; }
    if(!datos || !datos.length) return;

    var LS=caja.getAttribute('data-ls') || 'ruta';
    var meta=caja.getAttribute('data-meta') || '';
    var ctx=null;

    function nota(f, dur, vol, tipo){
      try{
        var AC=window.AudioContext||window.webkitAudioContext;
        if(!AC) return;
        if(!ctx) ctx=new AC();
        if(ctx.state==='suspended') ctx.resume();
        var t=ctx.currentTime, o=ctx.createOscillator(), g=ctx.createGain();
        o.type=tipo||'sine'; o.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol, t+0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
        o.connect(g); g.connect(ctx.destination);
        o.start(t); o.stop(t+dur+0.02);
      }catch(e){}
    }
    function claxon(){ nota(520,0.12,0.07,'triangle'); setTimeout(function(){ nota(780,0.16,0.06,'triangle'); }, 90); }

    // ---- marcado ----
    var h='<div class="ruta-top">'+
      '<div class="ruta-barra"><span class="ruta-relleno"></span></div>'+
      '<span class="ruta-cuenta"></span>'+
      '<button class="o-btn o-btn-secondary ruta-todo" type="button">Abrir todas</button>'+
      '<button class="o-btn o-btn-secondary ruta-limpiar" type="button">Reiniciar</button>'+
      '</div><div class="ruta">'+
      '<div class="via" aria-hidden="true"><span class="bordes"></span><span class="rayas"></span>'+
      '<span class="hecho-tramo"></span><span class="meta"></span></div>'+
      '<div class="carro" aria-hidden="true">'+CARRO+'</div>';

    datos.forEach(function(p, i){
      var n=i+1, id=LS+'-det-'+n;
      h+='<article class="parada" data-n="'+n+'">'+
         '<span class="bandera"><small>Paso</small><b>'+n+'</b></span>'+
         '<div class="cartel"><button class="cartel-cab" type="button" aria-expanded="false" aria-controls="'+id+'">'+
         (p.ico ? '<span class="cartel-ico">'+svg(p.ico)+'</span>' : '')+
         '<span class="cartel-txt"><span class="rotulo">'+p.t+'</span>'+
         (p.d ? '<span class="sub">'+p.d+'</span>' : '')+'</span>'+
         '<span class="sello"></span><span class="flecha" aria-hidden="true">›</span></button>'+
         '<div class="cartel-det" id="'+id+'" hidden>';
      if(p.p && p.p.length){
        h+='<ul>';
        p.p.forEach(function(x){ h+='<li>'+x+'</li>'; });
        h+='</ul>';
      }
      if(p.href) h+='<p style="margin:12px 0 0"><a class="o-btn o-btn-teal" href="'+p.href+'">'+(p.enlace||'Ir a la sesión')+'</a></p>';
      h+='<label class="hecho"><input type="checkbox"><span>Marcar esta parada como recorrida</span></label>'+
         '</div></div></article>';
    });
    if(meta) h+='<p class="meta-final">'+meta+'</p>';
    h+='</div>';
    caja.innerHTML=h;

    var paradas=[].slice.call(caja.querySelectorAll('.parada'));
    var carro=caja.querySelector('.carro');
    var tramo=caja.querySelector('.hecho-tramo');

    function leer(){ try{ return JSON.parse(localStorage.getItem(LS)) || []; }catch(e){ return []; } }
    function guardar(v){ try{ localStorage.setItem(LS, JSON.stringify(v)); }catch(e){} }
    function centro(el){ return el.offsetTop + el.querySelector('.bandera').offsetTop + 20; }

    function pintar(){
      var vistas=leer(), sigue=-1;
      paradas.forEach(function(p, k){
        var n=+p.getAttribute('data-n'), esta=vistas.indexOf(n)>=0;
        p.classList.toggle('vista', esta);
        p.querySelector('.sello').textContent = esta ? '✓ Hecho' : '';
        p.querySelector('input').checked=esta;
        if(!esta && sigue<0) sigue=k;
      });
      paradas.forEach(function(p, k){ p.classList.toggle('sigue', k===sigue); });

      var n=vistas.length, total=paradas.length;
      caja.querySelector('.ruta-cuenta').textContent=n+' de '+total+' paradas';
      caja.querySelector('.ruta-relleno').style.width=(n/total*100)+'%';
      var destino=(sigue>=0) ? paradas[sigue] : paradas[paradas.length-1];
      var yy=Math.max(26, centro(destino) + (sigue<0 ? 46 : -34));
      carro.style.top=yy+'px';
      tramo.style.height=yy+'px';
    }

    paradas.forEach(function(p){
      var cab=p.querySelector('.cartel-cab'), det=p.querySelector('.cartel-det');
      cab.addEventListener('click', function(){
        var abierto=!det.hidden;
        det.hidden=abierto;
        p.classList.toggle('abierta', !abierto);
        cab.setAttribute('aria-expanded', String(!abierto));
        nota(abierto?520:780, 0.07, 0.05);
        setTimeout(pintar, 30);
      });
      var chk=p.querySelector('input');
      chk.addEventListener('change', function(){
        var n=+p.getAttribute('data-n'), v=leer(), i=v.indexOf(n);
        if(chk.checked && i<0) v.push(n);
        if(!chk.checked && i>=0) v.splice(i,1);
        guardar(v);
        if(chk.checked){
          p.classList.add('recien');
          setTimeout(function(){ p.classList.remove('recien'); }, 520);
          claxon();
        } else nota(400,0.09,0.05);
        pintar();
      });
    });

    caja.querySelector('.ruta-todo').addEventListener('click', function(){
      var abrir=paradas.some(function(p){ return p.querySelector('.cartel-det').hidden; });
      paradas.forEach(function(p){
        p.querySelector('.cartel-det').hidden=!abrir;
        p.classList.toggle('abierta', abrir);
        p.querySelector('.cartel-cab').setAttribute('aria-expanded', String(abrir));
      });
      this.textContent = abrir ? 'Cerrar todas' : 'Abrir todas';
      nota(abrir?780:520, 0.08, 0.05);
      setTimeout(pintar, 30);
    });
    caja.querySelector('.ruta-limpiar').addEventListener('click', function(){
      guardar([]); pintar(); nota(400, 0.1, 0.06);
    });

    if('IntersectionObserver' in window){
      var io=new IntersectionObserver(function(ent){
        ent.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('dentro'); io.unobserve(e.target); } });
      }, { rootMargin:'0px 0px -40px 0px', threshold:.12 });
      paradas.forEach(function(p){ io.observe(p); });
    } else paradas.forEach(function(p){ p.classList.add('dentro'); });

    window.addEventListener('resize', pintar);
    pintar();
  }

  [].slice.call(document.querySelectorAll('.ruta-monta')).forEach(montar);
})();
