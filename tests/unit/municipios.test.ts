import { describe, expect, it } from 'vitest';
import {
  buscar,
  coincidenciasExactas,
  evaluarMunicipio,
  jugables,
  type Municipio,
} from '../../src/juego/municipios';

// Municipios inventados para la prueba (no son datos reales).
const m = (
  cod: string,
  nombre: string,
  dpto: string,
  lat: number,
  lon: number,
  tipo = 'Municipio',
): Municipio => ({
  cod,
  nombre,
  dpto,
  codDpto: cod.slice(0, 2),
  tipo,
  lat,
  lon,
});

const lista = [
  m('01001', 'San Pedro', 'Uno', 0, 0),
  m('02001', 'San Pedro', 'Dos', 0, 1),
  m('01002', 'Pedregal', 'Uno', 1, 0),
  m('01003', 'Villa Ñandú', 'Uno', -1, 0),
  m('03001', 'El Ápice', 'Tres', 0, -1),
  m('04001', 'Selva Grande', 'Cuatro', 2, 2, 'Área no municipalizada'),
];

describe('buscar', () => {
  it('ordena: empieza por, luego palabra, luego contiene', () => {
    expect(buscar(lista, 'ped').map((x) => x.cod)).toEqual(['01002', '02001', '01001']);
  });

  it('ignora tildes, mayúsculas y espacios', () => {
    expect(buscar(lista, 'el apice').map((x) => x.nombre)).toEqual(['El Ápice']);
    expect(buscar(lista, 'ÑAN').map((x) => x.nombre)).toEqual(['Villa Ñandú']);
  });

  it('respeta el máximo y la consulta vacía', () => {
    expect(buscar(lista, 'e', 2)).toHaveLength(2);
    expect(buscar(lista, '  ')).toEqual([]);
  });
});

describe('coincidencias y jugables', () => {
  it('encuentra nombres repetidos y nombre con departamento', () => {
    expect(coincidenciasExactas(lista, 'san pedro')).toHaveLength(2);
    expect(coincidenciasExactas(lista, 'San Pedro, Dos').map((x) => x.cod)).toEqual(['02001']);
  });

  it('saca las áreas no municipalizadas', () => {
    expect(jugables(lista).map((x) => x.cod)).not.toContain('04001');
  });
});

describe('evaluarMunicipio', () => {
  const respuesta = lista[0] as Municipio;

  it('acierto', () => {
    expect(evaluarMunicipio(respuesta, respuesta, 500)).toMatchObject({
      acierto: true,
      distanciaKm: 0,
      cercania: 100,
      mismoDpto: true,
    });
  });

  it('pista con distancia, dirección y departamento', () => {
    const p = evaluarMunicipio(lista[2] as Municipio, respuesta, 500);
    expect(p.acierto).toBe(false);
    expect(p.distanciaKm).toBe(111);
    expect(p.direccion).toBe('S');
    expect(p.cercania).toBe(78);
    expect(p.mismoDpto).toBe(true);
    expect(evaluarMunicipio(lista[4] as Municipio, respuesta, 500)).toMatchObject({
      direccion: 'E',
      mismoDpto: false,
    });
  });

  it('un intento muy cercano nunca marca 100 si no es el correcto', () => {
    const vecino = m('01009', 'Vecino', 'Uno', 0.0001, 0);
    expect(evaluarMunicipio(vecino, respuesta, 500).cercania).toBe(99);
  });
});
