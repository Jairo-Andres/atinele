// Genera public/datos/mapa.json: contorno de los departamentos de Colombia y de
// los países vecinos para el mapa del modo Municipio.
//
// Uso (descarga ~55 MB de GitHub y usa mapshaper con npx):
//   npm run mapa
//
// Fuente: Natural Earth 1:10m (Admin 0 y Admin 1), versión 5.1.2, dominio público.
// https://www.naturalearthdata.com/about/terms-of-use/
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { RAIZ } from './lib.mjs';

const BASE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson';
const ADMIN1 = `${BASE}/ne_10m_admin_1_states_provinces.geojson`;
const ADMIN0 = `${BASE}/ne_10m_admin_0_countries.geojson`;
const MAPSHAPER = 'mapshaper@0.6.121';

// ISO 3166-2 de Natural Earth → código de departamento DIVIPOLA (DANE).
// Bogotá y Cundinamarca comparten CO-CUN en Natural Earth; se separan por nombre.
export const ISO_A_DANE = {
  'CO-ANT': '05',
  'CO-ATL': '08',
  'CO-BOL': '13',
  'CO-BOY': '15',
  'CO-CAL': '17',
  'CO-CAQ': '18',
  'CO-CAU': '19',
  'CO-CES': '20',
  'CO-COR': '23',
  'CO-CUN': '25',
  'CO-CHO': '27',
  'CO-HUI': '41',
  'CO-LAG': '44',
  'CO-MAG': '47',
  'CO-MET': '50',
  'CO-NAR': '52',
  'CO-NSA': '54',
  'CO-QUI': '63',
  'CO-RIS': '66',
  'CO-SAN': '68',
  'CO-SUC': '70',
  'CO-TOL': '73',
  'CO-VAC': '76',
  'CO-ARA': '81',
  'CO-CAS': '85',
  'CO-PUT': '86',
  'CO-SAP': '88',
  'CO-AMA': '91',
  'CO-GUA': '94',
  'CO-GUV': '95',
  'CO-VAU': '97',
  'CO-VID': '99',
};

export function codigoDane(props) {
  if (props.name === 'Bogota') return '11';
  return ISO_A_DANE[props.iso_3166_2] ?? null;
}

/** Anillos [[lon, lat], ...] de un Polygon o MultiPolygon. */
export function anillos(geometria) {
  if (!geometria) return [];
  if (geometria.type === 'Polygon') return geometria.coordinates;
  if (geometria.type === 'MultiPolygon') return geometria.coordinates.flat();
  return [];
}

/** Geometrías de un FeatureCollection, GeometryCollection, Feature o geometría suelta. */
export function geometrias(gj) {
  if (gj.type === 'FeatureCollection') return gj.features.map((f) => f.geometry);
  if (gj.type === 'GeometryCollection') return gj.geometries;
  if (gj.type === 'Feature') return [gj.geometry];
  return [gj];
}

export function convertirMapa(departamentos, vecinos) {
  const errores = [];
  const deptos = [];
  for (const f of departamentos.features) {
    const cod = codigoDane(f.properties);
    if (!cod) {
      errores.push(`sin código DANE: ${f.properties.name} (${f.properties.iso_3166_2})`);
      continue;
    }
    deptos.push({ codDpto: cod, anillos: anillos(f.geometry) });
  }
  const codigos = deptos.map((d) => d.codDpto);
  const repetidos = codigos.filter((c, i) => codigos.indexOf(c) !== i);
  if (repetidos.length) errores.push(`departamentos repetidos: ${repetidos.join(', ')}`);
  if (deptos.length !== 33) errores.push(`se esperaban 33 departamentos y hay ${deptos.length}`);
  deptos.sort((a, b) => a.codDpto.localeCompare(b.codDpto));
  return {
    errores,
    departamentos: deptos,
    vecinos: geometrias(vecinos).flatMap(anillos),
  };
}

function bajar(url, destino) {
  console.log(`Descargando ${url}`);
  execFileSync('curl', ['-fsSL', '-o', destino, url], { stdio: 'inherit' });
}

function mapshaper(args) {
  execFileSync('npx', ['-y', MAPSHAPER, ...args], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
}

function principal() {
  const tmp = mkdtempSync(join(tmpdir(), 'atinele-mapa-'));
  const a1 = join(tmp, 'admin1.geojson');
  const a0 = join(tmp, 'admin0.geojson');
  bajar(ADMIN1, a1);
  bajar(ADMIN0, a0);
  const col = join(tmp, 'col.json');
  const vec = join(tmp, 'vec.json');
  // CO-X01~ es una zona en disputa sin departamento; no se dibuja.
  mapshaper([
    a1,
    '-filter',
    "adm0_a3=='COL' && iso_3166_2!='CO-X01~'",
    '-filter-fields',
    'name,iso_3166_2',
    '-simplify',
    '6%',
    'keep-shapes',
    '-filter-islands',
    'min-area=2km2',
    '-o',
    'format=geojson',
    'precision=0.001',
    col,
  ]);
  mapshaper([
    a0,
    '-filter',
    "['VEN','ECU','PER','BRA','PAN','CRI','NIC'].indexOf(ADM0_A3)>-1",
    '-clip',
    'bbox=-83,-5,-66,14',
    '-simplify',
    '5%',
    'keep-shapes',
    '-filter-islands',
    'min-area=20km2',
    '-dissolve',
    '-o',
    'format=geojson',
    'precision=0.001',
    vec,
  ]);
  const r = convertirMapa(
    JSON.parse(readFileSync(col, 'utf8')),
    JSON.parse(readFileSync(vec, 'utf8')),
  );
  if (r.errores.length) {
    for (const e of r.errores) console.error(`Error: ${e}`);
    process.exit(1);
  }
  const salida = {
    fuente: 'Natural Earth 1:10m (Admin 0 y Admin 1) v5.1.2, dominio público',
    nota: 'Simplificado con mapshaper. Es un dibujo de referencia, no un límite oficial.',
    departamentos: r.departamentos,
    vecinos: r.vecinos,
  };
  writeFileSync(join(RAIZ, 'public/datos/mapa.json'), JSON.stringify(salida) + '\n');
  console.log(`Listo: ${r.departamentos.length} departamentos.`);
}

if (process.argv[1]?.endsWith('generar-mapa.mjs')) principal();
