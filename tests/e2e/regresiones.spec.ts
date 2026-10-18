// Errores encontrados en la revisión de la fase 3; cada prueba reproduce uno.
import { expect, test } from '@playwright/test';
import {
  FECHA,
  MUNICIPIO,
  RESPUESTA,
  RESPUESTA_DICHO,
  abrir,
  abrirDicho,
  abrirMunicipio,
  adivinar,
  escribir,
  escribirDicho,
  palabrasQueNoSon,
} from './ayudantes';

test.use({ locale: 'es-CO' });

const filasEnviadas = (page: import('@playwright/test').Page) =>
  page.locator('#tablero .fila').filter({
    has: page.locator(
      '[data-estado="ausente"], [data-estado="presente"], [data-estado="correcta"]',
    ),
  });

test('Enter físico envía después de escribir con el teclado en pantalla', async ({ page }) => {
  await abrir(page);
  const palabra = palabrasQueNoSon(1)[0] as string;
  for (const l of palabra) await page.locator(`#teclado [data-tecla="${l}"]`).click();
  await page.keyboard.press('Enter');
  await expect(filasEnviadas(page)).toHaveCount(1);
});

test('Enter físico envía después de cerrar un diálogo con el mouse', async ({ page }) => {
  await abrir(page);
  await page.locator('[data-abrir="dlg-estadisticas"]').click();
  await page.locator('#dlg-estadisticas [data-cerrar]').click();
  await page.keyboard.type((palabrasQueNoSon(1)[0] as string).toLowerCase());
  await page.keyboard.press('Enter');
  await expect(page.locator('#dlg-estadisticas')).toBeHidden();
  await expect(filasEnviadas(page)).toHaveCount(1);
});

test('Espacio tras un clic en una tecla no la repite', async ({ page }) => {
  await abrir(page);
  await page.locator('#teclado [data-tecla="A"]').click();
  await page.keyboard.press(' ');
  await expect(page.locator('#tablero [data-estado="escrita"]')).toHaveCount(1);
});

test('con Tab y Enter sobre un botón se sigue activando el botón', async ({ page }) => {
  await abrir(page);
  await page.locator('#btn-idioma').focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('dos pestañas abiertas no se pisan la partida', async ({ context }) => {
  const a = await context.newPage();
  const b = await context.newPage();
  await abrir(a);
  await b.clock.setFixedTime(FECHA);
  await b.goto('/');
  await b.locator('#tablero[data-listo="true"]').waitFor({ state: 'attached' });
  await escribir(a, RESPUESTA);
  // La otra pestaña se recarga sola con la partida ganada.
  await expect(b.locator('#tab-palabra')).toHaveClass(/jugado/);
  await b.locator('#tablero[data-listo="true"]').waitFor({ state: 'attached' });
  await b.locator('#tab-municipio').click();
  await b.locator('#form-municipio[data-listo="true"]').waitFor({ state: 'attached' });
  await adivinar(b, MUNICIPIO);
  const guardado = await a.evaluate(() => JSON.parse(localStorage.getItem('atinele:v1') ?? '{}'));
  const dia = Object.values(guardado.partidas)[0] as Record<string, { estado: string }>;
  expect(dia.palabra?.estado).toBe('ganada');
  expect(dia.municipio?.estado).toBe('ganada');
});

test('a la medianoche de Colombia la página pasa sola al reto nuevo', async ({ page }) => {
  await page.clock.install({ time: new Date(FECHA.getTime() + 9 * 3_600_000 - 20_000) });
  await page.goto('/');
  await page.locator('#dlg-ayuda').waitFor();
  await page.keyboard.press('Escape');
  await expect(page.locator('#numero-reto')).toContainText('Reto #1');
  await page.clock.fastForward(60_000);
  await expect(page.locator('#numero-reto')).toContainText('Reto #2');
});

test('cambiar de idioma durante la animación no la corta', async ({ page }) => {
  await abrir(page);
  await page.keyboard.type((palabrasQueNoSon(1)[0] as string).toLowerCase());
  await page.keyboard.press('Enter');
  await page.locator('#btn-idioma').click();
  await expect(page.locator('#tablero .revelando')).toHaveCount(1);
  await expect(page.locator('#tablero .revelando')).toHaveCount(0);
  await expect(page.locator('#tablero .fila').first()).toHaveAttribute('aria-label', /Guess 1/);
});

test('municipio: "Cali" y "Bogota DC" se entienden sin elegir de la lista', async ({ page }) => {
  await abrirMunicipio(page);
  const casos: [string, string][] = [
    ['Cali', 'Santiago de Cali'],
    ['Bogota DC', 'Bogotá, D.C.'],
  ];
  for (const [texto, nombre] of casos) {
    if (MUNICIPIO.nombre === nombre) continue;
    await page.getByRole('combobox').fill(texto);
    await page.keyboard.press('Enter');
    await expect(page.locator('#intentos-municipio')).toContainText(nombre);
  }
});

test('con los tres modos terminados se pueden compartir juntos', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await abrir(page);
  await escribir(page, RESPUESTA);
  await page.keyboard.press('Escape');
  await expect(page.locator('#btn-compartir-todo')).toBeHidden();
  await page.locator('#tab-municipio').click();
  await page.locator('#form-municipio[data-listo="true"]').waitFor({ state: 'attached' });
  await adivinar(page, MUNICIPIO);
  await page.getByRole('dialog', { name: 'Estadísticas' }).waitFor();
  await page.keyboard.press('Escape');
  await page.locator('#tab-dicho').click();
  await escribirDicho(page, RESPUESTA_DICHO);
  const dialogo = page.getByRole('dialog', { name: 'Estadísticas' });
  await dialogo.getByRole('button', { name: 'Compartir los tres' }).click();
  const texto = await page.evaluate(() => navigator.clipboard.readText());
  expect(texto.match(/🇨🇴/g)).toHaveLength(1);
  expect(texto).toContain('🔤 Palabra 1/6');
  expect(texto).toContain('📍 Municipio 1/6');
  expect(texto).toContain('💬 Dicho 1/6');
});

test('el dicho se juega con el teclado físico', async ({ page }) => {
  await abrirDicho(page);
  await escribirDicho(page, RESPUESTA_DICHO);
  await expect(page.getByRole('dialog', { name: 'Estadísticas' })).toBeVisible();
});
