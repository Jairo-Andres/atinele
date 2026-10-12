import { expect, test, type Page } from '@playwright/test';
import { ALTO, ANCHO, proyectar } from '../../src/juego/mapa';
import { abrirMunicipio, adivinar, municipiosQueNoSon } from './ayudantes';

test.use({ locale: 'es-CO' });

const svg = (page: Page) => page.locator('#mapa-svg');

/** Toca el mapa justo encima de un municipio (vista completa). */
async function tocar(page: Page, lat: number, lon: number) {
  const caja = (await svg(page).boundingBox())!;
  const p = proyectar(lat, lon);
  await svg(page).click({
    position: { x: (p.x / ANCHO) * caja.width, y: (p.y / ALTO) * caja.height },
  });
}

test('el mapa muestra los 33 departamentos y un punto por municipio', async ({ page }) => {
  await abrirMunicipio(page);
  await expect(page.locator('#mapa-municipio')).toBeVisible();
  await expect(page.locator('#mapa-svg .mapa__dpto')).toHaveCount(33);
  await expect(page.locator('#mapa-svg .mapa__puntos')).toHaveAttribute('d', /^M/);
  await expect(page.locator('#mapa-pie')).toContainText('Toca un punto');
});

test('tocar un punto lo elige y Adivinar lo envía', async ({ page }) => {
  await abrirMunicipio(page);
  const otro = municipiosQueNoSon(1)[0]!;
  await tocar(page, otro.lat, otro.lon);
  await expect(page.locator('#mapa-pie')).toContainText(`${otro.nombre}, ${otro.dpto}`);
  await expect(page.locator('#entrada-municipio')).toHaveValue(`${otro.nombre}, ${otro.dpto}`);
  await expect(page.locator(`#mapa-svg .mapa__dpto[data-cod="${otro.codDpto}"]`)).toHaveClass(
    /mapa__dpto--elegido/,
  );
  await page.getByRole('button', { name: 'Adivinar' }).click();
  await expect(page.locator('#intentos-municipio .pista').first()).toContainText(otro.nombre);
});

test('cada intento queda marcado con su número y el círculo de distancia', async ({ page }) => {
  await abrirMunicipio(page);
  const [a, b] = municipiosQueNoSon(2);
  await adivinar(page, a!);
  await adivinar(page, b!);
  await expect(page.locator('#mapa-svg .mapa__intento')).toHaveCount(2);
  await expect(page.locator('#mapa-svg .mapa__intento text')).toHaveText(['1', '2']);
  await expect(page.locator('#mapa-svg .mapa__radio')).toHaveCount(1);
  const pista = page.locator('#intentos-municipio .pista').nth(1);
  const mismo = (await pista.locator('.pista__dpto').getAttribute('data-mismo')) === 'true';
  await expect(page.locator(`#mapa-svg .mapa__dpto[data-cod="${b!.codDpto}"]`)).toHaveClass(
    mismo ? /mapa__dpto--si/ : /mapa__dpto--no/,
  );
});

test('los botones acercan, alejan y vuelven a todo el país', async ({ page }) => {
  await abrirMunicipio(page);
  const completo = await svg(page).getAttribute('viewBox');
  await page.getByRole('button', { name: 'Acercar' }).click();
  await expect(page.locator('#mapa-municipio')).toHaveClass(/mapa--acercado/);
  expect(await svg(page).getAttribute('viewBox')).not.toBe(completo);
  await page.getByRole('button', { name: 'Ver todo el país' }).click();
  await expect(svg(page)).toHaveAttribute('viewBox', completo!);
  await svg(page).focus();
  await page.keyboard.press('+');
  await page.keyboard.press('ArrowRight');
  expect(await svg(page).getAttribute('viewBox')).not.toBe(completo);
  await page.keyboard.press('0');
  await expect(svg(page)).toHaveAttribute('viewBox', completo!);
});
