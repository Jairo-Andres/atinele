import { readFileSync } from 'node:fs';
import { expect, type Page } from '@playwright/test';

const calendario = JSON.parse(readFileSync('data/contenido/calendario.json', 'utf8')) as {
  inicio: string;
  dias: { n: number; palabra: string }[];
  dichos: {
    id: string;
    texto: string;
    oculta: string;
    pista: { es: string };
    significado: { es: string };
    fuente: { url: string };
  }[];
};

/** Día 1 del calendario a las 3 p. m. de Colombia. */
export const FECHA = new Date(`${calendario.inicio}T15:00:00-05:00`);

export const RESPUESTA = (calendario.dias[0] as { palabra: string }).palabra
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .toUpperCase();

const validas = readFileSync('public/palabras/5.txt', 'utf8').split('\n').filter(Boolean);

/** Palabras válidas distintas de la respuesta, para perder a propósito. */
export function palabrasQueNoSon(n: number): string[] {
  return validas.filter((w) => w !== RESPUESTA && !w.includes('Ñ')).slice(100, 100 + n);
}

export async function abrir(page: Page, opciones: { conAyuda?: boolean } = {}): Promise<void> {
  await page.clock.setFixedTime(FECHA);
  await page.goto('/');
  await page.locator('#tablero[data-listo="true"]').waitFor({ state: 'attached' });
  if (!opciones.conAyuda) {
    await page.locator('#dlg-ayuda').waitFor();
    await page.keyboard.press('Escape');
  }
}

const REVELADA = '[data-estado="correcta"], [data-estado="presente"], [data-estado="ausente"]';

export async function escribir(page: Page, palabra: string, tablero = '#tablero'): Promise<void> {
  const filas = page.locator(`${tablero} .fila`);
  const antes = await filas.filter({ has: page.locator(REVELADA) }).count();
  await page.keyboard.type(palabra.toLowerCase(), { delay: 20 });
  await expect(filas.nth(antes).locator('[data-estado="escrita"]')).toHaveCount(palabra.length);
  await page.keyboard.press('Enter');
  // Esperar a que la fila quede revelada, como haría una persona.
  await expect(filas.nth(antes).locator(REVELADA)).toHaveCount(palabra.length);
  await expect(page.locator(`${tablero} .revelando`)).toHaveCount(0);
}

// ---------- Modo Dicho ----------
const normal = (t: string) =>
  t
    .toUpperCase()
    .replaceAll('Ñ', '\u0000')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replaceAll('\u0000', 'Ñ');

/** Dicho del día 1 y su respuesta normalizada. */
export const DICHO = calendario.dichos[0] as (typeof calendario.dichos)[number];
export const RESPUESTA_DICHO = normal(DICHO.oculta);
export const LARGO_DICHO = Array.from(RESPUESTA_DICHO).length;

/** Palabras válidas del largo del dicho, distintas de la respuesta y sin Ñ. */
export function palabrasDichoQueNoSon(n: number): string[] {
  return readFileSync(`public/palabras/${LARGO_DICHO}.txt`, 'utf8')
    .split('\n')
    .filter((w) => w && w !== RESPUESTA_DICHO && !w.includes('Ñ'))
    .slice(50, 50 + n);
}

export async function abrirDicho(page: Page): Promise<void> {
  await page.clock.setFixedTime(FECHA);
  await page.goto('/#dicho');
  await page.locator('#dlg-ayuda').waitFor();
  await page.keyboard.press('Escape');
  await page.locator('#tablero-dicho[data-listo="true"]').waitFor({ state: 'attached' });
}

export const escribirDicho = (page: Page, palabra: string) =>
  escribir(page, palabra, '#tablero-dicho');

// ---------- Modo Municipio ----------
// Usa public/datos/municipios.json (lo genera `npm run municipios` desde DIVIPOLA).
interface MunicipioE2E {
  cod: string;
  nombre: string;
  dpto: string;
  codDpto: string;
  lat: number;
  lon: number;
}
const datosMunicipios = JSON.parse(readFileSync('public/datos/municipios.json', 'utf8')) as {
  municipios: MunicipioE2E[];
};
const codigosCalendario = (
  JSON.parse(readFileSync('data/contenido/calendario.json', 'utf8')) as { municipios: string[] }
).municipios;

function porCodigo(cod: string): MunicipioE2E {
  const m = datosMunicipios.municipios.find((x) => x.cod === cod);
  if (!m) throw new Error(`No está el municipio ${cod} en public/datos/municipios.json`);
  return m;
}

/** Respuesta del día 1 del modo Municipio. */
export const MUNICIPIO = porCodigo(codigosCalendario[0] as string);

/** Otras capitales (siempre están en DIVIPOLA) para fallar a propósito. */
export function municipiosQueNoSon(n: number): MunicipioE2E[] {
  return codigosCalendario.slice(1, 1 + n).map(porCodigo);
}

export async function abrirMunicipio(page: Page): Promise<void> {
  await page.clock.setFixedTime(FECHA);
  await page.goto('/#municipio');
  await page.locator('#dlg-ayuda').waitFor();
  await page.keyboard.press('Escape');
  await page.locator('#form-municipio[data-listo="true"]').waitFor({ state: 'attached' });
}

/** Escribe "Nombre, Departamento" (siempre único) y lo envía. */
export async function adivinar(page: Page, m: MunicipioE2E): Promise<void> {
  const pistas = page.locator('#intentos-municipio .pista:not(.pista--vacia)');
  const antes = await pistas.count();
  await page.locator('#entrada-municipio').fill(`${m.nombre}, ${m.dpto}`);
  await page.keyboard.press('Enter');
  await expect(pistas).toHaveCount(antes + 1);
}
