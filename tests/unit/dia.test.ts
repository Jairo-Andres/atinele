import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  diasEntre,
  formatoCuentaRegresiva,
  hoyEnColombia,
  msHastaManana,
  numeroReto,
  sumarDias,
} from '../../src/juego/dia';

afterEach(() => vi.useRealTimers());

describe('hoyEnColombia', () => {
  it('a las 04:59 UTC todavía es el día anterior en Colombia', () => {
    expect(hoyEnColombia(new Date('2026-10-12T04:59:59Z'))).toBe('2026-10-11');
  });

  it('a las 05:00 UTC ya es el día siguiente en Colombia', () => {
    expect(hoyEnColombia(new Date('2026-10-12T05:00:00Z'))).toBe('2026-10-12');
  });

  it('usa la hora del sistema por defecto, sin importar la zona del dispositivo', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-12-31T23:30:00-05:00'));
    expect(hoyEnColombia()).toBe('2026-12-31');
  });
});

describe('números de reto', () => {
  it('cuenta días entre fechas', () => {
    expect(diasEntre('2026-10-12', '2026-10-12')).toBe(0);
    expect(diasEntre('2026-10-12', '2026-11-12')).toBe(31);
    expect(diasEntre('2026-12-31', '2027-01-01')).toBe(1);
  });

  it('el día de inicio es el reto 1 y antes también', () => {
    expect(numeroReto('2026-10-12', '2026-10-12')).toBe(1);
    expect(numeroReto('2026-10-12', '2026-10-20')).toBe(9);
    expect(numeroReto('2026-10-12', '2026-10-01')).toBe(1);
  });

  it('rechaza fechas mal escritas', () => {
    expect(() => diasEntre('12/10/2026', '2026-10-12')).toThrow(/Fecha inválida/);
  });

  it('suma días cruzando meses y años', () => {
    expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01');
    expect(sumarDias('2028-02-28', 1)).toBe('2028-02-29');
  });
});

describe('cuenta regresiva', () => {
  it('calcula lo que falta para la medianoche de Colombia', () => {
    expect(msHastaManana(new Date('2026-10-12T04:00:00Z'))).toBe(3_600_000);
    expect(msHastaManana(new Date('2026-10-12T05:00:00Z'))).toBe(86_400_000);
  });

  it('da formato HH:MM:SS', () => {
    expect(formatoCuentaRegresiva(3_723_000)).toBe('01:02:03');
    expect(formatoCuentaRegresiva(-5)).toBe('00:00:00');
  });
});
