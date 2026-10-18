import { esGanador, estadoTeclado, evaluar, type EstadoLetra } from '../juego/evaluar';
import { LETRAS, letras, normalizar } from '../juego/normalizar';
import type { Partida } from '../almacen';
import { t } from '../i18n';
import { anunciar, avisar, duracion } from '../ui/aviso';
import { actualizarTeclado, crearTeclado, type Tecla } from '../ui/teclado';

export interface OpcionesPalabra {
  respuesta: string;
  largo: number;
  maxIntentos: number;
  partida: Partida;
  tablero: HTMLElement;
  teclado: HTMLElement;
  /** Se resuelve con las palabras válidas normalizadas. */
  validas: Promise<Set<string>>;
  alCambiar: (partida: Partida) => void;
  /** Se llama al terminar, después de la animación. */
  alTerminar: (partida: Partida, animado: boolean) => void;
}

export class JuegoPalabra {
  private actual: string[] = [];
  private validas: Set<string> | null = null;
  private errorValidas = false;
  private ocupado = false;
  /** Enter pulsado mientras se revelaba la fila anterior. */
  private enviarPendiente = false;
  /** Cambio de idioma durante la animación: se repinta al terminar. */
  private retraducirPendiente = false;
  private readonly respuestaNorm: string;

  constructor(private readonly o: OpcionesPalabra) {
    this.respuestaNorm = normalizar(o.respuesta);
    o.validas.then(
      (v) => {
        this.validas = v;
        o.tablero.dataset.listo = 'true';
      },
      () => (this.errorValidas = true),
    );
    crearTeclado(o.teclado, (tecla) => this.pulsar(tecla));
    this.dibujar();
    if (this.terminado) this.o.alTerminar(this.o.partida, false);
  }

  get terminado(): boolean {
    return this.o.partida.estado !== 'jugando';
  }

  get intentosEvaluados(): EstadoLetra[][] {
    return this.o.partida.intentos.map((i) => evaluar(this.respuestaNorm, i));
  }

  /** Vuelve a pintar textos traducidos (al cambiar de idioma). */
  retraducir(): void {
    if (this.ocupado) this.retraducirPendiente = true;
    else this.dibujar();
  }

  pulsar(tecla: Tecla): void {
    if (this.terminado) return;
    if (tecla === 'ENVIAR') {
      if (this.ocupado) this.enviarPendiente = true;
      else void this.enviar();
      return;
    }
    if (tecla === 'BORRAR') {
      this.actual.pop();
    } else {
      const letra = normalizar(tecla);
      if (letra.length !== 1 || !LETRAS.includes(letra) || this.actual.length >= this.o.largo)
        return;
      this.actual.push(letra);
    }
    this.dibujarFilaActual();
  }

  private async enviar(): Promise<void> {
    if (this.actual.length < this.o.largo) {
      this.rechazar(t('cortas'));
      return;
    }
    const intento = this.actual.join('');
    if (!this.validas) {
      if (this.errorValidas) avisar(t('errorLista'), 4000);
      else avisar(t('cargando'));
      return;
    }
    if (intento !== this.respuestaNorm && !this.validas.has(intento)) {
      this.rechazar(t('invalida'));
      return;
    }

    const p = this.o.partida;
    p.intentos.push(intento);
    const estados = evaluar(this.respuestaNorm, intento);
    if (esGanador(estados)) p.estado = 'ganada';
    else if (p.intentos.length >= this.o.maxIntentos) p.estado = 'perdida';
    this.actual = [];
    this.o.alCambiar(p);

    this.ocupado = true;
    const fila = this.dibujar(p.intentos.length - 1);
    anunciar(
      t('anuncioFila', {
        n: p.intentos.length,
        detalle: letras(intento)
          .map((l, k) => `${l} ${t(estados[k] as EstadoLetra)}`)
          .join(', '),
      }),
    );
    const espera = duracion('--duration-slow') * (this.o.largo / 2 + 1);
    await new Promise((r) => window.setTimeout(r, espera));
    fila?.classList.remove('revelando');
    this.ocupado = false;
    if (this.retraducirPendiente) {
      this.retraducirPendiente = false;
      this.dibujar();
    }
    if (this.terminado) {
      if (p.estado === 'ganada')
        this.o.tablero.children[p.intentos.length - 1]?.classList.add('ganadora');
      this.o.alTerminar(p, true);
    } else if (this.enviarPendiente) {
      this.enviarPendiente = false;
      void this.enviar();
    }
  }

  private rechazar(mensaje: string): void {
    avisar(mensaje);
    const fila = this.o.tablero.children[this.o.partida.intentos.length];
    fila?.classList.remove('tiembla');
    void (fila as HTMLElement | undefined)?.offsetWidth;
    fila?.classList.add('tiembla');
  }

  /** Dibuja el tablero completo. Devuelve la fila que se está revelando, si hay. */
  private dibujar(revelar?: number): HTMLElement | undefined {
    const { tablero, largo, maxIntentos, partida } = this.o;
    const evaluados = this.intentosEvaluados;
    let filaRevelada: HTMLElement | undefined;
    const filas = Array.from({ length: maxIntentos }, (_, f) => {
      const fila = document.createElement('div');
      fila.className = 'fila';
      fila.setAttribute('role', 'group');
      fila.setAttribute('aria-label', t('intento', { n: f + 1, total: maxIntentos }));
      const intento = partida.intentos[f];
      const ls = intento ? letras(intento) : f === partida.intentos.length ? this.actual : [];
      for (let k = 0; k < largo; k++) {
        const ficha = document.createElement('div');
        ficha.className = 'ficha';
        ficha.style.setProperty('--i', String(k));
        const letra = ls[k] ?? '';
        ficha.textContent = letra;
        const estado = intento ? evaluados[f]?.[k] : undefined;
        if (estado) {
          ficha.dataset.estado = estado;
          ficha.setAttribute('aria-label', `${letra}, ${t(estado)}`);
        } else {
          if (letra) ficha.dataset.estado = 'escrita';
          ficha.setAttribute('aria-label', letra || t('vacia'));
        }
        ficha.setAttribute('role', 'img');
        fila.append(ficha);
      }
      if (f === revelar) {
        fila.classList.add('revelando');
        filaRevelada = fila;
      }
      if (
        partida.estado === 'ganada' &&
        f === partida.intentos.length - 1 &&
        revelar === undefined
      ) {
        fila.classList.add('ganadora-fija');
      }
      return fila;
    });
    tablero.replaceChildren(...filas);
    const intentosParaTeclado =
      revelar === undefined ? partida.intentos : partida.intentos.slice(0, revelar);
    // El teclado se colorea cuando termina de revelarse la fila.
    actualizarTeclado(this.o.teclado, estadoTeclado(this.respuestaNorm, intentosParaTeclado));
    if (revelar !== undefined) {
      window.setTimeout(
        () =>
          actualizarTeclado(this.o.teclado, estadoTeclado(this.respuestaNorm, partida.intentos)),
        duracion('--duration-slow') * (largo / 2 + 1),
      );
    }
    return filaRevelada;
  }

  private dibujarFilaActual(): void {
    const fila = this.o.tablero.children[this.o.partida.intentos.length];
    if (!fila) return;
    Array.from(fila.children).forEach((ficha, k) => {
      const el = ficha as HTMLElement;
      const letra = this.actual[k] ?? '';
      el.textContent = letra;
      if (letra) el.dataset.estado = 'escrita';
      else delete el.dataset.estado;
      el.setAttribute('aria-label', letra || t('vacia'));
    });
  }
}
