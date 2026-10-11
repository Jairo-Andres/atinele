# Wordle colombiano · Documentación (v0.1, 2026-10-11)

Documentación para desarrollar el juego diario colombiano (nombre de trabajo **Atínele**). Todavía no hay código.

| Documento | Para qué sirve |
|---|---|
| [01-vision-y-alcance.md](01-vision-y-alcance.md) | Qué es, para quién, qué entra y qué no en la versión 1, nombre |
| [02-reglas-y-modos.md](02-reglas-y-modos.md) | Reglas de los tres modos, algoritmo de colores, cálculo del día, formato de compartir |
| [03-contenido-y-fuentes.md](03-contenido-y-fuentes.md) | Fuentes oficiales verificadas, formato de los JSON, curaduría de dichos, calendario |
| [04-arquitectura.md](04-arquitectura.md) | Stack, estructura del repo, estado local, despliegue en Vercel, integración con el portafolio |
| [05-diseno-y-accesibilidad.md](05-diseno-y-accesibilidad.md) | Identidad "Rutas + Cota", colores de fichas con contraste medido, línea F del portafolio, textos ES/EN |
| [06-pruebas-y-calidad.md](06-pruebas-y-calidad.md) | Pruebas unitarias, e2e, axe, Lighthouse y CI |
| [07-plan-de-trabajo.md](07-plan-de-trabajo.md) | Fases, decisiones pendientes con su valor por defecto y riesgos |
| [plantilla-README.md](plantilla-README.md) | README bilingüe del repo, con despliegue y "qué revisar si algo se cae" |

## Resumen en 5 líneas

1. Tres retos diarios (Palabra de 5 letras, Municipio con distancia y flecha, palabra oculta de un Dicho), 6 intentos cada uno.
2. Sitio estático (Vite + TypeScript) en Vercel gratis; el reto sale de la fecha de Colombia, sin servidor.
3. Municipios de DIVIPOLA del DANE (datos.gov.co `gdxc-w37w`, CC BY-SA 4.0); dichos solo con fuente citada.
4. Identidad "Rutas + Cota" sin modificar; propuesta de **línea F · Frontend, morada**, en el mapa del portafolio.
5. Compartir sin spoilers por WhatsApp, Web Share o portapapeles; accesible con teclado y lector de pantalla.

Convenciones: lo marcado como *suposición* o *pendiente* está por confirmar; ningún dato del juego se escribe de memoria.
