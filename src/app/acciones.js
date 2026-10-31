import { nuevoId } from "./estado.js";
import { tipoDeCapa } from "../capas/registro.js";
import { ajustesPorDefecto } from "../capas/comun.js";

/**
 * Todo lo que se puede cambiar del estado pasa por aquí. La interfaz solo llama
 * a estas funciones; no toca el estado ni el mapa directamente.
 */
export function crearAcciones(estado) {
  const { get, set } = estado;

  const ajustesIniciales = (tipo, ajustes = {}) => {
    const base = ajustesPorDefecto(tipoDeCapa(tipo));
    if (tipo === "arcos" && get().sugerenciaArcos) Object.assign(base, get().sugerenciaArcos);
    return { ...base, ...ajustes };
  };

  const capaNueva = (tipo, ajustes) => ({ id: nuevoId("capa"), tipo, ajustes: ajustesIniciales(tipo, ajustes) });

  return {
    /** Datos recién leídos: se reinicia todo lo que dependía del archivo anterior. */
    cargarDatos({ nombre, filas, columnas, coords, arcos }) {
      set({
        archivo: nombre,
        filas,
        columnas,
        coords,
        sugerenciaArcos: arcos,
        filtros: [],
        capas: [],
        interfaz: { ...get().interfaz, camposOcultos: [] },
      });
    },

    elegirCoordenadas(lat, lon) {
      set({ coords: lat && lon ? { lat, lon } : null });
    },

    irAPaso(paso) {
      set({ paso });
    },

    terminarAsistente() {
      set({ fase: "app" });
    },

    volverAlAsistente() {
      set({ fase: "asistente", paso: 0 });
    },

    // --- Capas -----------------------------------------------------------
    anadirCapa(tipo, ajustes) {
      set((e) => ({ capas: [...e.capas, capaNueva(tipo, ajustes)] }));
    },

    /** Activa o desactiva un tipo desde el asistente. */
    alternarTipo(tipo) {
      set((e) => {
        const existe = e.capas.some((c) => c.tipo === tipo);
        return { capas: existe ? e.capas.filter((c) => c.tipo !== tipo) : [...e.capas, capaNueva(tipo)] };
      });
    },

    quitarCapa(id) {
      set((e) => ({ capas: e.capas.filter((c) => c.id !== id) }));
    },

    /** Cambiar el tipo conserva los ajustes que tengan sentido en el nuevo (p. ej. el campo de color). */
    cambiarTipo(id, tipo) {
      set((e) => ({
        capas: e.capas.map((c) => {
          if (c.id !== id) return c;
          const claves = new Set(tipoDeCapa(tipo).opciones.filter((o) => o.tipo === "campo").map((o) => o.clave));
          const conservados = Object.fromEntries(Object.entries(c.ajustes).filter(([k]) => claves.has(k)));
          return { ...c, tipo, ajustes: ajustesIniciales(tipo, conservados) };
        }),
      }));
    },

    cambiarAjuste(id, clave, valor) {
      set((e) => ({
        capas: e.capas.map((c) => (c.id === id ? { ...c, ajustes: { ...c.ajustes, [clave]: valor } } : c)),
      }));
    },

    // --- Filtros ---------------------------------------------------------
    anadirFiltro() {
      set((e) => ({ filtros: [...e.filtros, { id: nuevoId("filtro"), campo: "", min: null, max: null, texto: "" }] }));
    },

    cambiarFiltro(id, cambios) {
      set((e) => ({ filtros: e.filtros.map((f) => (f.id === id ? { ...f, ...cambios } : f)) }));
    },

    quitarFiltro(id) {
      set((e) => ({ filtros: e.filtros.filter((f) => f.id !== id) }));
    },

    quitarFiltros() {
      set({ filtros: [] });
    },

    // --- Mapa e interfaz --------------------------------------------------
    elegirTema(tema) {
      set({ tema });
    },

    cambiarInterfaz(cambios) {
      set((e) => ({ interfaz: { ...e.interfaz, ...cambios } }));
    },

    alternarCampoInfo(campo) {
      set((e) => {
        const ocultos = new Set(e.interfaz.camposOcultos);
        if (ocultos.has(campo)) ocultos.delete(campo);
        else ocultos.add(campo);
        return { interfaz: { ...e.interfaz, camposOcultos: [...ocultos] } };
      });
    },
  };
}
