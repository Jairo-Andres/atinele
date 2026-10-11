# 03 · Contenido, fuentes y licencias

Regla del proyecto: **no inventar datos**. Todo dato que se muestre tiene una fuente citada en la página "Fuentes y licencias"; lo que no tenga fuente queda con `estado: "pendiente"` y el script de validación impide que entre al calendario.

## Fuentes verificadas (consultadas el 2026-10-11)

| Uso | Fuente | Qué se verificó | Licencia |
|---|---|---|---|
| Municipios, departamentos y coordenadas | **DIVIPOLA - Códigos municipios**, DANE, publicado en datos.gov.co, id `gdxc-w37w` ([ficha](https://www.datos.gov.co/d/gdxc-w37w)) | 1122 filas; columnas `cod_dpto`, `dpto`, `cod_mpio`, `nom_mpio`, `tipo_municipio` (Municipio / Isla / Área no municipalizada), `longitud`, `latitud`; filas actualizadas por última vez el 2025-01-24 | CC BY-SA 4.0 (según los metadatos del portal) |
| Lista de palabras válidas (intentos) | Diccionario **es_CO** del proyecto RLA-ES ([github.com/sbosio/rla-es](https://github.com/sbosio/rla-es)), el que usa LibreOffice/Hunspell | Existe variante para Colombia; Arch Linux empaqueta `hunspell-es_co` 2.9 como LGPL-3.0-or-later | **Confirmar en el repo** antes de usarlo: el proyecto ha publicado bajo varias licencias (GPL/LGPL/MPL). Haya la que haya, se incluye el aviso de licencia en `data/LICENCIAS.md` |
| Respuestas del modo Palabra | Lista propia curada | — | Propia (las palabras sueltas no tienen derechos) |
| Dichos | Lista propia curada; cada dicho cita dónde está documentado | Ver criterios abajo | El significado se escribe con palabras propias |

Consecuencia de CC BY-SA 4.0 en DIVIPOLA: el JSON derivado (`municipios.json`) se publica con la misma licencia y con atribución al DANE. El código del juego puede llevar otra licencia (ej. MIT); se aclara en el README.

**Acceso a los datos:** el contenedor de Claude en la nube no llega a `www.datos.gov.co` desde la terminal. Los scripts de descarga se corren en el PC de Jairo o en GitHub Actions; el resultado se guarda en el repo para que el sitio no dependa del portal.

## Archivos de contenido

Todos en `data/contenido/` y validados con JSON Schema (`data/esquemas/`).

### `municipios.json` (generado por script, no se edita a mano)

```json
{
  "fuente": "DANE - DIVIPOLA, datos.gov.co gdxc-w37w, CC BY-SA 4.0",
  "descargado": "AAAA-MM-DD",
  "distanciaMaxKm": 0,
  "municipios": [
    { "cod": "05001", "nombre": "Medellín", "dpto": "Antioquia", "codDpto": "05", "tipo": "Municipio", "lat": 0, "lon": 0 }
  ]
}
```

(Los ceros son marcadores de posición del esquema, no datos.)

Script `scripts/descargar-divipola.mjs`:

1. Descarga `https://www.datos.gov.co/resource/gdxc-w37w.json?$limit=5000`.
2. Rellena códigos con ceros a la izquierda (5 dígitos municipio, 2 departamento) por si llegan como número.
3. Convierte `latitud`/`longitud` a número; falla si alguna fila no tiene coordenadas o queda fuera de la caja de Colombia (lat −4.3 a 13.5, lon −82 a −66.8, incluyendo San Andrés).
4. Revisa que no haya códigos repetidos y avisa si el total no es 1122 (no falla: el DANE puede actualizar).
5. Normaliza mayúsculas de los nombres solo si el portal los entrega todo en mayúsculas (revisarlo en la primera descarga y decidir).
6. Calcula `distanciaMaxKm` y escribe el archivo.

### `respuestas-municipio.json` (curado)

```json
[{ "cod": "05001", "estado": "listo" }]
```

Empieza con las 32 capitales de departamento + Bogotá D.C. (sus códigos salen de DIVIPOLA, no se escriben de memoria) y se amplía con municipios reconocidos. Para elegir "reconocidos" con datos y no a ojo, una fuente posible son las proyecciones de población del DANE por municipio (pendiente de buscar el dataset y su licencia).

### `palabras-respuestas.json` (curado)

```json
[{ "palabra": "AREPA", "tipo": "colombianismo", "fuente": "pendiente", "estado": "pendiente" }]
```

- `tipo`: `general` o `colombianismo`.
- Para `colombianismo`, `fuente` cita una entrada concreta (ej. "Diccionario de colombianismos, Instituto Caro y Cuervo, 2018, s. v. …" o el DLE con la marca *Col.*). Para `general` basta con que esté en la lista de válidas.
- Criterio: palabras conocidas, sin groserías, sin nombres propios, sin conjugaciones raras. Objetivo: al menos 365 listas antes de lanzar (un año sin repetir).
- `AREPA` arriba es solo un ejemplo del formato, con estado pendiente.

### `palabras-validas.txt` (generado)

Una palabra normalizada por línea, de 4 a 8 letras. Se genera expandiendo el diccionario es_CO con sus reglas de afijos (`unmunch` de Hunspell o la librería `nspell`/`dictionary-es-co` si existe con la misma fuente; comprobar). Se filtran palabras con caracteres que no están en el teclado. Se agregan siempre todas las respuestas, para que nunca se rechace la respuesta del día.

### `dichos.json` (curado)

```json
[{
  "id": "d001",
  "texto": "Texto completo del dicho",
  "oculta": "palabra",
  "significado": { "es": "…", "en": "…" },
  "pista": { "es": "…", "en": "…" },
  "region": "opcional",
  "fuente": "referencia concreta",
  "estado": "pendiente"
}]
```

Criterios para pasar un dicho a `estado: "listo"`:

1. Aparece documentado como de uso en Colombia en al menos una fuente citada (libro, diccionario o publicación institucional, con página o entrada). Fuentes candidatas para consultar: *Diccionario de colombianismos* del Instituto Caro y Cuervo (2018) y publicaciones de la Academia Colombiana de la Lengua. **Solo se cita y se consulta; no se copian definiciones.**
2. Si el dicho es panhispánico (se usa en muchos países), puede entrar, pero el texto no dice que sea "exclusivamente colombiano".
3. La palabra oculta tiene entre 4 y 8 letras, es la que da sentido al dicho y está en la lista de válidas.
4. El significado está escrito con palabras propias, en ES y EN.
5. Sin contenido ofensivo, sexista ni racista (hay dichos populares que lo son; se excluyen).

Jairo revisa la lista antes de que entre al calendario: es quien puede confirmar mejor cuáles se dicen de verdad.

### `calendario.json` (generado)

```json
{ "inicio": "AAAA-MM-DD", "dias": [{ "n": 1, "palabra": "…", "municipio": "05001", "dicho": "d001" }] }
```

- `scripts/generar-calendario.mjs` mezcla solo los elementos `listo` con una semilla fija (resultado reproducible) y evita repetir el mismo departamento dos días seguidos en Municipio.
- El calendario ya generado **no se reordena** al añadir contenido: lo nuevo se agrega al final, para no cambiar retos pasados ni romper rachas.
- En el build, el calendario se ofusca (ej. base64 + desplazamiento) para que no aparezcan respuestas al buscar texto. No es seguridad, solo evita spoilers accidentales.

## Validación (`npm run validar`)

Corre en CI y falla si:

- Un archivo no cumple su esquema.
- Hay una respuesta de Palabra que no tiene 5 letras normalizadas o un dicho cuya palabra oculta no aparece en el texto.
- Una entrada `listo` no tiene `fuente`.
- El calendario apunta a algo que no existe o que está `pendiente`.
- Un código de municipio del calendario no está en `municipios.json`.
- Quedan menos de 30 días de calendario desde hoy (aviso, no falla).

## Página "Fuentes y licencias"

Lista cada fuente con nombre, entidad, enlace, licencia y fecha de descarga, más la licencia del código. Texto en ES/EN.
