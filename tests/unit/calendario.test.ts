import { describe, expect, it } from 'vitest';
import { retoDelDia, type Calendario } from '../../src/juego/calendario';
import { desofuscar, ofuscar } from '../../src/juego/ofuscar';
import calendarioReal from '../../data/contenido/calendario.json';

const cal: Calendario = {
  inicio: '2026-10-12',
  dias: [
    { n: 1, palabra: 'PERRO' },
    { n: 2, palabra: 'SUEÑO' },
  ],
};

describe('retoDelDia', () => {
  it('devuelve el reto según la fecha', () => {
    expect(retoDelDia(cal, '2026-10-12')).toEqual({
      numero: 1,
      palabra: 'PERRO',
      municipio: null,
      dicho: null,
      repetido: false,
    });
    expect(retoDelDia(cal, '2026-10-13')).toEqual({
      numero: 2,
      palabra: 'SUEÑO',
      municipio: null,
      dicho: null,
      repetido: false,
    });
  });

  it('repite el ciclo cuando se acaba el calendario', () => {
    expect(retoDelDia(cal, '2026-10-14')).toEqual({
      numero: 3,
      palabra: 'PERRO',
      municipio: null,
      dicho: null,
      repetido: true,
    });
  });

  it('el municipio tiene su propio ciclo', () => {
    const conMunicipios = { ...cal, municipios: ['05001', '11001', '76001'] };
    expect(retoDelDia(conMunicipios, '2026-10-12').municipio).toBe('05001');
    expect(retoDelDia(conMunicipios, '2026-10-14').municipio).toBe('76001');
    expect(retoDelDia(conMunicipios, '2026-10-15').municipio).toBe('05001');
  });

  it('el dicho tiene su propio ciclo', () => {
    const dicho = (id: string) => ({
      id,
      texto: 'Al que madruga, Dios le ayuda',
      oculta: 'madruga',
      significado: { es: 'x', en: 'x' },
      pista: { es: 'x', en: 'x' },
      fuente: { nombre: 'x', url: 'https://x' },
    });
    const conDichos = { ...cal, dichos: [dicho('d001'), dicho('d002'), dicho('d003')] };
    expect(retoDelDia(conDichos, '2026-10-12').dicho?.id).toBe('d001');
    expect(retoDelDia(conDichos, '2026-10-14').dicho?.id).toBe('d003');
    expect(retoDelDia(conDichos, '2026-10-15').dicho?.id).toBe('d001');
  });

  it('falla con calendario vacío', () => {
    expect(() => retoDelDia({ inicio: '2026-10-12', dias: [] }, '2026-10-12')).toThrow();
  });

  it('el calendario real se carga (desofuscado por el plugin de Vite)', () => {
    const real = calendarioReal as Calendario;
    expect(real.dias.length).toBeGreaterThan(0);
    expect(retoDelDia(real, real.inicio).numero).toBe(1);
    expect(retoDelDia(real, real.inicio).dicho).not.toBeNull();
  });
});

describe('ofuscar', () => {
  it('ida y vuelta con Ñ y tildes', () => {
    const texto = JSON.stringify({ palabra: 'SUEÑO', otra: 'ÁRBOL' });
    const codigo = ofuscar(texto);
    expect(codigo).not.toContain('SUE');
    expect(desofuscar(codigo)).toBe(texto);
  });
});
