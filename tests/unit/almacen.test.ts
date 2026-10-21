import { describe, expect, it } from 'vitest';
import {
  CLAVE,
  agregarJugador,
  borrar,
  cambiarJugador,
  cargar,
  datosVacios,
  guardar,
  perfiles,
  quitarJugador,
  renombrarJugador,
} from '../../src/almacen';

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

  it('datos de antes de la clasificación: se conservan y quedan en el jugador 1', () => {
    const a = new AlmacenMemoria();
    a.setItem(
      CLAVE,
      JSON.stringify({
        partidas: { '2026-10-12': { palabra: { intentos: ['PERRO'], estado: 'ganada' } } },
        estadisticas: { palabra: { jugadas: 3, ganadas: 2 } },
      }),
    );
    const d = cargar('2026-10-12', a);
    expect(d.jugadores.actual).toBe('j1');
    expect(d.jugadores.lista.map((p) => p.id)).toEqual(['j1']);
    expect(d.estadisticas.palabra.jugadas).toBe(3);
    expect(d.estadisticas.categoria.jugadas).toBe(0);
    expect(perfiles(d)[0]?.estadisticas.palabra.ganadas).toBe(2);
  });

  it('cada jugador tiene sus partidas y estadísticas', () => {
    const a = new AlmacenMemoria();
    const d = datosVacios();
    d.estadisticas.palabra.ganadas = 5;
    d.partidas['2026-10-12'] = { palabra: { intentos: ['PERRO'], estado: 'ganada' } };
    const id = agregarJugador(d, '  Ana  ');
    expect(id).toBe('j2');
    cambiarJugador(d, id);
    expect(d.jugadores.actual).toBe('j2');
    expect(d.estadisticas.palabra.ganadas).toBe(0);
    expect(d.partidas).toEqual({});
    d.estadisticas.dicho.ganadas = 1;
    guardar(d, a);

    const leido = cargar('2026-10-12', a);
    expect(perfiles(leido).map((p) => [p.id, p.nombre])).toEqual([
      ['j1', ''],
      ['j2', 'Ana'],
    ]);
    cambiarJugador(leido, 'j1');
    expect(leido.estadisticas.palabra.ganadas).toBe(5);
    expect(leido.partidas['2026-10-12']?.palabra?.intentos).toEqual(['PERRO']);
    expect(perfiles(leido)[1]?.estadisticas.dicho.ganadas).toBe(1);
  });

  it('renombrar, quitar y casos que no hacen nada', () => {
    const d = datosVacios();
    const id = agregarJugador(d, 'Beto');
    renombrarJugador(d, 'j1', ' Jairo ');
    renombrarJugador(d, 'no-existe', 'X');
    expect(d.jugadores.lista.map((p) => p.nombre)).toEqual(['Jairo', 'Beto']);
    cambiarJugador(d, 'no-existe');
    cambiarJugador(d, 'j1');
    expect(d.jugadores.actual).toBe('j1');
    quitarJugador(d, 'j1'); // el actual no se quita
    quitarJugador(d, id);
    expect(d.jugadores.lista.map((p) => p.id)).toEqual(['j1']);
    expect(agregarJugador(d, 'Caro')).toBe('j2');
    expect(agregarJugador(d, 'Dani')).toBe('j3');
    quitarJugador(d, 'j2');
    expect(agregarJugador(d, 'Eli')).toBe('j4');
  });

  it('jugadores dañados: vuelve a un solo jugador', () => {
    const a = new AlmacenMemoria();
    a.setItem(CLAVE, JSON.stringify({ jugadores: { actual: 'j9', lista: [{ id: 'j1' }] } }));
    expect(cargar('2026-10-12', a).jugadores).toEqual(datosVacios().jugadores);
    a.setItem(
      CLAVE,
      JSON.stringify({ jugadores: { actual: 'j1', lista: [{ id: 'j1', nombre: 7 }, null] } }),
    );
    expect(cargar('2026-10-12', a).jugadores.lista).toEqual(datosVacios().jugadores.lista);
  });
});
