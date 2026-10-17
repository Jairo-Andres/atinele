import { expect, test } from '@playwright/test';
import {
  DICHO,
  LARGO_DICHO,
  RESPUESTA_DICHO,
  abrirDicho,
  escribirDicho,
  palabrasDichoQueNoSon,
} from './ayudantes';

test.use({ locale: 'es-CO' });

test('muestra el dicho con la palabra oculta y un tablero de su largo', async ({ page }) => {
  await abrirDicho(page);
  const texto = page.locator('#dicho-texto');
  await expect(texto.locator('.dicho__casilla')).toHaveCount(LARGO_DICHO);
  await expect(texto).not.toContainText(DICHO.oculta);
  await expect(texto.locator('.dicho__hueco')).toHaveAttribute(
    'aria-label',
    `palabra oculta de ${LARGO_DICHO} letras`,
  );
  await expect(page.locator('#tablero-dicho .fila').first().locator('.ficha')).toHaveCount(
    LARGO_DICHO,
  );
  await expect(page.locator('#btn-pista')).toBeHidden();
});

test('la pista aparece desde el tercer intento y queda marcada al compartir', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await abrirDicho(page);
  const [a, b, c] = palabrasDichoQueNoSon(3) as [string, string, string];
  await escribirDicho(page, a);
  await escribirDicho(page, b);
  await expect(page.locator('#btn-pista')).toBeHidden();
  await escribirDicho(page, c);
  await page.getByRole('button', { name: 'Ver pista' }).click();
  await expect(page.locator('#dicho-pista')).toContainText(DICHO.pista.es);
  await expect(page.locator('#btn-pista')).toBeHidden();
  await escribirDicho(page, RESPUESTA_DICHO);
  const dialogo = page.getByRole('dialog', { name: 'Estadísticas' });
  await expect(dialogo).toBeVisible();
  await expect(dialogo).toContainText('La palabra que faltaba era');
  await dialogo.getByRole('button', { name: 'Copiar' }).click();
  const texto = await page.evaluate(() => navigator.clipboard.readText());
  expect(texto).toContain('💬 Dicho 4/6 💡');
  expect(texto).not.toContain(RESPUESTA_DICHO);
});

test('al acertar se ven el dicho completo, qué significa y la fuente', async ({ page }) => {
  await abrirDicho(page);
  await escribirDicho(page, RESPUESTA_DICHO);
  await page.keyboard.press('Escape');
  await expect(page.locator('#dicho-texto .dicho__palabra')).toHaveText(DICHO.oculta);
  await expect(page.locator('#dicho-significado')).toContainText(DICHO.significado.es);
  await expect(page.locator('#dicho-fuente a')).toHaveAttribute('href', DICHO.fuente.url);
  await expect(page.getByRole('tab', { name: /Dicho/ })).toHaveClass(/jugado/);
});

test('perder revela la palabra y la partida sigue al recargar', async ({ page }) => {
  await abrirDicho(page);
  for (const w of palabrasDichoQueNoSon(6)) await escribirDicho(page, w);
  await expect(page.getByRole('dialog', { name: 'Estadísticas' })).toContainText(
    DICHO.oculta.toLocaleUpperCase('es-CO'),
  );
  await page.reload();
  await page.locator('#tablero-dicho[data-listo="true"]').waitFor({ state: 'attached' });
  await expect(page.locator('#dicho-texto .dicho__palabra')).toHaveText(DICHO.oculta);
  await expect(page.locator('#tablero-dicho [data-estado="ausente"]').first()).toBeVisible();
});

test('una palabra del largo equivocado o que no existe se rechaza', async ({ page }) => {
  await abrirDicho(page);
  await page.keyboard.type('xq');
  await page.keyboard.press('Enter');
  await expect(page.locator('#aviso')).toContainText('Faltan letras');
  for (let i = 0; i < 2; i++) await page.keyboard.press('Backspace');
  await page.keyboard.type('q'.repeat(LARGO_DICHO));
  await page.keyboard.press('Enter');
  await expect(page.locator('#aviso')).toContainText('No está en la lista');
});
