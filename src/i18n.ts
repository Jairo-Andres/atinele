export type Idioma = 'es' | 'en';

const es = {
  saltar: 'Saltar al juego',
  subtitulo: 'La palabra del día, a la colombiana',
  reto: 'Reto #{n}',
  ayuda: 'Cómo jugar',
  estadisticas: 'Estadísticas',
  ajustes: 'Ajustes',
  cambiarIdioma: 'Cambiar a inglés',
  idiomaCorto: 'EN',
  modos: 'Modos de juego',
  modoPalabra: 'Palabra',
  modoMunicipio: 'Municipio',
  modoDicho: 'Dicho',
  pronto: 'Próximamente',
  prontoCorto: 'Pronto',
  prontoMunicipio:
    'Adivina el municipio del día con pistas de distancia y dirección. Los datos vendrán de DIVIPOLA del DANE.',
  prontoDicho: 'Completa la palabra que falta en un dicho colombiano y aprende qué significa.',
  tablero: 'Tablero',
  intento: 'Intento {n} de {total}',
  teclado: 'Teclado',
  enviar: 'Enviar',
  borrar: 'Borrar',
  vacia: 'vacía',
  correcta: 'correcta en su lugar',
  presente: 'está, en otro lugar',
  ausente: 'no está',
  cargando: 'Cargando palabras…',
  cortas: 'Faltan letras',
  invalida: 'No está en la lista',
  errorLista: 'No se pudo cargar la lista de palabras. Revisa tu conexión y recarga.',
  ganaste: '¡Le atinó!',
  perdiste: 'Hoy no fue',
  laRespuesta: 'La palabra era',
  anuncioFila: 'Intento {n}: {detalle}',
  jugadas: 'Jugadas',
  victorias: '% victorias',
  racha: 'Racha',
  mejorRacha: 'Mejor racha',
  distribucion: 'Intentos para acertar',
  distribucionFila: '{n} intentos: {v}',
  proximo: 'Próximo reto en',
  compartir: 'Compartir',
  whatsapp: 'Enviar por WhatsApp',
  copiar: 'Copiar',
  copiado: 'Resultado copiado',
  copiarManual: 'Copia el resultado:',
  cerrar: 'Cerrar',
  tema: 'Tema',
  temaSistema: 'Como el sistema',
  temaClaro: 'Claro',
  temaOscuro: 'Oscuro',
  altoContraste: 'Alto contraste (naranja y azul, para daltonismo)',
  borrarDatos: 'Borrar mis datos',
  confirmarBorrar: '¿Borrar estadísticas y partidas guardadas en este navegador?',
  datosBorrados: 'Datos borrados',
  privacidad: 'Tus estadísticas solo se guardan en este navegador. No hay cookies ni cuentas.',
  fuentes: 'Fuentes y licencias',
  ayudaIntro:
    'Adivina la palabra del día en 6 intentos. Cada intento debe ser una palabra válida de 5 letras.',
  ayudaColores: 'Después de cada intento, cada letra cambia de color y de forma:',
  ayudaCorrecta: 'La G está en la palabra y en su lugar.',
  ayudaPresente: 'La R está en la palabra, pero en otro lugar.',
  ayudaAusente: 'La O no está en la palabra.',
  ayudaTildes: 'Las tildes no cuentan; la Ñ es una letra aparte.',
  ayudaDiario: 'Hay un reto nuevo cada día a la medianoche, hora de Colombia.',
  ayudaPronto: 'Pronto: municipio y dicho del día.',
  fuentesPalabras:
    'Palabras válidas: diccionario es_CO del proyecto RLA-ES (LibreOffice/Hunspell), redistribuido bajo LGPL 3.0 o posterior.',
  fuentesCodigo: 'Código: licencia MIT.',
  fuentesWordle: 'Inspirado en Wordle. No está afiliado a The New York Times Company.',
  hechoPor: 'Hecho por Jairo Sierra',
  portafolio: 'Portafolio',
  repo: 'Código en GitHub',
  linea: 'Línea F · Frontend',
  sinJs: 'Atínele necesita JavaScript para funcionar.',
};

type Textos = typeof es;

