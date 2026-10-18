import { cercania, direccion, distanciaKm, rumbo, type Direccion } from './geo';
import { normalizarNombre } from './normalizar';

export interface Municipio {
  cod: string;
  nombre: string;
  dpto: string;
  codDpto: string;
  tipo: string;
  lat: number;
  lon: number;
}

export interface DatosMunicipios {
  fuente: string;
  descargado: string;
  distanciaMaxKm: number;
  municipios: Municipio[];
}

export interface Pista {
  municipio: Municipio;
  acierto: boolean;
  distanciaKm: number;
  direccion: Direccion;
  cercania: number;
  mismoDpto: boolean;
}

/** Los que se aceptan como intento (las áreas no municipalizadas quedan fuera). */
export function jugables(lista: Municipio[]): Municipio[] {
  return lista.filter((m) => m.tipo !== 'Área no municipalizada');
}

/**
 * Sugerencias para el autocompletado: primero los que empiezan por la
 * consulta, luego los que tienen una palabra que empieza por ella y al final
 * los que la contienen. Se compara sin tildes, espacios ni mayúsculas.
 */
export function buscar(lista: Municipio[], consulta: string, max = 8): Municipio[] {
  const q = normalizarNombre(consulta);
  if (!q) return [];
  const empieza: Municipio[] = [];
  const palabra: Municipio[] = [];
  const contiene: Municipio[] = [];
  for (const m of lista) {
    const nombre = normalizarNombre(m.nombre);
    // "San Luis Tol" también encuentra San Luis, Tolima.
    if (nombre.startsWith(q) || normalizarNombre(m.nombre + m.dpto).startsWith(q)) empieza.push(m);
    else if (m.nombre.split(/[\s-]+/).some((p) => normalizarNombre(p).startsWith(q)))
      palabra.push(m);
    else if (nombre.includes(q)) contiene.push(m);
  }
  const orden = (a: Municipio, b: Municipio) =>
    a.nombre.localeCompare(b.nombre, 'es') || a.dpto.localeCompare(b.dpto, 'es');
  return [...empieza.sort(orden), ...palabra.sort(orden), ...contiene.sort(orden)].slice(0, max);
}

/** Municipios cuyo nombre coincide exactamente (puede haber varios con el mismo nombre). */
export function coincidenciasExactas(lista: Municipio[], texto: string): Municipio[] {
  const q = normalizarNombre(texto);
  return lista.filter(
    (m) => normalizarNombre(m.nombre) === q || normalizarNombre(m.nombre + m.dpto) === q,
  );
}

/**
 * Entre varias sugerencias, la única cuyo nombre tiene la consulta como palabra
 * completa ("Cali" → Santiago de Cali, no Calima). null si no hay una sola.
 */
export function unicaPorPalabra(opciones: Municipio[], texto: string): Municipio | null {
  const q = normalizarNombre(texto);
  if (!q) return null;
  const con = opciones.filter((m) =>
    m.nombre.split(/[\s,-]+/).some((p) => normalizarNombre(p) === q),
  );
  return con.length === 1 ? (con[0] as Municipio) : null;
}

export function evaluarMunicipio(
  intento: Municipio,
  respuesta: Municipio,
  distanciaMax: number,
): Pista {
  const acierto = intento.cod === respuesta.cod;
  const d = acierto ? 0 : distanciaKm(intento, respuesta);
  return {
    municipio: intento,
    acierto,
    distanciaKm: Math.round(d),
    direccion: direccion(rumbo(intento, respuesta)),
    cercania: acierto ? 100 : Math.min(99, cercania(d, distanciaMax)),
    mismoDpto: intento.codDpto === respuesta.codDpto,
  };
}
