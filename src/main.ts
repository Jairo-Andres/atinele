import './estilos/tokens.css';
import './estilos/components.css';
import './estilos/juego.css';

import calendarioJson from '../data/contenido/calendario.json';
import { cargar, borrar, guardar, type Datos, type Partida } from './almacen';
import {
  LARGO_PALABRA,
  MAX_INTENTOS,
  NOMBRE,
  URL_LINKEDIN,
  URL_PORTAFOLIO,
  URL_PUBLICA,
  URL_REPO,
} from './config';
import { idiomaInicial, t, traducirDocumento, usarIdioma, idioma, type Idioma } from './i18n';
import { retoDelDia, type Calendario } from './juego/calendario';
import { enlaceWhatsApp, textoCompartir, textoConFilas } from './juego/compartir';
import { formatoCuentaRegresiva, hoyEnColombia, msHastaManana } from './juego/dia';
import { porcentajeVictorias, rachaVigente, registrarPartida } from './juego/estadisticas';
import type { DatosMapa } from './juego/mapa';
import type { DatosMunicipios } from './juego/municipios';
import { JuegoMunicipio } from './modos/municipio';
import { JuegoPalabra } from './modos/palabra';
import { avisar } from './ui/aviso';
import { abrirDialogo, hayDialogoAbierto, iniciarDialogos } from './ui/dialogos';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

const hoy = hoyEnColombia();
const reto = retoDelDia(calendarioJson as Calendario, hoy);
if (reto.repetido) console.warn('Atínele: el calendario se acabó; se está repitiendo el ciclo.');

const datos: Datos = cargar(hoy);
usarIdioma(idiomaInicial(datos.ajustes.idioma, navigator.language));

/** El calendario guarda la forma con tildes (ÁRBOL) para mostrarla al final. */
const formaVisible = reto.palabra;

type IdModo = 'palabra' | 'municipio';

function partidaDeHoy(modo: IdModo = 'palabra'): Partida {
  const dia = (datos.partidas[hoy] ??= {});
  return (dia[modo] ??= { intentos: [], estado: 'jugando' });
}

function guardarDatos(): void {
  guardar(datos);
}

// ---------- Tema y alto contraste ----------
function aplicarAjustes(): void {
  const raiz = document.documentElement;
  if (datos.ajustes.tema === 'sistema') delete raiz.dataset.theme;
  else raiz.dataset.theme = datos.ajustes.tema === 'oscuro' ? 'dark' : 'light';
  raiz.classList.toggle('alto-contraste', datos.ajustes.altoContraste);
}

