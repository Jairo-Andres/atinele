// Crucigrama: la rejilla llega armada en el calendario. Aquí se numeran las
// casillas, se sabe qué palabras pasan por cada una y se revisan las respuestas.
import type { Texto } from './dichos';
import { letras, normalizar } from './normalizar';

export type Direccion = 'h' | 'v';

export interface PalabraCrucigrama {
  palabra: string;
  fila: number;
  col: number;
  dir: Direccion;
  pista: Texto;
}

export interface Crucigrama {
  id: string;
  ancho: number;
  alto: number;
  palabras: PalabraCrucigrama[];
}

export interface Entrada extends PalabraCrucigrama {
  numero: number;
  respuesta: string[];
  casillas: number[];
}

export interface Tablero {
  ancho: number;
  alto: number;
  /** Letra correcta por casilla (índice fila*ancho+col), o null si es negra. */
  solucion: (string | null)[];
  /** Número que se dibuja en la casilla, si empieza alguna palabra. */
  numeros: (number | null)[];
  entradas: Entrada[];
}

export function armar(x: Crucigrama): Tablero {
  const total = x.ancho * x.alto;
  const solucion: (string | null)[] = Array(total).fill(null);
  const numeros: (number | null)[] = Array(total).fill(null);
  const inicios = [...new Set(x.palabras.map((p) => p.fila * x.ancho + p.col))].sort(
    (a, b) => a - b,
  );
  inicios.forEach((i, n) => (numeros[i] = n + 1));
  const entradas = x.palabras.map((p) => {
    const respuesta = letras(normalizar(p.palabra));
    const casillas = respuesta.map((l, i) => {
      const k = (p.fila + (p.dir === 'v' ? i : 0)) * x.ancho + p.col + (p.dir === 'h' ? i : 0);
      solucion[k] = l;
      return k;
    });
    return { ...p, numero: numeros[casillas[0] as number] as number, respuesta, casillas };
  });
  entradas.sort((a, b) => (a.dir === b.dir ? a.numero - b.numero : a.dir === 'h' ? -1 : 1));
  return { ancho: x.ancho, alto: x.alto, solucion, numeros, entradas };
}

/** Entradas que pasan por una casilla (una o dos). */
export function entradasEn(t: Tablero, casilla: number): Entrada[] {
  return t.entradas.filter((e) => e.casillas.includes(casilla));
}

/** Casillas con una letra distinta de la correcta (las vacías no cuentan). */
export function errores(t: Tablero, escritas: string[]): number[] {
  return t.solucion.flatMap((l, i) => (l !== null && escritas[i] && escritas[i] !== l ? [i] : []));
}

export function completo(t: Tablero, escritas: string[]): boolean {
  return t.solucion.every((l, i) => l === null || escritas[i] === l);
}

/** Cuántas palabras están bien escritas completas. */
export function palabrasResueltas(t: Tablero, escritas: string[]): number {
  return t.entradas.filter((e) => e.casillas.every((k, i) => escritas[k] === e.respuesta[i]))
    .length;
}
