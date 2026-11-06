// Modo Sopa de letras: encontrar las palabras del tema del día en una rejilla.
// Se marca una palabra arrastrando de la primera a la última letra, o tocando
// (o con Enter) la primera y luego la última. Con teclado: flechas para moverse.
import type { Partida } from '../almacen';
import { idioma, t } from '../i18n';
import { letraEn, linea, palabraEntre, type Casilla, type Sopa } from '../juego/sopa';
import { anunciar, avisar } from '../ui/aviso';

export interface OpcionesSopa {
  sopa: Sopa;
  partida: Partida;
  tema: HTMLElement;
  progreso: HTMLElement;
  rejilla: HTMLElement;
  lista: HTMLElement;
  botonRendirse: HTMLButtonElement;
  alCambiar: (partida: Partida) => void;
  alTerminar: (partida: Partida, animado: boolean) => void;
}

export class JuegoSopa {
  private readonly lado: number;
  private readonly botones: HTMLButtonElement[] = [];
  private inicio: Casilla | null = null;
  private arrastrando = false;
  private foco: Casilla = [0, 0];

  constructor(private readonly o: OpcionesSopa) {
    this.lado = o.sopa.filas.length;
    this.construir();
    o.botonRendirse.addEventListener('click', () => this.rendirse());
    this.dibujar();
    if (this.terminado) o.alTerminar(o.partida, false);
  }

  get terminado(): boolean {
    return this.o.partida.estado !== 'jugando';
  }

  get encontradas(): number {
    return this.o.partida.intentos.length;
  }

  get total(): number {
    return this.o.sopa.palabras.length;
  }

  retraducir(): void {
    this.dibujar();
  }

  // ---------- Construcción ----------
  private construir(): void {
    const { rejilla } = this.o;
    rejilla.style.setProperty('--lado', String(this.lado));
    rejilla.replaceChildren();
    for (let f = 0; f < this.lado; f++) {
      const fila = document.createElement('div');
      fila.className = 'sopa__fila';
      fila.setAttribute('role', 'row');
      for (let c = 0; c < this.lado; c++) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'sopa__letra';
        b.setAttribute('role', 'gridcell');
        b.dataset.f = String(f);
        b.dataset.c = String(c);
        b.textContent = letraEn(this.o.sopa, [f, c]);
        b.tabIndex = f === 0 && c === 0 ? 0 : -1;
        fila.append(b);
        this.botones.push(b);
      }
      rejilla.append(fila);
    }

    rejilla.addEventListener('pointerdown', (e) => {
      const casilla = this.casillaDe(e.target);
      if (!casilla || this.terminado) return;
      e.preventDefault();
      rejilla.setPointerCapture?.(e.pointerId);
      // Si ya había una primera letra elegida (modo tocar), esta es la última.
      if (this.inicio && !this.arrastrando) {
        this.intentar(this.inicio, casilla);
        return;
      }
      this.inicio = casilla;
      this.arrastrando = true;
      this.marcarSeleccion(casilla);
    });
    rejilla.addEventListener('pointermove', (e) => {
      if (!this.arrastrando || !this.inicio) return;
      const casilla = this.casillaDe(document.elementFromPoint(e.clientX, e.clientY));
      if (casilla) this.marcarSeleccion(casilla);
    });
    const soltar = (e: PointerEvent) => {
      if (!this.arrastrando || !this.inicio) return;
      this.arrastrando = false;
      const casilla = this.casillaDe(document.elementFromPoint(e.clientX, e.clientY));
      // Soltar en la misma letra = modo tocar: se espera la última letra.
      if (casilla && (casilla[0] !== this.inicio[0] || casilla[1] !== this.inicio[1])) {
        this.intentar(this.inicio, casilla);
      }
    };
    rejilla.addEventListener('pointerup', soltar);
    rejilla.addEventListener('pointercancel', () => {
      this.arrastrando = false;
      this.limpiarSeleccion();
    });

