// Modo Dicho: un dicho colombiano con una palabra oculta.
import { letras, normalizar } from './normalizar';

export interface Texto {
  es: string;
  en: string;
}

export interface Dicho {
  id: string;
  texto: string;
  /** La palabra oculta tal como aparece en el texto (con tildes). */
  oculta: string;
  significado: Texto;
  pista: Texto;
  fuente: { nombre: string; url: string };
}

export interface PartesDicho {
  antes: string;
  /** La palabra tal como aparece en el texto (respeta mayúscula inicial). */
  palabra: string;
  despues: string;
}

const LETRA = /[\p{L}\p{M}]/u;

/**
 * Divide el dicho alrededor de la primera aparición de la palabra oculta como
 * palabra completa (sin importar mayúsculas). Devuelve null si no aparece.
 */
export function partesDicho(texto: string, oculta: string): PartesDicho | null {
  const t = texto.toLocaleLowerCase('es-CO');
  const o = oculta.toLocaleLowerCase('es-CO');
  if (!o) return null;
  let desde = 0;
  for (;;) {
    const i = t.indexOf(o, desde);
    if (i < 0) return null;
    const antes = texto[i - 1];
    const despues = texto[i + o.length];
    const borde = (c: string | undefined) => c === undefined || !LETRA.test(c);
    if (borde(antes) && borde(despues)) {
      return {
        antes: texto.slice(0, i),
        palabra: texto.slice(i, i + o.length),
        despues: texto.slice(i + o.length),
      };
    }
    desde = i + 1;
  }
}

/** Respuesta normalizada (mayúsculas, sin tildes, con Ñ). */
export function respuestaDicho(d: Dicho): string {
  return normalizar(d.oculta);
}

export function largoDicho(d: Dicho): number {
  return letras(respuestaDicho(d)).length;
}

/** Intentos a partir de los cuales se puede pedir la pista. */
export const INTENTOS_PARA_PISTA = 3;
