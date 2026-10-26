// Modo Categoría: se adivina una palabra sabiendo su categoría (aseo, hogar,
// cocina…), con las mismas reglas de colores del modo Palabra. Desde el 3.er
// intento se puede pedir una pista; al terminar se muestra la palabra.
import type { Partida } from '../almacen';
import { idioma, t } from '../i18n';
import { largoCategoria, respuestaCategoria, type RetoCategoria } from '../juego/categorias';
import { INTENTOS_PARA_PISTA } from '../juego/dichos';
import type { EstadoLetra } from '../juego/evaluar';
import { anunciar } from '../ui/aviso';
import { JuegoPalabra } from './palabra';

export interface OpcionesCategoria {
  reto: RetoCategoria;
  maxIntentos: number;
  partida: Partida;
  validas: (largo: number) => Promise<Set<string>>;
  icono: HTMLElement;
  nombre: HTMLElement;
  largoTexto: HTMLElement;
  botonPista: HTMLButtonElement;
  pista: HTMLElement;
  tablero: HTMLElement;
  teclado: HTMLElement;
  alCambiar: (partida: Partida) => void;
  alTerminar: (partida: Partida, animado: boolean) => void;
}

export class JuegoCategoria {
  readonly largo: number;
  private readonly juego: JuegoPalabra;

  constructor(private readonly o: OpcionesCategoria) {
    this.largo = largoCategoria(o.reto);
    o.tablero.style.setProperty('--largo', String(this.largo));
    o.botonPista.addEventListener('click', () => this.verPista());
    this.juego = new JuegoPalabra({
      respuesta: respuestaCategoria(o.reto),
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

  /** La palabra en mayúsculas, con tildes. */
  respuestaVisible(): string {
    return this.o.reto.palabra.toLocaleUpperCase('es-CO');
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
    anunciar(`${t('pista')}: ${this.o.reto.pista[idioma()]}`);
    this.o.pista.focus();
  }

  private dibujar(): void {
    const { reto, partida } = this.o;
    const lang = idioma();
    this.o.icono.textContent = reto.categoria.icono;
    this.o.nombre.textContent = reto.categoria[lang];
    this.o.largoTexto.textContent = this.terminado
      ? t('eraLaPalabra', { palabra: this.respuestaVisible() })
      : t('palabraDeLetras', { n: this.largo });

    const puedePedir =
      !this.terminado && !this.usoPista && partida.intentos.length >= INTENTOS_PARA_PISTA;
    this.o.botonPista.hidden = !puedePedir;
    // Al terminar, la pista se muestra siempre como dato de la palabra.
    const verPista = this.usoPista || this.terminado;
    this.o.pista.hidden = !verPista;
    this.o.pista.textContent = verPista ? `💡 ${reto.pista[lang]}` : '';
  }
}
