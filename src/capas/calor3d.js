import { GridLayer } from "@deck.gl/aggregation-layers";
import { posicion, describirCelda } from "./comun.js";

export default {
  id: "calor3d",
  nombre: "Mapa de calor 3D",
  icono: "assets/icons/calor3D.svg",
  usaCoordenadas: true,
  opciones: [
    { clave: "celda", etiqueta: "Ancho de celda (m)", tipo: "numero", min: 10, max: 500000, paso: 10, defecto: 200 },
    { clave: "elevacion", etiqueta: "Escala de elevación", tipo: "numero", min: 1, max: 500, paso: 1, defecto: 10 },
  ],

  crear(ctx) {
    const { celda, elevacion } = ctx.ajustes;
    return new GridLayer({
      id: ctx.id,
      data: ctx.filas,
      getPosition: posicion(ctx.coords),
      cellSize: celda,
      elevationScale: elevacion,
      extruded: true,
      coverage: 0.9,
      opacity: 0.6,
      gpuAggregation: false, // en CPU: así al pasar el ratón tenemos los puntos de cada celda
      pickable: true,
      autoHighlight: true,
    });
  },

  describir: (info, ctx) => describirCelda(info, ctx),
};
