import { describe, expect, it } from 'vitest';
import {
  cuadrosCercania,
  enlaceWhatsApp,
  filaEmoji,
  filaMunicipio,
  textoCompartir,
  textoConFilas,
} from '../../src/juego/compartir';
import { evaluar } from '../../src/juego/evaluar';

const base = {
  nombre: 'Atínele',
  numero: 12,
  maxIntentos: 6,
  altoContraste: false,
  url: 'https://atinele.vercel.app',
  etiquetaModo: 'Palabra',
};

describe('compartir', () => {
  it('texto de partida ganada, sin letras', () => {
    const intentos = [evaluar('PERRO', 'ROBLE'), evaluar('PERRO', 'PERRO')];
    const texto = textoCompartir({ ...base, intentos, ganado: true });
    expect(texto).toBe(
      [
        'Atínele #12 🇨🇴',
        '🔤 Palabra 2/6',
        '🟨🟨⬛⬛🟨',
        '🟩🟩🟩🟩🟩',
        '',
        'https://atinele.vercel.app',
      ].join('\n'),
    );
    expect(texto).not.toMatch(/PERRO|ROBLE/);
  });

  it('partida perdida usa X/6', () => {
    const intentos = Array.from({ length: 6 }, () => evaluar('PERRO', 'NUBIL'));
    expect(textoCompartir({ ...base, intentos, ganado: false })).toContain('🔤 Palabra X/6');
  });

  it('alto contraste cambia verde por naranja y amarillo por azul', () => {
    expect(filaEmoji(evaluar('PERRO', 'ROBLE'), true)).toBe('🟦🟦⬛⬛🟦');
    expect(filaEmoji(evaluar('PERRO', 'PERRO'), true)).toBe('🟧🟧🟧🟧🟧');
  });

  it('enlace de WhatsApp sin número', () => {
    expect(enlaceWhatsApp('Hola #1 🟩')).toBe('https://wa.me/?text=Hola%20%231%20%F0%9F%9F%A9');
  });
});

describe('compartir municipio', () => {
  it('cuadros de cercanía', () => {
    expect(cuadrosCercania(0)).toBe('⬛⬛⬛⬛⬛');
    expect(cuadrosCercania(9)).toBe('⬛⬛⬛⬛⬛');
    expect(cuadrosCercania(10)).toBe('🟨⬛⬛⬛⬛');
    expect(cuadrosCercania(65)).toBe('🟩🟩🟩⬛⬛');
    expect(cuadrosCercania(72)).toBe('🟩🟩🟩🟨⬛');
    expect(cuadrosCercania(99)).toBe('🟩🟩🟩🟩🟨');
    expect(cuadrosCercania(100)).toBe('🟩🟩🟩🟩🟩');
    expect(cuadrosCercania(150)).toBe('🟩🟩🟩🟩🟩');
    expect(cuadrosCercania(50, true)).toBe('🟧🟧🟦⬛⬛');
  });

  it('fila con flecha o con pin al acertar', () => {
    expect(filaMunicipio({ acierto: false, cercania: 72, direccion: 'NE' })).toBe('🟩🟩🟩🟨⬛ ↗️');
    expect(filaMunicipio({ acierto: true, cercania: 100, direccion: 'N' })).toBe('🟩🟩🟩🟩🟩 📍');
  });

  it('texto completo sin nombres', () => {
    const texto = textoConFilas({
      nombre: 'Atínele',
      numero: 3,
      icono: '📍',
      etiquetaModo: 'Municipio',
      filas: ['🟩🟩⬛⬛⬛ ⬅️', '🟩🟩🟩🟩🟩 📍'],
      ganado: true,
      maxIntentos: 6,
      url: 'https://atinele.vercel.app',
    });
    expect(texto).toBe(
      [
        'Atínele #3 🇨🇴',
        '📍 Municipio 2/6',
        '🟩🟩⬛⬛⬛ ⬅️',
        '🟩🟩🟩🟩🟩 📍',
        '',
        'https://atinele.vercel.app',
      ].join('\n'),
    );
  });
});
