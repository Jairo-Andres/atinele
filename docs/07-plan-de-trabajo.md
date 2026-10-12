# 07 · Plan de trabajo

Estimación: unos 5 días de trabajo efectivo para la versión 1 (suposición, depende sobre todo de la curaduría de dichos).

## Fase 0 · Decisiones de Jairo (antes de escribir código)

Ver [Decisiones pendientes](#decisiones-pendientes).

## Fase 1 · Base y modo Palabra (hecha 2026-10-11)

- [x] Crear el proyecto Vite + TS en `C:\Users\Acer\Documents\Proyectos Programacion\atinele` con ESLint, Prettier, Vitest y Playwright.
- [x] Copiar `tokens.css`, `components.css`, favicons y logos sin modificar.
- [x] `normalizar`, `evaluar`, `dia`, `calendario`, `compartir`, `estadisticas`, `almacen` con sus pruebas.
- [x] Script `generar-validas` (lista es_CO) tras confirmar la licencia de RLA-ES.
- [x] Tablero, teclado en pantalla y físico, diálogo de resultado, compartir.
- [x] Primeras 30 palabras respuesta para probar (luego hasta 365).

## Fase 2 · Modo Municipio (hecha 2026-10-12)

- [x] Script `descargar-divipola` (corre en el PC de Jairo o en Actions) y `municipios.json`.
- [x] `geo` con pruebas, autocompletado accesible, filas de pistas.
- [x] `respuestas-municipio.json` con capitales (códigos tomados de DIVIPOLA). Ojo: 25001 es Agua de Dios, no la capital de Cundinamarca; Bogotá (11001) la reemplaza.

## Fase 3 · Modo Dicho y contenido

- [ ] Esquema y validación de `dichos.json`.
- [ ] Lista inicial de dichos con fuente, en estado `pendiente`, para que Jairo la revise.
- [ ] Significados ES/EN escritos con palabras propias.
- [ ] `generar-calendario` con lo que esté `listo`.

## Fase 4 · Pulido, accesibilidad y publicación

- [ ] Alto contraste, modo oscuro, animaciones con reduced-motion.
- [ ] Pruebas e2e + axe en verde, pruebas manuales (lector de pantalla, zoom, WhatsApp).
- [ ] Página Fuentes y licencias, Acerca de, imagen Open Graph.
- [ ] README ES/EN completo (partiendo de [plantilla-README.md](plantilla-README.md)).
- [ ] Jairo sube con GitHub Desktop e importa en Vercel.
- [ ] Fijar `FECHA_INICIO` al día del lanzamiento.

## Fase 5 · Portafolio

- [ ] Línea F (morada) en el mapa del portafolio, tarjeta con enlaces a juego y repo, rewrite `/juego/`.
- [ ] Post de LinkedIn ES/EN **solo al final**, con todo el portafolio terminado (regla de Jairo).

## Decisiones pendientes

Cada una tiene un valor por defecto para no bloquear el trabajo:

| # | Pregunta | Por defecto |
|---|---|---|
| 1 | Nombre visible | **Atínele** (repo `atinele`) |
| 2 | ¿Tres retos cada día o uno que rota? | Tres cada día |
| 3 | ¿Áreas no municipalizadas se aceptan como intento en Municipio? | No |
| 4 | ¿Colombianismos en el modo Palabra o solo español general? | Mezcla, con la fuente citada para cada colombianismo |
| 5 | Interfaz con framework (Preact) o sin framework | Sin framework |
| 6 | Licencia del código | MIT (los datos de DIVIPOLA quedan CC BY-SA 4.0) |
| 7 | ¿Medir visitas con Vercel Web Analytics (sin cookies)? | No en la versión 1 |
| 8 | Fecha de lanzamiento (`FECHA_INICIO`) | Se fija al publicar |

## Riesgos

| Riesgo | Qué hacer |
|---|---|
| No hay suficientes dichos con fuente verificable | Lanzar con los que haya y repetir ciclo; el modo Dicho puede salir días alternos si hace falta |
| Licencia de la lista es_CO no compatible con lo que se quiere | Usar otra lista abierta de español con licencia clara, o aceptar como válida cualquier combinación de letras (peor experiencia) |
| datos.gov.co cambia columnas o se cae | El sitio no depende del portal: `municipios.json` vive en el repo; el script falla con un mensaje claro |
| Respuestas visibles en el código | Aceptado (sitio estático); ofuscación solo contra spoilers accidentales |
| Nombre con marca registrada | No usar "Wordle" en el nombre ni el dominio; en el README se dice "inspirado en Wordle" |
