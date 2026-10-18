// Normalización común para respuestas e intentos (ver docs/02-reglas-y-modos.md).

const MARCA_Ñ = '\u0000';

/** Mayúsculas, sin tildes ni diéresis. La Ñ se conserva como letra propia. */
export function normalizar(texto: string): string {
  return texto
    .trim()
    .toLocaleUpperCase('es-CO')
    .replaceAll('Ñ', MARCA_Ñ)
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replaceAll(MARCA_Ñ, 'Ñ');
}

/**
 * Para buscar nombres de municipios: además quita espacios y signos (puntos,
 * comas, guiones, apóstrofos) y trata la Ñ como N, porque mucha gente escribe
 * "Narino" o "Bogota DC".
 */
export function normalizarNombre(texto: string): string {
  return normalizar(texto)
    .replaceAll('Ñ', 'N')
    .replace(/[^A-Z0-9]/g, '');
}

export const LETRAS = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';

/** Divide en letras (la Ñ cuenta como una). */
export function letras(palabra: string): string[] {
  return Array.from(normalizar(palabra));
}

export function esPalabraValidaDeForma(palabra: string, largo: number): boolean {
  const ls = letras(palabra);
  return ls.length === largo && ls.every((l) => LETRAS.includes(l));
}
