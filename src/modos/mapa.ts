// Mapa de ayuda del modo Municipio: SVG hecho a mano, sin teselas ni librerías.
// Muestra los departamentos, un punto por municipio, los intentos y un círculo
// con la distancia del último intento. Tocar un punto lo elige en el buscador.
import { t } from '../i18n';
import {
  ALTO,
  ANCHO,
  kmAUnidades,
  mover,
  proyectar,
  rutaSvg,
  vistaCompleta,
  zoom,
  type DatosMapa,
  type Vista,
} from '../juego/mapa';
import type { Municipio, Pista } from '../juego/municipios';

const SVG = 'http://www.w3.org/2000/svg';
const TOQUE_PX = 22; // radio para elegir el municipio más cercano al dedo
const ZOOM_ETIQUETAS_CHICAS = 2.2;
/** Desde este zoom se escriben los nombres de los municipios que se ven. */
const ZOOM_NOMBRES = 6;
const MAX_NOMBRES = 150;

// Nombres cortos para que quepan en el mapa (el nombre completo sale al tocar).
const CORTOS: Record<string, string> = {
  '11': 'Bogotá',
  '54': 'N. de Santander',
  '76': 'Valle',
  '88': 'San Andrés',
};

function el<K extends keyof SVGElementTagNameMap>(
  tipo: K,
  atributos: Record<string, string | number> = {},
): SVGElementTagNameMap[K] {
  const e = document.createElementNS(SVG, tipo);
  for (const [k, v] of Object.entries(atributos)) e.setAttribute(k, String(v));
  return e;
}

export interface OpcionesMapa {
  figura: HTMLElement;
  svg: SVGSVGElement;
  pie: HTMLElement;
  municipios: Municipio[];
  mapa: DatosMapa;
  alElegir: (m: Municipio) => void;
}

interface Punto {
  m: Municipio;
  x: number;
  y: number;
}

export class MapaMunicipios {
  private vista: Vista = vistaCompleta();
  private readonly puntos: Punto[];
  private readonly dptos = new Map<string, SVGPathElement>();
  /** Lado mayor (en unidades del SVG) del recuadro de cada departamento. */
  private readonly tamanos = new Map<string, number>();
  private readonly capaPistas = el('g', { class: 'mapa__pistas' });
  private readonly capaEtiquetas = el('g', { class: 'mapa__etiquetas', 'aria-hidden': 'true' });
  private readonly capaNombres = el('g', { class: 'mapa__nombres', 'aria-hidden': 'true' });
  private readonly seleccion = el('circle', { class: 'mapa__sel', r: 0 });
  private elegido: Municipio | null = null;
  private pistas: Pista[] = [];
  private respuesta: Municipio | null = null;
  private punteros = new Map<number, { x: number; y: number }>();
  private arrastre: { x: number; y: number; movido: boolean } | null = null;
  private pinza: number | null = null;

  constructor(private readonly o: OpcionesMapa) {
    this.puntos = o.municipios.map((m) => ({ m, ...proyectar(m.lat, m.lon) }));
    this.construir();
    this.eventos();
    o.figura.hidden = false;
    this.aplicarVista();
    this.textoPie();
  }

  /** Redibuja intentos, círculo de distancia y respuesta. */
  actualizar(pistas: Pista[], respuesta: Municipio | null): void {
    this.pistas = pistas;
    this.respuesta = respuesta;
    if (respuesta || pistas.some((p) => p.municipio.cod === this.elegido?.cod)) {
      this.elegido = null;
    }
    this.dibujarPistas();
    this.marcarDptos();
    this.textoPie();
  }

  retraducir(): void {
    this.o.svg.setAttribute('aria-label', t('mapaTitulo'));
    this.textoPie();
  }

