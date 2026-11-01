/** Archivos de ejemplo incluidos en public/datos (datos abiertos; fuentes en datos.html). */
export const EJEMPLOS = [
  {
    archivo: "vadosALC.csv",
    titulo: "Vados con licencia · Alicante 2019",
    capas: [{ tipo: "hexagonos", ajustes: { campoAltura: "PLAZAS" } }],
  },
  {
    archivo: "Veladores-geo-2019_5.csv",
    titulo: "Veladores con licencia · Alicante 2019",
    capas: [{ tipo: "puntos", ajustes: { campoColor: "DESCRIPCION", radio: 4 } }],
  },
  {
    archivo: "pisosTuristicosBarcelona.csv",
    titulo: "Viviendas de uso turístico · Barcelona 2018",
    capas: [{ tipo: "calor3d" }],
  },
  {
    archivo: "contenedores_Madrid.csv",
    titulo: "Contenedores de residuos · Madrid 2020",
    capas: [{ tipo: "puntos", ajustes: { campoColor: "Tipo_Contenedor", radio: 2 } }],
  },
  {
    archivo: "flujo_migratorio.csv",
    titulo: "Flujo de inmigrantes recibidos · España 2019",
    capas: [{ tipo: "arcos", ajustes: { campoColor: "Continente" } }],
  },
  {
    archivo: "casos_activos_zonas_basicas.csv",
    titulo: "Casos activos de COVID-19 · La Rioja, agosto 2020",
    capas: [{ tipo: "chinchetas" }],
  },
  {
    archivo: "limpiezaBCN.csv",
    titulo: "Puntos críticos de limpieza · Barcelona 2017",
    capas: [{ tipo: "calor" }],
  },
  {
    archivo: "meteoGalicia.json",
    titulo: "Estaciones meteorológicas · Galicia (JSON)",
    capas: [{ tipo: "chinchetas", ajustes: { campoColor: "provincia" } }],
  },
];

export function buscarEjemplo(archivo) {
  return EJEMPLOS.find((e) => e.archivo === archivo) ?? null;
}

export function urlEjemplo(archivo) {
  return `${import.meta.env.BASE_URL}datos/${encodeURIComponent(archivo)}`;
}
