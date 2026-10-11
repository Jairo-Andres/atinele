import { describe, expect, it } from 'vitest';
import {
  esPalabraValidaDeForma,
  letras,
  normalizar,
  normalizarNombre,
} from '../../src/juego/normalizar';

describe('normalizar', () => {
  it('pasa a mayúsculas y quita tildes y diéresis', () => {
    expect(normalizar('árbol')).toBe('ARBOL');
    expect(normalizar('Pingüino')).toBe('PINGUINO');
    expect(normalizar(' limón ')).toBe('LIMON');
  });

  it('conserva la Ñ', () => {
    expect(normalizar('sueño')).toBe('SUEÑO');
    expect(normalizar('SUEÑO')).toBe('SUEÑO');
  });

  it('cuenta la Ñ como una letra', () => {
    expect(letras('sueño')).toEqual(['S', 'U', 'E', 'Ñ', 'O']);
  });

  it('compara nombres sin espacios, guiones ni puntos', () => {
    expect(normalizarNombre('San Andrés de Tumaco')).toBe(normalizarNombre('san andres de-tumaco'));
    expect(normalizarNombre('Bogotá, D.C.')).toBe('BOGOTA,DC');
  });

  it('valida forma y largo', () => {
    expect(esPalabraValidaDeForma('sueño', 5)).toBe(true);
    expect(esPalabraValidaDeForma('sue1o', 5)).toBe(false);
    expect(esPalabraValidaDeForma('casa', 5)).toBe(false);
  });
});
