import puntos from "./puntos.js";
import chinchetas from "./chinchetas.js";
import calor from "./calor.js";
import calor3d from "./calor3d.js";
import hexagonos from "./hexagonos.js";
import arcos from "./arcos.js";

/**
 * Todos los tipos de capa. Para añadir uno nuevo basta con crear su módulo
 * (ver comun.js) y añadirlo aquí: el asistente y el panel de capas lo recogen solos.
 */
export const TIPOS = [puntos, chinchetas, calor3d, calor, hexagonos, arcos];

const porId = new Map(TIPOS.map((t) => [t.id, t]));

export function tipoDeCapa(id) {
  const tipo = porId.get(id);
  if (!tipo) throw new Error(`Tipo de capa desconocido: ${id}`);
  return tipo;
}
