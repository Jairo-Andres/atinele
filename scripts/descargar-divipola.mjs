// Descarga DIVIPOLA (DANE) desde datos.gov.co y genera public/datos/municipios.json.
//
// Uso (en un equipo con acceso a www.datos.gov.co, o con el workflow "Municipios"):
//   npm run municipios
//
// Fuente: DANE, "DIVIPOLA - Códigos municipios", datos.gov.co gdxc-w37w, CC BY-SA 4.0.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { RAIZ, distanciaKm, tipoTitulo } from './lib.mjs';

const URL_DATOS = 'https://www.datos.gov.co/resource/gdxc-w37w.json?$limit=5000&$order=cod_mpio';
const FILAS_ESPERADAS = 1122; // Conteo al 2026-10-11; el DANE puede actualizarlo.
const CAJA = { latMin: -4.3, latMax: 13.5, lonMin: -82, lonMax: -66.8 }; // Colombia con San Andrés

const numero = (v) => Number(String(v).replace(',', '.'));

export function convertir(filas) {
  const errores = [];
  const vistos = new Set();
  const municipios = filas.map((f, i) => {
    const m = {
      cod: String(f.cod_mpio ?? '').padStart(5, '0'),
      nombre: tipoTitulo(String(f.nom_mpio ?? '')),
      dpto: tipoTitulo(String(f.dpto ?? '')),
      codDpto: String(f.cod_dpto ?? '').padStart(2, '0'),
      tipo: String(f.tipo_municipio ?? ''),
      lat: numero(f.latitud),
      lon: numero(f.longitud),
    };
    if (!/^\d{5}$/.test(m.cod)) errores.push(`fila ${i}: código inválido "${f.cod_mpio}"`);
    if (!m.nombre) errores.push(`fila ${i}: sin nombre`);
    if (vistos.has(m.cod)) errores.push(`fila ${i}: código repetido ${m.cod}`);
    vistos.add(m.cod);
    const dentro =
      m.lat >= CAJA.latMin && m.lat <= CAJA.latMax && m.lon >= CAJA.lonMin && m.lon <= CAJA.lonMax;
    if (!Number.isFinite(m.lat) || !Number.isFinite(m.lon) || !dentro) {
      errores.push(
        `fila ${i} (${m.cod} ${m.nombre}): coordenadas fuera de Colombia (${f.latitud}, ${f.longitud})`,
      );
    }
    return m;
  });
  return { municipios, errores };
}

export function distanciaMaxima(municipios) {
  let max = 0;
  for (let i = 0; i < municipios.length; i++) {
    for (let j = i + 1; j < municipios.length; j++) {
      max = Math.max(max, distanciaKm(municipios[i], municipios[j]));
    }
  }
  return Math.round(max);
}

async function principal() {
  console.log(`Descargando ${URL_DATOS}`);
  const r = await fetch(URL_DATOS, { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error(`datos.gov.co respondió ${r.status} ${r.statusText}`);
  const filas = await r.json();
  const { municipios, errores } = convertir(filas);
  if (errores.length) {
    for (const e of errores) console.error(`Error: ${e}`);
    process.exit(1);
  }
  if (municipios.length !== FILAS_ESPERADAS) {
    console.warn(
      `Aviso: llegaron ${municipios.length} filas (se esperaban ${FILAS_ESPERADAS}). Revisa el diff.`,
    );
  }
  const salida = {
    fuente: 'DANE - DIVIPOLA Códigos municipios, datos.gov.co gdxc-w37w, CC BY-SA 4.0',
    descargado: new Date().toISOString().slice(0, 10),
    nota: 'Nombres convertidos de mayúsculas a tipo título. Coordenadas tal como las publica el DANE.',
    distanciaMaxKm: distanciaMaxima(municipios),
    municipios,
  };
  mkdirSync(join(RAIZ, 'public/datos'), { recursive: true });
  writeFileSync(join(RAIZ, 'public/datos/municipios.json'), JSON.stringify(salida) + '\n');
  console.log(
    `Listo: ${municipios.length} municipios, distancia máxima ${salida.distanciaMaxKm} km.`,
  );
}

// Solo descarga cuando se ejecuta directo (no al importarlo en las pruebas).
if (process.argv[1]?.endsWith('descargar-divipola.mjs')) {
  principal().catch((e) => {
    console.error(`No se pudo descargar DIVIPOLA: ${e.message}`);
    process.exit(1);
  });
}
