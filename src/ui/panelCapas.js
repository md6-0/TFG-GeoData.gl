import { h, vaciarYPoner, selectorDeColumnas, recurso } from "./dom.js";
import { TIPOS, tipoDeCapa } from "../capas/registro.js";
import { opcionesQueFaltan } from "../capas/comun.js";

/**
 * Panel «Capas». Cada tarjeta se genera a partir de las `opciones` de su tipo:
 * nada de `children[13]` ni de seis cajas copiadas en el HTML.
 *
 * Solo se redibuja cuando cambia la estructura (qué capas hay y de qué tipo, o
 * las columnas). Al cambiar un ajuste se actualiza el estado sin redibujar, para
 * no perder el foco del campo que se está editando.
 */
export function montarPanelCapas(contenedor, { estado, acciones }) {
  const lista = h("div", { class: "lista-tarjetas" });
  const anadir = h("button", { type: "button", class: "boton boton-principal", onclick: () => acciones.anadirCapa(primerTipoDisponible(estado.get())) }, "Añadir capa");
  vaciarYPoner(contenedor, lista, h("div", { class: "panel-acciones" }, anadir));

  estado.observar(
    (e) => [e.columnas, e.coords, e.capas.map((c) => `${c.id}:${c.tipo}`).join()],
    (_, e) => {
      vaciarYPoner(lista, e.capas.length ? e.capas.map((capa) => tarjetaCapa(capa, e, acciones)) : h("p", { class: "vacio" }, "No hay capas. Añade una para ver los datos."));
    },
    { igual: (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2] },
  );
}

function primerTipoDisponible(e) {
  return (e.coords ? TIPOS[0] : TIPOS.find((t) => !t.usaCoordenadas)).id;
}

function tarjetaCapa(capa, e, acciones) {
  const tipo = tipoDeCapa(capa.tipo);
  const ajustes = { ...capa.ajustes };
  const aviso = h("p", { class: "tarjeta-aviso", role: "status" });
  const actualizarAviso = () => {
    const faltan = opcionesQueFaltan(tipo, ajustes);
    aviso.textContent = faltan.length ? `Falta: ${faltan.map((o) => o.etiqueta.toLowerCase()).join(", ")}` : "";
    aviso.hidden = faltan.length === 0;
  };
  const cambiar = (clave, valor) => {
    ajustes[clave] = valor;
    actualizarAviso();
    acciones.cambiarAjuste(capa.id, clave, valor);
  };
  actualizarAviso();

  const selectorTipo = h(
    "select",
    { class: "selector-tipo", "aria-label": "Tipo de representación", onchange: (ev) => acciones.cambiarTipo(capa.id, ev.target.value) },
    TIPOS.map((t) => h("option", { value: t.id, selected: t.id === capa.tipo, disabled: t.usaCoordenadas && !e.coords }, t.nombre)),
  );

  return h(
    "article",
    { class: "tarjeta-capa" },
    h(
      "header",
      {},
      h("img", { src: recurso(tipo.icono), alt: "" }),
      selectorTipo,
      h("button", { type: "button", class: "boton-icono", title: "Quitar capa", "aria-label": "Quitar capa", onclick: () => acciones.quitarCapa(capa.id) }, "✕"),
    ),
    tipo.opciones.map((opcion) => campoDeOpcion(opcion, ajustes[opcion.clave], e.columnas, (v) => cambiar(opcion.clave, v))),
    aviso,
  );
}

let secuencia = 0;

function campoDeOpcion(opcion, valor, columnas, alCambiar) {
  const id = `opcion-${++secuencia}`;
  let control;
  if (opcion.tipo === "campo") {
    const disponibles = opcion.columnas === "numero" ? columnas.filter((c) => c.tipo === "numero") : columnas.filter((c) => c.tipo !== "vacia");
    control = selectorDeColumnas(disponibles, { id, valor, vacio: opcion.requerida ? "Elige un campo" : "—", onchange: (ev) => alCambiar(ev.target.value) });
  } else {
    let espera;
    control = h("input", {
      id,
      type: "number",
      value: valor ?? opcion.defecto,
      min: opcion.min,
      max: opcion.max,
      step: opcion.paso,
      oninput: (ev) => {
        clearTimeout(espera);
        const n = ev.target.valueAsNumber;
        if (!Number.isFinite(n)) return;
        const limitado = Math.min(opcion.max, Math.max(opcion.min, n));
        espera = setTimeout(() => alCambiar(limitado), 200);
      },
    });
  }
  return h("div", { class: "campo" }, h("label", { for: id }, opcion.etiqueta, opcion.requerida ? " *" : ""), control);
}
