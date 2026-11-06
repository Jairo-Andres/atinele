// Modo Crucigrama: una rejilla pequeña con pistas horizontales y verticales.
// Se escribe con el teclado en pantalla o el físico; tocar una casilla la
// elige y tocarla otra vez cambia entre horizontal y vertical.
import type { Partida } from '../almacen';
import { idioma, t } from '../i18n';
import {
  armar,
  completo,
  entradasEn,
  errores,
  palabrasResueltas,
  type Crucigrama,
  type Entrada,
  type Tablero,
} from '../juego/crucigrama';
import { LETRAS, normalizar } from '../juego/normalizar';
import { anunciar, avisar } from '../ui/aviso';
import { crearTeclado, actualizarTeclado, type Tecla } from '../ui/teclado';

export interface OpcionesCrucigrama {
  crucigrama: Crucigrama;
  partida: Partida;
  rejilla: HTMLElement;
  pistaActual: HTMLElement;
  horizontales: HTMLElement;
  verticales: HTMLElement;
  teclado: HTMLElement;
  botonRevisar: HTMLButtonElement;
  botonRendirse: HTMLButtonElement;
  alCambiar: (partida: Partida) => void;
  alTerminar: (partida: Partida, animado: boolean) => void;
}

const VACIA = '.';

export class JuegoCrucigrama {
  readonly tablero: Tablero;
  private escritas: string[];
  private casillas: (HTMLButtonElement | null)[] = [];
  private actual: Entrada;
  private activa: number;

  constructor(private readonly o: OpcionesCrucigrama) {
    this.tablero = armar(o.crucigrama);
    const guardado = Array.from(o.partida.intentos[0] ?? '');
    this.escritas = this.tablero.solucion.map((_, i) =>
      guardado[i] && guardado[i] !== VACIA ? (guardado[i] as string) : '',
    );
    this.actual = this.tablero.entradas[0] as Entrada;
    this.activa = this.actual.casillas[0] as number;
    this.construir();
    o.teclado.dataset.enviar = 'siguiente';
    crearTeclado(o.teclado, (tecla) => this.pulsar(tecla));
    o.botonRevisar.addEventListener('click', () => this.revisar());
    o.botonRendirse.addEventListener('click', () => this.rendirse());
    this.dibujar();
    if (this.terminado) o.alTerminar(o.partida, false);
  }

  get terminado(): boolean {
    return this.o.partida.estado !== 'jugando';
  }

  get resueltas(): number {
    return palabrasResueltas(this.tablero, this.escritas);
  }

  get total(): number {
    return this.tablero.entradas.length;
  }

  get reviso(): boolean {
    return this.o.partida.pista === true;
  }

  retraducir(): void {
    actualizarTeclado(this.o.teclado, new Map());
    this.dibujar();
  }

  pulsar(tecla: Tecla): void {
    if (this.terminado) return;
    if (tecla === 'ENVIAR') return this.saltar(1);
    if (tecla === 'BORRAR') return this.borrar();
    const letra = normalizar(tecla);
    if (letra.length !== 1 || !LETRAS.includes(letra)) return;
    this.escritas[this.activa] = letra;
    const i = this.actual.casillas.indexOf(this.activa);
    // Pasa a la casilla siguiente de la palabra (aunque ya tenga letra, para
    // poder escribir la palabra completa de corrido sobre los cruces).
    this.activa = this.actual.casillas[Math.min(i + 1, this.actual.casillas.length - 1)] as number;
    this.cambio();
  }

  // ---------- Construcción ----------
  private construir(): void {
    const { rejilla } = this.o;
    const { ancho, alto, solucion, numeros } = this.tablero;
    rejilla.style.setProperty('--ancho', String(ancho));
    rejilla.replaceChildren();
    this.casillas = [];
    for (let f = 0; f < alto; f++) {
      const fila = document.createElement('div');
      fila.className = 'cruci__fila';
      fila.setAttribute('role', 'row');
      for (let c = 0; c < ancho; c++) {
        const k = f * ancho + c;
        if (solucion[k] === null) {
          const negra = document.createElement('span');
          negra.className = 'cruci__negra';
          negra.setAttribute('role', 'gridcell');
          negra.setAttribute('aria-hidden', 'true');
          fila.append(negra);
          this.casillas.push(null);
          continue;
        }
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'cruci__casilla';
        b.setAttribute('role', 'gridcell');
        b.dataset.k = String(k);
        if (numeros[k]) {
          const n = document.createElement('span');
          n.className = 'cruci__numero';
          n.textContent = String(numeros[k]);
          n.setAttribute('aria-hidden', 'true');
          b.append(n);
        }
        const letra = document.createElement('span');
        letra.className = 'cruci__letra';
        b.append(letra);
        b.addEventListener('click', () => this.tocar(k));
        fila.append(b);
        this.casillas.push(b);
      }
      rejilla.append(fila);
    }
    rejilla.addEventListener('keydown', (e) => {
      const mov: Record<string, [number, number]> = {
        ArrowUp: [-1, 0],
        ArrowDown: [1, 0],
        ArrowLeft: [0, -1],
        ArrowRight: [0, 1],
      };
      const d = mov[e.key];
      if (!d) return;
      e.preventDefault();
      this.mover(d[0], d[1]);
    });
  }

  private tocar(k: number): void {
    const opciones = entradasEn(this.tablero, k);
    if (k === this.activa && opciones.length > 1) {
      this.actual = opciones.find((e) => e !== this.actual) as Entrada;
    } else if (!opciones.includes(this.actual)) {
      this.actual = opciones.find((e) => e.dir === this.actual.dir) ?? (opciones[0] as Entrada);
    }
    this.activa = k;
    this.dibujar();
    this.enfocar();
  }

