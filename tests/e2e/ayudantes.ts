import { readFileSync } from 'node:fs';
import { expect, type Page } from '@playwright/test';

const calendario = JSON.parse(readFileSync('data/contenido/calendario.json', 'utf8')) as {
  inicio: string;
  dias: { n: number; palabra: string }[];
  categorias: {
    id: string;
    categoria: { es: string; en: string; icono: string };
    palabra: string;
    pista: { es: string };
  }[];
  sopas: {
    id: string;
    tema: { es: string };
    palabras: { palabra: string; inicio: number[]; fin: number[] }[];
  }[];
  crucigramas: {
    id: string;
    ancho: number;
    palabras: { palabra: string; fila: number; col: number; dir: 'h' | 'v' }[];
  }[];
  desde: { sopas: string; crucigramas: string };
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

// ---------- Modo Categoría ----------
export const CATEGORIA = calendario.categorias[0] as (typeof calendario.categorias)[number];
export const RESPUESTA_CATEGORIA = normal(CATEGORIA.palabra);
export const LARGO_CATEGORIA = Array.from(RESPUESTA_CATEGORIA).length;

export function palabrasCategoriaQueNoSon(n: number): string[] {
  return readFileSync(`public/palabras/${LARGO_CATEGORIA}.txt`, 'utf8')
    .split('\n')
    .filter((w) => w && w !== RESPUESTA_CATEGORIA && !w.includes('Ñ'))
    .slice(50, 50 + n);
}

export async function abrirCategoria(page: Page): Promise<void> {
  await page.clock.setFixedTime(FECHA);
  await page.goto('/#categoria');
  await page.locator('#dlg-ayuda').waitFor();
  await page.keyboard.press('Escape');
  await page.locator('#tablero-categoria[data-listo="true"]').waitFor({ state: 'attached' });
}

export const escribirCategoria = (page: Page, palabra: string) =>
  escribir(page, palabra, '#tablero-categoria');

// ---------- Sopa de letras y crucigrama ----------
// Tienen su propio ciclo desde calendario.desde (igual que retoDelDia).
const dias = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
function delDia<T>(lista: T[], desde: string): T {
  const n = dias(desde, calendario.inicio);
  return lista[((n % lista.length) + lista.length) % lista.length] as T;
}
export const SOPA = delDia(calendario.sopas, calendario.desde.sopas);
export const CRUCIGRAMA = delDia(calendario.crucigramas, calendario.desde.crucigramas);

async function abrirPanel(page: Page, modo: string): Promise<void> {
  await page.clock.setFixedTime(FECHA);
  await page.goto(`/#${modo}`);
  await page.locator('#dlg-ayuda').waitFor();
  await page.keyboard.press('Escape');
}
export const abrirSopa = (page: Page) => abrirPanel(page, 'sopa');
export const abrirCrucigrama = (page: Page) => abrirPanel(page, 'crucigrama');

/** Marca una palabra de la sopa tocando su primera y su última letra. */
export async function marcarEnSopa(page: Page, p: (typeof SOPA.palabras)[number]): Promise<void> {
  const casilla = ([f, c]: number[]) => page.locator(`.sopa__letra[data-f="${f}"][data-c="${c}"]`);
  await casilla(p.inicio).click();
  await casilla(p.fin).click();
}

/** Escribe una palabra del crucigrama tocando su primera casilla. */
export async function escribirEnCrucigrama(
  page: Page,
  p: (typeof CRUCIGRAMA.palabras)[number],
  texto = p.palabra,
): Promise<void> {
  const k = p.fila * CRUCIGRAMA.ancho + p.col;
  const casilla = page.locator(`.cruci__casilla[data-k="${k}"]`);
  await casilla.click();
  // Si la casilla empieza dos palabras, tocar otra vez cambia de dirección.
  const otra = p.dir === 'h' ? 'vertical' : 'horizontal';
  if ((await page.locator('#cruci-pista').textContent())?.includes(otra)) await casilla.click();
  // keyboard.type no dispara keydown con la ñ (no está en el teclado de EE. UU.),
  // así que esa letra se toca en el teclado en pantalla.
  for (const letra of normal(texto)) {
    if (letra === 'Ñ') await page.locator('#teclado-cruci [data-tecla="Ñ"]').click();
    else await page.keyboard.type(letra.toLowerCase());
  }
}

/** Llena todo el crucigrama con la solución. */
export async function resolverCrucigrama(page: Page): Promise<void> {
  for (const p of CRUCIGRAMA.palabras) {
    if (page.isClosed()) return;
    if (await page.locator('#dlg-estadisticas[open]').count()) return;
    await escribirEnCrucigrama(page, p);
  }
}

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
export const todosLosMunicipios = (): MunicipioE2E[] => datosMunicipios.municipios;

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
