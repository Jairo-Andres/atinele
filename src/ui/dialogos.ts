const origen = new WeakMap<HTMLDialogElement, Element | null>();

export function abrirDialogo(id: string): HTMLDialogElement | null {
  const dlg = document.getElementById(id);
  if (!(dlg instanceof HTMLDialogElement)) return null;
  if (dlg.open) return dlg;
  document.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach((d) => d.close());
  origen.set(dlg, document.activeElement);
  dlg.showModal();
  dlg.dispatchEvent(new Event('abierto'));
  return dlg;
}

export function iniciarDialogos(): void {
  document.querySelectorAll<HTMLElement>('[data-abrir]').forEach((btn) => {
    btn.addEventListener('click', () => abrirDialogo(btn.dataset.abrir as string));
  });
  document.querySelectorAll<HTMLDialogElement>('dialog').forEach((dlg) => {
    dlg
      .querySelectorAll('[data-cerrar]')
      .forEach((b) => b.addEventListener('click', () => dlg.close()));
    // Clic en el fondo cierra.
    dlg.addEventListener('click', (e) => {
      if (e.target === dlg) dlg.close();
    });
    dlg.addEventListener('close', () => {
      const anterior = origen.get(dlg);
      if (anterior instanceof HTMLElement && anterior.isConnected) anterior.focus();
    });
  });
}

export function hayDialogoAbierto(): boolean {
  return document.querySelector('dialog[open]') !== null;
}
