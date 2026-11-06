import { expect, test } from '@playwright/test';
import { SOPA, abrirSopa, marcarEnSopa } from './ayudantes';

test.use({ locale: 'es-CO' });

test('muestra el tema, la rejilla de 10×10 y las palabras', async ({ page }) => {
  await abrirSopa(page);
  await expect(page.locator('#sopa-tema')).toContainText(SOPA.tema.es);
  await expect(page.locator('#sopa-rejilla .sopa__letra')).toHaveCount(100);
  await expect(page.locator('#sopa-palabras li')).toHaveCount(SOPA.palabras.length);
  await expect(page.locator('#sopa-progreso')).toHaveText(`0 de ${SOPA.palabras.length} palabras`);
});

test('tocar la primera y la última letra marca la palabra y se guarda', async ({ page }) => {
  await abrirSopa(page);
  const p = SOPA.palabras[0]!;
  await marcarEnSopa(page, p);
  await expect(page.locator('#sopa-palabras .sopa__palabra--encontrada')).toHaveText(p.palabra);
  await expect(page.locator('#sopa-progreso')).toContainText('1 de');
  await page.reload();
  await expect(page.locator('#sopa-palabras .sopa__palabra--encontrada')).toHaveText(p.palabra);
  await expect(page.locator('.sopa__letra--encontrada').first()).toBeVisible();
});

test('arrastrar también marca la palabra; una selección que no es palabra avisa', async ({
  page,
}) => {
  await abrirSopa(page);
  const p = SOPA.palabras[1]!;
  const casilla = ([f, c]: number[]) => page.locator(`.sopa__letra[data-f="${f}"][data-c="${c}"]`);
  const a = (await casilla(p.inicio).boundingBox())!;
  const z = (await casilla(p.fin).boundingBox())!;
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(z.x + z.width / 2, z.y + z.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator('#sopa-palabras .sopa__palabra--encontrada')).toHaveText(p.palabra);

  // Dos letras vecinas que no forman ninguna palabra.
  const otra = SOPA.palabras.flatMap((x) => [x.inicio.join(), x.fin.join()]);
  const libre = [0, 1, 2, 3, 4, 5, 6, 7, 8].find(
    (c) => !otra.includes(`9,${c}`) && !otra.includes(`9,${c + 1}`),
  )!;
  await casilla([9, libre]).click();
  await casilla([9, libre + 1]).click();
  await expect(page.locator('#aviso')).toContainText('no es una de las palabras');
});

test('con teclado: flechas y Enter en la primera y la última letra', async ({ page }) => {
  await abrirSopa(page);
  const p = SOPA.palabras[2]!;
  await page.locator('.sopa__letra[data-f="0"][data-c="0"]').focus();
  const ir = async ([f, c]: number[]) => {
    for (let i = 0; i < 10; i++) await page.keyboard.press('ArrowUp');
    for (let i = 0; i < 10; i++) await page.keyboard.press('ArrowLeft');
    for (let i = 0; i < f!; i++) await page.keyboard.press('ArrowDown');
    for (let i = 0; i < c!; i++) await page.keyboard.press('ArrowRight');
  };
  await ir(p.inicio);
  await page.keyboard.press('Enter');
  await ir(p.fin);
  await page.keyboard.press('Enter');
  await expect(page.locator('#sopa-palabras .sopa__palabra--encontrada')).toHaveText(p.palabra);
});

test('encontrar todas gana y comparte sin decir las palabras', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await abrirSopa(page);
  for (const p of SOPA.palabras) await marcarEnSopa(page, p);
  const dialogo = page.getByRole('dialog', { name: 'Estadísticas' });
  await expect(dialogo).toContainText('Palabras encontradas');
  await expect(dialogo.locator('#seccion-distribucion')).toBeHidden();
  await dialogo.getByRole('button', { name: 'Copiar' }).click();
  const texto = await page.evaluate(() => navigator.clipboard.readText());
  const n = SOPA.palabras.length;
  expect(texto).toContain(`🔎 Sopa de letras ${n}/${n}\n${'🟩'.repeat(n)}`);
  for (const p of SOPA.palabras) expect(texto.toLowerCase()).not.toContain(p.palabra);
  await expect(page.getByRole('tab', { name: /Sopa/ })).toHaveClass(/jugado/);
});

test('rendirse muestra las palabras que faltaban', async ({ page }) => {
  await abrirSopa(page);
  page.once('dialog', (d) => void d.accept());
  await page.getByRole('button', { name: 'Me rindo' }).click();
  await expect(page.getByRole('dialog', { name: 'Estadísticas' })).toContainText('Hoy no fue');
  await page.keyboard.press('Escape');
  await expect(page.locator('#sopa-palabras .sopa__palabra--revelada')).toHaveCount(
    SOPA.palabras.length,
  );
  await expect(page.getByRole('button', { name: 'Me rindo' })).toBeHidden();
});