    rejilla.addEventListener('keydown', (e) => {
      const mov: Record<string, Casilla> = {
        ArrowUp: [-1, 0],
        ArrowDown: [1, 0],
        ArrowLeft: [0, -1],
        ArrowRight: [0, 1],
      };
      const d = mov[e.key];
      if (d) {
        e.preventDefault();
        const f = Math.min(this.lado - 1, Math.max(0, this.foco[0] + d[0]));
        const c = Math.min(this.lado - 1, Math.max(0, this.foco[1] + d[1]));
        this.enfocar([f, c]);
        if (this.inicio) this.marcarSeleccion([f, c]);
      } else if ((e.key === 'Enter' || e.key === ' ') && !this.terminado) {
        e.preventDefault();
        e.stopPropagation();
        if (this.inicio) this.intentar(this.inicio, this.foco);
        else {
          this.inicio = this.foco;
          this.marcarSeleccion(this.foco);
          anunciar(t('sopaPrimera', { letra: letraEn(this.o.sopa, this.foco) }));
        }
      } else if (e.key === 'Escape' && this.inicio) {
        e.stopPropagation();
        this.inicio = null;
        this.limpiarSeleccion();
      }
    });
    rejilla.addEventListener('focusin', (e) => {
      const casilla = this.casillaDe(e.target);
      if (casilla) this.foco = casilla;
    });
  }

  private casillaDe(objetivo: EventTarget | null): Casilla | null {
    const b = (objetivo as HTMLElement | null)?.closest?.<HTMLElement>('.sopa__letra');
    if (!b || !this.o.rejilla.contains(b)) return null;
    return [Number(b.dataset.f), Number(b.dataset.c)];
  }

  private boton([f, c]: Casilla): HTMLButtonElement {
    return this.botones[f * this.lado + c] as HTMLButtonElement;
  }

  private enfocar(casilla: Casilla): void {
    this.boton(this.foco).tabIndex = -1;
    this.foco = casilla;
    const b = this.boton(casilla);
    b.tabIndex = 0;
    b.focus();
  }

  // ---------- Selección ----------
  private marcarSeleccion(hasta: Casilla): void {
    this.limpiarSeleccion();
    if (!this.inicio) return;
    const casillas = linea(this.inicio, hasta) ?? [this.inicio];
    for (const c of casillas) this.boton(c).classList.add('sopa__letra--elegida');
  }

  private limpiarSeleccion(): void {
    for (const b of this.botones) b.classList.remove('sopa__letra--elegida');
  }

  private intentar(a: Casilla, b: Casilla): void {
    this.inicio = null;
    this.limpiarSeleccion();
    const p = palabraEntre(this.o.sopa, a, b);
    const { partida } = this.o;
    if (!p) {
      avisar(t('sopaNoEs'));
      return;
    }
    if (partida.intentos.includes(p.palabra)) {
      avisar(t('sopaYa'));
      return;
    }
    partida.intentos.push(p.palabra);
    if (partida.intentos.length === this.total) partida.estado = 'ganada';
    this.o.alCambiar(partida);
    this.dibujar();
    anunciar(
      t('sopaEncontrada', {
        palabra: p.palabra,
        n: partida.intentos.length,
        total: this.total,
      }),
    );
    if (this.terminado) this.o.alTerminar(partida, true);
  }

  private rendirse(): void {
    if (this.terminado || !confirm(t('confirmarRendirse'))) return;
    this.o.partida.estado = 'perdida';
    this.o.alCambiar(this.o.partida);
    this.dibujar();
    this.o.alTerminar(this.o.partida, true);
  }

  // ---------- Dibujo ----------
  private dibujar(): void {
    const { sopa, partida } = this.o;
    this.o.tema.textContent = `${sopa.tema.icono} ${sopa.tema[idioma()]}`;
    this.o.progreso.textContent = t('sopaProgreso', { n: this.encontradas, total: this.total });
    this.o.botonRendirse.hidden = this.terminado;
    this.o.rejilla.setAttribute('aria-label', t('sopaRejilla'));

    for (const b of this.botones) {
      b.classList.remove('sopa__letra--encontrada', 'sopa__letra--revelada');
      const casilla: Casilla = [Number(b.dataset.f), Number(b.dataset.c)];
      b.setAttribute(
        'aria-label',
        t('sopaCasilla', { f: casilla[0] + 1, c: casilla[1] + 1, letra: letraEn(sopa, casilla) }),
      );
    }
    this.o.lista.replaceChildren(
      ...sopa.palabras.map((p) => {
        const li = document.createElement('li');
        const encontrada = partida.intentos.includes(p.palabra);
        li.textContent = p.palabra;
        if (encontrada) li.className = 'sopa__palabra--encontrada';
        else if (this.terminado) li.className = 'sopa__palabra--revelada';
        li.setAttribute(
          'aria-label',
          encontrada ? `${p.palabra}, ${t('encontrada')}` : `${p.palabra}, ${t('porEncontrar')}`,
        );
        const marca = encontrada
          ? 'sopa__letra--encontrada'
          : this.terminado
            ? 'sopa__letra--revelada'
            : null;
        if (marca) {
          for (const c of linea(p.inicio, p.fin) ?? []) this.boton(c).classList.add(marca);
        }
        return li;
      }),
    );
  }
}
