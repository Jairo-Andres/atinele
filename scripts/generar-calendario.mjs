// Agrega al final de data/contenido/calendario.json las palabras y municipios "listo" que
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

escribirJson(RUTA, calendario);
console.log(
  `Calendario: ${calendario.dias.length} palabras (+${nuevas.length}) y ${calendario.municipios.length} municipios (+${nuevosMunicipios.length}) desde ${calendario.inicio}.`,
);
