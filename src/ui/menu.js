import { h, vaciarYPoner } from "./dom.js";

/**
 * Menú inferior con pestañas. Tres alturas: minimizado (solo pestañas),
 * normal y ampliado. Las pestañas son botones de verdad con roles ARIA.
 */
export function montarMenu(contenedor, { pestanas, alVolver, alCambiarAltura }) {
  const ALTURAS = ["minimizado", "normal", "ampliado"];
  let altura = 1;
  let activa = 0;

  const paneles = pestanas.map((p, i) =>
    h("div", { class: "panel", id: `panel-${p.id}`, role: "tabpanel", "aria-labelledby": `tab-${p.id}`, hidden: i !== activa }),
  );
  const botones = pestanas.map((p, i) =>
    h(
      "button",
      { type: "button", role: "tab", id: `tab-${p.id}`, "aria-controls": `panel-${p.id}`, "aria-selected": String(i === activa), onclick: () => elegir(i) },
      p.nombre,
    ),
  );

  const cambiarAltura = (delta) => {
    altura = Math.max(0, Math.min(ALTURAS.length - 1, altura + delta));
    contenedor.dataset.altura = ALTURAS[altura];
    alCambiarAltura?.(ALTURAS[altura]);
  };

  function elegir(i) {
    activa = i;
    paneles.forEach((p, j) => (p.hidden = j !== i));
    botones.forEach((b, j) => b.setAttribute("aria-selected", String(j === i)));
    if (altura === 0) cambiarAltura(1);
  }

  vaciarYPoner(
    contenedor,
    h(
      "header",
      { class: "menu-cabecera" },
      h("div", { role: "tablist", class: "pestanas" }, botones),
      h(
        "div",
        { class: "menu-controles" },
        h("button", { type: "button", class: "boton boton-secundario boton-pequeno", onclick: alVolver }, "Otro archivo"),
        h("button", { type: "button", class: "boton-icono", title: "Reducir", "aria-label": "Reducir el menú", onclick: () => cambiarAltura(-1) }, "▾"),
        h("button", { type: "button", class: "boton-icono", title: "Ampliar", "aria-label": "Ampliar el menú", onclick: () => cambiarAltura(1) }, "▴"),
      ),
    ),
    h("div", { class: "menu-cuerpo" }, paneles),
  );
  contenedor.dataset.altura = ALTURAS[altura];

  return Object.fromEntries(pestanas.map((p, i) => [p.id, paneles[i]]));
}
