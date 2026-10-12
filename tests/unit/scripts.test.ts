import { describe, expect, it } from 'vitest';
import { normalizar } from '../../src/juego/normalizar';
// @ts-expect-error: módulo JS de los scripts, sin tipos.
import { normalizar as normalizarScript, tipoTitulo } from '../../scripts/lib.mjs';
// @ts-expect-error: módulo JS de los scripts, sin tipos.
import { convertir, distanciaMaxima } from '../../scripts/descargar-divipola.mjs';
// @ts-expect-error: módulo JS de los scripts, sin tipos.
import { ISO_A_DANE, codigoDane, convertirMapa, geometrias } from '../../scripts/generar-mapa.mjs';

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

describe('mapa (Natural Earth)', () => {
  const poligono = {
    type: 'Polygon',
    coordinates: [
      [
        [-75, 5],
        [-74, 5],
        [-74, 6],
        [-75, 5],
      ],
    ],
  };
  const feature = (name: string, iso: string) => ({
    type: 'Feature',
    properties: { name, iso_3166_2: iso },
    geometry: poligono,
  });

  it('asigna el código DANE y separa Bogotá de Cundinamarca', () => {
    expect(codigoDane({ name: 'Antioquia', iso_3166_2: 'CO-ANT' })).toBe('05');
    expect(codigoDane({ name: 'Cundinamarca', iso_3166_2: 'CO-CUN' })).toBe('25');
    expect(codigoDane({ name: 'Bogota', iso_3166_2: 'CO-CUN' })).toBe('11');
    expect(codigoDane({ name: 'Zona', iso_3166_2: 'CO-X01~' })).toBeNull();
    expect(Object.keys(ISO_A_DANE)).toHaveLength(32);
  });

  it('lee FeatureCollection, GeometryCollection, Feature y geometría suelta', () => {
    expect(geometrias({ type: 'FeatureCollection', features: [feature('A', 'CO-ANT')] })).toEqual([
      poligono,
    ]);
    expect(geometrias({ type: 'GeometryCollection', geometries: [poligono] })).toEqual([poligono]);
    expect(geometrias(feature('A', 'CO-ANT'))).toEqual([poligono]);
    expect(geometrias(poligono)).toEqual([poligono]);
  });

  it('exige 33 departamentos sin repetir', () => {
    const todos = [
      ...Object.keys(ISO_A_DANE).map((iso) => feature(iso, iso)),
      feature('Bogota', 'CO-CUN'),
    ];
    const vecinos = { type: 'GeometryCollection', geometries: [poligono] };
    const ok = convertirMapa({ type: 'FeatureCollection', features: todos }, vecinos);
    expect(ok.errores).toEqual([]);
    expect(ok.departamentos).toHaveLength(33);
    expect(ok.departamentos[0].codDpto).toBe('05');
    expect(ok.vecinos).toHaveLength(1);

    const mal = convertirMapa(
      {
        type: 'FeatureCollection',
        features: [feature('A', 'CO-ANT'), feature('A', 'CO-ANT'), feature('?', 'CO-X01~')],
      },
      vecinos,
    );
    expect(mal.errores.join(' ')).toMatch(/sin código DANE/);
    expect(mal.errores.join(' ')).toMatch(/repetidos: 05/);
    expect(mal.errores.join(' ')).toMatch(/33 departamentos/);
  });
});
