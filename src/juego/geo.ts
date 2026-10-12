// Distancia, dirección y cercanía entre municipios (ver docs/02-reglas-y-modos.md).

export interface Punto {
  lat: number;
  lon: number;
}

const RADIO_TIERRA_KM = 6371;
const rad = (g: number) => (g * Math.PI) / 180;

/** Distancia en km por la fórmula de haversine. */
export function distanciaKm(a: Punto, b: Punto): number {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * RADIO_TIERRA_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Rumbo inicial de a hacia b, en grados (0 = norte, 90 = este). */
export function rumbo(a: Punto, b: Punto): number {
  const y = Math.sin(rad(b.lon - a.lon)) * Math.cos(rad(b.lat));
  const x =
    Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) -
    Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lon - a.lon));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export const DIRECCIONES = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'] as const;
export type Direccion = (typeof DIRECCIONES)[number];

/** Rumbo redondeado a uno de los 8 puntos cardinales. */
export function direccion(grados: number): Direccion {
  return DIRECCIONES[Math.round(grados / 45) % 8] as Direccion;
}

export const FLECHAS: Record<Direccion, string> = {
  N: '⬆️',
  NE: '↗️',
  E: '➡️',
  SE: '↘️',
  S: '⬇️',
  SO: '↙️',
  O: '⬅️',
  NO: '↖️',
};

/** Cercanía de 0 a 100 (100 = mismo lugar), relativa a la mayor distancia posible. */
export function cercania(distancia: number, distanciaMax: number): number {
  if (distanciaMax <= 0) return distancia === 0 ? 100 : 0;
  return Math.round(Math.max(0, 100 - (distancia / distanciaMax) * 100));
}
