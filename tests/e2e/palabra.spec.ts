import { expect, test } from '@playwright/test';
import { RESPUESTA, abrir, escribir, palabrasQueNoSon } from './ayudantes';

test.use({ locale: 'es-CO' });

test('la primera visita muestra cómo jugar', async ({ page }) => {
  await abrir(page, { conAyuda: true });
  await expect(page.getByRole('dialog', { name: 'Cómo jugar' })).toBeVisible();
});

test('gana con el teclado físico y ve sus estadísticas', async ({ page }) => {
  await abrir(page);
  const [otra] = palabrasQueNoSon(1);
  await escribir(page, otra as string);
  await escribir(page, RESPUESTA);
  const dialogo = page.getByRole('dialog', { name: 'Estadísticas' });
  await expect(dialogo).toBeVisible();
  await expect(dialogo.getByText('¡Le atinó!')).toBeVisible();
  await expect(page.locator('.fila').nth(1).locator('[data-estado="correcta"]')).toHaveCount(5);
});

test('gana con el teclado en pantalla', async ({ page }) => {
  await abrir(page);
  for (const letra of RESPUESTA) {
    await page.locator(`#teclado .tecla[data-tecla="${letra}"]`).click();
  }
  await page.locator('#teclado .tecla[data-tecla="ENVIAR"]').click();
  await expect(page.getByRole('dialog', { name: 'Estadísticas' })).toBeVisible();
});

test('un intento que no está en la lista no gasta intento', async ({ page }) => {
  await abrir(page);
  await page.keyboard.type('zzzzz');
  await page.keyboard.press('Enter');
  await expect(page.locator('#aviso')).toHaveText('No está en la lista');
  await expect(page.locator('.fila').first().locator('[data-estado="escrita"]')).toHaveCount(5);
  await expect(page.locator('#tablero [data-estado="ausente"]')).toHaveCount(0);
});

test('pierde tras 6 intentos y ve la respuesta', async ({ page }) => {
  await abrir(page);
  for (const p of palabrasQueNoSon(6)) await escribir(page, p);
  const dialogo = page.getByRole('dialog', { name: 'Estadísticas' });
  await expect(dialogo.getByText('Hoy no fue')).toBeVisible();
  await expect(dialogo.locator('#resultado-palabra')).not.toBeEmpty();
});

test('recargar conserva el progreso del día', async ({ page }) => {
  await abrir(page);
  const [otra] = palabrasQueNoSon(1);
  await escribir(page, otra as string);
  await expect(page.locator('.fila').first().locator('[data-estado="escrita"]')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.fila').first()).toContainText(otra as string);
  await expect(page.locator('#dlg-ayuda')).not.toBeVisible();
});

test('compartir copia la cuadrícula sin la respuesta', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await abrir(page);
  await escribir(page, RESPUESTA);
  await page.getByRole('button', { name: 'Copiar' }).click();
  await expect(page.locator('#aviso')).toHaveText('Resultado copiado');
  const texto = await page.evaluate(() => navigator.clipboard.readText());
  expect(texto).toContain('Atínele #1 🇨🇴');
  expect(texto).toContain('🟩🟩🟩🟩🟩');
  expect(texto).not.toContain(RESPUESTA);
  await expect(page.getByRole('link', { name: 'Enviar por WhatsApp' })).toHaveAttribute(
    'href',
    /^https:\/\/wa\.me\/\?text=/,
  );
});

test('cambia a inglés y lo recuerda', async ({ page }) => {
  await abrir(page);
  await page.getByRole('button', { name: 'Cambiar a inglés' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('tab', { name: /Word/ })).toBeVisible();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('las pestañas se manejan con flechas', async ({ page }) => {
  await abrir(page);
  await page.getByRole('tab', { name: /Palabra/ }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: /Municipio/ })).toBeFocused();
  await expect(page.locator('#panel-municipio')).toBeVisible();
  await expect(page.locator('#panel-palabra')).toBeHidden();
});

test('la política de seguridad (CSP) no bloquea nada del juego', async ({ page }) => {
  const bloqueos: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error' && /Content Security Policy/i.test(m.text())) bloqueos.push(m.text());
  });
  await abrir(page);
  await escribir(page, RESPUESTA);
  await expect(page.getByRole('dialog', { name: 'Estadísticas' })).toBeVisible();
  expect(bloqueos).toEqual([]);
});
