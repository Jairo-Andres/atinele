import { expect, test, type Page } from '@playwright/test';
import { ALTO, ANCHO, proyectar } from '../../src/juego/mapa';
import { abrirMunicipio, adivinar, municipiosQueNoSon, todosLosMunicipios } from './ayudantes';

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

/** Posición en pantalla de un municipio con la vista actual del mapa. */
async function enPantalla(page: Page, lat: number, lon: number) {
  const caja = (await svg(page).boundingBox())!;
  const [x, y, w, h] = (await svg(page).getAttribute('viewBox'))!.split(' ').map(Number) as [
    number,
    number,
    number,
    number,
  ];
  const p = proyectar(lat, lon);
  return { x: ((p.x - x) / w) * caja.width, y: ((p.y - y) / h) * caja.height };
}

test('con mucho zoom se ven los nombres y se elige bien entre municipios vecinos', async ({
  page,
}) => {
  await abrirMunicipio(page);
  // Un municipio con un vecino a menos de 5 km: con el zoom de antes no se distinguían.
  const todos = todosLosMunicipios();
  const km = (a: { lat: number; lon: number }, b: { lat: number; lon: number }) =>
    Math.hypot((a.lat - b.lat) * 111, (a.lon - b.lon) * 111 * Math.cos((a.lat * Math.PI) / 180));
  const objetivo = todos.find((m) =>
    todos.some((o) => o.cod !== m.cod && km(m, o) > 2.5 && km(m, o) < 5),
  )!;
  for (let i = 0; i < 5; i++) {
    await svg(page).dblclick({ position: await enPantalla(page, objetivo.lat, objetivo.lon) });
  }
  await expect(page.locator('#mapa-municipio')).toHaveClass(/mapa--cerca/);
  await expect(
    page.locator('#mapa-svg .mapa__nombre', { hasText: objetivo.nombre }),
  ).not.toHaveCount(0);
  await svg(page).click({ position: await enPantalla(page, objetivo.lat, objetivo.lon) });
  await expect(page.locator('#mapa-pie')).toContainText(`${objetivo.nombre}, ${objetivo.dpto}`);
});
