import { describe, expect, it } from 'vitest';
import { letraEn, linea, palabraEntre, type Sopa } from '../../src/juego/sopa';

const sopa: Sopa = {
  id: 's001',
  tema: { es: 'Prueba', en: 'Test', icono: '🧪' },
  filas: ['SOLX', 'XAXX', 'XXÑX', 'MARX'],
  palabras: [
    { palabra: 'sol', inicio: [0, 0], fin: [0, 2] },
    { palabra: 'saña', inicio: [0, 0], fin: [3, 3] },
    { palabra: 'mar', inicio: [3, 0], fin: [3, 2] },
  ],
};

describe('sopa de letras', () => {
  it('líneas rectas en las 8 direcciones; las demás no', () => {
    expect(linea([0, 0], [0, 2])).toEqual([
      [0, 0],
      [0, 1],
      [0, 2],
    ]);
    expect(linea([2, 2], [0, 0])).toEqual([
      [2, 2],
      [1, 1],
      [0, 0],
    ]);
    expect(linea([3, 0], [1, 0])).toHaveLength(3);
    expect(linea([0, 0], [1, 2])).toBeNull();
    expect(linea([1, 1], [1, 1])).toEqual([[1, 1]]);
  });

  it('una palabra se reconoce en cualquier sentido', () => {
    expect(palabraEntre(sopa, [0, 0], [0, 2])?.palabra).toBe('sol');
    expect(palabraEntre(sopa, [3, 2], [3, 0])?.palabra).toBe('mar');
    expect(palabraEntre(sopa, [0, 0], [0, 1])).toBeNull();
  });

  it('la Ñ ocupa una sola casilla', () => {
    expect(letraEn(sopa, [2, 2])).toBe('Ñ');
    expect(letraEn(sopa, [2, 3])).toBe('X');
    expect(letraEn(sopa, [9, 9])).toBe('');
  });
});
