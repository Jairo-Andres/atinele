import { describe, expect, it } from 'vitest';
import {
  ALTO,
  ANCHO,
  ZOOM_MAX,
  dentro,
  kmAUnidades,
  limitar,
  mover,
  proyectar,
  rutaSvg,
  vistaCompleta,
  zoom,
  type Anillo,
} from '../../src/juego/mapa';
// @ts-expect-error: módulo JS de los scripts, sin tipos.
import { dentro as dentroScript } from '../../scripts/lib.mjs';

const cuadro: Anillo = [
  [-75, 5],
  [-74, 5],
  [-74, 6],
  [-75, 6],
  [-75, 5],
];
const hueco: Anillo = [
  [-74.6, 5.4],
  [-74.4, 5.4],
  [-74.4, 5.6],
  [-74.6, 5.6],
  [-74.6, 5.4],
];

describe('proyección', () => {
  it('pone el norte arriba y el oeste a la izquierda', () => {
    const norte = proyectar(10, -74);
    const sur = proyectar(0, -74);
    const oeste = proyectar(5, -78);
    const este = proyectar(5, -70);
    expect(norte.y).toBeLessThan(sur.y);
    expect(oeste.x).toBeLessThan(este.x);
  });

  it('deja todo el país dentro del recuadro', () => {
    for (const [lat, lon] of [
      [12.58, -81.7], // San Andrés
      [-4.2, -69.94], // Leticia
      [12.46, -71.67], // Punta Gallinas
      [6.19, -67.49], // Puerto Carreño
    ] as const) {
      const p = proyectar(lat, lon);
      expect(p.x).toBeGreaterThan(0);
      expect(p.x).toBeLessThan(ANCHO);
      expect(p.y).toBeGreaterThan(0);
      expect(p.y).toBeLessThan(ALTO);
    }
  });

  it('un grado de latitud equivale a 111 km', () => {
    const a = proyectar(4, -74);
    const b = proyectar(5, -74);
    expect(kmAUnidades(111.195)).toBeCloseTo(a.y - b.y, 5);
  });
});

describe('rutaSvg', () => {
  it('convierte cada anillo en un subcamino cerrado', () => {
    const d = rutaSvg([cuadro, hueco]);
    expect(d.match(/M/g)).toHaveLength(2);
    expect(d.match(/Z/g)).toHaveLength(2);
    expect(d.startsWith('M')).toBe(true);
  });

  it('ignora anillos degenerados', () => {
    expect(
      rutaSvg([
        [
          [-74, 5],
          [-74, 6],
        ],
      ]),
    ).toBe('');
  });
});

describe('dentro', () => {
  it('detecta puntos dentro, fuera y en un hueco', () => {
    expect(dentro(5.2, -74.8, [cuadro, hueco])).toBe(true);
    expect(dentro(5.5, -74.5, [cuadro, hueco])).toBe(false);
    expect(dentro(7, -74.5, [cuadro, hueco])).toBe(false);
  });

  it('el script de validación usa la misma regla', () => {
    for (const [lat, lon] of [
      [5.2, -74.8],
      [5.5, -74.5],
      [7, -74.5],
      [5.99, -74.01],
    ] as const) {
      expect(dentroScript(lat, lon, [cuadro, hueco])).toBe(dentro(lat, lon, [cuadro, hueco]));
    }
  });
});

describe('vista', () => {
  it('acercar mantiene fijo el punto elegido', () => {
    const v = vistaCompleta();
    const cx = ANCHO / 2;
    const cy = ALTO / 2;
    const z = zoom(v, 2, cx, cy);
    expect(z.w).toBeCloseTo(ANCHO / 2);
    expect(z.h).toBeCloseTo(ALTO / 2);
    expect((cx - z.x) / z.w).toBeCloseTo((cx - v.x) / v.w);
  });

  it('no aleja más que el país ni acerca más que el máximo', () => {
    expect(zoom(vistaCompleta(), 0.25, 10, 10)).toEqual(vistaCompleta());
    const muy = zoom(vistaCompleta(), 100, ANCHO / 2, ALTO / 2);
    expect(muy.w).toBeCloseTo(ANCHO / ZOOM_MAX);
  });

  it('mover no se sale del mapa', () => {
    const z = zoom(vistaCompleta(), 4, 0, 0);
    const lejos = mover(z, 99999, 99999);
    expect(lejos.x + lejos.w).toBeCloseTo(ANCHO);
    expect(lejos.y + lejos.h).toBeCloseTo(ALTO);
    expect(limitar({ ...z, x: -50, y: -50 })).toMatchObject({ x: 0, y: 0 });
  });
});
