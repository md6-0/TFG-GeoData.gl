import { COLOR_BASE } from "./colores.js";

/**
 * Piezas compartidas por los tipos de capa.
 *
 * Un tipo de capa es un objeto con esta forma:
 *   id, nombre, icono         identificación y botón del asistente
 *   opciones                  lista de ajustes; el panel de capas se genera a partir de ella
 *   usaCoordenadas            si necesita las columnas de latitud y longitud principales
 *   crear(ctx)                devuelve la capa de deck.gl (o null si faltan ajustes)
 *   describir(info, ctx)      qué mostrar en la caja de datos al pasar el ratón (opcional)
 *
 * Tipos de opción: "campo" (desplegable de columnas; `columnas: "numero"` para
 * limitar a las numéricas) y "numero" (con min, max, paso).
 */

export const opcionColor = {
  clave: "campoColor",
  etiqueta: "Colorear por campo",
  tipo: "campo",
  columnas: "todas",
  usaEscala: true,
};

export function posicion(coords) {
  return (d) => [d[coords.lon], d[coords.lat]];
}

/** Accesor de color: por categoría si hay campo, si no el color de siempre. */
export function color(ctx, alfa = 220) {
  const campo = ctx.ajustes.campoColor;
  if (!campo) return [...COLOR_BASE, alfa];
  const escala = ctx.escala(campo);
  return (d) => [...escala.colorDe(d[campo]), alfa];
}

/** Valores por defecto de las opciones numéricas de un tipo. */
export function ajustesPorDefecto(tipo) {
  const ajustes = {};
  for (const opcion of tipo.opciones) {
    if (opcion.defecto !== undefined) ajustes[opcion.clave] = opcion.defecto;
  }
  return ajustes;
}

/** Opciones obligatorias que faltan por rellenar. */
export function opcionesQueFaltan(tipo, ajustes) {
  return tipo.opciones.filter((o) => o.requerida && (ajustes[o.clave] === undefined || ajustes[o.clave] === ""));
}

export function describirFila(info) {
  return info.object ? { fila: info.object } : null;
}

/**
 * Para capas que agregan puntos en celdas (hexágonos, cuadrícula). El centro se
 * calcula con los puntos de la celda: la posición que da deck.gl 9 en modo CPU
 * no tiene en cuenta el origen de la rejilla y sale desplazada.
 */
export function describirCelda(info, ctx, campoSuma) {
  const celda = info.object;
  if (!celda) return null;
  const puntos = Array.isArray(celda.points) ? celda.points : [];
  const lineas = [["Elementos en esta zona", formatear(celda.count)]];
  if (puntos.length) {
    const { lat, lon } = ctx.coords;
    const media = (campo) => puntos.reduce((s, p) => s + p[campo], 0) / puntos.length;
    lineas.unshift(["Centro aprox.", `${media(lat).toFixed(4)}, ${media(lon).toFixed(4)}`]);
  }
  if (campoSuma && puntos.length) {
    const suma = puntos.reduce((s, p) => s + (p[campoSuma] ?? 0), 0);
    lineas.push([`Total de ${campoSuma}`, formatear(suma)]);
  }
  return { lineas };
}

const formato = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 });
export function formatear(n) {
  return typeof n === "number" ? formato.format(n) : String(n ?? "");
}
