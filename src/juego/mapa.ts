// Proyección y geometría del mapa del modo Municipio (sin librerías).
//
// Proyección equirrectangular centrada en la latitud media de Colombia: en un
// país tan cerca del ecuador deforma poco y deja que 1 km mida casi lo mismo en
// cualquier dirección, así que la distancia de una pista se puede dibujar como
// un círculo.

export type Anillo = [number, number][]; // [lon, lat]

export interface DatosMapa {
  fuente: string;
  departamentos: { codDpto: string; anillos: Anillo[] }[];
  vecinos: Anillo[];
}

/** Recuadro que se dibuja (incluye San Andrés y Leticia). */
export const LIMITES = { lonMin: -82, lonMax: -66.6, latMin: -4.4, latMax: 13.6 };
const LAT_MEDIA = 4.6;
const COS = Math.cos((LAT_MEDIA * Math.PI) / 180);
/** Unidades del SVG por grado de latitud. */
export const ESCALA = 40;
const KM_POR_GRADO = 111.195; // 2π·6371/360

export const ANCHO = (LIMITES.lonMax - LIMITES.lonMin) * COS * ESCALA;
export const ALTO = (LIMITES.latMax - LIMITES.latMin) * ESCALA;

export function proyectar(lat: number, lon: number): { x: number; y: number } {
  return {
    x: (lon - LIMITES.lonMin) * COS * ESCALA,
    y: (LIMITES.latMax - lat) * ESCALA,
  };
}

/** Kilómetros a unidades del SVG. */
export function kmAUnidades(km: number): number {
  return (km / KM_POR_GRADO) * ESCALA;
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Atributo d de un path SVG con todos los anillos (usar fill-rule evenodd). */
export function rutaSvg(anillos: Anillo[]): string {
  return anillos
    .filter((a) => a.length > 2)
    .map(
      (a) =>
        'M' +
        a
          .map(([lon, lat]) => {
            const p = proyectar(lat, lon);
            return `${r1(p.x)} ${r1(p.y)}`;
          })
          .join('L') +
        'Z',
    )
    .join('');
}

/** Punto dentro de los anillos (regla par-impar, así los huecos cuentan). */
export function dentro(lat: number, lon: number, anillos: Anillo[]): boolean {
  let adentro = false;
  for (const a of anillos) {
    for (let i = 0, j = a.length - 1; i < a.length; j = i++) {
      const [xi, yi] = a[i] as [number, number];
      const [xj, yj] = a[j] as [number, number];
      if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
        adentro = !adentro;
      }
    }
  }
  return adentro;
}

export interface Vista {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const ZOOM_MAX = 40;

/**
 * Acerca o aleja la vista manteniendo fijo el punto (cx, cy) y sin salirse del
 * mapa. factor > 1 acerca.
 */
export function zoom(v: Vista, factor: number, cx: number, cy: number): Vista {
  const w = Math.min(ANCHO, Math.max(ANCHO / ZOOM_MAX, v.w / factor));
  const h = (w * ALTO) / ANCHO;
  const nueva = { x: cx - ((cx - v.x) * w) / v.w, y: cy - ((cy - v.y) * h) / v.h, w, h };
  return limitar(nueva);
}

export function mover(v: Vista, dx: number, dy: number): Vista {
  return limitar({ ...v, x: v.x + dx, y: v.y + dy });
}

export function limitar(v: Vista): Vista {
  return {
    ...v,
    x: Math.min(Math.max(v.x, 0), ANCHO - v.w),
    y: Math.min(Math.max(v.y, 0), ALTO - v.h),
  };
}

export function vistaCompleta(): Vista {
  return { x: 0, y: 0, w: ANCHO, h: ALTO };
}
