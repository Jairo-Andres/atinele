// Valida el contenido del juego. Corre en CI: si algo está mal, sale con código 1.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  LARGOS,
  LETRAS,
  RAIZ,
  contienePalabra,
  dentro,
  largo,
  leerJson,
  leerValidas,
  normalizar,
} from './lib.mjs';
import { LADO_CRUCIGRAMA, LADO_SOPA, letrasEntre, problemasCrucigrama } from './rejillas.mjs';

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

// ---------- Dichos ----------
const dichos = leerJson('data/contenido/dichos.json');
const idsDichos = new Set();
for (const d of dichos) {
  const donde = `dichos.json ${d.id ?? '(sin id)'}`;
  if (!/^d\d{3,}$/.test(d.id ?? '')) errores.push(`${donde}: id inválido (formato d001)`);
  if (idsDichos.has(d.id)) errores.push(`${donde}: id repetido`);
  idsDichos.add(d.id);
  if (!['listo', 'pendiente'].includes(d.estado)) errores.push(`${donde}: estado inválido`);
  if (!d.texto || !d.oculta) {
    errores.push(`${donde}: falta texto u oculta`);
    continue;
  }
  if (!contienePalabra(d.texto, d.oculta)) {
    errores.push(`${donde}: "${d.oculta}" no aparece como palabra en el texto`);
  }
  const n = largo(normalizar(d.oculta));
  if (n < 4 || n > 8) errores.push(`${donde}: la palabra oculta debe tener entre 4 y 8 letras`);
  else if (!leerValidas(n).has(normalizar(d.oculta))) {
    avisos.push(
      `${donde}: "${d.oculta}" no está en public/palabras/${n}.txt (igual se acepta como respuesta)`,
    );
  }
  if (![...normalizar(d.oculta)].every((c) => LETRAS.includes(c))) {
    errores.push(`${donde}: la palabra oculta tiene caracteres fuera del teclado`);
  }
  for (const campo of ['significado', 'pista']) {
    if (!d[campo]?.es || !d[campo]?.en) errores.push(`${donde}: falta ${campo} en ES o EN`);
  }
  if (d.estado === 'listo' && !(d.fuente?.nombre && /^https:\/\//.test(d.fuente?.url ?? ''))) {
    errores.push(`${donde}: está "listo" sin fuente (nombre y url https)`);
  }
}
const dichosCalendario = calendario.dichos ?? [];
if (!dichosCalendario.length) errores.push('calendario.json: no tiene dichos');
for (const d of dichosCalendario) {
  const original = dichos.find((x) => x.id === d.id);
  if (!original) errores.push(`calendario.json: el dicho ${d.id} no está en dichos.json`);
  else if (original.estado !== 'listo')
    errores.push(`calendario.json: el dicho ${d.id} está pendiente`);
  else if (original.texto !== d.texto || original.oculta !== d.oculta) {
    errores.push(
      `calendario.json: el dicho ${d.id} está desactualizado; corre "npm run calendario"`,
    );
  }
}

// ---------- Categorías ----------
const contenidoCategorias = leerJson('data/contenido/categorias.json');
const nombresCategorias = contenidoCategorias.categorias ?? {};
for (const [clave, c] of Object.entries(nombresCategorias)) {
  if (!c.es || !c.en || !c.icono) errores.push(`categorias.json ${clave}: falta es, en o icono`);
}
const idsCategorias = new Set();
const palabrasCategorias = new Set();
for (const p of contenidoCategorias.palabras ?? []) {
  const donde = `categorias.json ${p.id ?? '(sin id)'} (${p.palabra})`;
  if (!/^c\d{3,}$/.test(p.id ?? '')) errores.push(`${donde}: id inválido (formato c001)`);
  if (idsCategorias.has(p.id)) errores.push(`${donde}: id repetido`);
  idsCategorias.add(p.id);
  if (!nombresCategorias[p.categoria])
    errores.push(`${donde}: categoría "${p.categoria}" no existe`);
  if (!['listo', 'pendiente'].includes(p.estado)) errores.push(`${donde}: estado inválido`);
  if (!p.pista?.es || !p.pista?.en) errores.push(`${donde}: falta pista en ES o EN`);
  const n = normalizar(p.palabra ?? '');
  if (palabrasCategorias.has(n)) errores.push(`${donde}: palabra repetida`);
  palabrasCategorias.add(n);
  if (p.palabra !== p.palabra?.toLocaleLowerCase('es-CO'))
    errores.push(`${donde}: va en minúsculas (con tildes)`);
  if (![...n].every((c) => LETRAS.includes(c)))
    errores.push(`${donde}: tiene caracteres fuera del teclado`);
  if (largo(n) < 4 || largo(n) > 8) errores.push(`${donde}: debe tener entre 4 y 8 letras`);
  else if (!leerValidas(largo(n)).has(n)) {
    errores.push(`${donde}: no está en public/palabras/${largo(n)}.txt`);
  }
}
const categoriasCalendario = calendario.categorias ?? [];
if (!categoriasCalendario.length) errores.push('calendario.json: no tiene categorías');
for (const c of categoriasCalendario) {
  const original = (contenidoCategorias.palabras ?? []).find((x) => x.id === c.id);
  if (!original) errores.push(`calendario.json: la palabra ${c.id} no está en categorias.json`);
  else if (original.estado !== 'listo')
    errores.push(`calendario.json: la palabra ${c.id} está pendiente`);
  else if (
    original.palabra !== c.palabra ||
    nombresCategorias[original.categoria]?.es !== c.categoria?.es
  ) {
    errores.push(
      `calendario.json: la palabra ${c.id} está desactualizada; corre "npm run calendario"`,
    );
  }
}

// ---------- Sopas de letras ----------
const contenidoSopas = leerJson('data/contenido/sopas.json');
const idsSopas = new Set();
for (const t of contenidoSopas) {
  const donde = `sopas.json ${t.id ?? '(sin id)'}`;
  if (!/^s\d{3,}$/.test(t.id ?? '')) errores.push(`${donde}: id inválido (formato s001)`);
  if (idsSopas.has(t.id)) errores.push(`${donde}: id repetido`);
  idsSopas.add(t.id);
  if (!t.tema?.es || !t.tema?.en || !t.tema?.icono)
    errores.push(`${donde}: falta tema es, en o icono`);
  if (!['listo', 'pendiente'].includes(t.estado)) errores.push(`${donde}: estado inválido`);
  const palabras = t.palabras ?? [];
  if (palabras.length < 6 || palabras.length > 10)
    errores.push(`${donde}: debe tener de 6 a 10 palabras`);
  const vistasTema = new Set();
  for (const p of palabras) {
    const n = normalizar(p);
    if (largo(n) < 3 || largo(n) > LADO_SOPA)
      errores.push(`${donde}: "${p}" debe tener de 3 a ${LADO_SOPA} letras`);
    if (![...n].every((c) => LETRAS.includes(c)))
      errores.push(`${donde}: "${p}" tiene caracteres fuera del teclado`);
    if (vistasTema.has(n)) errores.push(`${donde}: "${p}" repetida`);
    vistasTema.add(n);
  }
}
const sopasCalendario = calendario.sopas ?? [];
if (!sopasCalendario.length) errores.push('calendario.json: no tiene sopas de letras');
for (const s of sopasCalendario) {
  const original = contenidoSopas.find((x) => x.id === s.id);
  if (!original) errores.push(`calendario.json: la sopa ${s.id} no está en sopas.json`);
  else if (original.estado !== 'listo')
    errores.push(`calendario.json: la sopa ${s.id} está pendiente`);
  else if (original.palabras.join() !== s.palabras.map((p) => p.palabra).join())
    errores.push(
      `calendario.json: la sopa ${s.id} está desactualizada; corre "npm run calendario"`,
    );
  if (s.filas?.length !== LADO_SOPA || s.filas.some((f) => largo(f) !== LADO_SOPA))
    errores.push(`calendario.json: la sopa ${s.id} no es de ${LADO_SOPA}×${LADO_SOPA}`);
  for (const p of s.palabras ?? []) {
    if (letrasEntre(s.filas ?? [], p.inicio, p.fin) !== normalizar(p.palabra))
      errores.push(`calendario.json: en la sopa ${s.id}, "${p.palabra}" no está donde dice`);
  }
}

// ---------- Crucigramas ----------
const grupoCrucigrama = leerJson('data/contenido/crucigramas.json');
const vistasCrucigrama = new Set();
for (const e of grupoCrucigrama) {
  const donde = `crucigramas.json ${e.id ?? '(sin id)'} (${e.palabra})`;
  if (!/^x\d{3,}$/.test(e.id ?? '')) errores.push(`${donde}: id inválido (formato x001)`);
  if (!['listo', 'pendiente'].includes(e.estado)) errores.push(`${donde}: estado inválido`);
  if (!e.pista?.es || !e.pista?.en) errores.push(`${donde}: falta pista en ES o EN`);
  const n = normalizar(e.palabra ?? '');
  if (largo(n) < 3 || largo(n) > LADO_CRUCIGRAMA)
    errores.push(`${donde}: debe tener de 3 a ${LADO_CRUCIGRAMA} letras`);
  if (![...n].every((c) => LETRAS.includes(c)))
    errores.push(`${donde}: tiene caracteres fuera del teclado`);
  if (vistasCrucigrama.has(n)) errores.push(`${donde}: palabra repetida`);
  vistasCrucigrama.add(n);
}
const crucigramasCalendario = calendario.crucigramas ?? [];
if (!crucigramasCalendario.length) errores.push('calendario.json: no tiene crucigramas');
for (const x of crucigramasCalendario) {
  if ((x.palabras ?? []).length < 5)
    errores.push(`calendario.json: el crucigrama ${x.id} tiene menos de 5 palabras`);
  if (x.ancho > LADO_CRUCIGRAMA || x.alto > LADO_CRUCIGRAMA)
    errores.push(`calendario.json: el crucigrama ${x.id} es muy grande`);
  for (const pr of problemasCrucigrama(x))
    errores.push(`calendario.json: crucigrama ${x.id}: ${pr}`);
}

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

// Fecha de Colombia (no UTC): el reto cambia a la medianoche de Bogotá.
const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
const transcurridos = Math.round((Date.parse(hoy) - Date.parse(calendario.inicio)) / 86_400_000);
// Cuando una lista se acaba, el juego repite su ciclo; si después se agrega
// contenido, cambia el reto del día. Por eso se avisa con un mes de margen.
const transcurridosDesde = (desde) =>
  desde
    ? Math.max(0, Math.round((Date.parse(hoy) - Date.parse(desde)) / 86_400_000))
    : transcurridos;
for (const [cuantos, que, desde] of [
  [calendario.dias.length, 'palabras (npm run calendario tras agregarlas)'],
  [(calendario.municipios ?? []).length, 'municipios a respuestas-municipio.json'],
  [(calendario.dichos ?? []).length, 'dichos a dichos.json'],
  [categoriasCalendario.length, 'categorías a categorias.json'],
  [sopasCalendario.length, 'sopas a sopas.json', calendario.desde?.sopas],
  [crucigramasCalendario.length, 'crucigramas a crucigramas.json', calendario.desde?.crucigramas],
]) {
  const quedan = cuantos - transcurridosDesde(desde) - 1;
  if (quedan < 30)
    avisos.push(`Quedan ${Math.max(0, quedan)} días de ${que.split(' ')[0]}: agrega ${que}.`);
}

for (const a of avisos) console.warn(`Aviso: ${a}`);
if (errores.length) {
  for (const e of errores) console.error(`Error: ${e}`);
  process.exit(1);
}
console.log(
  `Contenido válido: ${respuestas.length} palabras, ${calendario.dias.length} días, ${(calendario.municipios ?? []).length} municipios, ${dichosCalendario.length} dichos, ${categoriasCalendario.length} palabras por categoría, ${sopasCalendario.length} sopas y ${crucigramasCalendario.length} crucigramas.`,
);
