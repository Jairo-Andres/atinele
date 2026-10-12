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

const MINUSCULAS = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'y', 'e', 'en']);

/**
 * DIVIPOLA publica los nombres en mayúsculas (con tildes). Los pasa a tipo
 * título para mostrarlos: "CARTAGENA DE INDIAS" → "Cartagena de Indias".
 * Las abreviaturas con punto (D.C.) se dejan en mayúsculas.
 */
export function tipoTitulo(texto) {
  return texto
    .trim()
    .toLocaleLowerCase('es-CO')
    .split(/(\s+|-|\()/)
    .map((parte, i) => {
      if (/^\s+$|^-$|^\($/.test(parte) || parte === '') return parte;
      if (parte.includes('.')) return parte.toLocaleUpperCase('es-CO');
      if (i > 0 && MINUSCULAS.has(parte)) return parte;
      return parte.charAt(0).toLocaleUpperCase('es-CO') + parte.slice(1);
    })
    .join('');
}

/** Distancia en km (haversine, radio 6371 km). Igual que src/juego/geo.ts. */
export function distanciaKm(a, b) {
  const rad = (g) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Punto dentro de anillos [[lon, lat], ...] (par-impar). Igual a src/juego/mapa.ts. */
export function dentro(lat, lon, anillos) {
  let adentro = false;
  for (const a of anillos) {
    for (let i = 0, j = a.length - 1; i < a.length; j = i++) {
      const [xi, yi] = a[i];
      const [xj, yj] = a[j];
      if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
        adentro = !adentro;
      }
    }
  }
  return adentro;
}
