import { h, vaciarYPoner, selectorDeColumnas } from "./dom.js";
import { formatear } from "../capas/comun.js";

/**
 * Panel «Filtros». Los filtros se aplican al momento (antes había que pulsar
 * «Generar mapa»). El tipo de cada campo de entrada depende de la columna elegida
 * en ESE filtro: rango para números y «contiene» para texto.
 */
export function montarPanelFiltros(contenedor, { estado, acciones, filtradas }) {
  const lista = h("div", { class: "lista-tarjetas" });
  const recuento = h("p", { class: "recuento", role: "status" });
  vaciarYPoner(
    contenedor,
    lista,
    h(
      "div",
      { class: "panel-acciones" },
      recuento,
      h("button", { type: "button", class: "boton boton-principal", onclick: () => acciones.anadirFiltro() }, "Añadir filtro"),
      h("button", { type: "button", class: "boton boton-secundario", onclick: () => acciones.quitarFiltros() }, "Quitar todos"),
    ),
  );

  estado.observar(
    (e) => [e.columnas, e.filtros.map((f) => `${f.id}:${f.campo}`).join()],
    (_, e) => {
      vaciarYPoner(lista, e.filtros.length ? e.filtros.map((f) => tarjetaFiltro(f, e.columnas, acciones)) : h("p", { class: "vacio" }, "Sin filtros: se muestran todos los datos."));
    },
    { igual: (a, b) => a[0] === b[0] && a[1] === b[1] },
  );

  estado.observar(
    (e) => filtradas(e),
    (resultado, e) => {
      recuento.textContent =
        resultado.length === e.filas.length
          ? `${formatear(e.filas.length)} elementos`
          : `${formatear(resultado.length)} de ${formatear(e.filas.length)} elementos`;
    },
  );
}

function tarjetaFiltro(filtro, columnas, acciones) {
  const columna = columnas.find((c) => c.nombre === filtro.campo);
  const usables = columnas.filter((c) => c.tipo !== "vacia");
  const campo = selectorDeColumnas(usables, {
    valor: filtro.campo,
    vacio: "Elige un campo",
    "aria-label": "Campo a filtrar",
    onchange: (ev) => acciones.cambiarFiltro(filtro.id, { campo: ev.target.value, min: null, max: null, texto: "" }),
  });

  let valores = null;
  if (columna?.tipo === "numero") {
    const numero = (clave, etiqueta, ejemplo) =>
      h("input", {
        type: "number",
        step: "any",
        placeholder: `${etiqueta} (${formatear(ejemplo)})`,
        "aria-label": etiqueta,
        value: filtro[clave] ?? "",
        oninput: conEspera((ev) => acciones.cambiarFiltro(filtro.id, { [clave]: Number.isFinite(ev.target.valueAsNumber) ? ev.target.valueAsNumber : null })),
      });
    valores = h("div", { class: "rango" }, numero("min", "Mín.", columna.min), numero("max", "Máx.", columna.max));
  } else if (columna) {
    valores = h("input", {
      type: "search",
      placeholder: "Contiene…",
      "aria-label": "Texto que debe contener",
      value: filtro.texto ?? "",
      oninput: conEspera((ev) => acciones.cambiarFiltro(filtro.id, { texto: ev.target.value })),
    });
  }

  return h(
    "article",
    { class: "tarjeta-filtro" },
    h("header", {}, campo, h("button", { type: "button", class: "boton-icono", title: "Quitar filtro", "aria-label": "Quitar filtro", onclick: () => acciones.quitarFiltro(filtro.id) }, "✕")),
    valores,
  );
}

function conEspera(fn, ms = 250) {
  let t;
  return (ev) => {
    clearTimeout(t);
    t = setTimeout(() => fn(ev), ms);
  };
}
