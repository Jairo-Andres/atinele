import { describe, expect, it } from 'vitest';
import { normalizar } from '../../src/juego/normalizar';
// @ts-expect-error: módulo JS de los scripts, sin tipos.
import { normalizar as normalizarScript } from '../../scripts/lib.mjs';

describe('scripts/lib.mjs', () => {
  it('normaliza igual que el juego', () => {
    for (const p of ['árbol', 'SUEÑO', 'pingüino', ' Limón ', 'ñandú']) {
      expect(normalizarScript(p)).toBe(normalizar(p));
    }
  });
});
