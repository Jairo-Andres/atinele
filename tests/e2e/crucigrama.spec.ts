import { expect, test } from '@playwright/test';
import { CRUCIGRAMA, abrirCrucigrama, escribirEnCrucigrama, resolverCrucigrama } from './ayudantes';

test.use({ locale: 'es-CO' });

const casillasConLetra = (page: import('@playwright/test').Page) =>
  page.locator('#cruci-rejilla .cruci__letra:not(:empty)');

test('muestra la rejilla, las pistas y la pista actual', async ({ page }) => {
  await abrirCrucigrama(page);
  const h = CRUCIGRAMA.palabras.filter((p) => p.dir === 'h').length;
  await expect(page.locator('#cruci-horizontales li')).toHaveCount(h);
  await expect(page.locator('#cruci-verticales li')).toHaveCount(CRUCIGRAMA.palabras.length - h);
  await expect(page.locator('#cruci-pista')).toContainText(/^1 (horizontal|vertical): /);
  await expect(page.locator('#teclado-cruci .tecla[data-tecla="ENVIAR"]')).toHaveAccessibleName(
    'Siguiente palabra',
  );
});

test('escribir con el teclado en pantalla avanza y se guarda al recargar', async ({ page }) => {
  await abrirCrucigrama(page);
  const p = CRUCIGRAMA.palabras[0]!;
  await page.locator(`.cruci__casilla[data-k="${p.fila * CRUCIGRAMA.ancho + p.col}"]`).click();
  await page.locator('#teclado-cruci .tecla[data-tecla="Q"]').click();
  await page.locator('#teclado-cruci .tecla[data-tecla="Z"]').click();
  await expect(casillasConLetra(page)).toHaveText(['Q', 'Z']);
  await page.locator('#teclado-cruci .tecla[data-tecla="BORRAR"]').click();
  await expect(casillasConLetra(page)).toHaveText(['Q']);
  await page.reload();
  await expect(casillasConLetra(page)).toHaveText(['Q']);
});

test('Revisar marca las letras equivocadas y deja 🔍 al compartir', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await abrirCrucigrama(page);
  const p = CRUCIGRAMA.palabras[0]!;
  await escribirEnCrucigrama(page, p, 'q'.repeat(Array.from(p.palabra).length));
  await page.getByRole('button', { name: 'Revisar' }).click();
  await expect(page.locator('.cruci__casilla--error').first()).toBeVisible();
  await expect(page.locator('#aviso')).toContainText('letras equivocadas');
  await resolverCrucigrama(page);
  const dialogo = page.getByRole('dialog', { name: 'Estadísticas' });
  await expect(dialogo).toContainText('¡Le atinó!');
  await dialogo.getByRole('button', { name: 'Copiar' }).click();
  const texto = await page.evaluate(() => navigator.clipboard.readText());
  const n = CRUCIGRAMA.palabras.length;
  expect(texto).toContain(`🧩 Crucigrama ${n}/${n} 🔍`);
  await expect(page.getByRole('tab', { name: /Crucigrama/ })).toHaveClass(/jugado/);
});

test('tocar una pista la elige y rendirse muestra la solución', async ({ page }) => {
  await abrirCrucigrama(page);
  await page.locator('#cruci-verticales .cruci__pista').first().click();
  await expect(page.locator('#cruci-pista')).toContainText('vertical');
  page.once('dialog', (d) => void d.accept());
  await page.getByRole('button', { name: 'Me rindo' }).click();
  await expect(page.getByRole('dialog', { name: 'Estadísticas' })).toContainText('Hoy no fue');
  await page.keyboard.press('Escape');
  await expect(page.locator('#cruci-pista')).toHaveText('Esta era la solución.');
  await expect(page.locator('.cruci__casilla--revelada').first()).toBeVisible();
  await expect(page.locator('#teclado-cruci')).toBeHidden();
});
