import { describe, expect, it } from 'vitest';
import { CLAVE, borrar, cargar, datosVacios, guardar } from '../../src/almacen';

class AlmacenMemoria implements Storage {
  private datos = new Map<string, string>();
  get length() {
    return this.datos.size;
  }
  clear() {
    this.datos.clear();
  }
  getItem(k: string) {
    return this.datos.get(k) ?? null;
  }
  key(i: number) {
    return [...this.datos.keys()][i] ?? null;
  }
  removeItem(k: string) {
    this.datos.delete(k);
  }
  setItem(k: string, v: string) {
    this.datos.set(k, v);
  }
}

const roto = {
  getItem() {
    throw new Error('bloqueado');
  },
  setItem() {
    throw new Error('bloqueado');
  },
  removeItem() {
    throw new Error('bloqueado');
  },
} as unknown as Storage;

describe('almacén', () => {
  it('guarda y carga', () => {
    const a = new AlmacenMemoria();
    const d = datosVacios();
    d.partidas['2026-10-12'] = { palabra: { intentos: ['PERRO'], estado: 'ganada' } };
    expect(guardar(d, a)).toBe(true);
    expect(cargar('2026-10-12', a).partidas['2026-10-12']?.palabra?.intentos).toEqual(['PERRO']);
  });

  it('borra partidas de hace 7 días o más', () => {
    const a = new AlmacenMemoria();
    const d = datosVacios();
    d.partidas['2026-10-01'] = { palabra: { intentos: [], estado: 'jugando' } };
    d.partidas['2026-10-10'] = { palabra: { intentos: [], estado: 'jugando' } };
    guardar(d, a);
    const leido = cargar('2026-10-12', a);
    expect(Object.keys(leido.partidas)).toEqual(['2026-10-10']);
  });

  it('funciona sin almacenamiento o con almacenamiento bloqueado', () => {
    expect(cargar('2026-10-12', null)).toEqual(datosVacios());
    expect(cargar('2026-10-12', roto)).toEqual(datosVacios());
    expect(guardar(datosVacios(), roto)).toBe(false);
    expect(guardar(datosVacios(), null)).toBe(false);
    expect(() => borrar(roto)).not.toThrow();
  });

  it('ignora contenido dañado', () => {
    const a = new AlmacenMemoria();
    a.setItem(CLAVE, '{no es json');
    expect(cargar('2026-10-12', a)).toEqual(datosVacios());
  });

  it('borrar quita los datos', () => {
    const a = new AlmacenMemoria();
    guardar(datosVacios(), a);
    borrar(a);
    expect(a.getItem(CLAVE)).toBeNull();
  });

  it('usa localStorage por defecto', () => {
    expect(guardar(datosVacios())).toBe(true);
    expect(cargar('2026-10-12').ajustes.tema).toBe('sistema');
    borrar();
    expect(localStorage.getItem(CLAVE)).toBeNull();
  });
});
