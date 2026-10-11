import { letras } from './normalizar';

export type EstadoLetra = 'correcta' | 'presente' | 'ausente';

const PRIORIDAD: Record<EstadoLetra, number> = { ausente: 0, presente: 1, correcta: 2 };

/**
 * Colores por letra con el algoritmo de dos pasadas, para que las letras
 * repetidas se marquen bien.
 */
export function evaluar(respuesta: string, intento: string): EstadoLetra[] {
  const r = letras(respuesta);
  const i = letras(intento);
  if (r.length !== i.length) {
    throw new Error(`Largo distinto: respuesta ${r.length}, intento ${i.length}`);
  }
  const resultado: EstadoLetra[] = i.map(() => 'ausente');
  const pendientes = new Map<string, number>();
  for (const l of r) pendientes.set(l, (pendientes.get(l) ?? 0) + 1);

  i.forEach((l, k) => {
    if (l === r[k]) {
      resultado[k] = 'correcta';
      pendientes.set(l, (pendientes.get(l) ?? 0) - 1);
    }
  });
  i.forEach((l, k) => {
    if (resultado[k] === 'correcta') return;
    const quedan = pendientes.get(l) ?? 0;
    if (quedan > 0) {
      resultado[k] = 'presente';
      pendientes.set(l, quedan - 1);
    }
  });
  return resultado;
}

export function esGanador(estados: EstadoLetra[]): boolean {
  return estados.length > 0 && estados.every((e) => e === 'correcta');
}

/** Mejor estado visto por cada letra, para colorear el teclado. */
export function estadoTeclado(respuesta: string, intentos: string[]): Map<string, EstadoLetra> {
  const mapa = new Map<string, EstadoLetra>();
  for (const intento of intentos) {
    const estados = evaluar(respuesta, intento);
    letras(intento).forEach((l, k) => {
      const nuevo = estados[k] as EstadoLetra;
      const actual = mapa.get(l);
      if (!actual || PRIORIDAD[nuevo] > PRIORIDAD[actual]) mapa.set(l, nuevo);
    });
  }
  return mapa;
}
