# 02 · Reglas, modos y formato de compartir

Este documento es la especificación funcional. El código del motor (`src/juego/`) debe poder probarse solo con lo que dice aquí.

## Reglas comunes

- 6 intentos por modo y por día.
- Un intento inválido (palabra que no existe, municipio que no está en la lista) **no gasta intento**: se avisa y la fila tiembla (sin temblor si hay `prefers-reduced-motion`).
- El progreso del día se guarda tras cada intento; si el jugador recarga, sigue donde iba.
- Al ganar o perder se muestra: la respuesta, el dato curioso o significado (si aplica), la fuente, las estadísticas y el botón Compartir.
- El día cambia a las 00:00 de Colombia. Se muestra la cuenta regresiva al próximo reto.

### Número del reto

```
numero = días completos entre FECHA_INICIO y hoy (ambas en America/Bogota) + 1
```

- `FECHA_INICIO` es una constante en `src/config.ts`. Se fija el día del lanzamiento (aún sin definir).
- "Hoy en Colombia" se calcula con `Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' })` para obtener `AAAA-MM-DD`, nunca con la hora local del dispositivo. Colombia no tiene horario de verano.
- Si `numero` supera el largo del calendario, el juego vuelve a empezar el ciclo (`(numero - 1) % largo`) y se muestra un aviso en consola para recordar ampliar el contenido. Nunca debe romperse.

## Normalización de texto

Se aplica igual a respuestas e intentos:

1. Mayúsculas (`toLocaleUpperCase('es-CO')`).
2. Quitar tildes y diéresis: `Á→A, É→E, Í→I, Ó→O, Ú→U, Ü→U`.
3. **La Ñ se conserva** como letra propia (el teclado la tiene).
4. Para municipios: además se quitan espacios, guiones y puntos al comparar (`"San Andrés de Tumaco"` y `"san andres de tumaco"` son iguales). Se muestra siempre el nombre oficial con tildes.

La respuesta se guarda con su forma correcta (ej. `ÁRBOL`) para mostrarla al final; la comparación usa la forma normalizada (`ARBOL`).

## Modo Palabra

- Palabras de **5 letras** (después de normalizar; la Ñ cuenta como una).
- Un intento es válido si está en `palabras-validas.txt` o en la lista de respuestas.
- Colores por letra (algoritmo de dos pasadas para letras repetidas):

```
entrada: respuesta R[0..4], intento I[0..4]
resultado = [ausente × 5]
pendientes = conteo de letras de R
pasada 1: para i en 0..4, si I[i] == R[i]: resultado[i] = correcta; pendientes[I[i]] -= 1
pasada 2: para i en 0..4, si resultado[i] != correcta y pendientes[I[i]] > 0:
              resultado[i] = presente; pendientes[I[i]] -= 1
```

Casos que deben tener prueba unitaria: respuesta `CASAS` e intento `SALSA`; respuesta `PERRO` e intento `RORRO`; letra repetida en el intento pero única en la respuesta; Ñ vs N (son distintas).

- El teclado en pantalla colorea cada tecla con el mejor estado visto (correcta > presente > ausente).
- **Modo difícil** (opcional, interruptor en ajustes): las letras correctas deben quedarse en su sitio y las presentes deben usarse. Sale en la versión 1 solo si sobra tiempo.

## Modo Municipio

- Se escribe el nombre y aparece un **autocompletado** con los municipios que coinciden (nombre + departamento, porque hay nombres repetidos, ej. varios "San Pedro" o "Albania"). Solo se puede enviar una opción de la lista.
- La identidad de cada municipio es su **código DIVIPOLA** (`cod_mpio`, 5 dígitos), nunca el nombre.
- Por cada intento se muestra:
  - Nombre y departamento.
  - **Distancia** en km a la respuesta (fórmula de haversine con radio 6371 km sobre `latitud`/`longitud` de DIVIPOLA, redondeada a km).
  - **Dirección** hacia la respuesta en 8 rumbos (N, NE, E, SE, S, SO, O, NO) con flecha. En EN: N, NE, E, SE, S, SW, W, NW.
  - **Cercanía** en %: `max(0, 100 − distancia / DISTANCIA_MAX × 100)`, con `DISTANCIA_MAX` = la mayor distancia posible entre dos municipios de la lista (se calcula en el script de datos y se guarda en el JSON).
  - Indicador "mismo departamento" (sí/no).
