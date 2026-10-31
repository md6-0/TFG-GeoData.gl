import { tipoDeCapa } from "./registro.js";
import { crearEscalaCategorias } from "./colores.js";

/**
 * Traduce el estado (datos + lista de capas con sus ajustes) a capas de deck.gl.
 * deck.gl compara por id y solo recalcula lo que cambia, así que se puede llamar
 * en cada cambio del estado sin quitar y volver a poner capas a mano.
 */
export function crearConstructor() {
  // Las escalas de color se calculan sobre TODAS las filas, no las filtradas,
  // para que un valor conserve su color al filtrar.
  let filasEscala = null;
  const escalas = new Map();
  const escala = (todas) => (campo) => {
    if (filasEscala !== todas) {
      filasEscala = todas;
      escalas.clear();
    }
    if (!escalas.has(campo)) escalas.set(campo, crearEscalaCategorias(todas, campo));
    return escalas.get(campo);
  };

  return function construir({ todas, filtradas, conCoordenadas, coords, capas }) {
    const contextos = new Map();
    const layers = [];
    for (const capa of capas) {
      const tipo = tipoDeCapa(capa.tipo);
      if (tipo.usaCoordenadas && !coords) continue;
      const ctx = {
        id: capa.id,
        filas: conCoordenadas,
        todas: filtradas,
        coords,
        ajustes: capa.ajustes,
        escala: escala(todas),
      };
      const layer = tipo.crear(ctx);
      if (layer) {
        layers.push(layer);
        contextos.set(capa.id, { tipo, ctx });
      }
    }
    return { layers, contextos, escala: escala(todas) };
  };
}

/** Filas que se pueden situar en el mapa con la latitud/longitud principal. */
export function filasConCoordenadas(filas, coords) {
  if (!coords) return [];
  const { lat, lon } = coords;
  return filas.filter((f) => {
    const y = f[lat];
    const x = f[lon];
    return y !== null && x !== null && Math.abs(y) <= 90 && Math.abs(x) <= 180 && !(y === 0 && x === 0);
  });
}
