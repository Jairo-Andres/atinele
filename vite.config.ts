/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import { ofuscar } from './src/juego/ofuscar.ts';

// Sirve data/contenido/calendario.json ofuscado en vez de JSON plano.
const RUTA_CALENDARIO = fileURLToPath(new URL('./data/contenido/calendario.json', import.meta.url));
const ID_VIRTUAL = '\0calendario-ofuscado';

function calendarioOfuscado(): Plugin {
  return {
    name: 'calendario-ofuscado',
    enforce: 'pre',
    resolveId(fuente) {
      return fuente.replace(/\\/g, '/').endsWith('data/contenido/calendario.json')
        ? ID_VIRTUAL
        : null;
    },
    load(id) {
      if (id !== ID_VIRTUAL) return null;
      this.addWatchFile(RUTA_CALENDARIO);
      const codigo = ofuscar(readFileSync(RUTA_CALENDARIO, 'utf8'));
      return `import { desofuscar } from '/src/juego/ofuscar.ts';\nexport default JSON.parse(desofuscar(${JSON.stringify(codigo)}));`;
    },
  };
}

// Las mismas cabeceras de seguridad de vercel.json, para probarlas con `vite preview`.
const cabeceras = Object.fromEntries(
  (
    JSON.parse(readFileSync(new URL('./vercel.json', import.meta.url), 'utf8')) as {
      headers: { source: string; headers: { key: string; value: string }[] }[];
    }
  ).headers[0]!.headers.map((h) => [h.key, h.value]),
);

export default defineConfig({
  // Rutas relativas: el sitio funciona en la raíz y detrás de un rewrite (/juego/).
  base: './',
  plugins: [calendarioOfuscado()],
  build: { target: 'es2022' },
  preview: { headers: cabeceras },
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/juego/**', 'src/almacen.ts'],
      thresholds: { lines: 95, functions: 95, branches: 90 },
    },
  },
});
