import { h, vaciarYPoner, recurso, selectorDeColumnas } from "./dom.js";
import { TIPOS } from "../capas/registro.js";
import { TEMAS } from "../mapa/temas.js";
import { EJEMPLOS } from "../datos/ejemplos.js";
import { formatear } from "../capas/comun.js";

/**
 * Asistente de tres pasos: archivo → representaciones → tema.
 * Se dibuja entero a partir del estado cada vez que cambia algo relevante
 * (antes cada paso se mostraba u ocultaba según la clase CSS «0», «1», «-2»…).
 */
export function montarAsistente(contenedor, { estado, acciones, abrirArchivo, abrirEjemplo }) {
  const pasos = [pasoArchivo, pasoCapas, pasoTema];

  const dibujar = () => {
    const e = estado.get();
    const paso = pasos[e.paso](e, { acciones, abrirArchivo, abrirEjemplo });
    vaciarYPoner(contenedor, paso);
    contenedor.querySelector("[data-foco]")?.focus();
  };

  estado.observar(
    (e) => [e.fase, e.paso, e.archivo, e.coords?.lat, e.coords?.lon, e.capas.map((c) => c.tipo).join(), e.tema].join("|"),
    (_, e) => {
      contenedor.hidden = e.fase !== "asistente";
      if (!contenedor.hidden) dibujar();
    },
  );
}

function cabecera(numero, ordinal, titulo) {
  return h(
    "header",
    { class: "paso-cabecera" },
    h("p", { class: "paso-numero", "aria-hidden": "true" }, `0${numero}/03`),
    h("p", { class: "paso-ordinal" }, `——— ${ordinal} PASO`),
    h("h2", { class: "paso-titulo" }, titulo),
  );
}

function botones(...hijos) {
  return h("div", { class: "paso-botones" }, hijos);
}

function boton(texto, onclick, { principal = true, disabled = false, title } = {}) {
  return h("button", { type: "button", class: ["boton", principal ? "boton-principal" : "boton-secundario"], onclick, disabled, title }, texto);
}

// --- Paso 1: archivo --------------------------------------------------------

function pasoArchivo(e, { acciones, abrirArchivo, abrirEjemplo }) {
  const input = h("input", {
    type: "file",
    id: "inputArchivo",
    class: "visualmente-oculto",
    accept: ".csv,.json,.geojson,.tsv,.txt",
    onchange: (ev) => ev.target.files[0] && abrirArchivo(ev.target.files[0]),
  });

  const zona = h(
    "label",
    { for: "inputArchivo", class: "zona-archivo", "data-foco": e.archivo ? undefined : "" , tabindex: "0",
      onkeydown: (ev) => (ev.key === "Enter" || ev.key === " ") && (ev.preventDefault(), input.click()) },
    h("img", { src: recurso("assets/icons/icons8-subir-80.png"), alt: "" }),
    h("span", {}, e.archivo ? "Cambiar de archivo" : "Selecciona o arrastra un archivo"),
    h("small", {}, "CSV, JSON o GeoJSON. El archivo no sale de tu ordenador."),
  );
  for (const tipo of ["dragenter", "dragover"]) {
    zona.addEventListener(tipo, (ev) => {
      ev.preventDefault();
      zona.classList.add("zona-archivo-encima");
    });
  }
  zona.addEventListener("dragleave", () => zona.classList.remove("zona-archivo-encima"));
  zona.addEventListener("drop", (ev) => {
    ev.preventDefault();
    zona.classList.remove("zona-archivo-encima");
    const archivo = ev.dataTransfer.files[0];
    if (archivo) abrirArchivo(archivo);
  });

  const ejemplos = h(
    "div",
    { class: "ejemplos" },
    h("p", {}, "¿No tienes datos a mano? Prueba con un ejemplo:"),
    h(
      "ul",
      {},
      EJEMPLOS.map((ej) =>
        h("li", {}, h("button", { type: "button", class: ["chip", e.archivo === ej.archivo && "chip-activo"], onclick: () => abrirEjemplo(ej) }, ej.titulo)),
      ),
    ),
  );

  return h(
    "div",
    { class: "paso" },
    cabecera(1, "PRIMER", "Selecciona el archivo de datos"),
    h("div", { class: "paso-cuerpo" }, input, e.archivo ? resumenArchivo(e, acciones) : null, zona, ejemplos),
    botones(
      h("a", { class: "boton boton-secundario", href: "./datos.html" }, "¿Cómo debe ser el archivo?"),
      boton("Siguiente paso", () => acciones.irAPaso(1), { disabled: !e.archivo, title: e.archivo ? undefined : "Primero elige un archivo" }),
    ),
  );
}

