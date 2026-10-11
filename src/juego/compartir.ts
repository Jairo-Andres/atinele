import type { EstadoLetra } from './evaluar';

export interface OpcionesCompartir {
  nombre: string;
  numero: number;
  intentos: EstadoLetra[][];
  ganado: boolean;
  maxIntentos: number;
  altoContraste: boolean;
  url: string;
  etiquetaModo: string;
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
  const marcador = o.ganado ? `${o.intentos.length}/${o.maxIntentos}` : `X/${o.maxIntentos}`;
  return [
    `${o.nombre} #${o.numero} 🇨🇴`,
    `🔤 ${o.etiquetaModo} ${marcador}`,
    ...o.intentos.map((f) => filaEmoji(f, o.altoContraste)),
    '',
    o.url,
  ].join('\n');
}

export function enlaceWhatsApp(texto: string): string {
  return `https://wa.me/?text=${encodeURIComponent(texto)}`;
}
