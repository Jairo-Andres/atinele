// Genera public/palabras/{4..8}.txt (palabras válidas como intento) a partir
// del diccionario es_CO del proyecto RLA-ES expandido con `unmunch` de Hunspell.
//
// Uso (Linux, WSL o el workflow "Palabras válidas" de GitHub Actions):
//   npm pack dictionary-es-co@2.0.0 && tar xzf dictionary-es-co-2.0.0.tgz
//   unmunch package/index.dic package/index.aff > expandido.txt
//   node scripts/generar-validas.mjs expandido.txt
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { LARGOS, LETRAS, RAIZ, largo, leerJson, normalizar } from './lib.mjs';

const entrada = process.argv[2];
if (!entrada) {
  console.error('Uso: node scripts/generar-validas.mjs <expandido.txt>');
  process.exit(1);
}

const porLargo = new Map(LARGOS.map((n) => [n, new Set()]));
for (const linea of readFileSync(entrada, 'utf8').split('\n')) {
  const palabra = linea.trim().split('/')[0];
  // Fuera nombres propios y siglas (empiezan con mayúscula).
  if (!palabra || palabra[0] !== palabra[0].toLowerCase()) continue;
  const n = normalizar(palabra);
  if (![...n].every((l) => LETRAS.includes(l))) continue;
  porLargo.get(largo(n))?.add(n);
}

// Las respuestas siempre son válidas.
for (const r of leerJson('data/contenido/palabras-respuestas.json')) {
  const n = normalizar(r.palabra);
  porLargo.get(largo(n))?.add(n);
}

for (const [n, conjunto] of porLargo) {
  const lista = [...conjunto].sort((a, b) => a.localeCompare(b, 'es'));
  writeFileSync(join(RAIZ, `public/palabras/${n}.txt`), lista.join('\n') + '\n');
  console.log(`${n} letras: ${lista.length} palabras`);
}
