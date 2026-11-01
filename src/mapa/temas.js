/**
 * Temas del mapa. Antes eran estilos de una cuenta de Mapbox (con token);
 * ahora son mapas libres que no necesitan clave:
 *  - OpenFreeMap (vectorial, datos de OpenStreetMap)
 *  - Esri World Imagery (satélite) y OpenTopoMap (relieve), como teselas raster.
 * `logo` es el color del logotipo para que se lea sobre cada fondo.
 */

const raster = (id, teselas, atribucion, maxzoom = 19) => ({
  version: 8,
  sources: { [id]: { type: "raster", tiles: teselas, tileSize: 256, attribution: atribucion, maxzoom } },
  layers: [{ id, type: "raster", source: id }],
});

export const TEMAS = [
  {
    id: "satelite",
    icono: "assets/icons/satelite-min.svg",
    nombre: "Satélite",
    miniatura: "assets/imgs/satelite-min.png",
    logo: "claro",
    estilo: raster(
      "satelite",
      ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
      "Imágenes © Esri, Maxar, Earthstar Geographics y la comunidad de usuarios SIG",
    ),
  },
  {
    id: "estandar",
    icono: "assets/icons/estandar-min.svg",
    nombre: "Estándar",
    miniatura: "assets/imgs/estandar-min.png",
    logo: "oscuro",
    estilo: "https://tiles.openfreemap.org/styles/liberty",
  },
  {
    id: "relieve",
    icono: "assets/icons/elevacion-min.svg",
    nombre: "Relieve",
    miniatura: "assets/imgs/elevacion-min.png",
    logo: "oscuro",
    estilo: raster(
      "relieve",
      ["a", "b", "c"].map((s) => `https://${s}.tile.opentopomap.org/{z}/{x}/{y}.png`),
      'Datos © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, SRTM · Estilo © <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
      17,
    ),
  },
  {
    id: "claro",
    icono: "assets/icons/claro-min.svg",
    nombre: "Día",
    miniatura: "assets/imgs/claro-min.png",
    logo: "oscuro",
    estilo: "https://tiles.openfreemap.org/styles/positron",
  },
  {
    id: "noche",
    icono: "assets/icons/oscuro-min.svg",
    nombre: "Noche",
    miniatura: "assets/imgs/oscuro-min.png",
    logo: "claro",
    estilo: "https://tiles.openfreemap.org/styles/dark",
  },
  {
    id: "oscuro",
    icono: "assets/icons/geodata-min.svg",
    nombre: "Oscuro",
    miniatura: "assets/imgs/geodata-min.png",
    logo: "claro",
    estilo: "https://tiles.openfreemap.org/styles/fiord",
  },
];

export const TEMA_POR_DEFECTO = "oscuro";

export function temaPorId(id) {
  return TEMAS.find((t) => t.id === id) ?? TEMAS.find((t) => t.id === TEMA_POR_DEFECTO);
}
