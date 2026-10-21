import { describe, expect, it } from 'vitest';
import { largoCategoria, respuestaCategoria } from '../../src/juego/categorias';

const reto = (palabra: string) => ({
  id: 'c001',
  categoria: { es: 'Cocina', en: 'Kitchen', icono: '🍳' },
  palabra,
  pista: { es: 'x', en: 'x' },
});

describe('categorías', () => {
  it('la respuesta va sin tildes y conserva la Ñ', () => {
    expect(respuestaCategoria(reto('sartén'))).toBe('SARTEN');
    expect(respuestaCategoria(reto('piña'))).toBe('PIÑA');
  });

  it('el largo cuenta letras, no tildes', () => {
    expect(largoCategoria(reto('acordeón'))).toBe(8);
    expect(largoCategoria(reto('piña'))).toBe(4);
  });
});
