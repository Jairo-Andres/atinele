import { readFileSync } from 'node:fs';
import { expect, type Page } from '@playwright/test';

const calendario = JSON.parse(readFileSync('data/contenido/calendario.json', 'utf8')) as {
  inicio: string;
  dias: { n: number; palabra: string }[];
};

/** Día 1 del calendario a las 3 p. m. de Colombia. */
export const FECHA = new Date(`${calendario.inicio}T15:00:00-05:00`);

export const RESPUESTA = (calendario.dias[0] as { palabra: string }).palabra
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .toUpperCase();

const validas = readFileSync('public/palabras/5.txt', 'utf8').split('\n').filter(Boolean);

/** Palabras válidas distintas de la respuesta, para perder a propósito. */
export function palabrasQueNoSon(n: number): string[] {
  return validas.filter((w) => w !== RESPUESTA && !w.includes('Ñ')).slice(100, 100 + n);
}

export async function abrir(page: Page, opciones: { conAyuda?: boolean } = {}): Promise<void> {
  await page.clock.setFixedTime(FECHA);
  await page.goto('/');
  await page.locator('#tablero[data-listo="true"]').waitFor({ state: 'attached' });
  if (!opciones.conAyuda) {
    await page.locator('#dlg-ayuda').waitFor();
    await page.keyboard.press('Escape');
  }
}

const REVELADA = '[data-estado="correcta"], [data-estado="presente"], [data-estado="ausente"]';

export async function escribir(page: Page, palabra: string): Promise<void> {
  const filas = page.locator('#tablero .fila');
  const antes = await filas.filter({ has: page.locator(REVELADA) }).count();
  await page.keyboard.type(palabra.toLowerCase(), { delay: 20 });
  await expect(filas.nth(antes).locator('[data-estado="escrita"]')).toHaveCount(palabra.length);
  await page.keyboard.press('Enter');
  // Esperar a que la fila quede revelada, como haría una persona.
  await expect(filas.nth(antes).locator(REVELADA)).toHaveCount(palabra.length);
  await expect(page.locator('#tablero .revelando')).toHaveCount(0);
}
