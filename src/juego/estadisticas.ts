import { diasEntre } from './dia';

export interface Estadisticas {
  jugadas: number;
  ganadas: number;
  racha: number;
  mejorRacha: number;
  /** distribucion[0] = ganadas en 1 intento … distribucion[5] = en 6. */
  distribucion: number[];
  /** Último día (AAAA-MM-DD) en que se terminó una partida. */
  ultimoDia: string | null;
}

export function estadisticasVacias(maxIntentos = 6): Estadisticas {
  return {
    jugadas: 0,
    ganadas: 0,
    racha: 0,
    mejorRacha: 0,
    distribucion: Array.from({ length: maxIntentos }, () => 0),
    ultimoDia: null,
  };
}

/** Registra una partida terminada. Si ese día ya estaba registrado, no cambia nada. */
export function registrarPartida(
  e: Estadisticas,
  dia: string,
  ganada: boolean,
  intentos: number,
): Estadisticas {
  if (e.ultimoDia === dia) return e;
  const consecutivo = e.ultimoDia !== null && diasEntre(e.ultimoDia, dia) === 1;
  const racha = ganada ? (consecutivo ? e.racha + 1 : 1) : 0;
  const distribucion = [...e.distribucion];
  if (ganada && intentos >= 1 && intentos <= distribucion.length) {
    distribucion[intentos - 1] = (distribucion[intentos - 1] ?? 0) + 1;
  }
  return {
    jugadas: e.jugadas + 1,
    ganadas: e.ganadas + (ganada ? 1 : 0),
    racha,
    mejorRacha: Math.max(e.mejorRacha, racha),
    distribucion,
    ultimoDia: dia,
  };
}

/** La racha que se muestra hoy: se pierde si ayer no se terminó el reto. */
export function rachaVigente(e: Estadisticas, hoy: string): number {
  if (e.ultimoDia === null) return 0;
  return diasEntre(e.ultimoDia, hoy) <= 1 ? e.racha : 0;
}

export function porcentajeVictorias(e: Estadisticas): number {
  return e.jugadas === 0 ? 0 : Math.round((e.ganadas / e.jugadas) * 100);
}
