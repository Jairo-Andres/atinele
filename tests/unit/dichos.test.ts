import { describe, expect, it } from 'vitest';
import { largoDicho, partesDicho, respuestaDicho, type Dicho } from '../../src/juego/dichos';
import calendarioReal from '../../data/contenido/calendario.json';
// @ts-expect-error: módulo JS de los scripts, sin tipos.
import { contienePalabra } from '../../scripts/lib.mjs';

const dicho = (texto: string, oculta: string): Dicho => ({
  id: 'd999',
  texto,
  oculta,
  significado: { es: '', en: '' },
  pista: { es: '', en: '' },
  fuente: { nombre: '', url: '' },
});

describe('partesDicho', () => {
  it('parte el texto alrededor de la palabra oculta', () => {
    expect(partesDicho('Con hambre, no hay pan duro', 'hambre')).toEqual({
      antes: 'Con ',
      palabra: 'hambre',
      despues: ', no hay pan duro',
    });
  });

  it('respeta mayúsculas del texto y signos', () => {
    expect(partesDicho('¡Serán guayabas!', 'guayabas')?.palabra).toBe('guayabas');
    expect(partesDicho('Camarón que se duerme', 'camarón')?.palabra).toBe('Camarón');
  });

  it('solo cuenta palabras completas', () => {
    // "gato" aparece primero dentro de "gatos".
    expect(partesDicho('Los gatos y el gato', 'gato')).toEqual({
      antes: 'Los gatos y el ',
      palabra: 'gato',
      despues: '',
    });
    expect(partesDicho('Los gatos', 'gato')).toBeNull();
    expect(partesDicho('algo', '')).toBeNull();
  });

  it('el validador usa la misma regla', () => {
    for (const [t, o] of [
      ['Los gatos y el gato', 'gato'],
      ['Los gatos', 'gato'],
      ['¡Serán guayabas!', 'guayabas'],
      ['Le falta pelo pa’ moña', 'moña'],
    ] as const) {
      expect(contienePalabra(t, o)).toBe(partesDicho(t, o) !== null);
    }
  });
});

describe('respuesta del dicho', () => {
  it('normaliza tildes y conserva la Ñ', () => {
    const d = dicho('Le falta pelo pa’ moña', 'moña');
    expect(respuestaDicho(d)).toBe('MOÑA');
    expect(largoDicho(d)).toBe(4);
    expect(respuestaDicho(dicho('El ladrón juzga', 'ladrón'))).toBe('LADRON');
  });

  it('todos los dichos del calendario tienen su palabra en el texto y entre 4 y 8 letras', () => {
    const dichos = (calendarioReal as { dichos: Dicho[] }).dichos;
    expect(dichos.length).toBeGreaterThan(0);
    for (const d of dichos) {
      expect(partesDicho(d.texto, d.oculta), d.id).not.toBeNull();
      expect(largoDicho(d)).toBeGreaterThanOrEqual(4);
      expect(largoDicho(d)).toBeLessThanOrEqual(8);
      expect(d.fuente.url).toMatch(/^https:\/\//);
    }
  });
});
