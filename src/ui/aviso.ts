let temporizador: number | undefined;

/** Aviso visible corto (también lo leen los lectores de pantalla: role="status"). */
export function avisar(texto: string, ms = 2200): void {
  const el = document.getElementById('aviso');
  if (!el) return;
  el.textContent = texto;
  el.classList.add('visible');
  window.clearTimeout(temporizador);
  temporizador = window.setTimeout(() => {
    el.classList.remove('visible');
    el.textContent = '';
  }, ms);
}

/** Mensaje solo para lectores de pantalla. */
export function anunciar(texto: string): void {
  const el = document.getElementById('anuncio');
  if (!el) return;
  el.textContent = '';
  window.setTimeout(() => (el.textContent = texto), 50);
}

/** Duración de un token de movimiento en ms (0 con prefers-reduced-motion). */
export function duracion(token: '--duration-fast' | '--duration-base' | '--duration-slow'): number {
  const valor = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  const n = parseFloat(valor);
  if (Number.isNaN(n)) return 0;
  return valor.endsWith('ms') ? n : n * 1000;
}
