import { expect, test } from '@playwright/test';
import { MUNICIPIO, abrirMunicipio, adivinar, municipiosQueNoSon } from './ayudantes';

test.use({ locale: 'es-CO' });

test('el enlace #municipio abre la pestaña del municipio', async ({ page }) => {
  await abrirMunicipio(page);
  await expect(page.getByRole('tab', { name: /Municipio/ })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.locator('#panel-municipio')).toBeVisible();
  await expect(page.locator('#intentos-municipio .pista--vacia')).toHaveCount(6);
});

test('un intento fallido muestra distancia, dirección y cercanía', async ({ page }) => {
  await abrirMunicipio(page);
  const otro = municipiosQueNoSon(1)[0]!;
  await adivinar(page, otro);
  const pista = page.locator('#intentos-municipio .pista').first();
  await expect(pista).toContainText(otro.nombre);
  await expect(pista.locator('.pista__km')).toHaveText(/^[\d.]+ km$/);
  await expect(pista.locator('.pista__dir')).toHaveText(/^(N|NE|E|SE|S|SO|O|NO)$/);
  await expect(pista.locator('.pista__pct')).toHaveText(/^\d{1,2} %$/);
  await expect(pista).toHaveAttribute('aria-label', new RegExp(`Intento 1: ${otro.nombre}`));
  await expect(page.locator('#anuncio')).toContainText(otro.nombre);
});

test('el autocompletado se maneja con teclado', async ({ page }) => {
  await abrirMunicipio(page);
  const entrada = page.getByRole('combobox');
  await entrada.fill(MUNICIPIO.nombre.slice(0, 4));
  const lista = page.getByRole('listbox');
  await expect(lista).toBeVisible();
  await expect(entrada).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('ArrowDown');
  const primera = lista.getByRole('option').first();
  await expect(primera).toHaveAttribute('aria-selected', 'true');
  await expect(entrada).toHaveAttribute(
    'aria-activedescendant',
    (await primera.getAttribute('id'))!,
  );
  await page.keyboard.press('Escape');
  await expect(lista).toBeHidden();
  await expect(entrada).toHaveAttribute('aria-expanded', 'false');
});

test('elegir con el mouse envía el intento', async ({ page }) => {
  await abrirMunicipio(page);
  const otro = municipiosQueNoSon(1)[0]!;
  await page.getByRole('combobox').fill(otro.nombre);
  await page.getByRole('option').filter({ hasText: otro.dpto }).first().click();
  await expect(page.locator('#intentos-municipio .pista').first()).toContainText(otro.nombre);
});

test('avisa si el municipio no existe o ya se intentó', async ({ page }) => {
  await abrirMunicipio(page);
  await page.getByRole('combobox').fill('Ciudad Inventada Xyz');
  await page.keyboard.press('Enter');
  await expect(page.locator('#aviso')).toContainText('Elige un municipio de la lista');
  const otro = municipiosQueNoSon(1)[0]!;
  await adivinar(page, otro);
  await page.getByRole('combobox').fill(`${otro.nombre}, ${otro.dpto}`);
  await page.keyboard.press('Enter');
  await expect(page.locator('#aviso')).toContainText('Ya intentaste');
  await expect(page.locator('#intentos-municipio .pista:not(.pista--vacia)')).toHaveCount(1);
});

test('acertar muestra el resultado y el texto para compartir', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await abrirMunicipio(page);
  await adivinar(page, municipiosQueNoSon(1)[0]!);
  await adivinar(page, MUNICIPIO);
  const dialogo = page.getByRole('dialog', { name: 'Estadísticas' });
  await expect(dialogo).toBeVisible();
  await expect(dialogo).toContainText(MUNICIPIO.nombre);
  await expect(page.locator('#entrada-municipio')).toBeDisabled();
  await expect(page.getByRole('tab', { name: /Municipio/ })).toHaveClass(/jugado/);
  await dialogo.getByRole('button', { name: 'Copiar' }).click();
  const texto = await page.evaluate(() => navigator.clipboard.readText());
  expect(texto).toContain('2/6');
  expect(texto).toContain('🟩🟩🟩🟩🟩 📍');
  expect(texto).not.toContain(MUNICIPIO.nombre);
});

test('perder revela el municipio y la partida sigue al recargar', async ({ page }) => {
  await abrirMunicipio(page);
  for (const m of municipiosQueNoSon(6)) await adivinar(page, m);
  const dialogo = page.getByRole('dialog', { name: 'Estadísticas' });
  await expect(dialogo).toContainText(MUNICIPIO.nombre);
  await page.reload();
  await page.locator('#form-municipio[data-listo="true"]').waitFor({ state: 'attached' });
  await expect(page.locator('#intentos-municipio .pista:not(.pista--vacia)')).toHaveCount(6);
  await expect(page.locator('#entrada-municipio')).toBeDisabled();
});

test('la CSP no bloquea nada del modo Municipio', async ({ page }) => {
  const bloqueos: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error' && /Content Security Policy/i.test(m.text())) bloqueos.push(m.text());
  });
  await abrirMunicipio(page);
  await adivinar(page, municipiosQueNoSon(1)[0]!);
  await adivinar(page, MUNICIPIO);
  expect(bloqueos).toEqual([]);
});
