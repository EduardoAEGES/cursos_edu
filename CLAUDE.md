# cursos_edu

Repositorio de materiales de clase de Eduardo. Sitio estático: GitHub Pages
publica los archivos de la raíz en `eduardoaeges.github.io/cursos_edu/`.

## Regla principal: todo va a `main`

**Siempre trabajar y publicar en `main`.** Nada se ve en la web hasta que el
cambio está en `main`: la página se sirve desde esa rama. No dejar el trabajo
en una rama aparte ni esperar a que alguien fusione un pull request.

Al terminar un cambio: `commit` y `git push origin main`. Si la rama local se
quedó atrás, traer `origin/main` antes de empujar.

## Cómo se arman las clases

Las sesiones interactivas se hacen copiando la estructura de
`pl-semana-2-reforzamiento.html` y cambiando solo el contenido: `ACT` (las
actividades), `D` (las diapositivas), `CLAVES`, `LS` y la `sala` de
`Aula.iniciar`. El detalle está en la habilidad
`.claude/skills/crear-sesion-reforzamiento`.

Compartido por todas las páginas: `odoo.css`, `aula.css`, `aula.js`,
`reiniciar.js`, `calculadora.js`.

## Las dos marcas

El repositorio sirve a dos instituciones y cada curso lleva la suya.

- **Thomas Jefferson** (Costos y Presupuestos, Investigación Cuantitativa,
  Matemáticas Aplicadas): rojo `#E31E24` y gris `#505050`, logo
  `marca/logo-tj.png`, personajes `personajes/tj-*.webp`. No lleva
  `pl-certus.css` ni `pl-certus.js`, que son de la plantilla Certus.
- **Certus** (Pensamiento Lógico): azul `#071767` y fucsia `#FC0045`, logo
  `marca/certus-azul.png`. El pie «Elaborado por el equipo académico de
  CERTUS» es solo de ese curso.

## Antes de dar por terminada una clase

1. Cada clave de `CLAVES` existe en `ACT` y aparece en alguna diapositiva.
2. `node --check` del script inline.
3. Probarla en el navegador: entrar como alumno y como docente, resolver una
   actividad de cada tipo y revisar que ninguna lámina quede con scroll.
4. Cambiar `<meta name="version">`, la `sala`, `LS` y los `?v=` de los scripts.
5. Enlazarla desde la página del curso.
