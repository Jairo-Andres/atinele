// Tabla de clasificación entre los jugadores de este navegador.
import type { Perfil } from '../almacen';
import { rachaVigente, type Estadisticas } from './estadisticas';

export interface FilaClasificacion {
  id: string;
  nombre: string;
  puntos: number;
  ganadas: number;
  jugadas: number;
  racha: number;
}

/** 6 puntos por acertar en el 1.er intento, 5 en el 2.º … 1 en el 6.º. */
export function puntos(e: Estadisticas): number {
  const n = e.distribucion.length;
  return e.distribucion.reduce((suma, v, i) => suma + v * (n - i), 0);
}

/** Ordena por puntos, luego victorias y luego nombre. */
export function clasificacion(perfiles: Perfil[], hoy: string): FilaClasificacion[] {
  return perfiles
    .map((p) => {
      const todas = Object.values(p.estadisticas);
      return {
        id: p.id,
        nombre: p.nombre,
        puntos: todas.reduce((s, e) => s + puntos(e), 0),
        ganadas: todas.reduce((s, e) => s + e.ganadas, 0),
        jugadas: todas.reduce((s, e) => s + e.jugadas, 0),
        racha: Math.max(0, ...todas.map((e) => rachaVigente(e, hoy))),
      };
    })
    .sort(
      (a, b) =>
        b.puntos - a.puntos || b.ganadas - a.ganadas || a.nombre.localeCompare(b.nombre, 'es'),
    );
}
