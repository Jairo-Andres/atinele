# Atínele 🇨🇴

**ES** · Juego diario colombiano inspirado en Wordle. Cada día hay una palabra de 5 letras y un municipio por adivinar en 6 intentos; al terminar copias una cuadrícula de emojis sin spoilers para pegarla en WhatsApp. Próximamente: el dicho del día.

**EN** · A daily Colombian game inspired by Wordle. Every day there is a 5-letter Spanish word and a Colombian town to guess in 6 tries; when you finish you copy a spoiler-free emoji grid to paste into WhatsApp. Coming soon: the saying of the day.

> Estado / Status: **fase 2** (modos Palabra y Municipio). Plan completo en [`docs/`](docs/README.md).

🔗 Jugar / Play: https://atinele.vercel.app
🗺️ Parte del portafolio de Jairo Sierra (línea F · Frontend) / Part of Jairo Sierra's portfolio: https://web-portal-eight-tau.vercel.app

---

## Qué muestra este proyecto / What this project shows

- **ES** · Juego estático, mobile-first y accesible: fichas con color + forma + texto, teclado en pantalla y físico, lector de pantalla, alto contraste para daltonismo y animaciones que se apagan con `prefers-reduced-motion`.
- **EN** · Static, mobile-first, accessible game: tiles with color + shape + text, on-screen and physical keyboard, screen-reader support, colorblind high-contrast mode and animations that turn off with `prefers-reduced-motion`.
- Motor probado con Vitest (cobertura > 95 %); e2e y accesibilidad (axe, WCAG 2.1 AA) con Playwright en claro/oscuro, ES/EN, 390 y 1280 px. / Engine tested with Vitest; e2e and axe checks with Playwright.
- Sin servidor, sin cookies, sin cuentas. / No server, no cookies, no accounts.

## Cómo funciona / How it works

- El reto del día sale de `data/contenido/calendario.json` según la fecha **de Colombia** (America/Bogota); cambia a medianoche hora colombiana. / The daily challenge comes from the calendar using the Colombian date.
- El calendario se sirve ofuscado en el build para evitar spoilers al buscar texto (no es seguridad: el sitio es estático). / The calendar is obfuscated in the bundle to avoid accidental spoilers.
- Las palabras válidas (`public/palabras/5.txt`) se cargan después de pintar el tablero. / Valid words load after the board is drawn.
- **Municipio**: escribes un municipio (con autocompletado accesible) y el juego dice a cuántos km está, hacia dónde (flecha) y qué tan cerca (%). La distancia es en línea recta entre los puntos que publica el DANE en DIVIPOLA (`public/datos/municipios.json`). Un mapa SVG hecho a mano (sin teselas ni librerías) muestra los departamentos, un punto por municipio, tus intentos y un círculo con la distancia del último; tocar un punto lo elige en el buscador. Las respuestas son las 32 capitales de departamento más Bogotá (`data/contenido/respuestas-municipio.json`). / **Town**: type a town and get distance, direction and proximity, from DANE's DIVIPOLA coordinates.
- Estadísticas y racha se guardan solo en el navegador (`localStorage`). / Stats live only in the browser.

## Desarrollo local / Local development

