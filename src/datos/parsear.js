import Papa from "papaparse";

/**
 * Convierte el texto de un archivo en una lista de filas (objetos planos).
 * Acepta CSV (con cabecera; separador , ; tabulador o |), JSON (lista de objetos,
 * un objeto con una lista dentro) y GeoJSON con puntos.
 *
 * Aquí no se decide el tipo de cada columna: todos los valores llegan como vienen
 * (texto en CSV). De eso se encarga columnas.js.
 *
 * @param {string} texto
 * @param {string} nombreArchivo
 * @returns {{ filas: object[], avisos: string[] }}
 */
export function parsearTexto(texto, nombreArchivo = "") {
  const limpio = texto.replace(/^\uFEFF/, "");
  const extension = nombreArchivo.split(".").pop().toLowerCase();

  if (extension === "csv" || extension === "tsv" || extension === "txt") {
    return parsearCSV(limpio);
  }
  if (extension === "json" || extension === "geojson") {
    return parsearJSON(limpio);
  }
  // Sin extensión conocida: probamos JSON y, si no, CSV.
  const inicio = limpio.trimStart()[0];
  return inicio === "[" || inicio === "{" ? parsearJSON(limpio) : parsearCSV(limpio);
}

export function parsearCSV(texto) {
  const avisos = [];
  let anonimas = 0;
  const resultado = Papa.parse(texto, {
    header: true,
    skipEmptyLines: "greedy",
    delimitersToGuess: [",", ";", "\t", "|"],
    transformHeader: (cabecera) => {
      const nombre = cabecera.trim();
      return nombre === "" ? `columna_${++anonimas}` : nombre;
    },
  });

  if (resultado.meta.fields === undefined || resultado.meta.fields.length < 2) {
    throw new ErrorDeLectura("El CSV no tiene cabecera o solo tiene una columna.");
  }
  const filasMal = resultado.errors.filter((e) => e.type === "FieldMismatch").length;
  if (filasMal > 0) {
    avisos.push(`${filasMal} filas tienen un número de columnas distinto al de la cabecera.`);
  }
  return { filas: resultado.data, avisos };
}

export function parsearJSON(texto) {
  let datos;
  try {
    datos = JSON.parse(texto);
  } catch (error) {
    throw new ErrorDeLectura(`El JSON no es válido: ${error.message}`);
  }

  if (esGeoJSON(datos)) {
    return deGeoJSON(datos);
  }

  let lista = datos;
  if (!Array.isArray(datos) && datos !== null && typeof datos === "object") {
    // Formatos tipo { "data": [ ... ] }: usamos la primera lista de objetos que haya.
    lista = Object.values(datos).find((v) => Array.isArray(v) && typeof v[0] === "object");
  }
  if (!Array.isArray(lista) || lista.length === 0) {
    throw new ErrorDeLectura("El JSON debe ser una lista de objetos: [ {…}, {…} ].");
  }

  const filas = lista.filter((item) => item !== null && typeof item === "object" && !Array.isArray(item)).map(aplanar);
  if (filas.length === 0) {
    throw new ErrorDeLectura("La lista del JSON no contiene objetos.");
  }
  const avisos = filas.length < lista.length ? [`Se han ignorado ${lista.length - filas.length} elementos que no eran objetos.`] : [];
  return { filas, avisos };
}

function esGeoJSON(datos) {
  return datos?.type === "FeatureCollection" && Array.isArray(datos.features);
}

function deGeoJSON(coleccion) {
  const filas = [];
  let ignorados = 0;
  for (const f of coleccion.features) {
    if (f?.geometry?.type !== "Point") {
      ignorados++;
      continue;
    }
    const [lon, lat] = f.geometry.coordinates;
    filas.push({ ...aplanar(f.properties ?? {}), latitud: lat, longitud: lon });
  }
  if (filas.length === 0) {
    throw new ErrorDeLectura("El GeoJSON no contiene puntos (solo se admiten geometrías Point).");
  }
  const avisos = ignorados > 0 ? [`Se han ignorado ${ignorados} geometrías que no son puntos.`] : [];
  return { filas, avisos };
}

/** Un nivel de objetos anidados se aplana ("dir": {"calle": …} → "dir.calle"); lo demás se pasa a texto. */
function aplanar(objeto) {
  const plano = {};
  for (const [clave, valor] of Object.entries(objeto)) {
    if (valor !== null && typeof valor === "object" && !Array.isArray(valor)) {
      for (const [sub, v] of Object.entries(valor)) {
        plano[`${clave}.${sub}`] = esPrimitivo(v) ? v : JSON.stringify(v);
      }
    } else {
      plano[clave] = esPrimitivo(valor) ? valor : JSON.stringify(valor);
    }
  }
  return plano;
}

function esPrimitivo(v) {
  return v === null || ["string", "number", "boolean"].includes(typeof v);
}

export class ErrorDeLectura extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = "ErrorDeLectura";
  }
}
