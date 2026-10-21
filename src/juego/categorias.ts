// Modo Categoría: se adivina una palabra sabiendo a qué categoría pertenece
// (aseo, hogar, cocina…). Mismas reglas de colores del modo Palabra.
import type { Texto } from './dichos';
import { letras, normalizar } from './normalizar';

export interface NombreCategoria extends Texto {
  icono: string;
}

export interface RetoCategoria {
  id: string;
  categoria: NombreCategoria;
  /** La palabra con tildes, en minúscula (como se muestra al final). */
  palabra: string;
  pista: Texto;
}

/** Respuesta normalizada (mayúsculas, sin tildes, con Ñ). */
export function respuestaCategoria(r: RetoCategoria): string {
  return normalizar(r.palabra);
}

export function largoCategoria(r: RetoCategoria): number {
  return letras(respuestaCategoria(r)).length;
}
