import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import { posicion } from "./comun.js";

export default {
  id: "calor",
  nombre: "Mapa de calor",
  icono: "assets/icons/calor.svg",
  usaCoordenadas: true,
  opciones: [
    { clave: "campoPeso", etiqueta: "Peso (opcional)", tipo: "campo", columnas: "numero" },
    { clave: "radio", etiqueta: "Radio (px)", tipo: "numero", min: 5, max: 150, paso: 1, defecto: 30 },
    { clave: "intensidad", etiqueta: "Intensidad", tipo: "numero", min: 0.1, max: 5, paso: 0.1, defecto: 1 },
  ],

  crear(ctx) {
    const { campoPeso, radio, intensidad } = ctx.ajustes;
    return new HeatmapLayer({
      id: ctx.id,
      data: ctx.filas,
      getPosition: posicion(ctx.coords),
      getWeight: campoPeso ? (d) => d[campoPeso] ?? 0 : 1,
      radiusPixels: radio,
      intensity: intensidad,
      threshold: 0.05,
      updateTriggers: { getWeight: [campoPeso] },
    });
  },
};
