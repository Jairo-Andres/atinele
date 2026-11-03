import { describe, expect, it } from 'vitest';
import {
  generarCrucigrama,
  generarSopa,
  letrasEntre,
  mezclar,
  problemasCrucigrama,
  // @ts-expect-error: módulo JS de los scripts, sin tipos.
} from '../../scripts/rejillas.mjs';
import { normalizar } from '../../src/juego/normalizar';

interface Ubicada {
  palabra: string;
  inicio: [number, number];
  fin: [number, number];
}

describe('scripts/rejillas.mjs: sopa', () => {
  const palabras = ['magdalena', 'cauca', 'atrato', 'meta', 'sinú', 'caquetá', 'cañón', 'oso'];

  it('ubica todas las palabras donde dice y rellena el resto', () => {
    const s = generarSopa(palabras, 7);
    expect(s.filas).toHaveLength(10);
    for (const f of s.filas) expect(Array.from(f as string)).toHaveLength(10);
    for (const p of s.palabras as Ubicada[]) {
      expect(letrasEntre(s.filas, p.inicio, p.fin)).toBe(normalizar(p.palabra));
    }
    expect((s.palabras as Ubicada[]).map((p) => p.palabra)).toEqual(palabras);
  });

  it('es determinista', () => {
    expect(generarSopa(palabras, 99)).toEqual(generarSopa(palabras, 99));
    expect(generarSopa(palabras, 99)).not.toEqual(generarSopa(palabras, 100));
  });

  it('falla con claridad si no caben', () => {
    expect(() => generarSopa(['abcdefghijk'], 1)).toThrow(/No se pudieron ubicar/);
  });

  it('letrasEntre: solo líneas rectas dentro de la rejilla', () => {
    const filas = ['ABC', 'DEF', 'GHI'];
    expect(letrasEntre(filas, [0, 0], [2, 2])).toBe('AEI');
    expect(letrasEntre(filas, [2, 0], [0, 0])).toBe('GDA');
    expect(letrasEntre(filas, [0, 0], [1, 2])).toBeNull();
    expect(letrasEntre(filas, [0, 0], [0, 5])).toBeNull();
  });
});

describe('scripts/rejillas.mjs: crucigrama', () => {
  const grupo = [
    'colibrí',
    'bogotá',
    'cali',
    'tinto',
    'arepa',
    'panela',
    'ruana',
    'salsa',
    'tejo',
    'oro',
  ].map((palabra) => ({ palabra, pista: { es: 'x', en: 'x' } }));

  it('arma un crucigrama coherente de hasta 9×9 con palabras que se cruzan', () => {
    const x = generarCrucigrama(mezclar(grupo, 3), 11);
    expect(x.palabras.length).toBeGreaterThanOrEqual(5);
    expect(x.ancho).toBeLessThanOrEqual(9);
    expect(x.alto).toBeLessThanOrEqual(9);
    expect(problemasCrucigrama(x)).toEqual([]);
    expect(x.usadas).toHaveLength(x.palabras.length);
  });

  it('sin palabras de 5 letras o más no arma nada', () => {
    expect(generarCrucigrama([{ palabra: 'sol', pista: { es: 'x', en: 'x' } }], 1)).toBeNull();
  });

  it('detecta choques, palabras fuera de la rejilla y pistas faltantes', () => {
    const malo = {
      ancho: 3,
      alto: 3,
      palabras: [
        { palabra: 'sol', fila: 0, col: 0, dir: 'h', pista: { es: 'x', en: 'x' } },
        { palabra: 'mar', fila: 0, col: 2, dir: 'v', pista: { es: 'x' } },
        { palabra: 'luna', fila: 0, col: 0, dir: 'v', pista: { es: 'x', en: 'x' } },
      ],
    };
    const p = problemasCrucigrama(malo).join(' | ');
    expect(p).toMatch(/mar: choca/);
    expect(p).toMatch(/mar: falta pista/);
    expect(p).toMatch(/luna: se sale/);
  });
});