  // ---------- Construcción ----------
  private construir(): void {
    const { svg, mapa } = this.o;
    svg.setAttribute('viewBox', `0 0 ${ANCHO.toFixed(1)} ${ALTO.toFixed(1)}`);
    svg.setAttribute('aria-label', t('mapaTitulo'));
    svg.replaceChildren();

    // Rayado para los departamentos descartados (además del color, por accesibilidad).
    const defs = el('defs');
    const patron = el('pattern', {
      id: 'mapa-rayado',
      width: 6,
      height: 6,
      patternUnits: 'userSpaceOnUse',
      patternTransform: 'rotate(45)',
    });
    patron.append(el('line', { class: 'mapa__raya', x1: 0, y1: 0, x2: 0, y2: 6 }));
    defs.append(patron);
    svg.append(defs);
    svg.append(el('path', { class: 'mapa__vecinos', d: rutaSvg(mapa.vecinos) }));
    const capaDptos = el('g', { class: 'mapa__dptos' });
    for (const d of mapa.departamentos) {
      const p = el('path', { class: 'mapa__dpto', d: rutaSvg(d.anillos), 'data-cod': d.codDpto });
      this.dptos.set(d.codDpto, p);
      const xy = d.anillos.flat().map(([lon, lat]) => proyectar(lat, lon));
      const xs = xy.map((q) => q.x);
      const ys = xy.map((q) => q.y);
      this.tamanos.set(
        d.codDpto,
        Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)),
      );
      capaDptos.append(p);
    }
    svg.append(capaDptos);

    // Todos los municipios en un solo path: un punto es un trazo de largo 0.
    const d = this.puntos.map((p) => `M${p.x.toFixed(1)} ${p.y.toFixed(1)}h0`).join('');
    svg.append(el('path', { class: 'mapa__puntos', d }));

    this.etiquetas();
    svg.append(this.capaEtiquetas, this.capaNombres, this.capaPistas, this.seleccion);
  }

  private etiquetas(): void {
    const grupos = new Map<string, Punto[]>();
    for (const p of this.puntos) {
      const g = grupos.get(p.m.codDpto) ?? [];
      g.push(p);
      grupos.set(p.m.codDpto, g);
    }
    for (const [cod, ps] of grupos) {
      const x = ps.reduce((s, p) => s + p.x, 0) / ps.length;
      const y = ps.reduce((s, p) => s + p.y, 0) / ps.length;
      const nombre = CORTOS[cod] ?? (ps[0] as Punto).m.dpto;
      // Departamentos chicos: su nombre aparece solo al acercar.
      const tam = this.tamanos.get(cod);
      const chico = tam === undefined ? ps.length < 3 : tam < 60;
      const texto = el('text', {
        x: x.toFixed(1),
        y: y.toFixed(1),
        class: chico ? 'mapa__etiqueta mapa__etiqueta--chica' : 'mapa__etiqueta',
        'text-anchor': 'middle',
      });
      texto.textContent = nombre;
      this.capaEtiquetas.append(texto);
    }
  }

  // ---------- Pistas ----------
  private dibujarPistas(): void {
    const capa = this.capaPistas;
    capa.replaceChildren();
    const ultima = this.pistas.at(-1);
    if (ultima && !ultima.acierto && !this.respuesta) {
      const c = proyectar(ultima.municipio.lat, ultima.municipio.lon);
      capa.append(
        el('circle', {
          class: 'mapa__radio',
          cx: c.x.toFixed(1),
          cy: c.y.toFixed(1),
          r: kmAUnidades(ultima.distanciaKm).toFixed(1),
        }),
      );
    }
    this.pistas.forEach((p, i) => {
      const c = proyectar(p.municipio.lat, p.municipio.lon);
      const g = el('g', {
        class: p.acierto ? 'mapa__intento mapa__intento--acierto' : 'mapa__intento',
      });
      g.append(el('circle', { cx: c.x.toFixed(1), cy: c.y.toFixed(1) }));
      const n = el('text', { x: c.x.toFixed(1), y: c.y.toFixed(1), 'text-anchor': 'middle' });
      n.textContent = p.acierto ? '✓' : String(i + 1);
      g.append(n);
      capa.append(g);
    });
    if (this.respuesta && !this.pistas.some((p) => p.acierto)) {
      const c = proyectar(this.respuesta.lat, this.respuesta.lon);
      const g = el('g', { class: 'mapa__intento mapa__intento--respuesta' });
      g.append(el('circle', { cx: c.x.toFixed(1), cy: c.y.toFixed(1) }));
      const n = el('text', { x: c.x.toFixed(1), y: c.y.toFixed(1), 'text-anchor': 'middle' });
      n.textContent = '★';
      g.append(n);
      capa.append(g);
    }
    this.escalarMarcas();
  }

  /** Departamentos descartados (otro departamento) y confirmado (mismo). */
  private marcarDptos(): void {
    const si = new Set<string>();
    const no = new Set<string>();
    for (const p of this.pistas) (p.mismoDpto ? si : no).add(p.municipio.codDpto);
    for (const [cod, path] of this.dptos) {
      path.classList.toggle('mapa__dpto--si', si.has(cod));
      path.classList.toggle('mapa__dpto--no', no.has(cod) && !si.has(cod));
      path.classList.toggle('mapa__dpto--elegido', cod === this.elegido?.codDpto);
    }
  }

  // ---------- Selección ----------
  private elegirEn(x: number, y: number, radio: number): void {
    let mejor: Punto | null = null;
    let dmin = radio * radio;
    for (const p of this.puntos) {
      const d = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (d < dmin) {
        dmin = d;
        mejor = p;
      }
    }
    if (!mejor) return;
    this.elegido = mejor.m;
    this.o.alElegir(mejor.m);
    this.marcarDptos();
    this.textoPie();
    this.escalarMarcas();
  }

  private textoPie(): void {
    const { pie } = this.o;
    if (this.respuesta) {
      pie.textContent = t('mapaRespuesta', {
        lugar: `${this.respuesta.nombre}, ${this.respuesta.dpto}`,
      });
    } else if (this.elegido) {
      pie.textContent = t('mapaElegido', {
        lugar: `${this.elegido.nombre}, ${this.elegido.dpto}`,
      });
    } else {
      pie.textContent = t('mapaAyuda');
    }
    const s = this.seleccion;
    if (this.elegido) {
      const c = proyectar(this.elegido.lat, this.elegido.lon);
      s.setAttribute('cx', c.x.toFixed(1));
      s.setAttribute('cy', c.y.toFixed(1));
      s.classList.add('visible');
    } else {
      s.classList.remove('visible');
    }
  }

  // ---------- Vista: zoom y arrastre ----------
  private get unidadesPorPx(): number {
    const ancho = this.o.svg.clientWidth || ANCHO;
    return this.vista.w / ancho;
  }

  private get nivelZoom(): number {
    return ANCHO / this.vista.w;
  }

  private aplicarVista(): void {
    const v = this.vista;
    const { svg, figura } = this.o;
    svg.setAttribute(
      'viewBox',
      `${v.x.toFixed(1)} ${v.y.toFixed(1)} ${v.w.toFixed(1)} ${v.h.toFixed(1)}`,
    );
    figura.classList.toggle('mapa--acercado', this.nivelZoom > 1.01);
    figura.classList.toggle('mapa--detalle', this.nivelZoom >= ZOOM_ETIQUETAS_CHICAS);
    figura.classList.toggle('mapa--cerca', this.nivelZoom >= ZOOM_NOMBRES);
    this.nombres();
    this.escalarMarcas();
  }

  /** Con mucho zoom, escribe el nombre de cada municipio que queda a la vista. */
  private nombres(): void {
    const capa = this.capaNombres;
    const v = this.vista;
    const visibles =
      this.nivelZoom < ZOOM_NOMBRES
        ? []
        : this.puntos.filter(
            (p) => p.x >= v.x && p.x <= v.x + v.w && p.y >= v.y && p.y <= v.y + v.h,
          );
    if (visibles.length > MAX_NOMBRES) {
      capa.replaceChildren();
      return;
    }
    capa.replaceChildren(
      ...visibles.map((p) => {
        const texto = el('text', {
          x: p.x.toFixed(1),
          y: p.y.toFixed(1),
          class: 'mapa__nombre',
          'text-anchor': 'middle',
        });
        texto.textContent = p.m.nombre;
        return texto;
      }),
    );
  }

  /** Mantiene textos y marcas del mismo tamaño en pantalla al hacer zoom. */
  private escalarMarcas(): void {
    const u = this.unidadesPorPx;
    this.capaEtiquetas.setAttribute('font-size', (10 * u).toFixed(2));
    this.capaPistas.setAttribute('font-size', (10 * u).toFixed(2));
    this.capaNombres.setAttribute('font-size', (11 * u).toFixed(2));
    for (const n of this.capaNombres.querySelectorAll('text')) {
      n.setAttribute('dy', (-6 * u).toFixed(2));
    }
    for (const c of this.capaPistas.querySelectorAll('.mapa__intento circle')) {
      c.setAttribute('r', (9 * u).toFixed(2));
    }
    for (const n of this.capaPistas.querySelectorAll('.mapa__intento text')) {
      n.setAttribute('dy', (3.8 * u).toFixed(2));
    }
    this.seleccion.setAttribute('r', (8 * u).toFixed(2));
  }

  private aSvg(clienteX: number, clienteY: number): { x: number; y: number } {
    const r = this.o.svg.getBoundingClientRect();
    return {
      x: this.vista.x + ((clienteX - r.left) / (r.width || 1)) * this.vista.w,
      y: this.vista.y + ((clienteY - r.top) / (r.height || 1)) * this.vista.h,
    };
  }

  private acercar(factor: number, centro?: { x: number; y: number }): void {
    const c = centro ?? { x: this.vista.x + this.vista.w / 2, y: this.vista.y + this.vista.h / 2 };
    this.vista = zoom(this.vista, factor, c.x, c.y);
    this.aplicarVista();
  }

  private eventos(): void {
    const { svg, figura } = this.o;
    figura.querySelector('[data-mapa="mas"]')?.addEventListener('click', () => this.acercar(2));
    figura.querySelector('[data-mapa="menos"]')?.addEventListener('click', () => this.acercar(0.5));
    figura.querySelector('[data-mapa="todo"]')?.addEventListener('click', () => {
      this.vista = vistaCompleta();
      this.aplicarVista();
    });

    svg.addEventListener('pointerdown', (e) => {
      this.punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.punteros.size === 1) this.arrastre = { x: e.clientX, y: e.clientY, movido: false };
      if (this.punteros.size === 2) this.pinza = this.distanciaPunteros();
    });
    svg.addEventListener('pointermove', (e) => {
      if (!this.punteros.has(e.pointerId)) return;
      const antes = this.punteros.get(e.pointerId) as { x: number; y: number };
      this.punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.punteros.size === 2 && this.pinza) {
        const ahora = this.distanciaPunteros();
        const [a, b] = [...this.punteros.values()] as [
          { x: number; y: number },
          { x: number; y: number },
        ];
        this.acercar(ahora / this.pinza, this.aSvg((a.x + b.x) / 2, (a.y + b.y) / 2));
        this.pinza = ahora;
        if (this.arrastre) this.arrastre.movido = true;
        return;
      }
      const a = this.arrastre;
      if (!a) return;
      if (Math.hypot(e.clientX - a.x, e.clientY - a.y) > 6) a.movido = true;
      if (a.movido && this.nivelZoom > 1.01) {
        svg.setPointerCapture?.(e.pointerId);
        const u = this.unidadesPorPx;
        this.vista = mover(this.vista, (antes.x - e.clientX) * u, (antes.y - e.clientY) * u);
        this.aplicarVista();
      }
    });
    const soltar = (e: PointerEvent) => {
      const a = this.arrastre;
      this.punteros.delete(e.pointerId);
      if (this.punteros.size < 2) this.pinza = null;
      if (this.punteros.size > 0) return;
      this.arrastre = null;
      if (a && !a.movido && e.type === 'pointerup') {
        const p = this.aSvg(e.clientX, e.clientY);
        this.elegirEn(p.x, p.y, TOQUE_PX * this.unidadesPorPx);
      }
    };
    svg.addEventListener('pointerup', soltar);
    svg.addEventListener('pointercancel', soltar);
    svg.addEventListener('dblclick', (e) => {
      e.preventDefault();
      this.acercar(2, this.aSvg(e.clientX, e.clientY));
    });
    // Rueda solo con Ctrl (o pellizco del trackpad) para no atrapar el scroll.
    svg.addEventListener(
      'wheel',
      (e) => {
        if (!e.ctrlKey) return;
        e.preventDefault();
        this.acercar(e.deltaY < 0 ? 1.25 : 0.8, this.aSvg(e.clientX, e.clientY));
      },
      { passive: false },
    );
    // Teclado: flechas mueven, + y - acercan, 0 vuelve a todo el país.
    svg.addEventListener('keydown', (e) => {
      const paso = this.vista.w * 0.15;
      const mov: Record<string, [number, number]> = {
        ArrowLeft: [-paso, 0],
        ArrowRight: [paso, 0],
        ArrowUp: [0, -paso],
        ArrowDown: [0, paso],
      };
      if (mov[e.key]) {
        e.preventDefault();
        const [dx, dy] = mov[e.key] as [number, number];
        this.vista = mover(this.vista, dx, dy);
        this.aplicarVista();
      } else if (e.key === '+' || e.key === '=') {
        this.acercar(2);
      } else if (e.key === '-') {
        this.acercar(0.5);
      } else if (e.key === '0') {
        this.vista = vistaCompleta();
        this.aplicarVista();
      }
    });
    if ('ResizeObserver' in window) {
      new ResizeObserver(() => this.escalarMarcas()).observe(svg);
    }
  }

  private distanciaPunteros(): number {
    const [a, b] = [...this.punteros.values()] as [
      { x: number; y: number },
      { x: number; y: number },
    ];
    return Math.hypot(a.x - b.x, a.y - b.y) || 1;
  }
}
