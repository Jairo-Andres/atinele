# Licencias de los datos / Data licenses

## public/palabras/*.txt

**ES** · Listas de palabras válidas derivadas del diccionario **es_CO** del proyecto
RLA-ES (https://github.com/sbosio/rla-es), versión 2.8, empaquetado en npm como
`dictionary-es-co@2.0.0`. Se expandieron las formas con `unmunch` de Hunspell, se
pasaron a mayúsculas, se quitaron tildes (la Ñ se conserva) y se filtraron nombres
propios. El diccionario original se distribuye bajo un triple esquema de licencias
(GPL 3.0 o posterior, LGPL 3.0 o posterior, o MPL 1.1 o posterior); estas listas
derivadas se redistribuyen bajo **LGPL 3.0 o posterior**.

**EN** · Valid-word lists derived from the RLA-ES **es_CO** dictionary (version 2.8,
npm `dictionary-es-co@2.0.0`), expanded with Hunspell's `unmunch`, uppercased and
without accents (Ñ kept). The original is triple-licensed (GPL-3.0+, LGPL-3.0+ or
MPL-1.1+); these derived lists are redistributed under **LGPL-3.0-or-later**.

## data/contenido/palabras-respuestas.json

Lista propia. Cada palabra marcada `general` está en el diccionario es_CO; las
marcadas `colombianismo` citan su fuente en el campo `fuente`.
Own list. `general` words are in the es_CO dictionary; `colombianismo` words cite their source.

## public/datos/municipios.json

**ES** · Generado con `npm run municipios` a partir de DANE, _DIVIPOLA - Códigos
municipios_, publicado en datos.gov.co (conjunto `gdxc-w37w`) bajo
**CC BY-SA 4.0** (https://creativecommons.org/licenses/by-sa/4.0/). Cambios: nombres
de municipio y departamento pasados de MAYÚSCULAS a tipo título y coordenadas con
punto decimal. Esta adaptación se comparte bajo la misma licencia CC BY-SA 4.0.

**EN** · Generated with `npm run municipios` from DANE's _DIVIPOLA_ dataset
(datos.gov.co `gdxc-w37w`, **CC BY-SA 4.0**). Changes: names converted from
UPPERCASE to title case, decimal points in coordinates. This adaptation is shared
under the same CC BY-SA 4.0 license.

## public/datos/mapa.json

**ES** · Generado con `npm run mapa` a partir de Natural Earth 1:10m (Admin 0 y
Admin 1), versión 5.1.2, de **dominio público**
(https://www.naturalearthdata.com/about/terms-of-use/). Se simplificó con mapshaper
y se le asignó a cada departamento su código DIVIPOLA. Es un dibujo de referencia,
no un límite oficial.

**EN** · Generated with `npm run mapa` from Natural Earth 1:10m (Admin 0 and
Admin 1) v5.1.2, **public domain**. Simplified with mapshaper; each department got
its DIVIPOLA code. A reference drawing, not an official boundary.

## data/contenido/respuestas-municipio.json

Lista propia de códigos DIVIPOLA (capitales de departamento y Bogotá).
Own list of DIVIPOLA codes (department capitals and Bogotá).

## data/contenido/dichos.json

**ES** · Los dichos son de tradición oral colombiana. Cada uno se copió tal como
aparece en la publicación que cita en `fuente` (nombre y enlace) y se revisó contra
ella el 2026-10-15. Los títulos de la guía del Instituto Caro y Cuervo se pasaron a
masculino ("amarrado", "cabra", "cuadros"). Los significados y las pistas, en
español e inglés, son textos propios del proyecto (MIT), no copias de las fuentes.

**EN** · Sayings belong to Colombian oral tradition. Each one is copied as it
appears in the publication cited in `fuente` and was checked against it on
2026-10-15. Meanings and hints (Spanish and English) are the project's own text
(MIT), not copied from the sources.

## data/contenido/categorias.json

**ES** · Lista propia. Cada palabra está en las listas derivadas de RLA-ES
(`public/palabras/`); los nombres de las categorías y las pistas en español e
inglés son textos propios del proyecto (MIT).

**EN** · Own list. Every word is in the RLA-ES-derived lists; category names and
hints (Spanish and English) are the project's own text (MIT).
