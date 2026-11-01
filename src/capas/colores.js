/**
 * Colores por categoría. Antes cada valor recibía un color aleatorio y se
 * identificaba sumando los códigos de sus letras (así «AC» y «BB» salían iguales).
 * Ahora: paleta fija, los valores más frecuentes se llevan los colores y el resto
 * va a «Otros». El mismo archivo da siempre los mismos colores.
 */

export const COLOR_BASE = [255, 0, 102];
export const COLOR_OTROS = [150, 150, 160];

// Paleta cualitativa legible sobre mapas claros y oscuros.
export const PALETA = [
  [255, 0, 102],
  [0, 191, 255],
  [255, 196, 0],
  [124, 222, 90],
  [181, 120, 255],
  [255, 120, 40],
  [0, 220, 180],
  [255, 110, 199],
  [80, 140, 255],
  [200, 230, 60],
  [255, 70, 70],
];

/**
 * @param {object[]} filas
 * @param {string} campo
 * @returns {{ categorias: { valor: string, color: number[], n: number }[], colorDe: (valor: unknown) => number[], otros: number }}
 */
export function crearEscalaCategorias(filas, campo) {
  const cuentas = new Map();
  for (const fila of filas) {
    const valor = clave(fila[campo]);
    cuentas.set(valor, (cuentas.get(valor) ?? 0) + 1);
  }
  const ordenadas = [...cuentas.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  // Si caben todas, todas tienen color; si no, la última plaza es «Otros».
  const plazas = ordenadas.length <= PALETA.length ? ordenadas.length : PALETA.length - 1;
  const colores = new Map();
  const categorias = ordenadas.slice(0, plazas).map(([valor, n], i) => {
    colores.set(valor, PALETA[i]);
    return { valor, color: PALETA[i], n };
  });
  const otros = ordenadas.slice(plazas).reduce((suma, [, n]) => suma + n, 0);

  return {
    categorias,
    otros,
    colorDe: (valor) => colores.get(clave(valor)) ?? COLOR_OTROS,
  };
}

function clave(valor) {
  return valor === null || valor === undefined || valor === "" ? "(vacío)" : String(valor);
}

/** [r, g, b] → "rgb(r g b)" para CSS. */
export function aCss([r, g, b]) {
  return `rgb(${r} ${g} ${b})`;
}
