// Fecha y número del reto, siempre con la hora de Colombia (UTC−5, sin horario de verano).

export const ZONA = 'America/Bogota';
const DIA_MS = 86_400_000;

/** Fecha de Colombia como AAAA-MM-DD. */
export function hoyEnColombia(ahora: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(ahora);
}

function aMs(fecha: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) throw new Error(`Fecha inválida: ${fecha}`);
  const [a, m, d] = fecha.split('-').map(Number) as [number, number, number];
  return Date.UTC(a, m - 1, d);
}

/** Días entre dos fechas AAAA-MM-DD (b − a). */
export function diasEntre(a: string, b: string): number {
  return Math.round((aMs(b) - aMs(a)) / DIA_MS);
}

/** Número del reto: 1 el día de inicio. Antes del inicio también es 1. */
export function numeroReto(inicio: string, hoy: string): number {
  return Math.max(1, diasEntre(inicio, hoy) + 1);
}

/** Fecha AAAA-MM-DD sumando días. */
export function sumarDias(fecha: string, dias: number): string {
  return new Date(aMs(fecha) + dias * DIA_MS).toISOString().slice(0, 10);
}

/** Milisegundos que faltan para la medianoche de Colombia. */
export function msHastaManana(ahora: Date = new Date()): number {
  // Colombia = UTC−5 fijo: la medianoche local son las 05:00 UTC.
  const hoy = hoyEnColombia(ahora);
  const manana = aMs(sumarDias(hoy, 1)) + 5 * 3_600_000;
  return manana - ahora.getTime();
}

export function formatoCuentaRegresiva(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const seg = s % 60;
  return [h, m, seg].map((n) => String(n).padStart(2, '0')).join(':');
}
