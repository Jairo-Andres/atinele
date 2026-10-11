import { describe, expect, it } from 'vitest';
import {
  estadisticasVacias,
  porcentajeVictorias,
  rachaVigente,
  registrarPartida,
} from '../../src/juego/estadisticas';

describe('estadísticas', () => {
  it('la racha sube con días seguidos y guarda la mejor', () => {
    let e = estadisticasVacias();
    e = registrarPartida(e, '2026-10-12', true, 3);
    e = registrarPartida(e, '2026-10-13', true, 4);
    expect(e.racha).toBe(2);
    expect(e.mejorRacha).toBe(2);
    expect(e.distribucion).toEqual([0, 0, 1, 1, 0, 0]);
    expect(porcentajeVictorias(e)).toBe(100);
  });

  it('saltarse un día reinicia la racha en 1 al ganar', () => {
    let e = estadisticasVacias();
    e = registrarPartida(e, '2026-10-12', true, 3);
    e = registrarPartida(e, '2026-10-14', true, 2);
    expect(e.racha).toBe(1);
    expect(e.mejorRacha).toBe(1);
  });

  it('perder rompe la racha', () => {
    let e = estadisticasVacias();
    e = registrarPartida(e, '2026-10-12', true, 3);
    e = registrarPartida(e, '2026-10-13', false, 6);
    expect(e.racha).toBe(0);
    expect(e.mejorRacha).toBe(1);
    expect(porcentajeVictorias(e)).toBe(50);
  });

  it('el mismo día no se cuenta dos veces', () => {
    const e = registrarPartida(estadisticasVacias(), '2026-10-12', true, 3);
    expect(registrarPartida(e, '2026-10-12', true, 3)).toBe(e);
  });

  it('la racha vigente se pierde si ayer no se jugó', () => {
    const e = registrarPartida(estadisticasVacias(), '2026-10-12', true, 3);
    expect(rachaVigente(e, '2026-10-12')).toBe(1);
    expect(rachaVigente(e, '2026-10-13')).toBe(1);
    expect(rachaVigente(e, '2026-10-14')).toBe(0);
    expect(rachaVigente(estadisticasVacias(), '2026-10-14')).toBe(0);
    expect(porcentajeVictorias(estadisticasVacias())).toBe(0);
  });
});
