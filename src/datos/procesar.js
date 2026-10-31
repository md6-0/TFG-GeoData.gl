import { parsearTexto } from "./parsear.js";
import { analizarColumnas, normalizarFilas, detectarCoordenadas, sugerirArcos } from "./columnas.js";

/**
 * Del texto del archivo a todo lo que necesita la app. Es una función pura:
 * la usa el worker, y los tests la llaman directamente.
 *
 * @param {string} texto
 * @param {string} nombreArchivo
 */
export function procesarTexto(texto, nombreArchivo) {
  const { filas: crudas, avisos } = parsearTexto(texto, nombreArchivo);
  const columnas = analizarColumnas(crudas);
  const filas = normalizarFilas(crudas, columnas);
  return {
    nombre: nombreArchivo,
    filas,
    columnas,
    coords: detectarCoordenadas(columnas),
    arcos: sugerirArcos(columnas),
    avisos,
  };
}
