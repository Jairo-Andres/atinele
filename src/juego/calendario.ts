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
}

export interface RetoDelDia {
  numero: number;
  palabra: string;
  /** Código DIVIPOLA del municipio del día, si el calendario tiene municipios. */
  municipio: string | null;
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
  return { numero, palabra: dia.palabra, municipio, repetido: numero > calendario.dias.length };
}
