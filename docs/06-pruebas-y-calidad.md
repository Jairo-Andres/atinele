# 06 · Pruebas y calidad

## Unitarias (Vitest) — `tests/unit/`

Objetivo: 100 % de líneas en `src/juego/` (es lógica pura y pequeña).

| Módulo | Casos mínimos |
|---|---|
| `normalizar` | tildes y diéresis se quitan; Ñ se conserva; espacios y guiones en municipios; mayúsculas con `es-CO` |
| `evaluar` | todos correctos; ninguno; letras repetidas (`CASAS`/`SALSA`, `PERRO`/`RORRO`); Ñ ≠ N; largo distinto lanza error |
| `geo` | distancia 0 al mismo punto; Bogotá–Medellín en un rango razonable usando las coordenadas reales de `municipios.json`; los 8 rumbos; cercanía entre 0 y 100 |
| `dia` | cambio de día a las 00:00 de Bogotá aunque el dispositivo esté en otra zona (simular con `vi.setSystemTime` y `TZ=Asia/Tokyo` y `TZ=America/Los_Angeles`); día 1 = `FECHA_INICIO`; ciclo cuando se acaba el calendario |
| `calendario` | ofuscar → desofuscar devuelve lo mismo; el reto de una fecha fija es siempre el mismo |
| `compartir` | texto exacto para ganado / perdido / con pista / alto contraste / los tres modos; sin letras ni nombres en el texto |
| `estadisticas` | racha sube, se rompe al saltar un día o perder, mejor racha, distribución |
| `almacen` | funciona cuando `localStorage` lanza error; migración de versión |

## Contenido — `npm run validar`

Ver [03-contenido-y-fuentes.md](03-contenido-y-fuentes.md#validación-npm-run-validar). Corre en CI en cada push.

## End-to-end (Playwright) — `tests/e2e/`

Se fija la fecha con `page.clock` y se usa un calendario de prueba (`data/contenido/calendario.test.json`) para conocer las respuestas.

- Ganar Palabra con teclado físico y con teclado en pantalla.
- Intento inválido no gasta intento.
- Perder Palabra (6 intentos) y ver la respuesta.
- Municipio: autocompletado con teclado, distancia y flecha visibles, ganar.
- Dicho: pista marcada en el texto compartido.
- Recargar a mitad de partida conserva el progreso.
- Cambio de idioma ES ↔ EN cambia textos y `lang`.
- Compartir copia el texto esperado al portapapeles (permiso `clipboard-read` en Chromium).
- Con `reducedMotion: 'reduce'` no hay animaciones que bloqueen.
- Viewports: 360, 390 y 1280 px; claro y oscuro.

## Accesibilidad automática

`@axe-core/playwright` con etiquetas `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` en: inicio, cada modo con una partida a medias, diálogo de resultado, Cómo jugar, Ajustes y Fuentes, en claro/oscuro y ES/EN. Criterio: **0 incumplimientos**.

Lo que axe no cubre se prueba a mano antes de publicar (lista en el README):

- NVDA + Firefox o Chrome en Windows; TalkBack + Chrome en Android.
- Zoom al 200 % y 400 % (reflow a 320 px).
- Pegado del resultado en WhatsApp Android, iOS (si hay quien pruebe) y WhatsApp Web.

## Rendimiento

- Lighthouse CI (`@lhci/cli`) en GitHub Actions contra el build local (`vite preview`), perfil móvil. Umbrales objetivo: 95 en las cuatro categorías; empieza como aviso y se vuelve obligatorio cuando se estabilice.
- Presupuesto: JS inicial < 60 kB gzip, CSS < 20 kB gzip.

## CI — `.github/workflows/ci.yml`

En cada push y pull request:

1. `npm ci`
2. `npm run lint` y `npm run typecheck`
3. `npm run validar`
4. `npm run test` (Vitest con cobertura)
5. `npm run build`
6. `npx playwright test` (Chromium; las pruebas de axe van aquí)
7. Lighthouse CI (aviso)

El workflow no despliega: Vercel publica solo desde su integración con GitHub.

Workflow opcional semanal (`divipola.yml`): vuelve a descargar DIVIPOLA y, si cambió, abre un PR con el diff para revisarlo a mano. Solo una petición al portal por semana.
