import { h, vaciarYPoner, recurso } from "./dom.js";
import { TEMAS } from "../mapa/temas.js";

/** Panel «Mapa»: tema de fondo e inclinación para ver las capas en 3D. */
export function montarPanelMapa(contenedor, { estado, acciones, mapa }) {
  const temas = h("div", { class: "temas" });
  const inclinar = h("input", { type: "checkbox", onchange: (ev) => mapa.inclinar(ev.target.checked) });
  vaciarYPoner(
    contenedor,
    temas,
    h("label", { class: "interruptor" }, inclinar, h("span", {}, "Inclinar el mapa (vista 3D)")),
  );

  mapa.map.on("pitchend", () => {
    inclinar.checked = mapa.map.getPitch() > 5;
  });

  estado.observar(
    (e) => e.tema,
    (actual) => {
      vaciarYPoner(
        temas,
        TEMAS.map((t) =>
          h(
            "button",
            { type: "button", class: ["tema", t.id === actual && "tema-activo"], "aria-pressed": String(t.id === actual), onclick: () => acciones.elegirTema(t.id) },
            h("img", { src: recurso(t.miniatura), alt: "" }),
            h("span", {}, t.nombre),
          ),
        ),
      );
    },
  );
}
