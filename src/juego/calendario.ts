import { numeroReto } from './dia';

export interface DiaCalendario {
  n: number;
  palabra: string;
}

export interface Calendario {
  inicio: string;
  dias: DiaCalendario[];
}

export interface RetoDelDia {
  numero: number;
  palabra: string;
  /** true si el calendario se acabó y se está repitiendo el ciclo. */
  repetido: boolean;
}

export function retoDelDia(calendario: Calendario, hoy: string): RetoDelDia {
  if (calendario.dias.length === 0) throw new Error('El calendario está vacío');
  const numero = numeroReto(calendario.inicio, hoy);
  const indice = (numero - 1) % calendario.dias.length;
  const dia = calendario.dias[indice] as DiaCalendario;
  return { numero, palabra: dia.palabra, repetido: numero > calendario.dias.length };
}
