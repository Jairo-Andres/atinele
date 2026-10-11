import { describe, expect, it } from 'vitest';
import { esGanador, estadoTeclado, evaluar } from '../../src/juego/evaluar';

const C = 'correcta';
const P = 'presente';
const A = 'ausente';

describe('evaluar', () => {
  it('todas correctas', () => {
    expect(evaluar('PERRO', 'perro')).toEqual([C, C, C, C, C]);
    expect(esGanador(evaluar('PERRO', 'perro'))).toBe(true);
  });

  it('ninguna letra', () => {
    expect(evaluar('PERRO', 'NUBIL')).toEqual([A, A, A, A, A]);
  });

  it('letras repetidas en el intento: CASAS / SALSA', () => {
    // S en 0 y en 3 están en otro lugar, A en 1 correcta, L no está, A en 4 en otro lugar.
    expect(evaluar('CASAS', 'SALSA')).toEqual([P, C, A, P, P]);
  });

  it('no marca más presentes que las que hay: PERRO / RORRO', () => {
    expect(evaluar('PERRO', 'RORRO')).toEqual([A, A, C, C, C]);
  });

  it('letra repetida en el intento pero única en la respuesta', () => {
    expect(evaluar('LIMON', 'OSOSO')).toEqual([P, A, A, A, A]);
  });

  it('las tildes no cuentan', () => {
    expect(evaluar('ÁRBOL', 'arbol')).toEqual([C, C, C, C, C]);
  });

  it('la Ñ es distinta de la N', () => {
    expect(evaluar('SUEÑO', 'SUENO')).toEqual([C, C, C, A, C]);
  });

  it('falla si el largo es distinto', () => {
    expect(() => evaluar('PERRO', 'PERROS')).toThrow(/Largo distinto/);
  });

  it('esGanador es falso sin estados', () => {
    expect(esGanador([])).toBe(false);
  });
});

describe('estadoTeclado', () => {
  it('guarda el mejor estado de cada letra', () => {
    const mapa = estadoTeclado('PERRO', ['ROBLE', 'PERRO']);
    expect(mapa.get('R')).toBe(C);
    expect(mapa.get('B')).toBe(A);
    expect(mapa.get('E')).toBe(C);
  });

  it('no baja de correcta a presente', () => {
    const mapa = estadoTeclado('CASAS', ['CASAS', 'SALSA']);
    expect(mapa.get('S')).toBe(C);
  });
});
