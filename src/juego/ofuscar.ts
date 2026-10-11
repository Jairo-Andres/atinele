// Ofuscación simple del calendario para que las respuestas no aparezcan al
// buscar texto en el bundle. No es seguridad: el sitio es estático.

export function ofuscar(texto: string): string {
  const bytes = new TextEncoder().encode(texto);
  let binario = '';
  for (const b of bytes) binario += String.fromCharCode(b);
  return btoa(binario).split('').reverse().join('');
}

export function desofuscar(codigo: string): string {
  const binario = atob(codigo.split('').reverse().join(''));
  const bytes = Uint8Array.from(binario, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
