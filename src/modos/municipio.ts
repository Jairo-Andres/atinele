import type { Partida } from '../almacen';
import { t, type Clave } from '../i18n';
import { filaMunicipio } from '../juego/compartir';
import type { Direccion } from '../juego/geo';
import {
  buscar,
  coincidenciasExactas,
  evaluarMunicipio,
  jugables,
  type DatosMunicipios,
  type Municipio,
  type Pista,
  unicaPorPalabra,
} from '../juego/municipios';
import type { DatosMapa } from '../juego/mapa';
import { anunciar, avisar } from '../ui/aviso';
import { MapaMunicipios } from './mapa';

export interface OpcionesMunicipio {
  codigoRespuesta: string;
  maxIntentos: number;
  partida: Partida;
  datos: Promise<DatosMunicipios>;
  form: HTMLFormElement;
  entrada: HTMLInputElement;
  sugerencias: HTMLUListElement;
  lista: HTMLOListElement;
  alCambiar: (partida: Partida) => void;
  alTerminar: (partida: Partida, animado: boolean) => void;
  /** Mapa de ayuda; si no carga, el juego sigue sin él. */
  mapa?: { figura: HTMLElement; svg: SVGSVGElement; pie: HTMLElement; datos: Promise<DatosMapa> };
}

const GRADOS: Record<Direccion, number> = {
  N: 0,
  NE: 45,
  E: 90,
  SE: 135,
  S: 180,
  SO: 225,
  O: 270,
  NO: 315,
};

export class JuegoMunicipio {
  private datos: DatosMunicipios | null = null;
  private porCodigo = new Map<string, Municipio>();
  private candidatos: Municipio[] = [];
  private opciones: Municipio[] = [];
  private activa = -1;
  private elegido: Municipio | null = null;
  private mapa: MapaMunicipios | null = null;

