import { Map as MapaBase, NavigationControl, setWorkerUrl } from "maplibre-gl";
import urlWorkerMapLibre from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { temaPorId, TEMA_POR_DEFECTO } from "./temas.js";

// MapLibre 6 carga su worker desde un archivo aparte; con Vite hay que decirle dónde queda tras el build.
setWorkerUrl(urlWorkerMapLibre);

/**
 * Mapa base (MapLibre) + capas de datos (deck.gl) encima.
 * Con el overlay no intercalado, cambiar de tema no borra las capas: ya no hace
 * falta volver a añadirlas en cada «styledata» como antes.
 */
export function crearMapa(contenedor, { alPasar } = {}) {
  const map = new MapaBase({
    container: contenedor,
    style: temaPorId(TEMA_POR_DEFECTO).estilo,
    center: [-3.7, 40.2],
    zoom: 4.6,
    attributionControl: { compact: true },
    maxPitch: 75,
  });

  const navegacion = new NavigationControl({ visualizePitch: true });
  map.addControl(navegacion, "bottom-right");

  const overlay = new MapboxOverlay({
    interleaved: false,
    layers: [],
    onHover: (info) => alPasar?.(info),
  });
  map.addControl(overlay);

  let temaActual = TEMA_POR_DEFECTO;

  return {
    map,

    setTema(id) {
      if (id === temaActual) return;
      temaActual = id;
      map.setStyle(temaPorId(id).estilo);
    },

    setCapas(layers) {
      overlay.setProps({ layers });
    },

    /** Encuadra los datos ignorando valores extremos (un 0,0 suelto no manda el mapa al Atlántico). */
    encuadrar(filas, coords, { pitch = 0 } = {}) {
      const caja = cajaRobusta(filas, coords);
      if (!caja) return;
      const tieneVolumen = caja[0][0] !== caja[1][0] || caja[0][1] !== caja[1][1];
      // Un solo movimiento de cámara: si después se inclinara aparte, cancelaría este.
      if (tieneVolumen) {
        const alto = map.getContainer().clientHeight;
        const abajo = Math.min(alto * 0.4, 360);
        map.fitBounds(caja, { padding: { top: 70, bottom: abajo, left: 50, right: 50 }, pitch, duration: 1800, maxZoom: 15 });
      } else {
        map.flyTo({ center: caja[0], zoom: 12, pitch, duration: 1800 });
      }
    },

    /** Encuadra una caja [[oeste, sur], [este, norte]] (resultado del buscador). */
    irACaja(caja) {
      map.fitBounds(caja, { padding: 40, duration: 1500, maxZoom: 16 });
    },

    /** Inclina el mapa para que se vean las capas en 3D. */
    inclinar(activar) {
      map.easeTo({ pitch: activar ? 45 : 0, duration: 1000 });
    },

    mostrarControles(visible) {
      if (visible && !map.hasControl(navegacion)) map.addControl(navegacion, "bottom-right");
      if (!visible && map.hasControl(navegacion)) map.removeControl(navegacion);
    },

    redimensionar() {
      map.resize();
    },
  };
}

function cajaRobusta(filas, { lat, lon }, recorte = 0.01) {
  if (filas.length === 0) return null;
  const lats = filas.map((f) => f[lat]).sort((a, b) => a - b);
  const lons = filas.map((f) => f[lon]).sort((a, b) => a - b);
  const i = Math.floor(filas.length * recorte);
  const j = Math.max(i, filas.length - 1 - i);
  return [
    [lons[i], lats[i]],
    [lons[j], lats[j]],
  ];
}