  private mover(df: number, dc: number): void {
    const { ancho, alto, solucion } = this.tablero;
    let f = Math.floor(this.activa / ancho) + df;
    let c = (this.activa % ancho) + dc;
    while (f >= 0 && f < alto && c >= 0 && c < ancho) {
      const k = f * ancho + c;
      if (solucion[k] !== null) {
        const dir = df === 0 ? 'h' : 'v';
        const opciones = entradasEn(this.tablero, k);
        this.actual = opciones.find((e) => e.dir === dir) ?? (opciones[0] as Entrada);
        this.activa = k;
        this.dibujar();
        this.enfocar();
        return;
      }
      f += df;
      c += dc;
    }
  }

  private saltar(paso: number): void {
    const lista = this.tablero.entradas;
    const i = lista.indexOf(this.actual);
    this.actual = lista[(i + paso + lista.length) % lista.length] as Entrada;
    this.activa =
      this.actual.casillas.find((k) => !this.escritas[k]) ?? (this.actual.casillas[0] as number);
    this.dibujar();
    anunciar(this.textoPista(this.actual));
  }

  private borrar(): void {
    if (this.escritas[this.activa]) {
      this.escritas[this.activa] = '';
    } else {
      const i = this.actual.casillas.indexOf(this.activa);
      if (i > 0) {
        this.activa = this.actual.casillas[i - 1] as number;
        this.escritas[this.activa] = '';
      }
    }
    this.cambio();
  }

  private enfocar(): void {
    this.casillas[this.activa]?.focus();
  }

  private cambio(): void {
    const { partida } = this.o;
    partida.intentos = [this.escritas.map((l) => l || VACIA).join('')];
    if (completo(this.tablero, this.escritas)) {
      partida.estado = 'ganada';
      this.o.alCambiar(partida);
      this.dibujar();
      anunciar(t('cruciCompleto'));
      this.o.alTerminar(partida, true);
      return;
    }
    this.o.alCambiar(partida);
    this.dibujar();
    // Si se escribe con el teclado físico sobre la rejilla, el foco sigue a la casilla.
    if (this.o.rejilla.contains(document.activeElement)) this.enfocar();
  }

  private revisar(): void {
    if (this.terminado) return;
    const malas = errores(this.tablero, this.escritas);
    this.o.partida.pista = true;
    this.o.alCambiar(this.o.partida);
    for (const k of malas) this.casillas[k]?.classList.add('cruci__casilla--error');
    avisar(malas.length ? t('cruciErrores', { n: malas.length }) : t('cruciSinErrores'));
  }

  private rendirse(): void {
    if (this.terminado || !confirm(t('confirmarRendirse'))) return;
    this.o.partida.estado = 'perdida';
    this.o.alCambiar(this.o.partida);
    this.dibujar();
    this.o.alTerminar(this.o.partida, true);
  }

  // ---------- Dibujo ----------
  private textoPista(e: Entrada): string {
    const dir = t(e.dir === 'h' ? 'horizontal' : 'vertical');
    return `${e.numero} ${dir}: ${e.pista[idioma()]} (${e.respuesta.length})`;
  }

  private dibujar(): void {
    const { solucion } = this.tablero;
    const enActual = new Set(this.actual.casillas);
    this.o.rejilla.setAttribute('aria-label', t('cruciRejilla'));
    this.casillas.forEach((b, k) => {
      if (!b) return;
      const letra =
        this.terminado && this.o.partida.estado === 'perdida'
          ? (solucion[k] as string)
          : (this.escritas[k] ?? '');
      (b.querySelector('.cruci__letra') as HTMLElement).textContent = letra;
      b.classList.remove('cruci__casilla--error');
      b.classList.toggle('cruci__casilla--palabra', !this.terminado && enActual.has(k));
      b.classList.toggle('cruci__casilla--activa', !this.terminado && k === this.activa);
      b.classList.toggle(
        'cruci__casilla--revelada',
        this.o.partida.estado === 'perdida' && this.escritas[k] !== solucion[k],
      );
      b.tabIndex = k === this.activa ? 0 : -1;
      const numeros = entradasEn(this.tablero, k)
        .map((e) => `${e.numero} ${t(e.dir === 'h' ? 'horizontal' : 'vertical')}`)
        .join(', ');
      b.setAttribute('aria-label', `${numeros}: ${letra || t('vacia')}`);
    });
    this.o.pistaActual.textContent = this.terminado
      ? t(this.o.partida.estado === 'ganada' ? 'cruciCompleto' : 'cruciRevelado')
      : this.textoPista(this.actual);
    this.o.botonRevisar.hidden = this.terminado;
    this.o.botonRendirse.hidden = this.terminado;
    this.o.teclado.hidden = this.terminado;

    for (const [contenedor, dir] of [
      [this.o.horizontales, 'h'],
      [this.o.verticales, 'v'],
    ] as const) {
      contenedor.replaceChildren(
        ...this.tablero.entradas
          .filter((e) => e.dir === dir)
          .map((e) => {
            const li = document.createElement('li');
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'cruci__pista';
            if (e === this.actual && !this.terminado) b.setAttribute('aria-current', 'true');
            const bien = e.casillas.every((k, i) => this.escritas[k] === e.respuesta[i]);
            if (bien) b.classList.add('cruci__pista--resuelta');
            const n = document.createElement('strong');
            n.textContent = `${e.numero}. `;
            b.append(n, `${e.pista[idioma()]} (${e.respuesta.length})`);
            b.addEventListener('click', () => {
              this.actual = e;
              this.activa = e.casillas.find((k) => !this.escritas[k]) ?? (e.casillas[0] as number);
              this.dibujar();
              this.enfocar();
            });
            li.append(b);
            return li;
          }),
      );
    }
  }
}
