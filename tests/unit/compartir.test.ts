import { describe, expect, it } from 'vitest';
import { enlaceWhatsApp, filaEmoji, textoCompartir } from '../../src/juego/compartir';
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
