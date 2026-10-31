/**
 * Todo lo que sabemos de las columnas de un archivo: su tipo, sus valores y
 * cuáles son la latitud y la longitud.
 */

/** @typedef {{ nombre: string, tipo: "numero" | "texto" | "vacia", min?: number, max?: number }} Columna */

const MUESTRA = 1000;
const UMBRAL_NUMERICO = 0.95;

const NOMBRES_LAT = ["lat", "lati", "latitude", "latitud", "y", "latitud_y", "lat_y", "lat-x", "lat_x", "coord_y"];
const NOMBRES_LON = ["lon", "lng", "long", "longitude", "longitud", "x", "longitud_x", "lon_x", "lon-y", "lon_y", "lng_x", "coord_x"];

/** "  LATITUD_Y " → "latitud_y"; quita también tildes. */
export function normalizarNombre(nombre) {
  return String(nombre).trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * Convierte un valor a número si lo parece. Admite coma decimal ("441062,99")
 * cuando no hay también un punto, para no confundirla con separadores de miles.
 * @returns {number | null}
 */
export function aNumero(valor) {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : null;
  if (typeof valor !== "string") return null;
  let texto = valor.trim();
  if (texto === "") return null;
  if (texto.includes(",") && !texto.includes(".")) texto = texto.replace(",", ".");
  if (!/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(texto)) return null;
  const n = Number(texto);
  return Number.isFinite(n) ? n : null;
}

function estaVacio(v) {
  return v === null || v === undefined || (typeof v === "string" && v.trim() === "");
}

/**
 * Decide el tipo de cada columna mirando una muestra repartida por todo el
 * archivo (no solo la primera fila: si esa tiene un hueco, la columna no se pierde).
 * @param {object[]} filas
 * @returns {Columna[]}
 */
export function analizarColumnas(filas) {
  const nombres = [];
  const vistos = new Set();
  for (const fila of filas.slice(0, 50)) {
    for (const clave of Object.keys(fila)) {
      if (!vistos.has(clave)) {
        vistos.add(clave);
        nombres.push(clave);
      }
    }
  }

  const paso = Math.max(1, Math.floor(filas.length / MUESTRA));
  return nombres.map((nombre) => {
    let llenos = 0;
    let numericos = 0;
    for (let i = 0; i < filas.length; i += paso) {
      const v = filas[i][nombre];
      if (estaVacio(v)) continue;
      llenos++;
      if (aNumero(v) !== null) numericos++;
    }
    if (llenos === 0) return { nombre, tipo: "vacia" };
    return { nombre, tipo: numericos / llenos >= UMBRAL_NUMERICO ? "numero" : "texto" };
  });
}

/**
 * Deja las filas listas para pintar: números de verdad en las columnas numéricas
 * (null si el valor no lo es) y texto en las demás. Calcula de paso el mínimo y
 * el máximo de cada columna numérica.
 */
export function normalizarFilas(filas, columnas) {
  const numericas = columnas.filter((c) => c.tipo === "numero");
  const textos = columnas.filter((c) => c.tipo !== "numero");
  for (const c of numericas) {
    c.min = Infinity;
    c.max = -Infinity;
  }
  const resultado = filas.map((fila) => {
    const nueva = {};
    for (const c of numericas) {
      const n = aNumero(fila[c.nombre]);
      nueva[c.nombre] = n;
      if (n !== null) {
        if (n < c.min) c.min = n;
        if (n > c.max) c.max = n;
      }
    }
    for (const c of textos) {
      const v = fila[c.nombre];
      nueva[c.nombre] = estaVacio(v) ? "" : String(v).trim();
    }
    return nueva;
  });
  return resultado;
}

function enRango(columna, limite) {
  return columna.tipo === "numero" && columna.min >= -limite && columna.max <= limite;
}

/**
 * Busca las columnas de latitud y longitud: primero por nombre exacto (lista de
 * la página «Datos»), luego por nombres que contengan «lat» / «lon». En ambos
 * casos los valores tienen que estar en rango.
 * @param {Columna[]} columnas (ya con min/max)
 * @returns {{ lat: string, lon: string } | null}
 */
export function detectarCoordenadas(columnas) {
  const candidatasLat = columnas.filter((c) => enRango(c, 90));
  const candidatasLon = columnas.filter((c) => enRango(c, 180));

  const exacta = (lista, nombres) => lista.find((c) => nombres.includes(normalizarNombre(c.nombre)));
  let lat = exacta(candidatasLat, NOMBRES_LAT);
  let lon = exacta(candidatasLon, NOMBRES_LON);

  const unica = (lista, patron) => {
    const encontradas = lista.filter((c) => patron.test(normalizarNombre(c.nombre)));
    return encontradas.length === 1 ? encontradas[0] : undefined;
  };
  lat ??= unica(candidatasLat, /lat/);
  lon ??= unica(candidatasLon, /lon|lng/);

  if (!lat || !lon || lat === lon) return null;
  return { lat: lat.nombre, lon: lon.nombre };
}

/**
 * Para la capa de arcos: si hay exactamente dos columnas de latitud y dos de
 * longitud, propone cuál es el origen y cuál el destino.
 * @returns {{ latOrigen: string, lonOrigen: string, latDestino: string, lonDestino: string } | null}
 */
export function sugerirArcos(columnas) {
  const lats = columnas.filter((c) => enRango(c, 90) && /lat/.test(normalizarNombre(c.nombre)));
  const lons = columnas.filter((c) => enRango(c, 180) && /lon|lng/.test(normalizarNombre(c.nombre)));
  if (lats.length !== 2 || lons.length !== 2) return null;

  const esOrigen = (c) => /orig|org|src|source|desde|from|inicio|salida/.test(normalizarNombre(c.nombre));
  const ordenar = ([a, b]) => (esOrigen(b) && !esOrigen(a) ? [b, a] : [a, b]);
  const [latOrigen, latDestino] = ordenar(lats);
  const [lonOrigen, lonDestino] = ordenar(lons);
  return {
    latOrigen: latOrigen.nombre,
    lonOrigen: lonOrigen.nombre,
    latDestino: latDestino.nombre,
    lonDestino: lonDestino.nombre,
  };
}

/** Filas que tienen coordenadas válidas (las demás no se pueden pintar). */
export function contarSinCoordenadas(filas, coords) {
  if (!coords) return 0;
  let n = 0;
  for (const f of filas) {
    const lat = f[coords.lat];
    const lon = f[coords.lon];
    if (lat === null || lon === null || Math.abs(lat) > 90 || Math.abs(lon) > 180 || (lat === 0 && lon === 0)) n++;
  }
  return n;
}