Requisitos / Requirements: Node 22 o superior / or newer.

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # pruebas unitarias con cobertura / unit tests with coverage
npm run municipios   # descarga DIVIPOLA del DANE / downloads DIVIPOLA (needs www.datos.gov.co)
npm run mapa         # regenera el contorno del mapa (Natural Earth) / rebuilds the map outline
npm run validar      # valida respuestas y calendario / validates content
npx playwright install chromium   # solo la primera vez / first time only
npm run test:e2e     # e2e + accesibilidad / e2e + accessibility
npm run build        # genera dist/ / builds dist/
```

### Contenido / Content

- Agregar palabras: edítalas en `data/contenido/palabras-respuestas.json` (mayúsculas, con tildes, `estado: "listo"` y `fuente`) y corre `npm run calendario`. El calendario solo agrega al final; nunca reordena días ya jugados. / Add words, then run `npm run calendario` (append-only).
- Fecha de inicio: `npm run calendario -- --inicio AAAA-MM-DD` cambia el día 1 (hazlo solo antes de publicar). / Changes day 1.
- Municipios: `npm run municipios` descarga DIVIPOLA desde datos.gov.co y escribe `public/datos/municipios.json` (nombres en tipo título, coordenadas del DANE). Si tu red no llega a datos.gov.co, usa _Actions → Municipios → Run workflow_ y descarga el artefacto. Revisa el diff antes del commit. / Download DIVIPOLA locally or with the manual workflow.
- Agregar respuestas de municipio: código DIVIPOLA de 5 dígitos en `data/contenido/respuestas-municipio.json` y `npm run calendario`. / Add town answers by DIVIPOLA code.
- Regenerar palabras válidas: en GitHub, _Actions → Palabras válidas → Run workflow_, descarga el artefacto y reemplaza `public/palabras/`. En Linux/WSL también: ver el comentario de `scripts/generar-validas.mjs`. / Regenerate valid words with the manual workflow.

## Despliegue / Deployment

1. Sube el repo a GitHub (rama `main`). / Push to GitHub.
2. En Vercel: _Add New → Project_, importa el repo. `vercel.json` ya define framework Vite, `npm run build` y salida `dist`. Plan Hobby gratis. / Import in Vercel; `vercel.json` already configures it.
3. Cada push a `main` publica solo. / Every push to `main` deploys.
4. Cuando Vercel asigne el dominio, actualiza `URL_PUBLICA` en `src/config.ts` (va en el texto compartido). / Update `URL_PUBLICA` once the domain is known.

`vite.config.ts` usa `base: './'`, así que también funciona detrás de un rewrite del portafolio (por ejemplo `/juego/`). / Works behind a portfolio rewrite.

## Qué revisar si algo se cae / Troubleshooting

| Síntoma / Symptom                                                        | Qué revisar / What to check                                                                                                                                                                                        |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| El sitio no carga / Site is down                                         | Último deploy en Vercel (_Deployments_). Si el build falló, el log dice por qué y sigue publicada la versión anterior. / Check the latest Vercel deploy.                                                           |
| CI en rojo / CI is red                                                   | Abre el job en _Actions_. Si fallan las e2e, descarga el artefacto `playwright-report`. / Download the `playwright-report` artifact.                                                                               |
| `npm run validar` falla / fails                                          | Una palabra `listo` sin fuente, repetida, sin 5 letras o que no está en `public/palabras/5.txt`, o el calendario apunta a algo que no existe. / A content rule is broken; the message says which.                  |
| "No está en la lista" con una palabra correcta / Valid word rejected     | Falta en `public/palabras/5.txt`; agrégala en orden y vuelve a validar. / Add it to the list.                                                                                                                      |
| "Cargando palabras…" no se quita / Never stops loading                   | `palabras/5.txt` no se publicó o lo bloquea la red: revisa la pestaña Red del navegador. / Check the Network tab.                                                                                                  |
| Todos ven el reto de ayer / Everyone sees yesterday's word               | El cambio es a las 00:00 de Colombia, no a la hora local. Si aun así no cambia, recarga sin caché. / The day changes at midnight Colombia time.                                                                    |
| Se acabó el calendario / Calendar ran out                                | El juego repite el ciclo y avisa en la consola. Agrega palabras y corre `npm run calendario`. / The game loops; add words.                                                                                         |
| "No se pudieron cargar los municipios" / Towns fail to load              | `public/datos/municipios.json` no está en el repo o no se publicó. Corre `npm run municipios`, haz commit del archivo y vuelve a desplegar. / The file is missing: generate it and commit it.                      |
| `npm run municipios` falla / fails                                       | datos.gov.co caído o bloqueado por tu red: usa el workflow _Municipios_. Si dice "coordenadas fuera de Colombia", el DANE cambió un dato: revisa la fila que indica. / Use the workflow or check the reported row. |
| El mapa no aparece / Map is missing                                      | `public/datos/mapa.json` no se publicó; el juego sigue funcionando con el buscador. Regenéralo con `npm run mapa` (usa `npx mapshaper`). / The game still works without it.                                        |
| Un municipio no aparece / A town is missing                              | Las áreas no municipalizadas no se pueden jugar. Si es un municipio nuevo, vuelve a descargar DIVIPOLA. / Non-municipal areas are excluded; re-download DIVIPOLA.                                                  |
| Las fuentes se ven distintas / Fonts look different                      | Google Fonts bloqueado; se usa la fuente de respaldo. / Fallback font in use.                                                                                                                                      |
| Un recurso aparece bloqueado en la consola / Resource blocked in console | La CSP de `vercel.json` no lo permite. La prueba e2e de CSP usa las mismas cabeceras. / The CSP in `vercel.json` blocks it.                                                                                        |

## Fuentes y licencias / Sources and licenses

- Código / Code: [MIT](LICENSE).
- Palabras válidas / Valid words: diccionario es_CO del proyecto [RLA-ES](https://github.com/sbosio/rla-es) (versión 2.8, `dictionary-es-co@2.0.0`), redistribuido bajo LGPL 3.0 o posterior. Detalles en [`data/LICENCIAS.md`](data/LICENCIAS.md).
- Municipios / Towns: DANE, _DIVIPOLA - Códigos municipios_ ([datos.gov.co `gdxc-w37w`](https://www.datos.gov.co/d/gdxc-w37w)), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). `public/datos/municipios.json` es una adaptación (nombres en tipo título) y se comparte bajo la misma licencia. / Adapted (title case), shared under the same license.
- Mapa / Map: [Natural Earth](https://www.naturalearthdata.com/) 1:10m v5.1.2, dominio público / public domain, simplificado con mapshaper (`public/datos/mapa.json`).
- Identidad visual "Rutas + Cota" (tokens, componentes, favicon JAS): copiada sin modificar del sistema de diseño del portafolio.
- Inspirado en Wordle, marca de The New York Times Company. Este proyecto no está afiliado. / Inspired by Wordle; not affiliated with The New York Times Company.

## Contacto / Contact

[linkedin.com/in/jairo-andres31-analyst](https://www.linkedin.com/in/jairo-andres31-analyst)