// ---------- Palabras válidas ----------
async function cargarValidas(): Promise<Set<string>> {
  const r = await fetch(`${import.meta.env.BASE_URL}palabras/${LARGO_PALABRA}.txt`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return new Set((await r.text()).split('\n').filter(Boolean));
}

async function cargarMunicipios(): Promise<DatosMunicipios> {
  const r = await fetch(`${import.meta.env.BASE_URL}datos/municipios.json`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return (await r.json()) as DatosMunicipios;
}

async function cargarMapa(): Promise<DatosMapa> {
  const r = await fetch(`${import.meta.env.BASE_URL}datos/mapa.json`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return (await r.json()) as DatosMapa;
}

// ---------- Estadísticas y resultado ----------
let juego: JuegoPalabra;
let juegoMunicipio: JuegoMunicipio | null = null;
/** Modo cuyas estadísticas muestra el diálogo. */
let modoEstadisticas: IdModo = 'palabra';

function textoResultado(): string {
  if (modoEstadisticas === 'municipio' && juegoMunicipio) {
    const p = partidaDeHoy('municipio');
    return textoConFilas({
      nombre: NOMBRE,
      numero: reto.numero,
      icono: '📍',
      etiquetaModo: 'Municipio',
      filas: juegoMunicipio.filasCompartir(datos.ajustes.altoContraste),
      ganado: p.estado === 'ganada',
      maxIntentos: MAX_INTENTOS,
      url: URL_PUBLICA,
    });
  }
  const p = partidaDeHoy();
  return textoCompartir({
    nombre: NOMBRE,
    numero: reto.numero,
    intentos: juego.intentosEvaluados,
    ganado: p.estado === 'ganada',
    maxIntentos: MAX_INTENTOS,
    altoContraste: datos.ajustes.altoContraste,
    url: URL_PUBLICA,
    etiquetaModo: 'Palabra',
  });
}

function pintarEstadisticas(): void {
  const modo = modoEstadisticas;
  const e = datos.estadisticas[modo];
  const p = partidaDeHoy(modo);
  const terminado = p.estado !== 'jugando';
  $('estadisticas-modo').textContent = t('statsDe', {
    modo: t(modo === 'palabra' ? 'modoPalabra' : 'modoMunicipio'),
  });

  const numeros: [string, number][] = [
    [t('jugadas'), e.jugadas],
    [t('victorias'), porcentajeVictorias(e)],
    [t('racha'), rachaVigente(e, hoy)],
    [t('mejorRacha'), e.mejorRacha],
  ];
  $('numeros').replaceChildren(
    ...numeros.map(([etiqueta, valor]) => {
      const div = document.createElement('div');
      const dd = document.createElement('dd');
      dd.textContent = String(valor);
      const dt = document.createElement('dt');
      dt.textContent = etiqueta;
      div.append(dd, dt);
      return div;
    }),
  );

  const max = Math.max(1, ...e.distribucion);
  $('distribucion').replaceChildren(
    ...e.distribucion.map((v, i) => {
      const li = document.createElement('li');
      li.setAttribute('aria-label', t('distribucionFila', { n: i + 1, v }));
      const n = document.createElement('span');
      n.className = 'distribucion__n';
      n.textContent = String(i + 1);
      n.setAttribute('aria-hidden', 'true');
      const barra = document.createElement('span');
      barra.className = 'distribucion__barra';
      barra.style.setProperty('--ancho', `${Math.max(8, (v / max) * 100)}%`);
      barra.textContent = String(v);
      barra.setAttribute('aria-hidden', 'true');
      if (p.estado === 'ganada' && p.intentos.length === i + 1) li.classList.add('hoy');
      li.append(n, barra);
      return li;
    }),
  );

  $('resultado').hidden = !terminado;
  $('compartir').hidden = !terminado;
  if (terminado) {
    $('resultado-titulo').textContent = p.estado === 'ganada' ? t('ganaste') : t('perdiste');
    $('resultado-etiqueta').textContent = t(modo === 'palabra' ? 'laRespuesta' : 'elMunicipio');
    $('resultado-palabra').textContent =
      modo === 'palabra' ? formaVisible : (juegoMunicipio?.respuestaVisible() ?? '');
    $<HTMLAnchorElement>('btn-whatsapp').href = enlaceWhatsApp(textoResultado());
  }
}

let reloj: number | undefined;
function iniciarCuentaRegresiva(): void {
  const pintar = () =>
    ($('cuenta-regresiva').textContent = formatoCuentaRegresiva(msHastaManana()));
  pintar();
  window.clearInterval(reloj);
  reloj = window.setInterval(pintar, 1000);
}

async function compartir(): Promise<void> {
  const texto = textoResultado();
  if (navigator.share && matchMedia('(pointer: coarse)').matches) {
    try {
      await navigator.share({ text: texto });
      return;
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return;
    }
  }
  await copiar(texto);
}

async function copiar(texto = textoResultado()): Promise<void> {
  try {
    await navigator.clipboard.writeText(texto);
    avisar(t('copiado'));
  } catch {
    const caja = $('copia-manual');
    const area = $<HTMLTextAreaElement>('texto-manual');
    area.value = texto;
    caja.hidden = false;
    area.focus();
    area.select();
  }
}

// ---------- Pestañas de modo ----------
function iniciarPestanas(): void {
  const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const activar = (tab: HTMLButtonElement, enfocar: boolean) => {
    for (const otra of tabs) {
      const activa = otra === tab;
      otra.setAttribute('aria-selected', String(activa));
      otra.tabIndex = activa ? 0 : -1;
      $(otra.getAttribute('aria-controls') as string).hidden = !activa;
    }
    if (enfocar) tab.focus();
    const id = tab.id.replace('tab-', '');
    if (id === 'palabra' || id === 'municipio') modoEstadisticas = id;
    history.replaceState(null, '', id === 'palabra' ? location.pathname : `#${id}`);
  };
  const inicial = tabs.find((tab) => `#${tab.id.replace('tab-', '')}` === location.hash);
  if (inicial) activar(inicial, false);
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => activar(tab, false));
    tab.addEventListener('keydown', (e) => {
      const mover = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (mover) activar(tabs[(i + mover + tabs.length) % tabs.length] as HTMLButtonElement, true);
      if (e.key === 'Home') activar(tabs[0] as HTMLButtonElement, true);
      if (e.key === 'End') activar(tabs[tabs.length - 1] as HTMLButtonElement, true);
    });
  });
}

function palabraActiva(): boolean {
  return !$('panel-palabra').hidden;
}

function alCambiar(modo: IdModo, p: Partida): void {
  if (p.estado !== 'jugando') {
    datos.estadisticas[modo] = registrarPartida(
      datos.estadisticas[modo],
      hoy,
      p.estado === 'ganada',
      p.intentos.length,
    );
    marcarPestanas();
  }
  guardarDatos();
}

function mostrarEstadisticas(modo: IdModo): void {
  modoEstadisticas = modo;
  abrirDialogo('dlg-estadisticas');
}

/** Marca con ✓ las pestañas de los modos ya terminados hoy. */
function marcarPestanas(): void {
  for (const modo of ['palabra', 'municipio'] as const) {
    $(`tab-${modo}`).classList.toggle('jugado', partidaDeHoy(modo).estado !== 'jugando');
  }
}

