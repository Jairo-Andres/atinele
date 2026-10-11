# 04 · Arquitectura técnica

## Decisión principal

Sitio **100 % estático**: no hay servidor, base de datos ni API. El reto del día se calcula en el navegador a partir de la fecha y de un calendario que viene en el build. Así cuesta 0, no se duerme como Render y no hay nada que se caiga salvo Vercel.

## Stack

| Pieza | Elección | Por qué |
|---|---|---|
| Build | **Vite** + **TypeScript** | Rápido, el mismo build que la Sala; salida estática |
| Interfaz | TypeScript sin framework (DOM + plantillas pequeñas) | Bundle mínimo; el juego tiene pocas vistas. Si se prefiere Preact (~4 kB), cabe en el mismo diseño |
| Estilos | CSS plano con `tokens.css` y `components.css` de la identidad "Rutas + Cota" sin modificarlos, más `src/estilos/juego.css` | Igual que el portafolio y el Radar |
| Pruebas unitarias | **Vitest** | Motor del juego, fechas, normalización, compartir |
| Pruebas e2e | **Playwright** + **@axe-core/playwright** | Lo mismo que se usó en el Radar |
| Calidad | ESLint + Prettier + `tsc --noEmit` | |
| CI | GitHub Actions | Gratis en repos públicos |
| Hosting | **Vercel** Hobby, preset Vite (o "Other" con `npm run build` y salida `dist/`) | Autodeploy al hacer push a `main`, como la Sala |

Node 22 LTS (o la LTS vigente al empezar).

## Estructura del repo

```
atinele/
├─ index.html
├─ vercel.json
├─ package.json
├─ src/
│  ├─ main.ts                 arranque, router por pestañas (#palabra, #municipio, #dicho)
│  ├─ config.ts               FECHA_INICIO, URL pública, nombre
│  ├─ juego/                  lógica pura, sin DOM (100 % probada)
│  │  ├─ normalizar.ts
│  │  ├─ evaluar.ts           colores de letras (dos pasadas)
│  │  ├─ geo.ts               haversine, rumbo, cercanía
│  │  ├─ dia.ts               fecha de Colombia y número del reto
│  │  ├─ calendario.ts        reto del día desde el calendario ofuscado
│  │  ├─ compartir.ts         texto de la cuadrícula
│  │  └─ estadisticas.ts
│  ├─ modos/                  estado y vista de cada modo
│  │  ├─ palabra.ts
│  │  ├─ municipio.ts         carga municipios.json con import() dinámico
│  │  └─ dicho.ts
│  ├─ ui/                     tablero, teclado, autocompletado, diálogos, avisos
│  ├─ almacen.ts              envoltorio de localStorage con try/catch y versión
│  ├─ i18n/ es.json, en.json
│  └─ estilos/ tokens.css, components.css (copias sin modificar), juego.css
├─ public/                    favicon-jas/*, og.png, robots.txt
├─ data/
│  ├─ contenido/              JSON del juego (ver 03)
│  ├─ esquemas/               JSON Schema
│  └─ LICENCIAS.md
├─ scripts/                   descargar-divipola, generar-validas, generar-calendario, validar
├─ tests/ unit/, e2e/
└─ .github/workflows/ci.yml
```

## Flujo de datos

```
datos.gov.co ──(script, PC de Jairo o Actions)──▶ data/contenido/municipios.json
RLA-ES es_CO ──(script)──────────────────────────▶ data/contenido/palabras-validas.txt
curaduría (Jairo + Claude) ───────────────────────▶ palabras-respuestas.json, dichos.json, respuestas-municipio.json
generar-calendario ───────────────────────────────▶ calendario.json ──(build, ofuscado)──▶ dist/
navegador: fecha Colombia → número del reto → retos del día → juego → localStorage
```

- La lista de palabras válidas puede pesar cientos de kB: se sirve como archivo aparte y se carga **después** de pintar el tablero (el primer intento espera si aún no llegó). Se puede comprimir agrupando por largo.
- `municipios.json` (~1122 filas, estimado < 100 kB sin comprimir) se carga solo al abrir el modo Municipio.

## Estado en el navegador

Clave única versionada: `atinele:v1`.

```json
{
  "ajustes": { "tema": "sistema", "altoContraste": false, "dificil": false, "idioma": "es" },
  "partidas": { "AAAA-MM-DD": { "palabra": { "intentos": [], "estado": "jugando" }, "municipio": {}, "dicho": {} } },
  "estadisticas": { "palabra": { "jugadas": 0, "ganadas": 0, "racha": 0, "mejorRacha": 0, "distribucion": [0,0,0,0,0,0], "ultimoDia": null } }
}
```

- Solo se guardan las partidas de los últimos 7 días (las viejas se borran al arrancar).
- Toda lectura/escritura va en `try/catch`: en navegación privada o con almacenamiento bloqueado el juego funciona igual, solo no recuerda.
- Si cambia el formato, se sube a `v2` con una migración simple; nunca se borra la racha sin avisar.

## Idiomas

- Idioma inicial: el del navegador (`navigator.language` empieza por `es` → ES, si no → EN); se puede cambiar con un botón y se recuerda.
- `<html lang>` cambia con el idioma. Los retos (palabras, dichos, nombres de municipios) siempre en español; en EN la interfaz explica que el juego es en español.
- Todos los textos visibles en `i18n/*.json`; ninguno escrito directo en el HTML salvo el contenido inicial sin JS.

## Sin JavaScript

`index.html` trae un `<noscript>` en ES/EN que explica que el juego necesita JavaScript, con enlace a Fuentes y al portafolio.

## Seguridad y privacidad

- Sin cookies, sin cuentas, sin datos personales. El README lo dice.
- Cabeceras en `vercel.json`: `Content-Security-Policy` (solo `self` + Google Fonts), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` sin cámara/micrófono/ubicación.
- Nada de correo ni teléfono en el repo ni en el sitio; contacto solo `linkedin.com/in/jairo-andres31-analyst`.

## Despliegue

1. Jairo crea el repo en GitHub con GitHub Desktop y hace push (Claude no hace push ni deploy).
2. En Vercel: *Add New → Project* → importar el repo → preset **Vite** (build `npm run build`, salida `dist`).
3. Cada push a `main` publica solo.
4. Imagen Open Graph fija (`public/og.png`, 1200×630) para que WhatsApp muestre la vista previa.

`vite.config.ts` usa `base: './'` para que el sitio funcione también detrás de un rewrite del portafolio (ej. `/juego/`), igual que la Sala.

## Integración con el portafolio central

Ver [05-diseno-y-accesibilidad.md](05-diseno-y-accesibilidad.md#nueva-línea-en-el-mapa-del-portafolio). En `portafolio/vercel.json` se añadiría:

```json
{ "source": "/juego", "destination": "/juego/", "permanent": false }
{ "source": "/juego/", "destination": "https://<url-del-juego>.vercel.app/" }
{ "source": "/juego/:path*", "destination": "https://<url-del-juego>.vercel.app/:path*" }
```

(El primero va en `redirects` y los otros dos en `rewrites`, igual que ya están `/sala` y `/radar`.)
