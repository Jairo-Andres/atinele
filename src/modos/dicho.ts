// Modo Dicho: se adivina la palabra que falta en un dicho colombiano con las
// mismas reglas de colores del modo Palabra. Después del 3.er intento se puede
// pedir una pista; al terminar se muestra el dicho completo y qué significa.
import type { Partida } from '../almacen';
import { idioma, t } from '../i18n';
import {
  INTENTOS_PARA_PISTA,
  largoDicho,
  partesDicho,
  respuestaDicho,
  type Dicho,
} from '../juego/dichos';
import type { EstadoLetra } from '../juego/evaluar';
import { anunciar } from '../ui/aviso';
import { JuegoPalabra } from './palabra';

export interface OpcionesDicho {
  dicho: Dicho;
  maxIntentos: number;
  partida: Partida;
  validas: (largo: number) => Promise<Set<string>>;
  texto: HTMLElement;
  fuente: HTMLElement;
  botonPista: HTMLButtonElement;
  pista: HTMLElement;
  significado: HTMLElement;
  tablero: HTMLElement;
  teclado: HTMLElement;
  alCambiar: (partida: Partida) => void;
  alTerminar: (partida: Partida, animado: boolean) => void;
}

export class JuegoDicho {
  readonly largo: number;
  private readonly juego: JuegoPalabra;

  constructor(private readonly o: OpcionesDicho) {
    this.largo = largoDicho(o.dicho);
    o.tablero.style.setProperty('--largo', String(this.largo));
    o.botonPista.addEventListener('click', () => this.verPista());
    this.juego = new JuegoPalabra({
      respuesta: respuestaDicho(o.dicho),
      largo: this.largo,
      maxIntentos: o.maxIntentos,
      partida: o.partida,
      tablero: o.tablero,
      teclado: o.teclado,
      validas: o.validas(this.largo),
      alCambiar: (p) => {
        o.alCambiar(p);
        this.dibujar();
      },
      alTerminar: (p, animado) => {
        this.dibujar();
        o.alTerminar(p, animado);
      },
    });
    this.dibujar();
  }

  get terminado(): boolean {
    return this.o.partida.estado !== 'jugando';
  }

  get usoPista(): boolean {
    return this.o.partida.pista === true;
  }

  get intentosEvaluados(): EstadoLetra[][] {
    return this.juego.intentosEvaluados;
  }

  /** La palabra oculta como aparece en el dicho, en mayúsculas (con tildes). */
  respuestaVisible(): string {
    return this.o.dicho.oculta.toLocaleUpperCase('es-CO');
  }

  pulsar(tecla: string): void {
    this.juego.pulsar(tecla);
  }

  retraducir(): void {
    this.juego.retraducir();
    this.dibujar();
  }

  private verPista(): void {
    if (this.usoPista || this.o.partida.intentos.length < INTENTOS_PARA_PISTA) return;
    this.o.partida.pista = true;
    this.o.alCambiar(this.o.partida);
    this.dibujar();
    anunciar(`${t('pista')}: ${this.o.dicho.pista[idioma()]}`);
    this.o.pista.focus();
  }

  private dibujar(): void {
    const { dicho, partida } = this.o;
    const lang = idioma();

    // Dicho con la palabra oculta (o revelada al terminar).
    const partes = partesDicho(dicho.texto, dicho.oculta);
    const hueco = document.createElement(this.terminado ? 'strong' : 'span');
    hueco.className = this.terminado ? 'dicho__palabra' : 'dicho__hueco';
    if (this.terminado) {
      hueco.textContent = partes?.palabra ?? dicho.oculta;
    } else {
      hueco.setAttribute('role', 'img');
      hueco.setAttribute('aria-label', t('palabraOculta', { n: this.largo }));
      for (let i = 0; i < this.largo; i++) {
        const c = document.createElement('span');
        c.className = 'dicho__casilla';
        hueco.append(c);
      }
    }
    this.o.texto.replaceChildren(partes?.antes ?? '', hueco, partes?.despues ?? '');

    // Pista: se ofrece desde el 3.er intento.
    const puedePedir =
      !this.terminado && !this.usoPista && partida.intentos.length >= INTENTOS_PARA_PISTA;
    this.o.botonPista.hidden = !puedePedir;
    this.o.pista.hidden = !this.usoPista;
    this.o.pista.textContent = this.usoPista ? `💡 ${dicho.pista[lang]}` : '';

    // Significado y fuente al terminar.
    this.o.significado.hidden = !this.terminado;
    const p = this.o.significado.querySelector('p');
    if (p) p.textContent = this.terminado ? dicho.significado[lang] : '';
    this.o.fuente.hidden = !this.terminado;
    const a = this.o.fuente.querySelector('a');
    if (a) {
      a.href = dicho.fuente.url;
      a.textContent = dicho.fuente.nombre;
    }
  }
}
