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

## Próximas fases / Next phases

- Municipios: DANE, _DIVIPOLA - Códigos municipios_, datos.gov.co `gdxc-w37w`, CC BY-SA 4.0.
- Dichos: lista propia con fuente por dicho.
