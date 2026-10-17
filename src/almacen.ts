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

export interface Datos {
  ajustes: Ajustes;
  partidas: Record<string, { palabra?: Partida; municipio?: Partida; dicho?: Partida }>;
  estadisticas: { palabra: Estadisticas; municipio: Estadisticas; dicho: Estadisticas };
}

export function datosVacios(): Datos {
  return {
    ajustes: { tema: 'sistema', altoContraste: false, idioma: null, vioInstrucciones: false },
    partidas: {},
    estadisticas: {
      palabra: estadisticasVacias(),
      municipio: estadisticasVacias(),
      dicho: estadisticasVacias(),
    },
  };
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
    const datos: Datos = {
      ajustes: { ...base.ajustes, ...leido.ajustes },
      partidas: leido.partidas ?? {},
      estadisticas: {
        palabra: { ...base.estadisticas.palabra, ...leido.estadisticas?.palabra },
        municipio: { ...base.estadisticas.municipio, ...leido.estadisticas?.municipio },
        dicho: { ...base.estadisticas.dicho, ...leido.estadisticas?.dicho },
      },
    };
    for (const dia of Object.keys(datos.partidas)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dia) || diasEntre(dia, hoy) >= DIAS_GUARDADOS) {
        delete datos.partidas[dia];
      }
    }
    return datos;
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
