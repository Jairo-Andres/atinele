# 05 · Diseño y accesibilidad

## Identidad

Se usa la identidad común **"Rutas + Cota"** tal cual, desde `/mnt/project-files/identidad-visual/fase-2/`:

- `tokens.css` y `components.css` copiados **sin modificar** a `src/estilos/`. Todo lo propio del juego va en `juego.css` usando las variables de los tokens.
- Favicon y logos de `favicon-jas/` y `marca/` (monograma JAS, nombre visible "Jairo Sierra" en el pie).
- Tipografías: Atkinson Hyperlegible (cuerpo y fichas), Overpass 800/900 (título), Atkinson Hyperlegible Mono (números y contador).
- Textura de curvas de nivel (`--texture-topo`) de fondo en la cabecera, muy suave.

## Nueva línea en el mapa del portafolio

En el portafolio cada proyecto es una línea de metro: **B** Backend (azul), **D** Datos (amarillo), **Q** QA (rosa) y **BQ** MiTiendaW (verde, `--status-good`). Propuesta para este proyecto:

- **Línea F · Frontend** (en EN también "F · Frontend"), porque lo que muestra es producto e interfaz.
- Color: **morado** tomado de la paleta de gráficos ya validada: `--chart-4` = `#4A3AA7` en claro y `#9085E9` en oscuro.
  - Texto blanco sobre `#4A3AA7`: 8.56:1. Texto grafito `#1A1D21` sobre `#9085E9`: 5.41:1. Ambos pasan AA.
  - Es distinto de B, D, Q y BQ, así que no choca en el mapa.
- En el portafolio se definiría como `--route-f` / `--on-route-f` / `--ink-f` dentro de `portafolio/web/styles.css` (igual que se hizo con `--route-x` para MiTiendaW), sin tocar `tokens.css`.
- En el mapa: una 5.ª línea que cruza a la D (Datos) en una estación "Datos abiertos", porque el modo Municipio usa DIVIPOLA. Estaciones de la línea: *Palabra · Municipio · Dicho · Compartir*.
- En el juego mismo, el morado aparece solo como acento de marca (bullet "F" en el pie y en "Acerca de"), nunca en las fichas, para no confundirse con los colores de estado.
- Pendiente: el portafolio ya tiene 5 pestañas que no caben en celular; este proyecto entra como **tarjeta y enlace**, no como pestaña nueva, hasta resolver eso.

## Colores de las fichas

Se apoyan en los colores de estado de los tokens y siguen la regla de la identidad: **estado = forma + texto + color**, nunca solo color.

| Estado | Claro (fondo / texto) | Oscuro (fondo / texto) | Marca de forma | Texto para lector |
|---|---|---|---|---|
| Correcta | `--status-good` #1A7F37 / blanco (5.08:1) | #3FB950 / grafito (6.66:1) | ● círculo en la esquina | "correcta en su lugar" |
| Presente | `--route-d` #F2B705 / grafito (9.3:1) + borde `--ink-d` | #F2B705 / grafito | ▲ triángulo | "está, en otro lugar" |
| Ausente | `--color-fg-muted` #5C636B / blanco (6.08:1) | #3A3F45 / `--color-fg` (9.57:1) + borde `--color-border-strong` | ■ cuadrado | "no está" |
| Vacía | fondo `--color-bg`, borde `--color-border-strong` | igual | — | "vacía" |

