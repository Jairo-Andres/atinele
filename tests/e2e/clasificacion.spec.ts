import { expect, test } from '@playwright/test';
import { RESPUESTA, abrir, escribir } from './ayudantes';

test.use({ locale: 'es-CO' });

test('cada jugador guarda su progreso y la tabla los ordena por puntos', async ({ page }) => {
  await abrir(page);
  await escribir(page, RESPUESTA); // Jugador 1 acierta en el 1.er intento: 6 puntos
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'Clasificación' }).click();
  const dialogo = page.getByRole('dialog', { name: 'Clasificación' });
  await dialogo.getByLabel('Agregar jugador').fill('Ana');
  await dialogo.getByRole('button', { name: 'Agregar' }).click();
  const filas = dialogo.locator('#clasificacion-filas tr:not(.clasificacion__fila-acciones)');
  await expect(filas).toHaveCount(2);
  await expect(filas.nth(0)).toContainText('Jugador 1');
  await expect(filas.nth(0).locator('td').nth(1)).toHaveText('6');
  await expect(filas.nth(1)).toContainText('Ana');

  // Nombre repetido: no se agrega.
  await dialogo.getByLabel('Agregar jugador').fill('ana');
  await dialogo.getByRole('button', { name: 'Agregar' }).click();
  await expect(filas).toHaveCount(2);

  // Ana juega en el mismo navegador: tablero vacío y su propia partida.
  await dialogo.getByRole('button', { name: 'Jugar como Ana' }).click();
  await page.locator('#tablero[data-listo="true"]').waitFor({ state: 'attached' });
  await expect(page.locator('#tablero [data-estado="correcta"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Clasificación' }).click();
  await expect(filas.nth(1)).toHaveClass(/clasificacion__actual/);
  await expect(filas.nth(1)).toContainText('Ana');
  await expect(dialogo.locator('.clasificacion__jugando')).toHaveText('jugando');

  // Volver al jugador 1: su partida sigue ganada.
  await dialogo.getByRole('button', { name: 'Jugar como Jugador 1' }).click();
  await page.locator('#tablero[data-listo="true"]').waitFor({ state: 'attached' });
  await expect(page.locator('#tablero [data-estado="correcta"]')).toHaveCount(5);
});

test('cambiar el nombre y quitar a un jugador', async ({ page }) => {
  await abrir(page);
  await page.getByRole('button', { name: 'Clasificación' }).click();
  const dialogo = page.getByRole('dialog', { name: 'Clasificación' });
  page.once('dialog', (d) => void d.accept('Jairo'));
  await dialogo.getByRole('button', { name: 'Cambiar nombre' }).click();
  await expect(
    dialogo.locator('#clasificacion-filas tr:not(.clasificacion__fila-acciones)').first(),
  ).toContainText('Jairo');
  await dialogo.getByLabel('Agregar jugador').fill('Beto');
  await dialogo.getByRole('button', { name: 'Agregar' }).click();
  page.once('dialog', (d) => void d.accept());
  await dialogo.getByRole('button', { name: 'Quitar a Beto' }).click();
  await expect(
    dialogo.locator('#clasificacion-filas tr:not(.clasificacion__fila-acciones)'),
  ).toHaveCount(1);
  await page.reload();
  await page.getByRole('button', { name: 'Clasificación' }).click();
  await expect(
    dialogo.locator('#clasificacion-filas tr:not(.clasificacion__fila-acciones)'),
  ).toHaveCount(1);
  await expect(dialogo).toContainText('Jairo');
});
