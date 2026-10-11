// Valida el contenido del juego. Corre en CI: si algo está mal, sale con código 1.
import { LARGOS, LETRAS, largo, leerJson, leerValidas, normalizar } from './lib.mjs';

const errores = [];
const avisos = [];

const respuestas = leerJson('data/contenido/palabras-respuestas.json');
const calendario = leerJson('data/contenido/calendario.json');
const validas5 = leerValidas(5);

const vistas = new Set();
for (const [i, r] of respuestas.entries()) {
  const donde = `palabras-respuestas.json[${i}] (${r.palabra})`;
  const n = normalizar(r.palabra ?? '');
  if (largo(n) !== 5) errores.push(`${donde}: debe tener 5 letras`);
  if (![...n].every((l) => LETRAS.includes(l)))
    errores.push(`${donde}: tiene caracteres fuera del teclado`);
  if (r.palabra !== r.palabra.toLocaleUpperCase('es-CO'))
    errores.push(`${donde}: debe ir en mayúsculas`);
  if (!['general', 'colombianismo'].includes(r.tipo)) errores.push(`${donde}: tipo inválido`);
  if (!['listo', 'pendiente'].includes(r.estado)) errores.push(`${donde}: estado inválido`);
  if (r.estado === 'listo' && (!r.fuente || r.fuente === 'pendiente')) {
    errores.push(`${donde}: está "listo" sin fuente`);
  }
  if (!validas5.has(n)) errores.push(`${donde}: no está en public/palabras/5.txt`);
  if (vistas.has(n)) errores.push(`${donde}: repetida`);
  vistas.add(n);
}

const listas = new Map(respuestas.map((r) => [r.palabra, r]));
if (!/^\d{4}-\d{2}-\d{2}$/.test(calendario.inicio))
  errores.push('calendario.json: inicio inválido');
for (const [i, d] of calendario.dias.entries()) {
  if (d.n !== i + 1) errores.push(`calendario.json día ${i + 1}: n debe ser ${i + 1}`);
  const r = listas.get(d.palabra);
  if (!r) errores.push(`calendario.json día ${d.n}: ${d.palabra} no existe en las respuestas`);
  else if (r.estado !== 'listo')
    errores.push(`calendario.json día ${d.n}: ${d.palabra} está pendiente`);
}

for (const n of LARGOS) {
  const v = leerValidas(n);
  for (const p of v) {
    if (largo(p) !== n) {
      errores.push(`public/palabras/${n}.txt: "${p}" no tiene ${n} letras`);
      break;
    }
  }
}

const hoy = new Date().toISOString().slice(0, 10);
const transcurridos = Math.round((Date.parse(hoy) - Date.parse(calendario.inicio)) / 86_400_000);
const quedan = calendario.dias.length - transcurridos - 1;
if (quedan < 30) avisos.push(`Quedan ${Math.max(0, quedan)} días de calendario: agrega palabras.`);

for (const a of avisos) console.warn(`Aviso: ${a}`);
if (errores.length) {
  for (const e of errores) console.error(`Error: ${e}`);
  process.exit(1);
}
console.log(`Contenido válido: ${respuestas.length} respuestas, ${calendario.dias.length} días.`);
