import { ScatterplotLayer } from "@deck.gl/layers";
import { opcionColor, posicion, color, describirFila } from "./comun.js";

export default {
  id: "puntos",
  nombre: "Puntos",
  icono: "assets/icons/puntos.svg",
  usaCoordenadas: true,
  opciones: [
    opcionColor,
    { clave: "radio", etiqueta: "Tamaño de los puntos (px)", tipo: "numero", min: 1, max: 30, paso: 1, defecto: 3 },
  ],

  crear(ctx) {
    const { campoColor, radio } = ctx.ajustes;
    return new ScatterplotLayer({
      id: ctx.id,
      data: ctx.filas,
      getPosition: posicion(ctx.coords),
      getFillColor: color(ctx),
      radiusUnits: "pixels",
      getRadius: radio,
      radiusMinPixels: 1,
      stroked: false,
      pickable: true,
      autoHighlight: true,
      highlightColor: [255, 255, 255, 200],
      updateTriggers: { getFillColor: [campoColor] },
    });
  },

  describir: describirFila,
};
