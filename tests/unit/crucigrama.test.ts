import { describe, expect, it } from 'vitest';
import {
  armar,
  completo,
  entradasEn,
  errores,
  palabrasResueltas,
  type Crucigrama,
} from '../../src/juego/crucigrama';

// S O L
// . . U
// . . N
// . . A
const x: Crucigrama = {
  id: 'k001',
  ancho: 3,
  alto: 4,
  palabras: [
    { palabra: 'sol', fila: 0, col: 0, dir: 'h', pista: { es: 'Estrella', en: 'Star' } },
    { palabra: 'luna', fila: 0, col: 2, dir: 'v', pista: { es: 'Satélite', en: 'Moon' } },
  ],
};

describe('crucigrama', () => {
  const t = armar(x);

  it('numera las casillas donde empieza alguna palabra', () => {
    expect(t.numeros[0]).toBe(1);
    expect(t.numeros[2]).toBe(2);
    expect(t.numeros[1]).toBeNull();
    expect(t.entradas.map((e) => [e.numero, e.dir])).toEqual([
      [1, 'h'],
      [2, 'v'],
    ]);
  });

  it('las casillas vacías son negras y las demás tienen su letra', () => {
    expect(t.solucion).toEqual(['S', 'O', 'L', null, null, 'U', null, null, 'N', null, null, 'A']);
  });

  it('en el cruce pasan las dos palabras', () => {
    expect(entradasEn(t, 2).map((e) => e.palabra)).toEqual(['sol', 'luna']);
    expect(entradasEn(t, 0).map((e) => e.palabra)).toEqual(['sol']);
  });

  it('revisa errores, palabras resueltas y si está completo', () => {
    const escritas = Array(12).fill('');
    escritas[0] = 'S';
    escritas[1] = 'O';
    escritas[2] = 'L';
    escritas[5] = 'X';
    expect(errores(t, escritas)).toEqual([5]);
    expect(palabrasResueltas(t, escritas)).toBe(1);
    expect(completo(t, escritas)).toBe(false);
    escritas[5] = 'U';
    escritas[8] = 'N';
    escritas[11] = 'A';
    expect(completo(t, escritas)).toBe(true);
    expect(palabrasResueltas(t, escritas)).toBe(2);
  });
});
