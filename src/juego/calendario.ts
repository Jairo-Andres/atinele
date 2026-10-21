import type { RetoCategoria } from './categorias';
import type { Dicho } from './dichos';
import { numeroReto } from './dia';

export interface DiaCalendario {
  n: number;
  palabra: string;
}

export interface Calendario {
  inicio: string;
  dias: DiaCalendario[];
  /** Códigos DIVIPOLA en orden; su ciclo es independiente del de palabras. */
  municipios?: string[];
  /** Dichos completos en orden (van ofuscados con el calendario); ciclo propio. */
  dichos?: Dicho[];
  /** Palabras por categoría en orden (con su categoría y pista); ciclo propio. */
  categorias?: RetoCategoria[];
}

export interface RetoDelDia {
  numero: number;
  palabra: string;
  /** Código DIVIPOLA del municipio del día, si el calendario tiene municipios. */
  municipio: string | null;
  /** Dicho del día, si el calendario tiene dichos. */
  dicho: Dicho | null;
  /** Palabra por categoría del día, si el calendario tiene categorías. */
  categoria: RetoCategoria | null;
  /** true si el calendario se acabó y se está repitiendo el ciclo. */
  repetido: boolean;
}

export function retoDelDia(calendario: Calendario, hoy: string): RetoDelDia {
  if (calendario.dias.length === 0) throw new Error('El calendario está vacío');
  const numero = numeroReto(calendario.inicio, hoy);
  const indice = (numero - 1) % calendario.dias.length;
  const dia = calendario.dias[indice] as DiaCalendario;
  const municipios = calendario.municipios ?? [];
  const municipio = municipios.length
    ? (municipios[(numero - 1) % municipios.length] as string)
    : null;
  const dichos = calendario.dichos ?? [];
  const dicho = dichos.length ? (dichos[(numero - 1) % dichos.length] as Dicho) : null;
  const categorias = calendario.categorias ?? [];
  const categoria = categorias.length
    ? (categorias[(numero - 1) % categorias.length] as RetoCategoria)
    : null;
  return {
    numero,
    palabra: dia.palabra,
    municipio,
    dicho,
    categoria,
    repetido: numero > calendario.dias.length,
  };
}
