import type { EstadoLetra } from '../juego/evaluar';
import { t } from '../i18n';

const FILAS = ['QWERTYUIOP', 'ASDFGHJKLÑ', '<ZXCVBNM>'];

export type Tecla = string | 'ENVIAR' | 'BORRAR';

export function crearTeclado(contenedor: HTMLElement, alPulsar: (tecla: Tecla) => void): void {
  contenedor.replaceChildren(
    ...FILAS.map((fila) => {
      const div = document.createElement('div');
      div.className = 'teclado__fila';
      for (const c of fila) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'tecla';
        if (c === '<') {
          b.dataset.tecla = 'ENVIAR';
          b.classList.add('tecla--ancha');
        } else if (c === '>') {
          b.dataset.tecla = 'BORRAR';
          b.classList.add('tecla--ancha');
        } else {
          b.dataset.tecla = c;
          b.textContent = c;
        }
        b.addEventListener('click', () => alPulsar(b.dataset.tecla as Tecla));
        div.append(b);
      }
      return div;
    }),
  );
  actualizarTeclado(contenedor, new Map());
}

/** Colorea las teclas y actualiza sus nombres accesibles (y los textos al cambiar idioma). */
export function actualizarTeclado(
  contenedor: HTMLElement,
  estados: Map<string, EstadoLetra>,
): void {
  contenedor.querySelectorAll<HTMLButtonElement>('.tecla').forEach((b) => {
    const tecla = b.dataset.tecla as string;
    if (tecla === 'ENVIAR') {
      b.textContent = t('enviar');
      return;
    }
    if (tecla === 'BORRAR') {
      b.innerHTML =
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5h11v14H9l-6-7z"/><path d="M12.5 9.5l5 5m0-5l-5 5"/></svg>';
      b.setAttribute('aria-label', t('borrar'));
      return;
    }
    const estado = estados.get(tecla);
    if (estado) {
      b.dataset.estado = estado;
      b.setAttribute('aria-label', `${tecla}, ${t(estado)}`);
    } else {
      delete b.dataset.estado;
      b.removeAttribute('aria-label');
    }
  });
}
