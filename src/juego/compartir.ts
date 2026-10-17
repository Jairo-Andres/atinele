import type { EstadoLetra } from './evaluar';
import { FLECHAS, type Direccion } from './geo';

export interface OpcionesCompartir {
  nombre: string;
  numero: number;
  intentos: EstadoLetra[][];
  ganado: boolean;
  maxIntentos: number;
  altoContraste: boolean;
  url: string;
  etiquetaModo: string;
  icono?: string;
  extra?: string;
}

const EMOJI: Record<EstadoLetra, string> = { correcta: '🟩', presente: '🟨', ausente: '⬛' };
const EMOJI_CONTRASTE: Record<EstadoLetra, string> = {
  correcta: '🟧',
  presente: '🟦',
  ausente: '⬛',
};

/** Fila de emojis sin letras (sin spoilers). */
export function filaEmoji(estados: EstadoLetra[], altoContraste = false): string {
  const tabla = altoContraste ? EMOJI_CONTRASTE : EMOJI;
  return estados.map((e) => tabla[e]).join('');
}

/** Texto para pegar en WhatsApp. */
export function textoCompartir(o: OpcionesCompartir): string {
  return textoConFilas({
    ...o,
    icono: o.icono ?? '🔤',
    filas: o.intentos.map((f) => filaEmoji(f, o.altoContraste)),
  });
}

export interface BloqueModo {
  icono: string;
  etiquetaModo: string;
  filas: string[];
  ganado: boolean;
  maxIntentos: number;
  /** Marca al final del encabezado del modo, p. ej. 💡 si usó la pista. */
  extra?: string;
}

export interface OpcionesFilas extends BloqueModo {
  nombre: string;
  numero: number;
  url: string;
}

function lineasModo(b: BloqueModo): string[] {
  const marcador = b.ganado ? `${b.filas.length}/${b.maxIntentos}` : `X/${b.maxIntentos}`;
  const extra = b.extra ? ` ${b.extra}` : '';
  return [`${b.icono} ${b.etiquetaModo} ${marcador}${extra}`, ...b.filas];
}

/** Arma el texto común: encabezado, una línea por intento y el enlace. */
export function textoConFilas(o: OpcionesFilas): string {
  return [`${o.nombre} #${o.numero} 🇨🇴`, ...lineasModo(o), '', o.url].join('\n');
}

/** Los modos terminados del día en un solo mensaje. */
export function textoTodo(o: {
  nombre: string;
  numero: number;
  url: string;
  bloques: BloqueModo[];
}): string {
  return [`${o.nombre} #${o.numero} 🇨🇴`, ...o.bloques.flatMap(lineasModo), '', o.url].join('\n');
}

/**
 * Cinco cuadros que representan la cercanía: cada 🟩 vale 20 % y un 🟨 marca
 * que sobran 10 % o más. Sin nombres ni distancias (sin spoilers).
 */
export function cuadrosCercania(porcentaje: number, altoContraste = false): string {
  const verde = altoContraste ? '🟧' : '🟩';
  const amarillo = altoContraste ? '🟦' : '🟨';
  const p = Math.max(0, Math.min(100, porcentaje));
  const llenos = Math.floor(p / 20);
  const medio = llenos < 5 && p - llenos * 20 >= 10 ? 1 : 0;
  return verde.repeat(llenos) + amarillo.repeat(medio) + '⬛'.repeat(5 - llenos - medio);
}

export interface IntentoMunicipio {
  acierto: boolean;
  cercania: number;
  direccion: Direccion;
}

export function filaMunicipio(i: IntentoMunicipio, altoContraste = false): string {
  if (i.acierto) return `${cuadrosCercania(100, altoContraste)} 📍`;
  return `${cuadrosCercania(i.cercania, altoContraste)} ${FLECHAS[i.direccion]}`;
}

export function enlaceWhatsApp(texto: string): string {
  return `https://wa.me/?text=${encodeURIComponent(texto)}`;
}
