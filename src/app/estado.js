/**
 * Estado central de la app. Sustituye a las ~20 variables globales de antes:
 * todo lo que la interfaz y el mapa necesitan saber está aquí, y cada parte se
 * suscribe a lo que le interesa.
 *
 * @typedef {{ id: string, tipo: string, ajustes: Record<string, any> }} Capa
 * @typedef {{
 *   archivo: string | null,
 *   filas: object[],
 *   columnas: import("../datos/columnas.js").Columna[],
 *   coords: { lat: string, lon: string } | null,
 *   sugerenciaArcos: object | null,
 *   filtros: import("../datos/filtros.js").Filtro[],
 *   capas: Capa[],
 *   tema: string,
 *   fase: "asistente" | "app",
 *   paso: number,
 *   interfaz: { info: boolean, controles: boolean, busqueda: boolean, camposOcultos: string[] },
 * }} Estado
 */

/** @returns {Estado} */
export function estadoInicial() {
  return {
    archivo: null,
    filas: [],
    columnas: [],
    coords: null,
    sugerenciaArcos: null,
    filtros: [],
    capas: [],
    tema: "oscuro",
    fase: "asistente",
    paso: 0,
    interfaz: { info: true, controles: true, busqueda: true, camposOcultos: [] },
  };
}

export function crearEstado(inicial = estadoInicial()) {
  let estado = inicial;
  const oyentes = new Set();

  return {
    /** @returns {Estado} */
    get: () => estado,

    /** Acepta un objeto parcial o una función estado → parcial. */
    set(cambio) {
      const parcial = typeof cambio === "function" ? cambio(estado) : cambio;
      const anterior = estado;
      estado = { ...estado, ...parcial };
      for (const oyente of oyentes) oyente(estado, anterior);
    },

    suscribir(oyente) {
      oyentes.add(oyente);
      return () => oyentes.delete(oyente);
    },

    /**
     * Llama a `fn` solo cuando cambia lo que devuelve `selector`.
     * `igual` permite comparar por contenido (p. ej. una clave en texto).
     */
    observar(selector, fn, { igual = Object.is, ahora = true } = {}) {
      let previo = selector(estado);
      if (ahora) fn(previo, estado);
      return this.suscribir((nuevo) => {
        const actual = selector(nuevo);
        if (!igual(actual, previo)) {
          previo = actual;
          fn(actual, nuevo);
        }
      });
    },
  };
}

let contador = 0;
export const nuevoId = (prefijo) => `${prefijo}-${Date.now().toString(36)}-${(contador++).toString(36)}`;

/** Memoriza el último resultado de una función según la identidad de sus argumentos. */
export function memo(fn) {
  let args = null;
  let resultado;
  return (...nuevos) => {
    if (!args || nuevos.length !== args.length || nuevos.some((a, i) => a !== args[i])) {
      args = nuevos;
      resultado = fn(...nuevos);
    }
    return resultado;
  };
}