function resumenArchivo(e, acciones) {
  const numericas = e.columnas.filter((c) => c.tipo === "numero");
  const lat = selectorDeColumnas(numericas, { valor: e.coords?.lat, id: "selLat", onchange: (ev) => acciones.elegirCoordenadas(ev.target.value, lon.value) });
  const lon = selectorDeColumnas(numericas, { valor: e.coords?.lon, id: "selLon", onchange: (ev) => acciones.elegirCoordenadas(lat.value, ev.target.value) });

  return h(
    "div",
    { class: ["resumen-archivo", !e.coords && "resumen-atencion"] },
    h("p", { class: "resumen-nombre" }, h("strong", {}, e.archivo), ` · ${formatear(e.filas.length)} filas · ${e.columnas.length} columnas`),
    h(
      "p",
      {},
      e.coords
        ? "Coordenadas encontradas. Puedes cambiarlas si no son estas:"
        : "No he encontrado las columnas de latitud y longitud. Elígelas (si solo vas a usar arcos, puedes saltarte esto):",
    ),
    h("div", { class: "resumen-coords" }, h("label", { for: "selLat" }, "Latitud"), lat, h("label", { for: "selLon" }, "Longitud"), lon),
  );
}

// --- Paso 2: representaciones -----------------------------------------------

function pasoCapas(e, { acciones }) {
  const activos = new Set(e.capas.map((c) => c.tipo));
  const tarjetas = TIPOS.map((tipo) => {
    const sinCoords = tipo.usaCoordenadas && !e.coords;
    return h(
      "button",
      {
        type: "button",
        class: ["tarjeta", activos.has(tipo.id) && "tarjeta-activa"],
        "aria-pressed": String(activos.has(tipo.id)),
        disabled: sinCoords,
        title: sinCoords ? "Necesita las columnas de latitud y longitud (paso 1)" : undefined,
        onclick: () => acciones.alternarTipo(tipo.id),
      },
      h("img", { src: recurso(tipo.icono), alt: "" }),
      h("span", {}, tipo.nombre),
    );
  });

  return h(
    "div",
    { class: "paso" },
    cabecera(2, "SEGUNDO", "Elige una o varias representaciones"),
    h(
      "div",
      { class: "paso-cuerpo" },
      h("p", { class: "paso-ayuda" }, "Podrás añadir, quitar, combinar y ajustar capas después."),
      h("div", { class: "rejilla-tarjetas" }, tarjetas),
    ),
    botones(
      boton("Paso anterior", () => acciones.irAPaso(0), { principal: false }),
      boton("Siguiente paso", () => acciones.irAPaso(2), { disabled: activos.size === 0, title: activos.size ? undefined : "Elige al menos una" }),
    ),
  );
}

// --- Paso 3: tema --------------------------------------------------------------

function pasoTema(e, { acciones }) {
  const tarjetas = TEMAS.map((tema) =>
    h(
      "button",
      {
        type: "button",
        class: ["tarjeta", e.tema === tema.id && "tarjeta-activa"],
        "aria-pressed": String(e.tema === tema.id),
        onclick: () => acciones.elegirTema(tema.id),
      },
      h("img", { src: recurso(tema.icono), alt: "" }),
      h("span", {}, tema.nombre),
    ),
  );

  return h(
    "div",
    { class: "paso" },
    cabecera(3, "TERCER", "Elige el tema del mapa"),
    h(
      "div",
      { class: "paso-cuerpo" },
      h("p", { class: "paso-ayuda" }, "El mapa de fondo cambia al momento. Podrás cambiarlo más adelante."),
      h("div", { class: "rejilla-tarjetas" }, tarjetas),
    ),
    botones(
      boton("Paso anterior", () => acciones.irAPaso(1), { principal: false }),
      h("button", { type: "button", class: "boton boton-principal", "data-foco": "", onclick: () => acciones.terminarAsistente() }, "Ver el mapa"),
    ),
  );
}
