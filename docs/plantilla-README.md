# Atínele 🇨🇴

> Plantilla del README del repo. Lo que está entre `<…>` se llena al publicar.

**ES** · Juego diario inspirado en Wordle con tema colombiano: cada día una palabra, un municipio y un dicho por adivinar. Al terminar copias una cuadrícula de emojis sin spoilers para pegarla en WhatsApp.

**EN** · A daily Wordle-inspired game with a Colombian twist: every day there is a word, a town and a saying to guess. When you finish, you copy a spoiler-free emoji grid to paste into WhatsApp.

🔗 **Jugar / Play:** <https://atinele.vercel.app>
🗺️ Parte del portafolio de Jairo Sierra (línea F · Frontend) / Part of Jairo Sierra's portfolio: https://web-portal-eight-tau.vercel.app

---

## Qué muestra este proyecto / What this project shows

- Juego estático, mobile-first y accesible (WCAG 2.1 AA, 0 incumplimientos en axe). / Static, mobile-first, accessible game.
- Datos abiertos oficiales: municipios y coordenadas de DIVIPOLA (DANE). / Official open data.
- Lógica probada con Vitest, e2e y accesibilidad con Playwright + axe, CI en GitHub Actions. / Tested logic, e2e and a11y in CI.

## Cómo funciona / How it works

- El reto del día se calcula en el navegador con la fecha de Colombia (America/Bogota); no hay servidor. / The daily challenge is computed in the browser from the Colombian date; there is no server.
- Estadísticas y racha se guardan solo en tu navegador. Sin cookies ni cuentas. / Stats live only in your browser. No cookies, no accounts.

## Desarrollo local / Local development

```bash
npm ci
npm run dev        # http://localhost:5173
npm run test       # pruebas unitarias / unit tests
npm run validar    # valida el contenido / validates content
npx playwright test
npm run build      # genera dist/ / builds dist/
```

Actualizar municipios / Update towns (necesita acceso a datos.gov.co / needs access to datos.gov.co):

```bash
node scripts/descargar-divipola.mjs
```

## Despliegue / Deployment

1. Push a `main` en GitHub. / Push to `main`.
2. Vercel (plan Hobby gratis) publica solo: preset **Vite**, build `npm run build`, salida `dist`. / Vercel deploys automatically.
3. Para empezar el conteo de retos en otra fecha, cambia `FECHA_INICIO` en `src/config.ts`. / Change `FECHA_INICIO` to restart the challenge count.

## Qué revisar si algo se cae / Troubleshooting

| Síntoma / Symptom | Qué revisar / What to check |
|---|---|
| El sitio no carga / Site is down | Estado del último deploy en Vercel (*Deployments*). Si el build falló, el error está en el log; el sitio anterior sigue publicado. / Check the latest Vercel deploy. |
| Todos ven el mismo reto de ayer / Everyone sees yesterday's challenge | Caché del navegador o del CDN: recarga forzada. El cambio es a las 00:00 de Colombia, no a la hora local. / Hard refresh; the day changes at midnight Colombia time. |
| "No está en la lista" con una palabra correcta / Valid word rejected | Falta en `palabras-validas.txt`; agrégala y vuelve a correr `npm run validar`. / Add it to the valid list. |
| El modo Municipio no carga / Town mode does not load | `municipios.json` no se publicó o cambió de ruta; revisa la pestaña Red del navegador. / Check the Network tab. |
| CI en rojo por `validar` / CI red on `validar` | Un dicho o palabra marcado `listo` sin fuente, o el calendario apunta a algo pendiente. / A ready item without a source. |
| Se acabó el calendario / Calendar ran out | El juego repite el ciclo; agrega contenido y corre `node scripts/generar-calendario.mjs` (añade al final, no reordena). / Add content; the game loops meanwhile. |
| El descargador de DIVIPOLA falla / DIVIPOLA script fails | datos.gov.co caído o cambió columnas (`cod_mpio`, `nom_mpio`, `latitud`, `longitud`…). El sitio no se afecta: usa el JSON guardado. / The site keeps using the saved JSON. |
| Las fuentes se ven distintas / Fonts look different | Google Fonts bloqueado; se usa la fuente de respaldo. / Fallback font in use. |

## Fuentes y licencias / Sources and licenses

- Municipios: DANE, *DIVIPOLA - Códigos municipios*, datos.gov.co `gdxc-w37w`, CC BY-SA 4.0. Descargado el <fecha>. El archivo derivado `data/contenido/municipios.json` se comparte bajo la misma licencia.
- Palabras válidas: diccionario es_CO del proyecto RLA-ES, <licencia confirmada>.
- Dichos: lista propia; cada dicho cita su fuente en `data/contenido/dichos.json` y en la página Fuentes del sitio.
- Código: <MIT>.
- Inspirado en Wordle (marca de The New York Times Company); este proyecto no está afiliado. / Inspired by Wordle; not affiliated.

## Contacto / Contact

[linkedin.com/in/jairo-andres31-analyst](https://www.linkedin.com/in/jairo-andres31-analyst)
