// Valida el contenido del juego. Corre en CI: si algo está mal, sale con código 1.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { LARGOS, LETRAS, RAIZ, dentro, largo, leerJson, leerValidas, normalizar } from './lib.mjs';

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

// ---------- Municipios ----------
const RUTA_MUNICIPIOS = 'public/datos/municipios.json';
const respuestasMunicipio = leerJson('data/contenido/respuestas-municipio.json');
if (!existsSync(join(RAIZ, RUTA_MUNICIPIOS))) {
  errores.push(
    `Falta ${RUTA_MUNICIPIOS}: corre "npm run municipios" (necesita acceso a datos.gov.co).`,
  );
} else {
  const datos = leerJson(RUTA_MUNICIPIOS);
  const porCodigo = new Map(datos.municipios.map((m) => [m.cod, m]));
  if (!String(datos.fuente).startsWith('DANE - DIVIPOLA')) {
    errores.push(
      `${RUTA_MUNICIPIOS}: la fuente debe ser DANE - DIVIPOLA (generado por npm run municipios)`,
    );
  }
  if (datos.municipios.length < 1000) {
    errores.push(`${RUTA_MUNICIPIOS}: solo tiene ${datos.municipios.length} municipios`);
  }
  if (!(datos.distanciaMaxKm > 0)) errores.push(`${RUTA_MUNICIPIOS}: falta distanciaMaxKm`);
  const codigos = new Set();
  for (const [i, r] of respuestasMunicipio.entries()) {
    const donde = `respuestas-municipio.json[${i}] (${r.cod})`;
    const m = porCodigo.get(r.cod);
    if (!m) errores.push(`${donde}: no existe en DIVIPOLA`);
    else if (m.tipo === 'Área no municipalizada')
      errores.push(`${donde}: es un área no municipalizada`);
    if (!['listo', 'pendiente'].includes(r.estado)) errores.push(`${donde}: estado inválido`);
    if (codigos.has(r.cod)) errores.push(`${donde}: repetido`);
    codigos.add(r.cod);
  }
  for (const cod of calendario.municipios ?? []) {
    const r = respuestasMunicipio.find((x) => x.cod === cod);
    if (!r)
      errores.push(`calendario.json: el municipio ${cod} no está en respuestas-municipio.json`);
    else if (r.estado !== 'listo')
      errores.push(`calendario.json: el municipio ${cod} está pendiente`);
  }
}
if (!(calendario.municipios ?? []).length) errores.push('calendario.json: no tiene municipios');

// ---------- Mapa ----------
const RUTA_MAPA = 'public/datos/mapa.json';
if (!existsSync(join(RAIZ, RUTA_MAPA))) {
  errores.push(`Falta ${RUTA_MAPA}: corre "npm run mapa".`);
} else if (existsSync(join(RAIZ, RUTA_MUNICIPIOS))) {
  const mapa = leerJson(RUTA_MAPA);
  const municipios = leerJson(RUTA_MUNICIPIOS).municipios;
  const deptos = new Map(mapa.departamentos.map((d) => [d.codDpto, d.anillos]));
  if (deptos.size !== 33) errores.push(`${RUTA_MAPA}: tiene ${deptos.size} departamentos, no 33`);
  // Cada municipio debe caer en el dibujo de su departamento (con margen por la
  // simplificación de los bordes). Así se detecta un código DANE mal asignado.
  const porDpto = new Map();
  for (const m of municipios) {
    const c = porDpto.get(m.codDpto) ?? { total: 0, dentro: 0 };
    c.total++;
    if (deptos.has(m.codDpto) && dentro(m.lat, m.lon, deptos.get(m.codDpto))) c.dentro++;
    porDpto.set(m.codDpto, c);
  }
  for (const [cod, c] of porDpto) {
    if (!deptos.has(cod)) errores.push(`${RUTA_MAPA}: falta el departamento ${cod}`);
    else if (c.total >= 5 && c.dentro / c.total < 0.5) {
      errores.push(
        `${RUTA_MAPA}: solo ${c.dentro} de ${c.total} municipios del ${cod} caen en su dibujo`,
      );
    }
  }
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
console.log(
  `Contenido válido: ${respuestas.length} palabras, ${calendario.dias.length} días y ${(calendario.municipios ?? []).length} municipios.`,
);