// ---------- Arranque ----------
function iniciar(): void {
  aplicarAjustes();
  traducirDocumento();
  $('numero-reto').textContent = `· ${t('reto', { n: reto.numero })}`;
  $<HTMLAnchorElement>('enlace-portafolio').href = URL_PORTAFOLIO;
  $<HTMLAnchorElement>('enlace-repo').href = URL_REPO;
  $<HTMLAnchorElement>('enlace-linkedin').href = URL_LINKEDIN;
  iniciarDialogos();
  iniciarPestanas();
  marcarPestanas();

  juego = new JuegoPalabra({
    respuesta: reto.palabra,
    largo: LARGO_PALABRA,
    maxIntentos: MAX_INTENTOS,
    partida: partidaDeHoy(),
    tablero: $('tablero'),
    teclado: $('teclado'),
    validas: cargarValidas(),
    alCambiar: (p) => alCambiar('palabra', p),
    alTerminar: (_p, animado) => {
      if (animado) mostrarEstadisticas('palabra');
    },
  });

  if (reto.municipio) {
    juegoMunicipio = new JuegoMunicipio({
      codigoRespuesta: reto.municipio,
      maxIntentos: MAX_INTENTOS,
      partida: partidaDeHoy('municipio'),
      datos: cargarMunicipios(),
      form: $<HTMLFormElement>('form-municipio'),
      entrada: $<HTMLInputElement>('entrada-municipio'),
      sugerencias: $<HTMLUListElement>('sugerencias-municipio'),
      lista: $<HTMLOListElement>('intentos-municipio'),
      mapa: {
        figura: $('mapa-municipio'),
        svg: document.getElementById('mapa-svg') as unknown as SVGSVGElement,
        pie: $('mapa-pie'),
        datos: cargarMapa(),
      },
      alCambiar: (p) => alCambiar('municipio', p),
      alTerminar: (_p, animado) => {
        if (animado) window.setTimeout(() => mostrarEstadisticas('municipio'), 600);
      },
    });
  }

  // Teclado físico.
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || hayDialogoAbierto() || !palabraActiva()) return;
    const destino = e.target as HTMLElement;
    if (destino.closest('input, textarea, select')) return;
    // Enter o espacio sobre un control enfocado con teclado lo activan normalmente.
    // Tras un clic (sin :focus-visible), Enter envía el intento.
    const control = destino.closest('button, a, [role="tab"]');
    if (control && (e.key === ' ' || (e.key === 'Enter' && control.matches(':focus-visible'))))
      return;
    if (e.key === 'Enter') juego.pulsar('ENVIAR');
    else if (e.key === 'Backspace') juego.pulsar('BORRAR');
    else if (/^[a-zñáéíóúü]$/i.test(e.key)) juego.pulsar(e.key);
    else return;
    e.preventDefault();
  });

  document.querySelector('[data-abrir="dlg-estadisticas"]')?.addEventListener(
    'click',
    () => {
      modoEstadisticas = $('panel-municipio').hidden ? 'palabra' : 'municipio';
    },
    { capture: true },
  );
  $('dlg-estadisticas').addEventListener('abierto', () => {
    $('copia-manual').hidden = true;
    pintarEstadisticas();
    iniciarCuentaRegresiva();
  });
  $('dlg-estadisticas').addEventListener('close', () => window.clearInterval(reloj));
  $('btn-compartir').addEventListener('click', () => void compartir());
  $('btn-copiar').addEventListener('click', () => void copiar());

  // Ajustes.
  const radios = document.querySelectorAll<HTMLInputElement>('input[name="tema"]');
  radios.forEach((r) => {
    r.checked = r.value === datos.ajustes.tema;
    r.addEventListener('change', () => {
      datos.ajustes.tema = r.value as Datos['ajustes']['tema'];
      aplicarAjustes();
      guardarDatos();
    });
  });
  const contraste = $<HTMLInputElement>('alto-contraste');
  contraste.checked = datos.ajustes.altoContraste;
  contraste.addEventListener('change', () => {
    datos.ajustes.altoContraste = contraste.checked;
    aplicarAjustes();
    guardarDatos();
  });
  $('btn-borrar').addEventListener('click', () => {
    if (!confirm(t('confirmarBorrar'))) return;
    borrar();
    location.reload();
  });

  $('btn-idioma').addEventListener('click', () => {
    const nuevo: Idioma = idioma() === 'es' ? 'en' : 'es';
    usarIdioma(nuevo);
    datos.ajustes.idioma = nuevo;
    guardarDatos();
    traducirDocumento();
    $('numero-reto').textContent = `· ${t('reto', { n: reto.numero })}`;
    juego.retraducir();
    juegoMunicipio?.retraducir();
  });

  // Si el día cambia con la página abierta, recargar al volver.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && hoyEnColombia() !== hoy) location.reload();
  });

  if (!datos.ajustes.vioInstrucciones) {
    datos.ajustes.vioInstrucciones = true;
    guardarDatos();
    abrirDialogo('dlg-ayuda');
  }
}

iniciar();
