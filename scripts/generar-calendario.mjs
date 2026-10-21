// Agrega al final de data/contenido/calendario.json las palabras, municipios, dichos y categorías "listo" que
// aún no están, mezcladas con una semilla fija (resultado reproducible).
// Nunca reordena días ya publicados, para no cambiar retos pasados.
//
// Uso: node scripts/generar-calendario.mjs [--inicio AAAA-MM-DD]
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { RAIZ, escribirJson, leerJson } from './lib.mjs';

const RUTA = 'data/contenido/calendario.json';
const SEMILLA = 20261011;

// Generador pseudoaleatorio mulberry32.
function aleatorio(semilla) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function mezclar(lista, semilla) {
  const r = aleatorio(semilla);
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

const argInicio = process.argv.indexOf('--inicio');
const calendario = existsSync(join(RAIZ, RUTA))
  ? leerJson(RUTA)
  : { inicio: process.argv[argInicio + 1] ?? new Date().toISOString().slice(0, 10), dias: [] };
if (argInicio > -1) calendario.inicio = process.argv[argInicio + 1];

const usadas = new Set(calendario.dias.map((d) => d.palabra));
const nuevas = leerJson('data/contenido/palabras-respuestas.json')
  .filter((p) => p.estado === 'listo' && !usadas.has(p.palabra))
  .map((p) => p.palabra);

for (const palabra of mezclar(nuevas, SEMILLA + calendario.dias.length)) {
  calendario.dias.push({ n: calendario.dias.length + 1, palabra });
}

// Municipios: lista aparte (su ciclo es independiente del de palabras).
calendario.municipios ??= [];
const usados = new Set(calendario.municipios);
const nuevosMunicipios = leerJson('data/contenido/respuestas-municipio.json')
  .filter((m) => m.estado === 'listo' && !usados.has(m.cod))
  .map((m) => m.cod);
calendario.municipios.push(
  ...mezclar(nuevosMunicipios, SEMILLA + 7 + calendario.municipios.length),
);

// Dichos: van completos (texto, significado, pista y fuente) para que el sitio no
// necesite otro archivo y queden ofuscados con el calendario. Los que ya están se
// actualizan con el contenido de dichos.json sin cambiar su orden.
calendario.dichos ??= [];
const dichos = leerJson('data/contenido/dichos.json');
const porId = new Map(dichos.map((d) => [d.id, d]));
const publico = ({ id, texto, oculta, significado, pista, fuente }) => ({
  id,
  texto,
  oculta,
  significado,
  pista,
  fuente,
});
calendario.dichos = calendario.dichos.map((d) => (porId.has(d.id) ? publico(porId.get(d.id)) : d));
const usadosDichos = new Set(calendario.dichos.map((d) => d.id));
const nuevosDichos = dichos.filter((d) => d.estado === 'listo' && !usadosDichos.has(d.id));
calendario.dichos.push(
  ...mezclar(nuevosDichos, SEMILLA + 13 + calendario.dichos.length).map(publico),
);

// Categorías: como los dichos, van completas (con el nombre de la categoría y la pista).
calendario.categorias ??= [];
const contenidoCategorias = leerJson('data/contenido/categorias.json');
const publicoCategoria = ({ id, categoria, palabra, pista }) => ({
  id,
  categoria: contenidoCategorias.categorias[categoria],
  palabra,
  pista,
});
const porIdCategoria = new Map(contenidoCategorias.palabras.map((p) => [p.id, p]));
calendario.categorias = calendario.categorias.map((c) =>
  porIdCategoria.has(c.id) ? publicoCategoria(porIdCategoria.get(c.id)) : c,
);
const usadasCategorias = new Set(calendario.categorias.map((c) => c.id));
const nuevasCategorias = contenidoCategorias.palabras.filter(
  (p) => p.estado === 'listo' && !usadasCategorias.has(p.id),
);
calendario.categorias.push(
  ...mezclar(nuevasCategorias, SEMILLA + 17 + calendario.categorias.length).map(publicoCategoria),
);

escribirJson(RUTA, calendario);
console.log(
  `Calendario: ${calendario.dias.length} palabras (+${nuevas.length}) ${calendario.municipios.length} municipios (+${nuevosMunicipios.length}) ${calendario.dichos.length} dichos (+${nuevosDichos.length}) y ${calendario.categorias.length} palabras por categoría (+${nuevasCategorias.length}) desde ${calendario.inicio}.`,
);
