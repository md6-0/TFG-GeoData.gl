import { ArcLayer } from "@deck.gl/layers";
import { opcionColor, color, describirFila } from "./comun.js";

const valido = (lat, lon) => lat !== null && lon !== null && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;

export default {
  id: "arcos",
  nombre: "Arcos",
  icono: "assets/icons/arcos.svg",
  // Usa sus propias columnas de origen y destino, no la latitud/longitud principal.
  usaCoordenadas: false,
  opciones: [
    { clave: "latOrigen", etiqueta: "Latitud de origen", tipo: "campo", columnas: "numero", requerida: true },
    { clave: "lonOrigen", etiqueta: "Longitud de origen", tipo: "campo", columnas: "numero", requerida: true },
    { clave: "latDestino", etiqueta: "Latitud de destino", tipo: "campo", columnas: "numero", requerida: true },
    { clave: "lonDestino", etiqueta: "Longitud de destino", tipo: "campo", columnas: "numero", requerida: true },
    opcionColor,
    { clave: "ancho", etiqueta: "Grosor (px)", tipo: "numero", min: 1, max: 20, paso: 1, defecto: 3 },
  ],

  crear(ctx) {
    const { latOrigen, lonOrigen, latDestino, lonDestino, campoColor, ancho } = ctx.ajustes;
    if (!latOrigen || !lonOrigen || !latDestino || !lonDestino) return null;
    const filas = ctx.todas.filter((d) => valido(d[latOrigen], d[lonOrigen]) && valido(d[latDestino], d[lonDestino]));
    const getColor = color(ctx, 230);
    return new ArcLayer({
      id: ctx.id,
      data: filas,
      getSourcePosition: (d) => [d[lonOrigen], d[latOrigen]],
      getTargetPosition: (d) => [d[lonDestino], d[latDestino]],
      getSourceColor: getColor,
      getTargetColor: getColor,
      getWidth: ancho,
      widthUnits: "pixels",
      pickable: true,
      autoHighlight: true,
      updateTriggers: { getSourceColor: [campoColor], getTargetColor: [campoColor] },
    });
  },

  describir: describirFila,
};
