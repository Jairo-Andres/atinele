import { describe, expect, it } from 'vitest';
import { cercania, direccion, distanciaKm, rumbo } from '../../src/juego/geo';

// Puntos de prueba sobre el ecuador y un meridiano: los resultados se pueden
// calcular a mano (1 grado de arco ≈ 111,19 km con radio 6371 km).
const origen = { lat: 0, lon: 0 };

describe('distanciaKm', () => {
  it('es 0 en el mismo punto', () => {
    expect(distanciaKm(origen, origen)).toBe(0);
  });

  it('un grado sobre el ecuador ≈ 111,19 km', () => {
    expect(distanciaKm(origen, { lat: 0, lon: 1 })).toBeCloseTo(111.19, 1);
    expect(distanciaKm(origen, { lat: 1, lon: 0 })).toBeCloseTo(111.19, 1);
  });

  it('es simétrica', () => {
    const a = { lat: 4.6, lon: -74.1 };
    const b = { lat: 6.2, lon: -75.6 };
    expect(distanciaKm(a, b)).toBeCloseTo(distanciaKm(b, a), 9);
  });
});

describe('rumbo y dirección', () => {
  it('los 4 puntos cardinales', () => {
    expect(direccion(rumbo(origen, { lat: 1, lon: 0 }))).toBe('N');
    expect(direccion(rumbo(origen, { lat: 0, lon: 1 }))).toBe('E');
    expect(direccion(rumbo(origen, { lat: -1, lon: 0 }))).toBe('S');
    expect(direccion(rumbo(origen, { lat: 0, lon: -1 }))).toBe('O');
  });

  it('las diagonales', () => {
    expect(direccion(rumbo(origen, { lat: 1, lon: 1 }))).toBe('NE');
    expect(direccion(rumbo(origen, { lat: -1, lon: 1 }))).toBe('SE');
    expect(direccion(rumbo(origen, { lat: -1, lon: -1 }))).toBe('SO');
    expect(direccion(rumbo(origen, { lat: 1, lon: -1 }))).toBe('NO');
  });

  it('redondea al punto más cercano y da la vuelta en 360', () => {
    expect(direccion(22)).toBe('N');
    expect(direccion(23)).toBe('NE');
    expect(direccion(359)).toBe('N');
  });
});

describe('cercania', () => {
  it('va de 0 a 100', () => {
    expect(cercania(0, 1000)).toBe(100);
    expect(cercania(250, 1000)).toBe(75);
    expect(cercania(1000, 1000)).toBe(0);
    expect(cercania(2000, 1000)).toBe(0);
  });

  it('no divide por cero', () => {
    expect(cercania(0, 0)).toBe(100);
    expect(cercania(5, 0)).toBe(0);
  });
});
