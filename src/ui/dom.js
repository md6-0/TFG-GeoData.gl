/**
 * h("button", { class: "boton", onclick: fn }, "Texto", otroNodo)
 *
 * Crea nodos del DOM sin pasar por innerHTML: los nombres de columnas y los
 * valores del archivo se insertan siempre como texto, nunca como HTML.
 */
export function h(etiqueta, atributos = {}, ...hijos) {
  const el = document.createElement(etiqueta);
  for (const [clave, valor] of Object.entries(atributos ?? {})) {
    if (valor === undefined || valor === null || valor === false) continue;
    if (clave.startsWith("on") && typeof valor === "function") {
      el.addEventListener(clave.slice(2), valor);
    } else if (clave === "class") {
      el.className = Array.isArray(valor) ? valor.filter(Boolean).join(" ") : valor;
    } else if (clave === "dataset") {
      Object.assign(el.dataset, valor);
    } else if (clave === "style" && typeof valor === "object") {
      Object.assign(el.style, valor);
    } else if (clave in el && typeof valor !== "string") {
      el[clave] = valor; // value, checked, disabled… como propiedades
    } else {
      el.setAttribute(clave, valor === true ? "" : String(valor));
    }
  }
  anadir(el, hijos);
  return el;
}

function anadir(el, hijos) {
  for (const hijo of hijos.flat(Infinity)) {
    if (hijo === null || hijo === undefined || hijo === false) continue;
    el.append(hijo instanceof Node ? hijo : document.createTextNode(String(hijo)));
  }
}

/** Sustituye el contenido de un nodo. */
export function vaciarYPoner(el, ...hijos) {
  el.replaceChildren();
  anadir(el, hijos);
}

/** Ruta a un recurso de public/ que funciona igual en local que en GitHub Pages. */
export function recurso(ruta) {
  return `${import.meta.env.BASE_URL}${ruta}`;
}

/** Desplegable de columnas. `vacio` añade una primera opción en blanco. */
export function selectorDeColumnas(columnas, { valor = "", vacio = "—", ...atributos } = {}) {
  return h(
    "select",
    atributos,
    vacio !== null && h("option", { value: "" }, vacio),
    columnas.map((c) => h("option", { value: c.nombre, selected: c.nombre === valor }, c.nombre)),
  );
}
