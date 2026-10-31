import { h } from "./dom.js";

/**
 * Avisos breves arriba de la pantalla (sustituye a Toastify, que se cargaba de
 * un CDN sin versión). Se muestra uno cada vez: el nuevo reemplaza al anterior.
 *
 * tipo: "info" | "ok" | "atencion" | "error"
 * duracion: milisegundos; 0 = hasta que se cierre o llegue otro
 */
let actual = null;
let temporizador = null;
let zona = null;

export function aviso(texto, tipo = "info", { duracion = 5000 } = {}) {
  zona ??= document.body.appendChild(h("div", { class: "avisos", role: "status", "aria-live": "polite" }));
  cerrarAviso();
  const lineas = Array.isArray(texto) ? texto : [texto];
  actual = h(
    "div",
    { class: ["aviso", `aviso-${tipo}`], onclick: cerrarAviso, title: "Cerrar" },
    lineas.map((l) => h("p", {}, l)),
  );
  zona.append(actual);
  if (duracion > 0) temporizador = setTimeout(cerrarAviso, duracion);
}

export function cerrarAviso() {
  clearTimeout(temporizador);
  actual?.remove();
  actual = null;
}
