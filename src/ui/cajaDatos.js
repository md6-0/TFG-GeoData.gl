import { h, vaciarYPoner } from "./dom.js";
import { formatear } from "../capas/comun.js";
import { tipoDeCapa } from "../capas/registro.js";
import { aCss, COLOR_OTROS } from "../capas/colores.js";

/**
 * Caja «Datos»: cuántos elementos se representan, la leyenda de colores y la
 * información del elemento bajo el ratón.
 */
export function montarCajaDatos(contenedor, { estado }) {
  const recuento = h("p", { class: "recuento" });
  const detalle = h("div", { class: "detalle" });
  const leyendas = h("div", { class: "leyendas" });
  vaciarYPoner(contenedor, h("h2", {}, "Datos"), recuento, leyendas, detalle);

  let ultimo = null;

  const dibujarDetalle = () => {
    if (!ultimo) {
      vaciarYPoner(detalle, h("p", { class: "pista" }, "Pasa el ratón por encima de un elemento para ver sus datos."));
      return;
    }
    if (ultimo.lineas) {
      vaciarYPoner(detalle, h("dl", {}, ultimo.lineas.map(([k, v]) => [h("dt", {}, k), h("dd", {}, v)])));
      return;
    }
    const { columnas, coords, interfaz } = estado.get();
    const ocultos = new Set(interfaz.camposOcultos);
    const visibles = columnas.filter((c) => !ocultos.has(c.nombre) && c.nombre !== coords?.lat && c.nombre !== coords?.lon);
    const fila = ultimo.fila;
    vaciarYPoner(
      detalle,
      h(
        "dl",
        {},
        coords && fila[coords.lat] !== undefined && [h("dt", {}, "Coordenadas"), h("dd", {}, `${fila[coords.lat]}, ${fila[coords.lon]}`)],
        visibles.map((c) => [h("dt", {}, c.nombre), h("dd", {}, fila[c.nombre] === "" || fila[c.nombre] === null ? "—" : formatear(fila[c.nombre]))]),
      ),
    );
  };

  estado.observar(
    (e) => e.interfaz.camposOcultos,
    dibujarDetalle,
  );

  return {
    /** Recibe el resultado de describir() del tipo de capa, o null. */
    mostrar(descripcion) {
      if (!descripcion) return;
      ultimo = descripcion;
      dibujarDetalle();
    },

    actualizar({ filtradas, conCoordenadas, capas, escala }) {
      const total = estado.get().filas.length;
      const sinSitio = filtradas.length - conCoordenadas.length;
      recuento.textContent = [
        filtradas.length === total ? `${formatear(total)} elementos` : `${formatear(filtradas.length)} de ${formatear(total)} elementos`,
        sinSitio > 0 && capas.some((c) => tipoDeCapa(c.tipo).usaCoordenadas) ? ` · ${formatear(sinSitio)} sin coordenadas válidas` : "",
      ].join("");

      vaciarYPoner(
        leyendas,
        capas
          .filter((c) => c.ajustes.campoColor)
          .map((c) => leyenda(`${tipoDeCapa(c.tipo).nombre} · ${c.ajustes.campoColor}`, escala(c.ajustes.campoColor))),
      );
      ultimo = null;
      dibujarDetalle();
    },
  };
}

function leyenda(titulo, { categorias, otros }) {
  return h(
    "section",
    { class: "leyenda" },
    h("h3", {}, titulo),
    h(
      "ul",
      {},
      categorias.map((c) => elemento(c.color, c.valor, c.n)),
      otros > 0 && elemento(COLOR_OTROS, "Otros", otros),
    ),
  );
}

function elemento(color, texto, n) {
  return h("li", {}, h("span", { class: "muestra", style: { background: aCss(color) } }), h("span", { class: "leyenda-texto" }, texto), h("span", { class: "leyenda-n" }, formatear(n)));
}
