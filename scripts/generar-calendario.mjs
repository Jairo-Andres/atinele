// Agrega al final de data/contenido/calendario.json las palabras, municipios, dichos, categorías, sopas y crucigramas "listo" que
// aún no están, mezcladas con una semilla fija (resultado reproducible).
// Nunca reordena días ya publicados, para no cambiar retos pasados.
//
// Uso: node scripts/generar-calendario.mjs [--inicio AAAA-MM-DD]
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { RAIZ, escribirJson, leerJson, normalizar } from './lib.mjs';
import { generarCrucigrama, generarSopa, mezclar } from './rejillas.mjs';

const RUTA = 'data/contenido/calendario.json';
const SEMILLA = 20261011;

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

// Las listas que empezaron después del día 1 cuentan su ciclo desde su propia
// fecha (la de Colombia del día en que se agregaron), así no arrancan repetidas.
const hoyColombia = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(
  new Date(),
);
calendario.desde ??= {};
calendario.desde.sopas ??= hoyColombia;
calendario.desde.crucigramas ??= hoyColombia;

// Sopas de letras: la rejilla se genera aquí (determinista por id) y va lista.
calendario.sopas ??= [];
const sopas = leerJson('data/contenido/sopas.json');
const publicoSopa = (s) => ({
  id: s.id,
  tema: s.tema,
  ...generarSopa(s.palabras, SEMILLA + Number(s.id.slice(1))),
});
const porIdSopa = new Map(sopas.map((s) => [s.id, s]));
// Si cambian las palabras de un tema ya publicado, se regenera su rejilla.
calendario.sopas = calendario.sopas.map((s) => {
  const original = porIdSopa.get(s.id);
  const iguales = original && original.palabras.join() === s.palabras.map((p) => p.palabra).join();
  return original && !iguales
    ? publicoSopa(original)
    : original
      ? { ...s, tema: original.tema }
      : s;
});
const usadasSopas = new Set(calendario.sopas.map((s) => s.id));
const nuevasSopas = sopas.filter((s) => s.estado === 'listo' && !usadasSopas.has(s.id));
calendario.sopas.push(
  ...mezclar(nuevasSopas, SEMILLA + 19 + calendario.sopas.length).map(publicoSopa),
);

// Crucigramas: se arman con las palabras "listo" que aún no salieron en ninguno.
// Las que no cruzan con otras esperan a que haya más palabras.
calendario.crucigramas ??= [];
const grupoCrucigrama = leerJson('data/contenido/crucigramas.json');
const pistas = new Map(grupoCrucigrama.map((e) => [normalizar(e.palabra), e.pista]));
for (const x of calendario.crucigramas) {
  for (const p of x.palabras) p.pista = pistas.get(normalizar(p.palabra)) ?? p.pista;
}
const yaUsadas = new Set(
  calendario.crucigramas.flatMap((x) => x.palabras.map((p) => normalizar(p.palabra))),
);
let libres = mezclar(
  grupoCrucigrama.filter((e) => e.estado === 'listo' && !yaUsadas.has(normalizar(e.palabra))),
  SEMILLA + 23 + calendario.crucigramas.length,
);
let nuevosCrucigramas = 0;
while (libres.length >= 5) {
  const n = calendario.crucigramas.length + 1;
  const x = generarCrucigrama(libres, SEMILLA + 29 + n);
  if (!x || x.palabras.length < 5) break;
  calendario.crucigramas.push({
    id: `k${String(n).padStart(3, '0')}`,
    ancho: x.ancho,
    alto: x.alto,
    palabras: x.palabras,
  });
  libres = libres.filter((e) => !x.usadas.includes(e));
  nuevosCrucigramas++;
}

escribirJson(RUTA, calendario);
console.log(
  `Calendario: ${calendario.dias.length} palabras (+${nuevas.length}) ${calendario.municipios.length} municipios (+${nuevosMunicipios.length}) ${calendario.dichos.length} dichos (+${nuevosDichos.length}) ${calendario.categorias.length} palabras por categoría (+${nuevasCategorias.length}), ${calendario.sopas.length} sopas (+${nuevasSopas.length}) y ${calendario.crucigramas.length} crucigramas (+${nuevosCrucigramas}; ${libres.length} palabras esperando) desde ${calendario.inicio}.`,
);
