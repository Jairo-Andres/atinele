import { describe, expect, it } from 'vitest';
import type { Perfil } from '../../src/almacen';
import { clasificacion, puntos } from '../../src/juego/clasificacion';
import { estadisticasVacias, type Estadisticas } from '../../src/juego/estadisticas';

const est = (cambios: Partial<Estadisticas> = {}): Estadisticas => ({
  ...estadisticasVacias(),
  ...cambios,
});

const perfil = (id: string, nombre: string, palabra: Partial<Estadisticas>): Perfil => ({
  id,
  nombre,
  partidas: {},
  estadisticas: {
    palabra: est(palabra),
    municipio: est(),
    dicho: est(),
    categoria: est(),
  },
});

describe('clasificación', () => {
  it('6 puntos en el 1.er intento … 1 en el 6.º', () => {
    expect(puntos(est({ distribucion: [1, 0, 0, 0, 0, 0] }))).toBe(6);
    expect(puntos(est({ distribucion: [0, 0, 0, 0, 0, 1] }))).toBe(1);
    expect(puntos(est({ distribucion: [1, 2, 0, 0, 0, 1] }))).toBe(6 + 10 + 1);
    expect(puntos(est())).toBe(0);
  });

  it('ordena por puntos, luego victorias y luego nombre', () => {
    const filas = clasificacion(
      [
        perfil('j1', 'Carla', { distribucion: [0, 0, 0, 0, 0, 2], ganadas: 2, jugadas: 3 }),
        perfil('j2', 'Ana', { distribucion: [0, 0, 0, 0, 0, 2], ganadas: 2, jugadas: 2 }),
        perfil('j3', 'Beto', { distribucion: [1, 0, 0, 0, 0, 0], ganadas: 1, jugadas: 1 }),
        perfil('j4', 'Dani', { distribucion: [0, 0, 0, 0, 1, 0], ganadas: 1, jugadas: 1 }),
      ],
      '2026-10-19',
    );
    expect(filas.map((f) => f.nombre)).toEqual(['Beto', 'Ana', 'Carla', 'Dani']);
    expect(filas[0]).toMatchObject({ id: 'j3', puntos: 6, ganadas: 1, jugadas: 1 });
  });

  it('la racha es la mejor vigente entre los modos', () => {
    const p = perfil('j1', 'Ana', { racha: 4, ultimoDia: '2026-10-18' });
    p.estadisticas.dicho = est({ racha: 9, ultimoDia: '2026-10-10' }); // ya se perdió
    expect(clasificacion([p], '2026-10-19')[0]?.racha).toBe(4);
  });
});
