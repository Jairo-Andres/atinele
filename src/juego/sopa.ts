// Sopa de letras: la rejilla llega hecha en el calendario; aquí solo se revisa
// si una selección (de una casilla a otra, en línea recta) es una palabra.
import type { Texto } from './dichos';
import { letras } from './normalizar';

export type Casilla = [fila: number, col: number];

export interface PalabraSopa {
  /** Como se muestra en la lista (con tildes). */
  palabra: string;
  inicio: Casilla;
  fin: Casilla;
}

export interface Sopa {
  id: string;
  tema: Texto & { icono: string };
  /** Filas de letras (mayúsculas, sin tildes, con Ñ). */
  filas: string[];
  palabras: PalabraSopa[];
}

/** Casillas de una línea recta (horizontal, vertical o diagonal) o null si no lo es. */
export function linea(a: Casilla, b: Casilla): Casilla[] | null {
  const df = b[0] - a[0];
  const dc = b[1] - a[1];
  if (df !== 0 && dc !== 0 && Math.abs(df) !== Math.abs(dc)) return null;
  const n = Math.max(Math.abs(df), Math.abs(dc)) + 1;
  const pf = Math.sign(df);
  const pc = Math.sign(dc);
  return Array.from({ length: n }, (_, i) => [a[0] + pf * i, a[1] + pc * i] as Casilla);
}

const igual = (a: Casilla, b: Casilla) => a[0] === b[0] && a[1] === b[1];

/** Palabra de la sopa que va de `a` a `b` (en cualquier sentido), si hay. */
export function palabraEntre(sopa: Sopa, a: Casilla, b: Casilla): PalabraSopa | null {
  return (
    sopa.palabras.find(
      (p) => (igual(p.inicio, a) && igual(p.fin, b)) || (igual(p.inicio, b) && igual(p.fin, a)),
    ) ?? null
  );
}

/** Letra de una casilla (la Ñ cuenta como una sola). */
export function letraEn(sopa: Sopa, [f, c]: Casilla): string {
  return letras(sopa.filas[f] ?? '')[c] ?? '';
}
