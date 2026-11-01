import { readFileSync, readdirSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { parsearTexto, ErrorDeLectura } from "../src/datos/parsear.js";
import { aNumero, analizarColumnas, normalizarFilas, detectarCoordenadas, sugerirArcos } from "../src/datos/columnas.js";
import { procesarTexto } from "../src/datos/procesar.js";
import { aplicarFiltros } from "../src/datos/filtros.js";

const ejemplo = (nombre) => readFileSync(new URL(`../public/datos/${nombre}`, import.meta.url), "utf8");

describe("parsear", () => {
  it("lee CSV con comas y con punto y coma, y recorta los espacios de la cabecera", () => {
    const { filas } = parsearTexto(" lat , lon ;x\n1,2\n", "a.csv");
    expect(Object.keys(filas[0])).toContain("lat");
    const pc = parsearTexto("a;b\n1;2\n3;4\n", "b.csv");
    expect(pc.filas).toEqual([
      { a: "1", b: "2" },
      { a: "3", b: "4" },
    ]);
  });

  it("quita el BOM", () => {
    const { filas } = parsearTexto("﻿lat,lon\n1,2", "a.csv");
    expect(Object.keys(filas[0])).toEqual(["lat", "lon"]);
  });

  it("lee JSON en lista, dentro de un objeto y GeoJSON de puntos", () => {
    expect(parsearTexto('[{"a":1}]', "x.json").filas).toEqual([{ a: 1 }]);
    expect(parsearTexto('{"data":[{"a":1}]}', "x.json").filas).toEqual([{ a: 1 }]);
    const geo = parsearTexto(
      JSON.stringify({ type: "FeatureCollection", features: [{ type: "Feature", properties: { n: "A" }, geometry: { type: "Point", coordinates: [-0.48, 38.34] } }] }),
      "x.geojson",
    );
    expect(geo.filas).toEqual([{ n: "A", latitud: 38.34, longitud: -0.48 }]);
  });

  it("aplana un nivel de objetos anidados", () => {
    expect(parsearTexto('[{"dir":{"calle":"Mayor"},"tags":[1,2]}]', "x.json").filas[0]).toEqual({ "dir.calle": "Mayor", tags: "[1,2]" });
  });

  it("da errores comprensibles", () => {
    expect(() => parsearTexto("{nope", "x.json")).toThrow(ErrorDeLectura);
    expect(() => parsearTexto("solo\n1\n", "x.csv")).toThrow(/cabecera/);
  });
});

describe("columnas", () => {
  it("convierte números con punto o coma decimal", () => {
    expect(aNumero("38.34")).toBe(38.34);
    expect(aNumero("441062,99")).toBe(441062.99);
    expect(aNumero(" -0,5 ")).toBe(-0.5);
    expect(aNumero("1.234,5")).toBeNull(); // ambiguo: mejor texto que un número equivocado
    expect(aNumero("01-2013-0753")).toBeNull();
    expect(aNumero("")).toBeNull();
  });

  it("no decide el tipo por la primera fila (antes un hueco arriba la estropeaba)", () => {
    const filas = [{ n: "" }, { n: "3" }, { n: "4" }];
    expect(analizarColumnas(filas)).toEqual([{ nombre: "n", tipo: "numero" }]);
  });

  it("detecta latitud y longitud con los nombres de los ejemplos", () => {
    const casos = [
      ["Lat", "Lon"],
      ["LATITUD", "LONGITUD"],
      ["LATITUD_Y", "LONGITUD_X"],
      ["LAT-X", "LON-Y"],
      ["latitude", "longitude"],
    ];
    for (const [lat, lon] of casos) {
      const filas = [{ [lat]: "38.3", [lon]: "-0.4", otra: "x" }];
      const columnas = analizarColumnas(filas);
      normalizarFilas(filas, columnas);
      expect(detectarCoordenadas(columnas)).toEqual({ lat, lon });
    }
  });

  it("no confunde coordenadas UTM con latitud y longitud", () => {
    const filas = [{ COORDENADA_X: "441062,99", COORDENADA_Y: "4475052,45", LONGITUD: "-3.69", LATITUD: "40.42" }];
    const columnas = analizarColumnas(filas);
    normalizarFilas(filas, columnas);
    expect(detectarCoordenadas(columnas)).toEqual({ lat: "LATITUD", lon: "LONGITUD" });
  });

  it("propone origen y destino para los arcos", () => {
    const filas = [{ lat_esp: "40", lon_esp: "-3", lat_orig: "50", long_orig: "4" }];
    const columnas = analizarColumnas(filas);
    normalizarFilas(filas, columnas);
    expect(sugerirArcos(columnas)).toEqual({ latOrigen: "lat_orig", lonOrigen: "long_orig", latDestino: "lat_esp", lonDestino: "lon_esp" });
  });
});

describe("archivos de ejemplo", () => {
  const archivos = readdirSync(new URL("../public/datos/", import.meta.url));

  it.each(archivos)("%s se lee y tiene coordenadas o columnas para arcos", (archivo) => {
    const r = procesarTexto(ejemplo(archivo), archivo);
    expect(r.filas.length).toBeGreaterThan(0);
    expect(r.coords ?? r.arcos).not.toBeNull();
  });

  it("flujo_migratorio solo sirve para arcos, y los propone bien", () => {
    const r = procesarTexto(ejemplo("flujo_migratorio.csv"), "flujo_migratorio.csv");
    expect(r.coords).toBeNull();
    expect(r.arcos).toEqual({ latOrigen: "lat_orig", lonOrigen: "long_orig", latDestino: "lat_esp", lonDestino: "lon_esp" });
  });
});

describe("filtros", () => {
  const columnas = [
    { nombre: "n", tipo: "numero" },
    { nombre: "t", tipo: "texto" },
  ];
  const filas = [
    { n: 1, t: "Cafetería Ávila" },
    { n: 5, t: "Pub" },
    { n: null, t: "Bar" },
  ];

  it("sin filtros devuelve las mismas filas", () => {
    expect(aplicarFiltros(filas, [], columnas)).toBe(filas);
    expect(aplicarFiltros(filas, [{ id: "a", campo: "n", min: null, max: null }], columnas)).toBe(filas);
  });

  it("rango numérico con un solo extremo o con los dos", () => {
    expect(aplicarFiltros(filas, [{ id: "a", campo: "n", min: 2 }], columnas)).toEqual([filas[1]]);
    expect(aplicarFiltros(filas, [{ id: "a", campo: "n", min: 0, max: 1 }], columnas)).toEqual([filas[0]]);
  });

  it("texto: contiene, sin mayúsculas ni tildes", () => {
    expect(aplicarFiltros(filas, [{ id: "a", campo: "t", texto: "avila" }], columnas)).toEqual([filas[0]]);
  });

  it("combina varios filtros", () => {
    expect(aplicarFiltros(filas, [{ id: "a", campo: "n", min: 0 }, { id: "b", campo: "t", texto: "pub" }], columnas)).toEqual([filas[1]]);
  });
});
