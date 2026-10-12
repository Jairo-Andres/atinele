import { describe, expect, it } from 'vitest';
import { normalizar } from '../../src/juego/normalizar';
// @ts-expect-error: módulo JS de los scripts, sin tipos.
import { normalizar as normalizarScript, tipoTitulo } from '../../scripts/lib.mjs';
// @ts-expect-error: módulo JS de los scripts, sin tipos.
import { convertir, distanciaMaxima } from '../../scripts/descargar-divipola.mjs';

describe('scripts/lib.mjs', () => {
  it('normaliza igual que el juego', () => {
    for (const p of ['árbol', 'SUEÑO', 'pingüino', ' Limón ', 'ñandú']) {
      expect(normalizarScript(p)).toBe(normalizar(p));
    }
  });
});

describe('DIVIPOLA', () => {
  it('pasa nombres a tipo título', () => {
    expect(tipoTitulo('MEDELLÍN')).toBe('Medellín');
    expect(tipoTitulo('CARTAGENA DE INDIAS')).toBe('Cartagena de Indias');
    expect(tipoTitulo('BOGOTÁ, D.C.')).toBe('Bogotá, D.C.');
    expect(tipoTitulo('VALLE DEL CAUCA')).toBe('Valle del Cauca');
    expect(tipoTitulo('ARCHIPIÉLAGO DE SAN ANDRÉS, PROVIDENCIA Y SANTA CATALINA')).toBe(
      'Archipiélago de San Andrés, Providencia y Santa Catalina',
    );
    expect(tipoTitulo('EL CARMEN DE VIBORAL')).toBe('El Carmen de Viboral');
  });

  it('convierte filas con coma decimal y valida coordenadas', () => {
    const { municipios, errores } = convertir([
      {
        cod_dpto: '05',
        dpto: 'ANTIOQUIA',
        cod_mpio: '05001',
        nom_mpio: 'MEDELLÍN',
        tipo_municipio: 'Municipio',
        longitud: '-75,581775',
        latitud: '6,246631',
      },
      {
        cod_dpto: '05',
        dpto: 'ANTIOQUIA',
        cod_mpio: '05001',
        nom_mpio: 'REPETIDO',
        tipo_municipio: 'Municipio',
        longitud: '-75,5',
        latitud: '6,2',
      },
      {
        cod_dpto: '99',
        dpto: 'X',
        cod_mpio: '99999',
        nom_mpio: 'LEJOS',
        tipo_municipio: 'Municipio',
        longitud: '10',
        latitud: '50',
      },
    ]);
    expect(municipios[0]).toEqual({
      cod: '05001',
      nombre: 'Medellín',
      dpto: 'Antioquia',
      codDpto: '05',
      tipo: 'Municipio',
      lat: 6.246631,
      lon: -75.581775,
    });
    expect(errores).toHaveLength(2);
    expect(errores[0]).toMatch(/repetido/);
    expect(errores[1]).toMatch(/fuera de Colombia/);
  });

  it('distancia máxima entre todos los pares', () => {
    expect(
      distanciaMaxima([
        { lat: 0, lon: 0 },
        { lat: 0, lon: 1 },
        { lat: 0, lon: 2 },
      ]),
    ).toBe(222);
  });
});
