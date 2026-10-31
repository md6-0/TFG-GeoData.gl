import { h, vaciarYPoner } from "./dom.js";

/** Panel «Interfaz»: qué se ve en pantalla y qué campos salen en la caja de datos. */
export function montarPanelInterfaz(contenedor, { estado, acciones }) {
  const interruptor = (clave, texto) =>
    h(
      "label",
      { class: "interruptor" },
      h("input", { type: "checkbox", checked: estado.get().interfaz[clave], onchange: (ev) => acciones.cambiarInterfaz({ [clave]: ev.target.checked }) }),
      h("span", {}, texto),
    );

  const campos = h("div", { class: "chips" });
  vaciarYPoner(
    contenedor,
    h("div", { class: "interruptores" }, interruptor("info", "Caja de datos"), interruptor("controles", "Controles de zoom"), interruptor("busqueda", "Buscador de lugares")),
    h("p", { class: "panel-ayuda" }, "Campos que se muestran en la caja de datos al pasar el ratón:"),
    campos,
  );

  estado.observar(
    (e) => [e.columnas, e.interfaz.camposOcultos],
    ([columnas, ocultos]) => {
      const fuera = new Set(ocultos);
      vaciarYPoner(
        campos,
        columnas.map((c) =>
          h(
            "button",
            {
              type: "button",
              class: ["chip", !fuera.has(c.nombre) && "chip-activo"],
              "aria-pressed": String(!fuera.has(c.nombre)),
              onclick: () => acciones.alternarCampoInfo(c.nombre),
            },
            c.nombre,
          ),
        ),
      );
    },
    { igual: (a, b) => a[0] === b[0] && a[1] === b[1] },
  );
}
