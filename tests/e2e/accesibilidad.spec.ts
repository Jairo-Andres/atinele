import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import {
  MUNICIPIO,
  RESPUESTA,
  RESPUESTA_DICHO,
  abrir,
  abrirCategoria,
  abrirDicho,
  abrirMunicipio,
  adivinar,
  escribir,
  escribirCategoria,
  escribirDicho,
  municipiosQueNoSon,
  palabrasCategoriaQueNoSon,
  palabrasDichoQueNoSon,
  palabrasQueNoSon,
} from './ayudantes';

const ETIQUETAS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function revisar(page: Page) {
  // Esperar a que terminen las animaciones de las fichas.
  await page.waitForTimeout(100);
  const r = await new AxeBuilder({ page }).withTags(ETIQUETAS).analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual(
    [],
  );
}

for (const tema of ['light', 'dark'] as const) {
  for (const idioma of ['es', 'en'] as const) {
    test.describe(`${tema} · ${idioma}`, () => {
      test.use({
        colorScheme: tema,
        locale: idioma === 'es' ? 'es-CO' : 'en-US',
        reducedMotion: 'reduce',
      });

      test('cómo jugar', async ({ page }) => {
        await abrir(page, { conAyuda: true });
        await revisar(page);
      });

      test('partida a medias', async ({ page }) => {
        await abrir(page);
        for (const p of palabrasQueNoSon(2)) await escribir(page, p);
        await page.keyboard.type('ab');
        await revisar(page);
      });

      test('resultado y estadísticas', async ({ page }) => {
        await abrir(page);
        await escribir(page, palabrasQueNoSon(1)[0] as string);
        await escribir(page, RESPUESTA);
        await expect(page.locator('#dlg-estadisticas')).toBeVisible();
        await revisar(page);
      });

      test('ajustes con alto contraste', async ({ page }) => {
        await abrir(page);
        await escribir(page, palabrasQueNoSon(1)[0] as string);
        await page.locator('[data-abrir="dlg-ajustes"]').click();
        await page.locator('#alto-contraste').check();
        await revisar(page);
        await page.keyboard.press('Escape');
        await revisar(page);
      });

      test('municipio con intentos y sugerencias abiertas', async ({ page }) => {
        await abrirMunicipio(page);
        for (const m of municipiosQueNoSon(2)) await adivinar(page, m);
        await page.getByRole('combobox').fill(MUNICIPIO.nombre.slice(0, 3));
        await page.keyboard.press('ArrowDown');
        await revisar(page);
      });

      test('municipio acertado', async ({ page }) => {
        await abrirMunicipio(page);
        await adivinar(page, MUNICIPIO);
        await expect(page.locator('#dlg-estadisticas')).toBeVisible();
        await revisar(page);
      });

      test('dicho con intentos y pista', async ({ page }) => {
        await abrirDicho(page);
        for (const p of palabrasDichoQueNoSon(3)) await escribirDicho(page, p);
        await page.locator('#btn-pista').click();
        await expect(page.locator('#dicho-pista')).toBeVisible();
        await revisar(page);
      });

      test('dicho acertado con significado y fuente', async ({ page }) => {
        await abrirDicho(page);
        await escribirDicho(page, RESPUESTA_DICHO);
        await expect(page.locator('#dlg-estadisticas')).toBeVisible();
        await revisar(page);
        await page.keyboard.press('Escape');
        await expect(page.locator('#dicho-significado')).toBeVisible();
        await revisar(page);
      });

      test('categoría con pista', async ({ page }) => {
        await abrirCategoria(page);
        for (const p of palabrasCategoriaQueNoSon(3)) await escribirCategoria(page, p);
        await page.locator('#btn-pista-categoria').click();
        await revisar(page);
      });

      test('clasificación con dos jugadores', async ({ page }) => {
        await abrir(page);
        await page.locator('[data-abrir="dlg-clasificacion"]').click();
        await page.locator('#nombre-jugador').fill('Ana');
        await page.locator('#form-jugador button[type="submit"]').click();
        await expect(
          page.locator('#clasificacion-filas tr:not(.clasificacion__fila-acciones)'),
        ).toHaveCount(2);
        await revisar(page);
      });

      test('fuentes', async ({ page }) => {
        await abrir(page);
        await page.locator('[data-abrir="dlg-fuentes"]').click();
        await revisar(page);
      });
    });
  }
}
