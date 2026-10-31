import { normalizarNombre } from "./columnas.js";

/**
 * @typedef {{ id: string, campo: string, min?: number|null, max?: number|null, texto?: string }} Filtro
 * Columnas numéricas: rango [min, max] (cualquiera de los dos puede faltar).
 * Columnas de texto: el valor contiene el texto (sin distinguir mayúsculas ni tildes).
 */

/** Un filtro sin campo o sin valores no filtra nada. */
export function filtroVacio(filtro, columna) {
  if (!filtro.campo || !columna) return true;
  if (columna.tipo === "numero") return !Number.isFinite(filtro.min) && !Number.isFinite(filtro.max);
  return !filtro.texto || filtro.texto.trim() === "";
}

/**
 * @param {object[]} filas
 * @param {Filtro[]} filtros
 * @param {import("./columnas.js").Columna[]} columnas
 * @returns {object[]} las mismas filas si no hay filtros activos (misma referencia)
 */
export function aplicarFiltros(filas, filtros, columnas) {
  const porNombre = new Map(columnas.map((c) => [c.nombre, c]));
  const pruebas = filtros
    .filter((f) => !filtroVacio(f, porNombre.get(f.campo)))
    .map((f) => crearPrueba(f, porNombre.get(f.campo)));

  if (pruebas.length === 0) return filas;
  return filas.filter((fila) => pruebas.every((prueba) => prueba(fila)));
}

function crearPrueba(filtro, columna) {
  const campo = filtro.campo;
  if (columna.tipo === "numero") {
    const min = Number.isFinite(filtro.min) ? filtro.min : -Infinity;
    const max = Number.isFinite(filtro.max) ? filtro.max : Infinity;
    return (fila) => fila[campo] !== null && fila[campo] >= min && fila[campo] <= max;
  }
  const buscado = normalizarNombre(filtro.texto);
  return (fila) => normalizarNombre(fila[campo]).includes(buscado);
}