  constructor(private readonly o: OpcionesMunicipio) {
    o.entrada.disabled = true;
    o.entrada.placeholder = t('cargandoMunicipios');
    o.datos.then(
      (d) => {
        this.datos = d;
        this.porCodigo = new Map(d.municipios.map((m) => [m.cod, m]));
        this.candidatos = jugables(d.municipios);
        o.entrada.disabled = this.terminado;
        o.entrada.placeholder = '';
        o.form.dataset.listo = 'true';
        this.dibujar();
        if (this.terminado) o.alTerminar(o.partida, false);
        this.iniciarMapa();
      },
      () => {
        o.entrada.placeholder = '';
        avisar(t('errorMunicipios'), 5000);
      },
    );
    o.entrada.addEventListener('input', () => {
      this.elegido = null;
      this.actualizarSugerencias();
    });
    o.entrada.addEventListener('keydown', (e) => this.teclas(e));
    o.entrada.addEventListener('blur', () =>
      window.setTimeout(() => this.cerrarSugerencias(), 150),
    );
    o.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.enviarTexto();
    });
    this.dibujar();
  }

  private iniciarMapa(): void {
    const m = this.o.mapa;
    if (!m) return;
    m.datos.then(
      (mapa) => {
        this.mapa = new MapaMunicipios({
          figura: m.figura,
          svg: m.svg,
          pie: m.pie,
          municipios: this.candidatos,
          mapa,
          alElegir: (mun) => this.elegir(mun),
        });
        this.dibujar();
      },
      () => {
        // Sin mapa se puede jugar igual con el buscador.
      },
    );
  }

  get terminado(): boolean {
    return this.o.partida.estado !== 'jugando';
  }

  get listo(): boolean {
    return this.datos !== null;
  }

  private get respuesta(): Municipio | undefined {
    return this.porCodigo.get(this.o.codigoRespuesta);
  }

  pistas(): Pista[] {
    const r = this.respuesta;
    if (!r || !this.datos) return [];
    const max = this.datos.distanciaMaxKm;
    return this.o.partida.intentos
      .map((cod) => this.porCodigo.get(cod))
      .filter((m): m is Municipio => m !== undefined)
      .map((m) => evaluarMunicipio(m, r, max));
  }

  respuestaVisible(): string {
    const r = this.respuesta;
    return r ? `${r.nombre}, ${r.dpto}` : '';
  }

  filasCompartir(altoContraste: boolean): string[] {
    return this.pistas().map((p) => filaMunicipio(p, altoContraste));
  }

  retraducir(): void {
    this.mapa?.retraducir();
    this.dibujar();
  }

  // ---------- Autocompletado (patrón combobox de WAI-ARIA) ----------
  private actualizarSugerencias(): void {
    this.opciones = buscar(this.candidatos, this.o.entrada.value);
    this.activa = -1;
    const { sugerencias, entrada } = this.o;
    sugerencias.replaceChildren(
      ...this.opciones.map((m, i) => {
        const li = document.createElement('li');
        li.id = `sugerencia-${i}`;
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', 'false');
        const nombre = document.createElement('span');
        nombre.textContent = m.nombre;
        const dpto = document.createElement('span');
        dpto.className = 'sugerencia__dpto';
        dpto.textContent = m.dpto;
        li.append(nombre, dpto);
        // mousedown para que ocurra antes del blur de la entrada.
        li.addEventListener('mousedown', (e) => {
          e.preventDefault();
          this.elegir(m);
          this.enviar(m);
        });
        return li;
      }),
    );
    const abierta = this.opciones.length > 0;
    sugerencias.hidden = !abierta;
    entrada.setAttribute('aria-expanded', String(abierta));
    entrada.removeAttribute('aria-activedescendant');
  }

  private cerrarSugerencias(): void {
    this.o.sugerencias.hidden = true;
    this.o.entrada.setAttribute('aria-expanded', 'false');
    this.o.entrada.removeAttribute('aria-activedescendant');
    this.activa = -1;
  }

  private marcar(indice: number): void {
    const items = Array.from(this.o.sugerencias.children) as HTMLElement[];
    if (!items.length) return;
    this.activa = (indice + items.length) % items.length;
    items.forEach((li, i) => li.setAttribute('aria-selected', String(i === this.activa)));
    const actual = items[this.activa] as HTMLElement;
    this.o.entrada.setAttribute('aria-activedescendant', actual.id);
    actual.scrollIntoView({ block: 'nearest' });
  }

  private teclas(e: KeyboardEvent): void {
    const abierta = !this.o.sugerencias.hidden;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!abierta) this.actualizarSugerencias();
      this.marcar(this.activa + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (abierta) this.marcar(this.activa - 1);
    } else if (e.key === 'Escape') {
      if (abierta) {
        e.preventDefault();
        this.cerrarSugerencias();
      }
    } else if (e.key === 'Enter' && abierta && this.activa >= 0) {
      e.preventDefault();
      const m = this.opciones[this.activa] as Municipio;
      this.elegir(m);
      this.enviar(m);
    }
  }

  private elegir(m: Municipio): void {
    this.elegido = m;
    this.o.entrada.value = `${m.nombre}, ${m.dpto}`;
    this.cerrarSugerencias();
  }

  private enviarTexto(): void {
    if (this.terminado || !this.datos) return;
    if (this.elegido) return this.enviar(this.elegido);
    const texto = this.o.entrada.value;
    if (!texto.trim()) return;
    const exactas = coincidenciasExactas(this.candidatos, texto);
    if (exactas.length === 1) return this.enviar(exactas[0] as Municipio);
    if (exactas.length > 1) {
      avisar(t('elegirDpto'), 3500);
      this.actualizarSugerencias();
      return;
    }
    // Sin coincidencia exacta pero una sola sugerencia (p. ej. "Bogotá" → "Bogotá, D.C.").
    const parecidas = buscar(this.candidatos, texto);
    if (parecidas.length === 1) return this.enviar(parecidas[0] as Municipio);
    const unica = unicaPorPalabra(parecidas, texto);
    if (unica) return this.enviar(unica);
    if (parecidas.length > 1) {
      avisar(t('elegirDeLista'), 3500);
      this.actualizarSugerencias();
      return;
    }
    avisar(t('municipioNoEncontrado'), 3000);
  }

  private enviar(m: Municipio): void {
    const p = this.o.partida;
    if (this.terminado || !this.respuesta) return;
    if (p.intentos.includes(m.cod)) {
      avisar(t('yaIntentado'));
      return;
    }
    p.intentos.push(m.cod);
    if (m.cod === this.o.codigoRespuesta) p.estado = 'ganada';
    else if (p.intentos.length >= this.o.maxIntentos) p.estado = 'perdida';
    this.o.alCambiar(p);

    this.elegido = null;
    this.o.entrada.value = '';
    this.cerrarSugerencias();
    this.dibujar(p.intentos.length - 1);

    const pista = this.pistas().at(-1) as Pista;
    anunciar(this.textoPista(p.intentos.length, pista));
    if (this.terminado) {
      this.o.entrada.disabled = true;
      this.o.alTerminar(p, true);
    } else {
      this.o.entrada.focus();
    }
  }

  private textoPista(n: number, p: Pista): string {
    const lugar = `${p.municipio.nombre}, ${p.municipio.dpto}`;
    if (p.acierto) return t('anuncioAcierto', { n, lugar });
    return t('anuncioMunicipio', {
      n,
      lugar,
      km: p.distanciaKm,
      dir: t(`dir${p.direccion}` as Clave),
      pct: p.cercania,
      dpto: p.mismoDpto ? t('mismoDpto') : t('otroDpto'),
    });
  }

  // ---------- Lista de intentos ----------
  private dibujar(nueva?: number): void {
    const pistas = this.pistas();
    const filas = Array.from({ length: this.o.maxIntentos }, (_, i) => {
      const li = document.createElement('li');
      const p = pistas[i];
      if (!p) {
        li.className = 'pista pista--vacia';
        li.textContent = t('intentoN', { n: i + 1 });
        return li;
      }
      li.className = 'pista';
      if (i === nueva) li.classList.add('pista--nueva');
      if (p.acierto) li.dataset.acierto = 'true';

      const nombre = document.createElement('div');
      nombre.className = 'pista__nombre';
      const fuerte = document.createElement('strong');
      fuerte.textContent = p.municipio.nombre;
      const dpto = document.createElement('span');
      dpto.textContent = p.municipio.dpto;
      nombre.append(fuerte, dpto);

      const datos = document.createElement('div');
      datos.className = 'pista__datos';
      if (p.acierto) {
        const ok = document.createElement('span');
        ok.className = 'pista__acierto';
        ok.textContent = `📍 ${t('ahiEs')}`;
        datos.append(ok);
      } else {
        const km = document.createElement('span');
        km.className = 'pista__km';
        km.textContent = `${p.distanciaKm.toLocaleString('es-CO')} km`;

        const dir = document.createElement('span');
        dir.className = 'pista__dir';
        dir.title = t(`dir${p.direccion}` as Clave);
        dir.innerHTML =
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l6 8h-4v10h-4V11H6z"/></svg>';
        // Por CSSOM (no atributo style) para cumplir la CSP.
        dir.querySelector('svg')?.style.setProperty('--giro', `${GRADOS[p.direccion]}deg`);
        const dirTexto = document.createElement('span');
        dirTexto.textContent = t(`dirCorta${p.direccion}` as Clave);
        dir.append(dirTexto);

        const pct = document.createElement('span');
        pct.className = 'pista__pct';
        pct.style.setProperty('--p', `${p.cercania}%`);
        pct.textContent = `${p.cercania} %`;
        pct.title = t('cercania');

        datos.append(km, dir, pct);
      }

      li.append(nombre, datos);
      if (!p.acierto) {
        const mismo = document.createElement('span');
        mismo.className = 'pista__dpto';
        mismo.dataset.mismo = String(p.mismoDpto);
        mismo.textContent = p.mismoDpto ? `✓ ${t('mismoDpto')}` : `✗ ${t('otroDpto')}`;
        li.append(mismo);
      }
      li.setAttribute('aria-label', this.textoPista(i + 1, p));
      return li;
    });
    this.o.lista.replaceChildren(...filas);
    this.mapa?.actualizar(pistas, this.terminado ? (this.respuesta ?? null) : null);
  }
}