- El amarillo sobre blanco solo da 1.82:1 como superficie; por eso la ficha presente lleva **borde `--ink-d`** (6.32:1) para cumplir el 3:1 de componentes no textuales.
- El gris oscuro de "ausente" en modo oscuro se distingue del fondo por el borde y la forma, no por el relleno.
- **Alto contraste** (interruptor): correcta → naranja `--chart-6` (#EB6834 claro / #D95926 oscuro, texto grafito) y presente → azul `--route-b` (#1959D1, texto blanco / #7FA8FF oscuro, texto grafito). Las formas se mantienen. Las letras de las fichas son grandes y en negrita (texto grande WCAG, mínimo 3:1); todas las parejas de arriba superan 4.35:1.
- Contrastes calculados con la fórmula WCAG 2.1 sobre los valores de `paleta.json`; volver a medir si cambian los tokens.

## Pantallas

Mobile-first, diseñado a 360 px y probado a 390 y 1280 px.

1. **Cabecera**: nombre del juego, número del reto, botones (?) Cómo jugar, (📊) Estadísticas, (⚙) Ajustes, ES/EN. Todos con nombre accesible y área táctil ≥ 44 px (`--tap-min`).
2. **Pestañas de modo**: Palabra · Municipio · Dicho, con ✓ cuando ese modo ya se jugó hoy. Son `role="tablist"` con flechas de teclado.
3. **Tablero**: 6 filas. Palabra y Dicho: fichas de letras. Municipio: filas con nombre, departamento, km, flecha y % de cercanía (en celular la fila se apila en dos líneas).
4. **Teclado en pantalla** (Palabra y Dicho): QWERTY español con Ñ, Enviar y Borrar en la última fila. También funciona el teclado físico.
5. **Campo con autocompletado** (Municipio): patrón *combobox* de WAI-ARIA (`role="combobox"`, `aria-expanded`, `aria-activedescendant`, lista `role="listbox"`), máximo 8 sugerencias, flechas para moverse, Enter para elegir.
6. **Diálogo de resultado**: respuesta, significado/fuente, estadísticas, cuenta regresiva, Compartir / WhatsApp / Copiar.
7. **Cómo jugar** (se abre solo la primera vez), **Ajustes**, **Fuentes y licencias**, **Acerca de** (quién lo hizo, enlace al portafolio y a LinkedIn).

Diálogos con `<dialog>` nativo: foco atrapado, Esc cierra, el foco vuelve al botón que lo abrió.

## Movimiento

- Volteo de fichas al revelar (escalonado), rebote al ganar, temblor en intento inválido.
- Todos con las duraciones de los tokens (`--duration-*`), que bajan a 0 con `prefers-reduced-motion`. En ese caso el resultado aparece de una vez.
- Nada de WebGL. Un detalle 3D sencillo es opcional (volteo con `transform: rotateX`), apagable igual.

## Accesibilidad (WCAG 2.1 AA como mínimo)

- Cada ficha revelada tiene texto accesible, ej. "A, correcta en su lugar". Al enviar un intento, una región `aria-live="polite"` lee el resultado de la fila completa una sola vez.
- El juego entero se puede jugar solo con teclado y con lector de pantalla (NVDA en Windows y TalkBack en Android como prueba manual).
- Foco visible con `--color-focus` en todos los controles.
- Zoom al 200 % y texto agrandado sin perder funciones ni tener scroll horizontal (WCAG 1.4.10 y 1.4.4).
- El teclado en pantalla no se roba el foco del teclado físico ni del lector.
- Los emojis de la cuadrícula compartida son para pegar fuera; dentro del sitio, la vista previa del texto compartido tiene una descripción alternativa ("Palabra: acertada en 4 de 6 intentos").
- Idioma marcado (`lang="es"` / `lang="en"`); las palabras en español dentro de la interfaz EN llevan `lang="es"`.

## Textos visibles (muestra ES/EN)

| Clave | ES | EN |
|---|---|---|
| `titulo` | Atínele | Atínele |
| `subtitulo` | La palabra, el municipio y el dicho del día | Today's word, town and Colombian saying |
| `modo.palabra` | Palabra | Word |
| `modo.municipio` | Municipio | Town |
| `modo.dicho` | Dicho | Saying |
| `invalida` | No está en la lista | Not in the word list |
| `ganaste` | ¡Le atinó! | Nailed it! |
| `perdiste` | Hoy no fue. La respuesta era: | Not today. The answer was: |
| `copiado` | Resultado copiado | Result copied |
| `proximo` | Próximo reto en | Next challenge in |
| `distancia` | Distancia aproximada entre cabeceras | Approximate distance between town centers |
| `soloEspanol` | — | The challenges are in Spanish; the interface is in English. |

El nombre y los textos finales los revisa Jairo.
