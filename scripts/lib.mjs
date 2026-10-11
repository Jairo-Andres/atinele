// Utilidades compartidas por los scripts. La normalización debe ser igual a
// src/juego/normalizar.ts (la prueba tests/unit/scripts.test.ts lo comprueba).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
export const LETRAS = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
export const LARGOS = [4, 5, 6, 7, 8];

export function normalizar(texto) {
  return texto
    .trim()
    .toLocaleUpperCase('es-CO')
    .replaceAll('Ñ', '\u0000')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replaceAll('\u0000', 'Ñ');
}

export function largo(palabra) {
  return Array.from(palabra).length;
}

export function leerJson(ruta) {
  return JSON.parse(readFileSync(join(RAIZ, ruta), 'utf8'));
}

export function escribirJson(ruta, datos) {
  writeFileSync(join(RAIZ, ruta), JSON.stringify(datos, null, 2) + '\n');
}

export function leerValidas(n) {
  return new Set(
    readFileSync(join(RAIZ, `public/palabras/${n}.txt`), 'utf8')
      .split('\n')
      .filter(Boolean),
  );
}
