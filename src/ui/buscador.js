import { h, vaciarYPoner } from "./dom.js";

/**
 * Buscador de lugares con Nominatim (OpenStreetMap). Sustituye al geocoder de
 * Mapbox. Su política de uso no permite autocompletar mientras se escribe, así
 * que se busca al pulsar Intro.
 */
const NOMINATIM = "https://nominatim.openstreetmap.org/search";

export function montarBuscador(contenedor, { alElegir }) {
  const entrada = h("input", { type: "search", placeholder: "Buscar ciudad o región…", "aria-label": "Buscar un lugar", autocomplete: "off" });
  const resultados = h("ul", { class: "buscador-resultados", hidden: true });

  const formulario = h(
    "form",
    {
      class: "buscador",
      role: "search",
      onsubmit: async (ev) => {
        ev.preventDefault();
        const q = entrada.value.trim();
        if (q.length < 2) return;
        vaciarYPoner(resultados, h("li", { class: "pista" }, "Buscando…"));
        resultados.hidden = false;
        try {
          mostrar(await buscar(q));
        } catch {
          vaciarYPoner(resultados, h("li", { class: "pista" }, "No se ha podido buscar. Revisa la conexión."));
        }
      },
    },
    entrada,
    h("button", { type: "submit", class: "boton-icono", "aria-label": "Buscar" }, "⌕"),
    resultados,
  );

  function mostrar(lugares) {
    if (lugares.length === 0) {
      vaciarYPoner(resultados, h("li", { class: "pista" }, "Sin resultados."));
      return;
    }
    vaciarYPoner(
      resultados,
      lugares.map((l) =>
        h(
          "li",
          {},
          h(
            "button",
            {
              type: "button",
              onclick: () => {
                resultados.hidden = true;
                entrada.value = l.name || l.display_name.split(",")[0];
                const [sur, norte, oeste, este] = l.boundingbox.map(Number);
                alElegir([
                  [oeste, sur],
                  [este, norte],
                ]);
              },
            },
            l.display_name,
          ),
        ),
      ),
    );
  }

  entrada.addEventListener("keydown", (ev) => ev.key === "Escape" && (resultados.hidden = true));
  vaciarYPoner(contenedor, formulario);
}

async function buscar(q) {
  const url = new URL(NOMINATIM);
  url.search = new URLSearchParams({ q, format: "jsonv2", limit: "5", "accept-language": "es" });
  const respuesta = await fetch(url);
  if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
  return respuesta.json();
}
