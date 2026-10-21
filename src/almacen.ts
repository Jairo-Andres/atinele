import { estadisticasVacias, type Estadisticas } from './juego/estadisticas';
import { diasEntre } from './juego/dia';

export const CLAVE = 'atinele:v1';
const DIAS_GUARDADOS = 7;

export type EstadoPartida = 'jugando' | 'ganada' | 'perdida';

export interface Partida {
  intentos: string[];
  estado: EstadoPartida;
  /** Modo Dicho: si pidió la pista (se marca con 💡 al compartir). */
  pista?: boolean;
  /**
   * Respuesta con la que se jugó (palabra, código o id del dicho). Si el
   * calendario cambia y el reto de hoy ya no es el mismo, la partida no se
   * reutiliza contra otra respuesta.
   */
  clave?: string;
}

export interface Ajustes {
  tema: 'sistema' | 'claro' | 'oscuro';
  altoContraste: boolean;
  idioma: 'es' | 'en' | null;
  vioInstrucciones: boolean;
}

export type IdModo = 'palabra' | 'municipio' | 'dicho' | 'categoria';
export const MODOS: IdModo[] = ['palabra', 'municipio', 'dicho', 'categoria'];

export type PartidasPorDia = Record<string, Partial<Record<IdModo, Partida>>>;
export type EstadisticasPorModo = Record<IdModo, Estadisticas>;

/** Un jugador de este navegador (para la clasificación). */
export interface Perfil {
  id: string;
  /** Vacío = sin nombre (se muestra "Jugador 1"). */
  nombre: string;
  partidas: PartidasPorDia;
  estadisticas: EstadisticasPorModo;
}

export interface Datos {
  ajustes: Ajustes;
  /** Partidas y estadísticas del jugador actual. */
  partidas: PartidasPorDia;
  estadisticas: EstadisticasPorModo;
  /**
   * Jugadores de este navegador. Los datos del actual viven arriba (partidas y
   * estadisticas); en la lista se guardan los de los demás.
   */
  jugadores: { actual: string; lista: Perfil[] };
}

function estadisticasPorModoVacias(): EstadisticasPorModo {
  return Object.fromEntries(MODOS.map((m) => [m, estadisticasVacias()])) as EstadisticasPorModo;
}

function perfilVacio(id: string, nombre = ''): Perfil {
  return { id, nombre, partidas: {}, estadisticas: estadisticasPorModoVacias() };
}

export function datosVacios(): Datos {
  return {
    ajustes: { tema: 'sistema', altoContraste: false, idioma: null, vioInstrucciones: false },
    partidas: {},
    estadisticas: estadisticasPorModoVacias(),
    jugadores: { actual: 'j1', lista: [perfilVacio('j1')] },
  };
}

function leerEstadisticas(leidas: Partial<EstadisticasPorModo> | undefined): EstadisticasPorModo {
  const base = estadisticasPorModoVacias();
  for (const m of MODOS) base[m] = { ...base[m], ...leidas?.[m] };
  return base;
}

function podarPartidas(partidas: PartidasPorDia | undefined, hoy: string): PartidasPorDia {
  const copia = { ...partidas };
  for (const dia of Object.keys(copia)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dia) || diasEntre(dia, hoy) >= DIAS_GUARDADOS) {
      delete copia[dia];
    }
  }
  return copia;
}

/**
 * Lee los datos guardados. Si localStorage no está disponible (navegación
 * privada, almacenamiento bloqueado) o el contenido está dañado, devuelve
 * datos vacíos y el juego sigue funcionando sin recordar.
 */
export function cargar(hoy: string, almacen: Storage | null = obtenerAlmacen()): Datos {
  const base = datosVacios();
  if (!almacen) return base;
  try {
    const crudo = almacen.getItem(CLAVE);
    if (!crudo) return base;
    const leido = JSON.parse(crudo) as Partial<Datos>;
    // Datos de antes de la clasificación: no traen jugadores; se crea uno.
    const lista = (leido.jugadores?.lista ?? []).filter((p) => p && typeof p.id === 'string');
    const actual = leido.jugadores?.actual;
    const jugadores =
      actual && lista.some((p) => p.id === actual)
        ? {
            actual,
            lista: lista.map((p) => ({
              id: p.id,
              nombre: typeof p.nombre === 'string' ? p.nombre : '',
              partidas: podarPartidas(p.partidas, hoy),
              estadisticas: leerEstadisticas(p.estadisticas),
            })),
          }
        : base.jugadores;
    return {
      ajustes: { ...base.ajustes, ...leido.ajustes },
      partidas: podarPartidas(leido.partidas, hoy),
      estadisticas: leerEstadisticas(leido.estadisticas),
      jugadores,
    };
  } catch {
    return base;
  }
}

export function guardar(datos: Datos, almacen: Storage | null = obtenerAlmacen()): boolean {
  if (!almacen) return false;
  try {
    almacen.setItem(CLAVE, JSON.stringify(datos));
    return true;
  } catch {
    return false;
  }
}

export function borrar(almacen: Storage | null = obtenerAlmacen()): void {
  try {
    almacen?.removeItem(CLAVE);
  } catch {
    // Sin almacenamiento no hay nada que borrar.
  }
}

function obtenerAlmacen(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

// ---------- Jugadores ----------

/** Lista de jugadores con los datos del actual al día. */
export function perfiles(datos: Datos): Perfil[] {
  return datos.jugadores.lista.map((p) =>
    p.id === datos.jugadores.actual
      ? { ...p, partidas: datos.partidas, estadisticas: datos.estadisticas }
      : p,
  );
}

function nuevoId(datos: Datos): string {
  const usados = new Set(datos.jugadores.lista.map((p) => p.id));
  let n = datos.jugadores.lista.length + 1;
  while (usados.has(`j${n}`)) n++;
  return `j${n}`;
}

/** Agrega un jugador sin partidas y devuelve su id (no lo vuelve el actual). */
export function agregarJugador(datos: Datos, nombre: string): string {
  const id = nuevoId(datos);
  datos.jugadores.lista.push(perfilVacio(id, nombre.trim()));
  return id;
}

/** Guarda los datos del actual en su perfil y carga los de otro jugador. */
export function cambiarJugador(datos: Datos, id: string): void {
  const destino = datos.jugadores.lista.find((p) => p.id === id);
  if (!destino || id === datos.jugadores.actual) return;
  datos.jugadores.lista = perfiles(datos);
  datos.partidas = destino.partidas;
  datos.estadisticas = destino.estadisticas;
  datos.jugadores.actual = id;
}

export function renombrarJugador(datos: Datos, id: string, nombre: string): void {
  const p = datos.jugadores.lista.find((x) => x.id === id);
  if (p) p.nombre = nombre.trim();
}

/** Quita a un jugador. El actual no se puede quitar (primero hay que cambiar). */
export function quitarJugador(datos: Datos, id: string): void {
  if (id === datos.jugadores.actual) return;
  datos.jugadores.lista = datos.jugadores.lista.filter((p) => p.id !== id);
}
