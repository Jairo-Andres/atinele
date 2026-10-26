import { expect, test } from '@playwright/test';
import {
  CATEGORIA,
  LARGO_CATEGORIA,
  RESPUESTA_CATEGORIA,
  abrirCategoria,
  escribirCategoria,
  palabrasCategoriaQueNoSon,
} from './ayudantes';

test.use({ locale: 'es-CO' });

test('muestra la categoría del día y un tablero del largo de la palabra', async ({ page }) => {
  await abrirCategoria(page);
  await expect(page.locator('#categoria-nombre')).toHaveText(CATEGORIA.categoria.es);
  await expect(page.locator('#categoria-largo')).toHaveText(`Palabra de ${LARGO_CATEGORIA} letras`);
  await expect(page.locator('#tablero-categoria .fila').first().locator('.ficha')).toHaveCount(
    LARGO_CATEGORIA,
  );
  await expect(page.locator('#btn-pista-categoria')).toBeHidden();
});

test('pista desde el tercer intento, 💡 al compartir y la palabra al final', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await abrirCategoria(page);
  for (const w of palabrasCategoriaQueNoSon(3)) await escribirCategoria(page, w);
  await page.locator('#btn-pista-categoria').click();
  await expect(page.locator('#categoria-pista')).toContainText(CATEGORIA.pista.es);
  await escribirCategoria(page, RESPUESTA_CATEGORIA);
  const dialogo = page.getByRole('dialog', { name: 'Estadísticas' });
  await expect(dialogo).toContainText('La palabra era');
  await expect(dialogo).toContainText(CATEGORIA.palabra.toLocaleUpperCase('es-CO'));
  await dialogo.getByRole('button', { name: 'Copiar' }).click();
  const texto = await page.evaluate(() => navigator.clipboard.readText());
  expect(texto).toContain('🗂️ Categoría 4/6 💡');
  expect(texto).not.toContain(RESPUESTA_CATEGORIA);
  await page.keyboard.press('Escape');
  await expect(page.locator('#categoria-largo')).toContainText(
    CATEGORIA.palabra.toLocaleUpperCase('es-CO'),
  );
  await expect(page.getByRole('tab', { name: /Categoría/ })).toHaveClass(/jugado/);
});

test('en inglés la categoría sale traducida', async ({ page }) => {
  await abrirCategoria(page);
  await page.locator('#btn-idioma').click();
  await expect(page.locator('#categoria-nombre')).toHaveText(CATEGORIA.categoria.en);
});
