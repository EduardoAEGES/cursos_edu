---
name: crear-sesion-reforzamiento
description: Crear una sesión de clase interactiva (diapositivas con actividades, aula en vivo, código de 4 dígitos, práctica libre, avisos del alumno, elegir diapositivas, reporte Excel/PDF y diseño Certus) a partir de la sesión de Reforzamiento de Pensamiento Lógico. Usar al pedir una nueva sesión, semana o clase del curso.
---

# Crear una sesión de clase (modelo: Reforzamiento)

Modelo de referencia: `pl-semana-2-reforzamiento.html`. Copiar su estructura y cambiar solo el contenido.

## 1. Estructura de la página

- Un solo HTML con `<style>` propio, `<script src="aula.js?v=...">`, `<script src="reiniciar.js">`, `<script src="calculadora.js">` y un `<script>` inline con IIFE.
- Cabecera de marca (`.marca`), zona `#puerta` ("Entra a la sala"), `#mazo` (escenario de diapositivas), `#anclaMuro` (muro del docente).
- Al final de `<head>`: `<link rel="stylesheet" href="pl-certus.css?v=...">`. Antes de `</body>`: `<script src="pl-certus.js?v=...">`.
- Cambiar siempre `<meta name="version">` y los `?v=` de los scripts al editar, para que las pestañas abiertas se recarguen.
- Versión de `aula.js` compartida: si cambia, subir el `?v=` en todas las páginas.

## 2. Datos de las diapositivas

- `ACT = { clave: {tipo, titulo, ...} }`: las actividades. Claves cortas únicas.
- `D = [ { et, t, claves:[...], lado:1?, h:"html", pdf:"html" } ]`: las diapositivas. `et` es la etiqueta de la cabecera, `t` el título, `h` la teoría, `pdf` la versión para imprimir (sin actividades). `lado:1` parte la lámina en teoría | actividad.
- `CLAVES = [...]`: todas las claves en el orden de las diapositivas. Lo usan el avance, el reporte y el filtro de diapositivas.
- `LS = 'pl_xxx_v1'`: clave de guardado local. Cambiarla si cambia la estructura.

### Tipos de actividad (`vista()`)

| tipo | qué es | uso |
|---|---|---|
| `quiz` | pregunta + opciones, con `ok` y `pq` (explicación) | preguntas simples y "¿qué regla aplico?" |
| `par` | arrastrar ficha a hueco (`fichas`, `huecos`) | emparejar, ordenar pasos |
| `arr` / `cuadro` | arrastrar a cajas / cuadro contable | clasificar |
| `tabla` | tabla con `ops` (menú) o `e` (número) por celda, `ok` | completar líneas (3), (4), (5) de una derivación |
| `arma` | constructor: arrastrar letras/frases y negar con `~`/`no` (`vars`, `regla`, `ok`) | contraposición |
| `cal` | respuesta numérica con tolerancia | hallar x |
| `cruz` | crucigrama | repaso |
| `hoja` | mini hoja de cálculo tipo Excel | cálculos |
| `sel` / `opi` | selección por línea / opinión sin corrección | casos |

Cada actividad acepta `fin` (HTML que aparece al resolverla). Los `tabla` con `ops` usan `ok` (índice correcto) y `pq` (explicación).

## 3. Diapositivas: contenido y diseño

- Empezar con teoría breve (`.teo-def`, `.props` con p/q, `.tabenv`) y luego la actividad.
- Derivaciones: `.deriv` con `.ln`, `.nn`, `.ff`, `.oo`, `.jj` (ley y líneas, p. ej. `MTT, 1, 3`).
- Recursos de la plantilla Certus en `marca/iconos/*.png`, `marca/fondo-ondas.webp`, `personajes/*.webp`.
- La letra ya crece 15 % (`pl-certus.css`). No poner textos de menos de 16 px dentro de la lámina.
- No dejar espacios vacíos: `pl-certus.js` coloca tarjetas "Recuerda" o "Tip de clase" según el hueco. Para tarjetas propias, editar `R['archivo']` en ese script.
- El pie "Elaborado por el equipo académico de CERTUS: Luis, Mirko y Eduardo" es solo de Pensamiento Lógico; otros cursos no lo llevan.

## 4. Aula en vivo (`Aula.iniciar`)

Opciones usadas:

- `sala:'PLR2'`: identificador de la sesión en la base; cambiarlo para cada clase.
- `codigo:'PL'`, `clave:'LOGICO'`: clave del docente.
- `simple:true`: el alumno no escribe DNI.
- `pin:true`: el docente crea un código de 4 dígitos al entrar; el alumno entra con ese código. Sin código, "Practicar sin código" (solo práctica, nada se guarda).
- `resumen`, `ventana`, `pantalla`: lo que el alumno publica y cómo lo ve el docente (lámina y respuestas en vivo).
- `diapos`, `seleccion`, `alElegir`: elegir qué diapositivas se presentan hoy; la selección viaja con la batuta.
- `actividades`: nombre y puntos de cada actividad para el reporte.
- `musica:true`: música de fondo solo para el docente, volumen inicial 4 %.
- `batuta`: modo guiado (todos en la lámina del docente) o libre.

Lo que ya trae el aula: manito "Listo" (1 min) y "Duda" (2 min), mensajes de hasta 140 caracteres (1 min o hasta que el docente los quite), botón para apagar los comentarios, "Bajar mano" del docente, pantalla en vivo del alumno, toast con pitido.

Las páginas no escriben nada en el repositorio. Los datos van a la tabla `sala_asientos` de Supabase.

## 5. Reporte del docente

- "Descargar Excel" (ExcelJS, con respaldo a CSV): hojas Resumen, Por actividad y Actividades, con porcentajes y colores por nivel (Completó, Avanzado 80–99 %, En proceso 50–79 %, Inicio 1–49 %, Sin empezar).
- "Ver reporte para imprimir": página A4 con los mismos datos.
- Requiere que `resumen` publique `ok`, `total`, `lamina`, `titulo` y `rejilla` por actividad.

## 6. Lista de verificación antes de entregar

1. Cada clave de `CLAVES` existe en `ACT` y aparece en alguna `D[i].claves`.
2. Cada `tabla` tiene un `ok` válido y las justificaciones son solo las leyes que se enseñan (MPP, MTT).
3. `node --check` al script inline y a `aula.js`.
4. Prueba en navegador: cargar la página, entrar con código, aplicar selección de diapositivas, enviar un aviso desde el alumno y verlo en el docente, descargar el Excel y el reporte para imprimir.
5. Revisar que no quede contenido escondido: las láminas no deben tener scroll ni huecos grandes.
6. Cambiar `sala`, `LS`, versiones `?v=` y `<title>`.

## 7. Errores frecuentes

- Olvidar una clave en `CLAVES`: el avance y el reporte no cuentan esa actividad.
- Cambiar `LS` sin migrar: el avance guardado en el equipo se pierde.
- Usar `D.length` en vez de `vis().length` en código nuevo: no respeta las diapositivas elegidas.
- Poner respuestas sin `pq` o con justificaciones que no son MPP ni MTT en la práctica de derivaciones.