- Respuestas posibles: una **lista curada** de municipios reconocibles (empieza con las capitales de departamento y se amplía). Intentos aceptados: todos los de la lista de municipios.
- Qué cuenta como municipio jugable: filas de DIVIPOLA con `tipo_municipio` = "Municipio" o "Isla". Las "Área no municipalizada" quedan fuera de las respuestas (sí se pueden aceptar como intento: **decisión pendiente**, por defecto fuera).
- Supuesto a verificar: las coordenadas de DIVIPOLA son un punto de referencia (probablemente la cabecera), no el centro del territorio. La interfaz dice "distancia aproximada entre cabeceras" hasta confirmarlo.

## Modo Dicho

- Se muestra un dicho colombiano con **una palabra oculta** como casillas vacías, ej.:
  `Al que madruga, ___ lo ayuda` (ejemplo de formato, el contenido real sale de `dichos.json`).
- Se adivina esa palabra con las mismas reglas de colores del modo Palabra; el largo es el de la palabra oculta (entre 4 y 8 letras).
- Intento válido: cualquier palabra del mismo largo que esté en `palabras-validas.txt` (lista general de todos los largos) o la propia respuesta.
- Pista opcional después del 3.er intento: botón "Ver pista" que muestra la región o el sentido general del dicho. Usarla queda marcado en la cuadrícula con 💡.
- Al terminar se ve el dicho completo, su significado en ES y EN (escrito con palabras propias, no copiado de un diccionario) y la fuente.

## Formato de compartir

Reglas: sin spoilers (nunca letras, nombres ni distancias exactas), corto, y que se vea bien en WhatsApp.

Ejemplo con los tres modos (los números son de ejemplo):

```
Atínele #12 🇨🇴
🔤 Palabra 4/6
⬛🟨⬛⬛⬛
⬛🟩🟨⬛⬛
🟩🟩⬛🟩⬛
🟩🟩🟩🟩🟩
📍 Municipio 3/6
🟨⬛⬛⬛⬛ ↗️
🟩🟩🟩🟨⬛ ⬅️
🟩🟩🟩🟩🟩 📍
💬 Dicho X/6 💡
…
atinele.vercel.app
```

- Cada modo se puede compartir solo, o los tres juntos (botón "Compartir todo" cuando ya terminó los tres).
- `X/6` = perdió.
- Municipio: 5 cuadros que representan la cercanía (cada 🟩 = 20 %, 🟨 = la fracción que sobra ≥ 10 %), seguidos de la flecha de dirección. Al acertar: 🟩🟩🟩🟩🟩 📍.
- **Alto contraste** activado: 🟩 → 🟧 y 🟨 → 🟦 (igual que en la interfaz).
- Modo oscuro no cambia los emojis: el cuadro de "ausente" es siempre ⬛ (se ve en WhatsApp claro y oscuro).
- El enlace va al final en una línea propia para que WhatsApp genere la vista previa con la imagen Open Graph.
- La URL definitiva depende del nombre y del dominio de Vercel (pendiente).

### Cómo se comparte

1. Si `navigator.share` existe (celular): menú nativo del sistema con el texto.
2. Si no: `navigator.clipboard.writeText` y aviso "Resultado copiado / Result copied" en una región `aria-live`.
3. Botón aparte "WhatsApp": abre `https://wa.me/?text=<texto codificado con encodeURIComponent>`.
4. Si el portapapeles falla (permisos, navegador viejo): se muestra el texto en un `<textarea>` seleccionado para copiar a mano.

## Estadísticas

Por modo, en `localStorage`:

- Jugadas, ganadas, % de victorias, racha actual, mejor racha.
- Distribución de intentos (1 a 6) en barras, con la del día resaltada.
- La racha se rompe si un día no se completa el modo (perder también la rompe).
- Botón "Borrar mis datos" con confirmación.
