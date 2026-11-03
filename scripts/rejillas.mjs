// Generadores de la sopa de letras y del crucigrama. Corren al armar el
// calendario (npm run calendario): el sitio recibe la rejilla ya hecha.
// Son deterministas: la misma semilla da siempre la misma rejilla.
import { largo, normalizar } from './lib.mjs';

/** Generador pseudoaleatorio mulberry32. */
export function aleatorio(semilla) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function mezclar(lista, semilla) {
  const r = aleatorio(semilla);
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// ---------- Sopa de letras ----------
export const LADO_SOPA = 10;
// Horizontal, vertical y diagonales, en ambos sentidos.
const DIRECCIONES = [
  [0, 1],
  [1, 0],
  [1, 1],
  [-1, 1],
  [0, -1],
  [-1, 0],
  [-1, -1],
  [1, -1],
];
// Relleno con letras frecuentes del español para que no se note dónde están las palabras.
const RELLENO = 'AAAAAEEEEEIIIOOOOUUSSSRRRNNNLLLDDCCTTTMMPPBGVYFHJQZÑ';

/**
 * Ubica las palabras (con tildes, se normalizan) en una rejilla cuadrada.
 * Devuelve las filas como texto y dónde quedó cada palabra (inicio y fin).
 */
export function generarSopa(palabras, semilla, lado = LADO_SOPA) {
  const orden = [...palabras].sort((a, b) => largo(normalizar(b)) - largo(normalizar(a)));
  for (let intento = 0; intento < 300; intento++) {
    const r = aleatorio(semilla + intento * 7919);
    const rejilla = Array.from({ length: lado }, () => Array(lado).fill(null));
    const ubicadas = new Map();
    let completa = true;
    for (const palabra of orden) {
      const letras = Array.from(normalizar(palabra));
      const n = letras.length;
      const opciones = [];
      for (const [df, dc] of DIRECCIONES) {
        for (let f = 0; f < lado; f++) {
          for (let c = 0; c < lado; c++) {
            const ff = f + df * (n - 1);
            const cf = c + dc * (n - 1);
            if (ff < 0 || ff >= lado || cf < 0 || cf >= lado) continue;
            if (letras.every((l, i) => [null, l].includes(rejilla[f + df * i][c + dc * i]))) {
              opciones.push([f, c, df, dc]);
            }
          }
        }
      }
      if (!opciones.length) {
        completa = false;
        break;
      }
      const [f, c, df, dc] = opciones[Math.floor(r() * opciones.length)];
      letras.forEach((l, i) => (rejilla[f + df * i][c + dc * i] = l));
      ubicadas.set(palabra, { palabra, inicio: [f, c], fin: [f + df * (n - 1), c + dc * (n - 1)] });
    }
    if (!completa) continue;
    const filas = rejilla.map((fila) =>
      fila.map((l) => l ?? RELLENO[Math.floor(r() * RELLENO.length)]).join(''),
    );
    return { filas, palabras: palabras.map((p) => ubicadas.get(p)) };
  }
  throw new Error(`No se pudieron ubicar las palabras en ${lado}×${lado}: ${palabras.join(', ')}`);
}

/** Letras de la rejilla entre inicio y fin (en línea recta), o null si no es recta. */
export function letrasEntre(filas, [f0, c0], [f1, c1]) {
  const df = Math.sign(f1 - f0);
  const dc = Math.sign(c1 - c0);
  const n = Math.max(Math.abs(f1 - f0), Math.abs(c1 - c0)) + 1;
  if (f0 !== f1 && c0 !== c1 && Math.abs(f1 - f0) !== Math.abs(c1 - c0)) return null;
  let texto = '';
  for (let i = 0; i < n; i++) {
    const fila = Array.from(filas[f0 + df * i] ?? '');
    const l = fila[c0 + dc * i];
    if (l === undefined) return null;
    texto += l;
  }
  return texto;
}

// ---------- Crucigrama ----------
export const LADO_CRUCIGRAMA = 9;

/**
 * Arma un crucigrama con palabras del grupo (cada una {palabra, pista}) que se
 * crucen entre sí, sin pasar de `lado`×`lado`. Usa hasta `meta` palabras.
 */
export function generarCrucigrama(grupo, semilla, { meta = 6, lado = LADO_CRUCIGRAMA } = {}) {
  const r = aleatorio(semilla);
  const celdas = new Map(); // "f,c" -> letra
  const clave = (f, c) => `${f},${c}`;
  const puestas = [];
  let caja = null;

  const cabe = (letras, f, c, dir) => {
    const [df, dc] = dir === 'h' ? [0, 1] : [1, 0];
    const n = letras.length;
    if (celdas.has(clave(f - df, c - dc)) || celdas.has(clave(f + df * n, c + dc * n))) return -1;
    let cruces = 0;
    for (let i = 0; i < n; i++) {
      const ff = f + df * i;
      const cc = c + dc * i;
      const actual = celdas.get(clave(ff, cc));
      if (actual === letras[i]) cruces++;
      else if (actual !== undefined) return -1;
      // Una letra nueva no puede quedar pegada a otra por los lados.
      else if (celdas.has(clave(ff + dc, cc + df)) || celdas.has(clave(ff - dc, cc - df)))
        return -1;
    }
    if (cruces === n) return -1;
    const fMin = Math.min(caja.fMin, f);
    const cMin = Math.min(caja.cMin, c);
    const fMax = Math.max(caja.fMax, f + df * (n - 1));
    const cMax = Math.max(caja.cMax, c + dc * (n - 1));
    if (fMax - fMin + 1 > lado || cMax - cMin + 1 > lado) return -1;
    return cruces;
  };

  const poner = (entrada, letras, f, c, dir) => {
    const [df, dc] = dir === 'h' ? [0, 1] : [1, 0];
    letras.forEach((l, i) => celdas.set(clave(f + df * i, c + dc * i), l));
    const n = letras.length;
    caja = {
      fMin: Math.min(caja?.fMin ?? f, f),
      cMin: Math.min(caja?.cMin ?? c, c),
      fMax: Math.max(caja?.fMax ?? f, f + df * (n - 1)),
      cMax: Math.max(caja?.cMax ?? c, c + dc * (n - 1)),
    };
    puestas.push({ entrada, f, c, dir });
  };

  const pendientes = [...grupo];
  const primera = pendientes.findIndex((e) => largo(normalizar(e.palabra)) >= 5);
  if (primera < 0) return null;
  const [inicial] = pendientes.splice(primera, 1);
  poner(inicial, Array.from(normalizar(inicial.palabra)), 0, 0, 'h');

  let avance = true;
  while (avance && puestas.length < meta) {
    avance = false;
    for (let k = 0; k < pendientes.length && puestas.length < meta; k++) {
      const entrada = pendientes[k];
      const letras = Array.from(normalizar(entrada.palabra));
      const opciones = [];
      for (const [pos, l] of celdas) {
        const [f, c] = pos.split(',').map(Number);
        letras.forEach((x, i) => {
          if (x !== l) return;
          for (const [dir, ff, cc] of [
            ['h', f, c - i],
            ['v', f - i, c],
          ]) {
            const cruces = cabe(letras, ff, cc, dir);
            if (cruces > 0) opciones.push({ ff, cc, dir, cruces, azar: r() });
          }
        });
      }
      if (!opciones.length) continue;
      opciones.sort((a, b) => b.cruces - a.cruces || a.azar - b.azar);
      const o = opciones[0];
      poner(entrada, letras, o.ff, o.cc, o.dir);
      pendientes.splice(k, 1);
      k--;
      avance = true;
    }
  }

  const palabras = puestas
    .map(({ entrada, f, c, dir }) => ({
      palabra: entrada.palabra,
      fila: f - caja.fMin,
      col: c - caja.cMin,
      dir,
      pista: entrada.pista,
    }))
    .sort((a, b) => a.fila - b.fila || a.col - b.col || (a.dir === 'h' ? -1 : 1));
  return {
    ancho: caja.cMax - caja.cMin + 1,
    alto: caja.fMax - caja.fMin + 1,
    palabras,
    usadas: puestas.map((p) => p.entrada),
  };
}

/**
 * Revisa que un crucigrama sea coherente: cada palabra dentro de la rejilla y
 * sin letras que choquen donde se cruzan. Devuelve la lista de problemas.
 */
export function problemasCrucigrama(x) {
  const problemas = [];
  const celdas = new Map();
  for (const p of x.palabras ?? []) {
    const letras = Array.from(normalizar(p.palabra ?? ''));
    const [df, dc] = p.dir === 'h' ? [0, 1] : [1, 0];
    if (!['h', 'v'].includes(p.dir)) problemas.push(`${p.palabra}: dirección inválida`);
    letras.forEach((l, i) => {
      const f = p.fila + df * i;
      const c = p.col + dc * i;
      if (f < 0 || c < 0 || f >= x.alto || c >= x.ancho) {
        problemas.push(`${p.palabra}: se sale de la rejilla`);
        return;
      }
      const k = `${f},${c}`;
      if (celdas.has(k) && celdas.get(k) !== l) problemas.push(`${p.palabra}: choca en ${k}`);
      celdas.set(k, l);
    });
    if (!p.pista?.es || !p.pista?.en) problemas.push(`${p.palabra}: falta pista en ES o EN`);
  }
  return [...new Set(problemas)];
}
