import { describe, it, expect } from "vitest";
import { crearEscalaCategorias, PALETA, COLOR_OTROS } from "../src/capas/colores.js";
import { TIPOS, tipoDeCapa } from "../src/capas/registro.js";
import { ajustesPorDefecto, opcionesQueFaltan } from "../src/capas/comun.js";
import { crearConstructor, filasConCoordenadas } from "../src/capas/construir.js";
import { crearEstado } from "../src/app/estado.js";
import { crearAcciones } from "../src/app/acciones.js";

describe("colores por categoría", () => {
  it("valores distintos con la misma suma de letras tienen colores distintos", () => {
    // Con la suma de códigos ASCII de antes, «AC» y «BB» coincidían.
    const escala = crearEscalaCategorias([{ c: "AC" }, { c: "BB" }], "c");
    expect(escala.colorDe("AC")).not.toEqual(escala.colorDe("BB"));
  });

  it("es estable y da los primeros colores a los valores más frecuentes", () => {
    const filas = [{ c: "b" }, { c: "a" }, { c: "a" }];
    const a = crearEscalaCategorias(filas, "c");
    const b = crearEscalaCategorias(filas, "c");
    expect(a.categorias.map((x) => x.valor)).toEqual(["a", "b"]);
    expect(a.colorDe("a")).toEqual(PALETA[0]);
    expect(a.colorDe("b")).toEqual(b.colorDe("b"));
  });

  it("agrupa en «Otros» lo que no cabe en la paleta", () => {
    const filas = Array.from({ length: 30 }, (_, i) => ({ c: `v${i}` }));
    const escala = crearEscalaCategorias(filas, "c");
    expect(escala.categorias).toHaveLength(PALETA.length - 1);
    expect(escala.otros).toBe(30 - (PALETA.length - 1));
    expect(escala.colorDe("v29")).toEqual(COLOR_OTROS);
  });
});

const filas = [
  { lat: 38.34, lon: -0.48, cat: "A", n: 3, lat2: 40.4, lon2: -3.7 },
  { lat: 38.35, lon: -0.49, cat: "B", n: 4, lat2: 40.4, lon2: -3.7 },
  { lat: null, lon: -0.49, cat: "B", n: 1, lat2: 40.4, lon2: -3.7 },
  { lat: 0, lon: 0, cat: "B", n: 1, lat2: 40.4, lon2: -3.7 },
];
const coords = { lat: "lat", lon: "lon" };

describe("tipos de capa", () => {
  it("todos tienen la forma que espera el resto de la app", () => {
    for (const tipo of TIPOS) {
      expect(tipo.id).toMatch(/^[a-z0-9]+$/);
      expect(typeof tipo.crear).toBe("function");
      expect(Array.isArray(tipo.opciones)).toBe(true);
      for (const o of tipo.opciones) expect(["campo", "numero"]).toContain(o.tipo);
    }
  });

  it("cada tipo crea su capa de deck.gl con los ajustes por defecto", () => {
    const construir = crearConstructor();
    for (const tipo of TIPOS) {
      const ajustes = { ...ajustesPorDefecto(tipo), latOrigen: "lat", lonOrigen: "lon", latDestino: "lat2", lonDestino: "lon2" };
      const { layers } = construir({ todas: filas, filtradas: filas, conCoordenadas: filasConCoordenadas(filas, coords), coords, capas: [{ id: tipo.id, tipo: tipo.id, ajustes }] });
      expect(layers, tipo.id).toHaveLength(1);
      expect(layers[0].id).toBe(`${tipo.id}-${tipo.id}`);
    }
  });

  it("al cambiar el tipo de una capa cambia el id de la capa de deck.gl", () => {
    const construir = crearConstructor();
    const base = { todas: filas, filtradas: filas, conCoordenadas: filasConCoordenadas(filas, coords), coords };
    const antes = construir({ ...base, capas: [{ id: "c1", tipo: "calor", ajustes: ajustesPorDefecto(tipoDeCapa("calor")) }] });
    const despues = construir({ ...base, capas: [{ id: "c1", tipo: "puntos", ajustes: ajustesPorDefecto(tipoDeCapa("puntos")) }] });
    expect(antes.layers[0].id).not.toBe(despues.layers[0].id);
  });

  it("los arcos no se crean hasta tener las cuatro columnas", () => {
    const arcos = tipoDeCapa("arcos");
    expect(opcionesQueFaltan(arcos, {}).map((o) => o.clave)).toEqual(["latOrigen", "lonOrigen", "latDestino", "lonDestino"]);
    const construir = crearConstructor();
    const { layers } = construir({ todas: filas, filtradas: filas, conCoordenadas: [], coords: null, capas: [{ id: "x", tipo: "arcos", ajustes: { latOrigen: "lat" } }] });
    expect(layers).toHaveLength(0);
  });

  it("descarta filas sin coordenadas y el 0,0", () => {
    expect(filasConCoordenadas(filas, coords)).toEqual(filas.slice(0, 2));
  });
});

describe("estado y acciones", () => {
  const datos = { nombre: "x.csv", filas, columnas: [{ nombre: "cat", tipo: "texto" }], coords, arcos: { latOrigen: "lat", lonOrigen: "lon", latDestino: "lat2", lonDestino: "lon2" } };

  it("cargar un archivo nuevo borra capas y filtros del anterior", () => {
    const estado = crearEstado();
    const acciones = crearAcciones(estado);
    acciones.cargarDatos(datos);
    acciones.anadirCapa("puntos");
    acciones.anadirFiltro();
    acciones.cargarDatos(datos);
    expect(estado.get().capas).toEqual([]);
    expect(estado.get().filtros).toEqual([]);
  });

  it("una capa de arcos nueva usa las columnas propuestas", () => {
    const estado = crearEstado();
    const acciones = crearAcciones(estado);
    acciones.cargarDatos(datos);
    acciones.anadirCapa("arcos");
    expect(estado.get().capas[0].ajustes).toMatchObject(datos.arcos);
  });

  it("cambiar de tipo conserva el campo de color", () => {
    const estado = crearEstado();
    const acciones = crearAcciones(estado);
    acciones.cargarDatos(datos);
    acciones.anadirCapa("puntos", { campoColor: "cat" });
    const id = estado.get().capas[0].id;
    acciones.cambiarTipo(id, "chinchetas");
    expect(estado.get().capas[0]).toMatchObject({ tipo: "chinchetas", ajustes: { campoColor: "cat", tam: 28 } });
    expect(estado.get().capas[0].ajustes.radio).toBeUndefined();
  });

  it("observar solo avisa cuando cambia lo observado", () => {
    const estado = crearEstado();
    const vistos = [];
    estado.observar((e) => e.tema, (t) => vistos.push(t));
    estado.set({ paso: 1 });
    estado.set({ tema: "noche" });
    expect(vistos).toEqual(["oscuro", "noche"]);
  });
});

describe("caja de datos de una celda", () => {
  it("centro calculado con los puntos y suma del campo de altura", async () => {
    const { describirCelda } = await import("../src/capas/comun.js");
    const info = { object: { count: 2, position: [-180, -85], points: filas.slice(0, 2) } };
    const { lineas } = describirCelda(info, { coords }, "n");
    expect(lineas).toEqual([
      ["Centro aprox.", "38.3450, -0.4850"],
      ["Elementos en esta zona", "2"],
      ["Total de n", "7"],
    ]);
  });
});
