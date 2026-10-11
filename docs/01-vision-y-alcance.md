# 01 · Visión y alcance

## Qué es

Un juego diario al estilo Wordle con tema colombiano. Cada día hay **tres retos cortos**, iguales para todo el mundo:

| Modo | Qué se adivina | Pista que da el juego |
|---|---|---|
| **Palabra** | Una palabra de 5 letras (español general o colombianismo) | Colores por letra, como Wordle |
| **Municipio** | Un municipio de Colombia | Distancia en km, dirección (flecha) y si es del mismo departamento |
| **Dicho** | La palabra que falta en un dicho colombiano | Colores por letra; al final se muestra el dicho completo y qué significa |

Al terminar, el jugador copia una **cuadrícula de emojis sin spoilers** para pegarla en WhatsApp (o compartir directo con el menú del celular).

> **Decisión tomada por defecto (cambiable):** los tres modos salen cada día. La idea original decía "una palabra, un municipio o un dicho"; si Jairo prefiere **un solo reto que rota** (lunes palabra, martes municipio…), el motor sirve igual y solo cambia el calendario (ver [07-plan-de-trabajo.md](07-plan-de-trabajo.md#decisiones-pendientes)).

## Por qué este proyecto en el portafolio

- Muestra **frontend de producto**: un juego pulido, rápido, accesible y mobile-first, algo que no cubren la API (B), la Sala (D), el Radar (Q) ni MiTiendaW (BQ).
- Reutiliza **datos abiertos oficiales** (DIVIPOLA del DANE), coherente con el resto del portafolio.
- El formato de compartir genera tráfico orgánico: cada resultado pegado en WhatsApp lleva el enlace.
- Se construye en pocos días porque no necesita backend.

## Nombre

"Wordle" es una marca del New York Times, así que **no va en el nombre visible** ni en el dominio. Propuestas (elige Jairo):

| Opción | ES | EN (subtítulo) | Nota |
|---|---|---|---|
| **Atínele** *(nombre de trabajo)* | Atínele | Guess it, Colombian style | "Atinarle" = acertar; suposición: se entiende en todo el país, confirmar |
| Adivina, parce | Adivina, parce | Guess it, mate | Muy coloquial |
| La del día | La del día | Today's one | Neutro, menos memorable |

Mientras Jairo decide, la documentación usa **Atínele** y el repo `atinele` (el hilo del proyecto se llama "Wordle colombiano").

## Público

- Colombianos (y la diáspora) que juegan desde el celular, casi siempre desde un enlace de WhatsApp.
- Reclutadores que llegan desde LinkedIn o el portafolio y quieren ver calidad de frontend en 30 segundos.

## Dentro del alcance (versión 1)

- Tres modos diarios con 6 intentos cada uno.
- Reto del día calculado con la fecha de **Colombia (America/Bogota, UTC−5)**; cambia a medianoche hora colombiana.
- Compartir: Web Share API en celular, copiar al portapapeles como respaldo, botón "Enviar por WhatsApp" (`https://wa.me/?text=…`, sin número).
- Estadísticas y racha guardadas solo en el navegador (`localStorage`).
- Interfaz ES/EN (los retos en sí son en español; la interfaz, las instrucciones y el significado del dicho tienen versión EN).
- Modo claro/oscuro (sigue al sistema), modo de alto contraste para daltonismo, animaciones apagables.
- Página "Fuentes y licencias" con cada fuente citada.
- Despliegue estático en Vercel (plan Hobby gratis), CI en GitHub Actions.

## Fuera del alcance (versión 1)

- Cuentas, inicio de sesión, ranking global o backend.
- Cookies o analítica que identifique personas. Si se quiere medir visitas, Vercel Web Analytics (sin cookies) es opcional y se decide después.
- Modo "jugar días anteriores" (archivo). Queda como mejora.
- App instalable (PWA offline). Queda como mejora.
- Ocultar las respuestas de forma segura: es un sitio estático, quien abra las herramientas de desarrollo puede verlas. Solo se ofuscan para evitar spoilers accidentales.

## Cómo se mide que salió bien

- Se juega completo en un celular de 360 px sin zoom ni scroll horizontal.
- axe: 0 incumplimientos WCAG 2.1 AA en claro/oscuro, ES/EN, 390 y 1280 px (mismo criterio que el portafolio).
- Lighthouse móvil ≥ 95 en rendimiento, accesibilidad, buenas prácticas y SEO (objetivo, no promesa).
- Bundle JS inicial < 60 kB gzip (objetivo; los datos de municipios van aparte y se cargan solo en ese modo).
- La cuadrícula copiada se ve bien pegada en WhatsApp de Android, iOS y WhatsApp Web (prueba manual).
- 0 datos inventados: cada municipio sale de DIVIPOLA y cada dicho tiene fuente o está marcado como pendiente y **no** entra al calendario.