const en: Textos = {
  saltar: 'Skip to game',
  subtitulo: "Today's word, Colombian style",
  reto: 'Challenge #{n}',
  ayuda: 'How to play',
  estadisticas: 'Statistics',
  ajustes: 'Settings',
  cambiarIdioma: 'Switch to Spanish',
  idiomaCorto: 'ES',
  modos: 'Game modes',
  modoPalabra: 'Word',
  modoMunicipio: 'Town',
  modoDicho: 'Saying',
  pronto: 'Coming soon',
  prontoCorto: 'Soon',
  prontoMunicipio:
    "Guess today's Colombian town with distance and direction hints. Data will come from DANE's DIVIPOLA.",
  prontoDicho: 'Fill in the missing word of a Colombian saying and learn what it means.',
  tablero: 'Board',
  intento: 'Guess {n} of {total}',
  teclado: 'Keyboard',
  enviar: 'Enter',
  borrar: 'Delete',
  vacia: 'empty',
  correcta: 'correct spot',
  presente: 'in the word, wrong spot',
  ausente: 'not in the word',
  cargando: 'Loading words…',
  cortas: 'Not enough letters',
  invalida: 'Not in the word list',
  errorLista: 'The word list could not be loaded. Check your connection and reload.',
  ganaste: 'Nailed it!',
  perdiste: 'Not today',
  laRespuesta: 'The word was',
  anuncioFila: 'Guess {n}: {detalle}',
  jugadas: 'Played',
  victorias: 'Win %',
  racha: 'Streak',
  mejorRacha: 'Best streak',
  distribucion: 'Guess distribution',
  distribucionFila: '{n} guesses: {v}',
  proximo: 'Next challenge in',
  compartir: 'Share',
  whatsapp: 'Send via WhatsApp',
  copiar: 'Copy',
  copiado: 'Result copied',
  copiarManual: 'Copy your result:',
  cerrar: 'Close',
  tema: 'Theme',
  temaSistema: 'Match system',
  temaClaro: 'Light',
  temaOscuro: 'Dark',
  altoContraste: 'High contrast (orange and blue, colorblind friendly)',
  borrarDatos: 'Delete my data',
  confirmarBorrar: 'Delete the statistics and games saved in this browser?',
  datosBorrados: 'Data deleted',
  privacidad: 'Your statistics are only stored in this browser. No cookies, no accounts.',
  fuentes: 'Sources and licenses',
  ayudaIntro:
    "Guess today's Spanish word in 6 tries. Each guess must be a valid 5-letter Spanish word.",
  ayudaColores: 'After each guess, every letter changes color and shape:',
  ayudaCorrecta: 'G is in the word and in the correct spot.',
  ayudaPresente: 'R is in the word but in the wrong spot.',
  ayudaAusente: 'O is not in the word.',
  ayudaTildes: 'Accents do not matter; Ñ is a separate letter.',
  ayudaDiario: 'A new challenge arrives every day at midnight, Colombia time.',
  ayudaPronto: 'Coming soon: town and saying of the day.',
  fuentesPalabras:
    'Valid words: RLA-ES es_CO dictionary (LibreOffice/Hunspell), redistributed under LGPL-3.0-or-later.',
  fuentesCodigo: 'Code: MIT license.',
  fuentesWordle: 'Inspired by Wordle. Not affiliated with The New York Times Company.',
  hechoPor: 'Made by Jairo Sierra',
  portafolio: 'Portfolio',
  repo: 'Code on GitHub',
  linea: 'Line F · Frontend',
  sinJs: 'Atínele needs JavaScript to work.',
};

const textos: Record<Idioma, Textos> = { es, en };
export type Clave = keyof Textos;

let actual: Idioma = 'es';

export function idiomaInicial(guardado: Idioma | null, navegador: string): Idioma {
  if (guardado) return guardado;
  return navegador.toLowerCase().startsWith('es') ? 'es' : 'en';
}

export function usarIdioma(idioma: Idioma): void {
  actual = idioma;
}

export function idioma(): Idioma {
  return actual;
}

export function t(clave: Clave, vars: Record<string, string | number> = {}): string {
  return textos[actual][clave].replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
}

/** Traduce los elementos con data-i18n, data-i18n-aria y data-i18n-title. */
export function traducirDocumento(raiz: ParentNode = document): void {
  document.documentElement.lang = actual;
  raiz.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n as Clave);
  });
  raiz.querySelectorAll<HTMLElement>('[data-i18n-aria]').forEach((el) => {
    el.setAttribute('aria-label', t(el.dataset.i18nAria as Clave));
  });
  raiz.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach((el) => {
    el.title = t(el.dataset.i18nTitle as Clave);
  });
}
