import { IconLayer } from "@deck.gl/layers";
import { opcionColor, posicion, color, describirFila } from "./comun.js";

// Chincheta propia (antes se descargaba un atlas de iconos de GitHub en cada visita).
// Va en blanco porque `mask: true` la tiñe con el color de cada punto.
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="128" viewBox="0 0 24 32">
<path fill="#fff" d="M12 0C5.4 0 0 5.3 0 11.9 0 20.8 12 32 12 32s12-11.2 12-20.1C24 5.3 18.6 0 12 0zm0 16.5a4.6 4.6 0 1 1 0-9.2 4.6 4.6 0 0 1 0 9.2z"/></svg>`;
const ICONO = { url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(SVG)}`, id: "chincheta", width: 96, height: 128, anchorY: 128, mask: true };

export default {
  id: "chinchetas",
  nombre: "Chinchetas",
  icono: "assets/icons/chinchetas.svg",
  usaCoordenadas: true,
  opciones: [
    opcionColor,
    { clave: "tam", etiqueta: "Tamaño (px)", tipo: "numero", min: 8, max: 80, paso: 1, defecto: 28 },
  ],

  crear(ctx) {
    const { campoColor, tam } = ctx.ajustes;
    return new IconLayer({
      id: ctx.id,
      data: ctx.filas,
      getPosition: posicion(ctx.coords),
      getIcon: () => ICONO,
      getSize: tam,
      sizeUnits: "pixels",
      getColor: color(ctx, 255),
      pickable: true,
      updateTriggers: { getColor: [campoColor] },
    });
  },

  describir: describirFila,
};
