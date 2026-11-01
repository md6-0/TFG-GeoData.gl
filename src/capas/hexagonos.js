import { HexagonLayer } from "@deck.gl/aggregation-layers";
import { posicion, describirCelda } from "./comun.js";

export default {
  id: "hexagonos",
  nombre: "Hexágonos",
  icono: "assets/icons/hex.png",
  usaCoordenadas: true,
  opciones: [
    // Antes era obligatoria; sin ella, la altura es el número de elementos de cada hexágono.
    { clave: "campoAltura", etiqueta: "Altura según (opcional)", tipo: "campo", columnas: "numero" },
    { clave: "radio", etiqueta: "Radio del hexágono (m)", tipo: "numero", min: 10, max: 500000, paso: 10, defecto: 500 },
    { clave: "elevacion", etiqueta: "Escala de elevación", tipo: "numero", min: 1, max: 500, paso: 1, defecto: 25 },
  ],

  crear(ctx) {
    const { campoAltura, radio, elevacion } = ctx.ajustes;
    const peso = campoAltura ? (d) => d[campoAltura] ?? 0 : 1;
    return new HexagonLayer({
      id: ctx.id,
      data: ctx.filas,
      getPosition: posicion(ctx.coords),
      radius: radio,
      elevationScale: elevacion,
      getElevationWeight: peso,
      elevationAggregation: "SUM",
      getColorWeight: peso,
      colorAggregation: "SUM",
      extruded: true,
      coverage: 0.9,
      opacity: 0.6,
      gpuAggregation: false,
      pickable: true,
      autoHighlight: true,
      updateTriggers: { getElevationWeight: [campoAltura], getColorWeight: [campoAltura] },
    });
  },

  describir: (info, ctx) => describirCelda(info, ctx, ctx.ajustes.campoAltura),
};
