import "../estilos/app.css";
import { crearEstado, memo } from "./estado.js";
import { crearAcciones } from "./acciones.js";
import { aplicarFiltros } from "../datos/filtros.js";
import { cargarArchivo, cargarUrl } from "../datos/cargar.js";
import { buscarEjemplo, urlEjemplo } from "../datos/ejemplos.js";
import { crearConstructor, filasConCoordenadas } from "../capas/construir.js";
import { tipoDeCapa } from "../capas/registro.js";
import { crearMapa } from "../mapa/mapa.js";
import { temaPorId } from "../mapa/temas.js";
import { aviso, cerrarAviso } from "../ui/avisos.js";
import { montarAsistente } from "../ui/asistente.js";
import { montarMenu } from "../ui/menu.js";
import { montarPanelCapas } from "../ui/panelCapas.js";
import { montarPanelFiltros } from "../ui/panelFiltros.js";
import { montarPanelInterfaz } from "../ui/panelInterfaz.js";
import { montarPanelMapa } from "../ui/panelMapa.js";
import { montarCajaDatos } from "../ui/cajaDatos.js";
import { montarBuscador } from "../ui/buscador.js";
import { formatear } from "../capas/comun.js";

const $ = (id) => document.getElementById(id);

const estado = crearEstado();
const acciones = crearAcciones(estado);

// --- Datos derivados (se recalculan solo si cambian sus entradas) ----------
const filtrar = memo(aplicarFiltros);
const situar = memo(filasConCoordenadas);
const filtradas = (e) => filtrar(e.filas, e.filtros, e.columnas);
const conCoordenadas = (e) => situar(filtradas(e), e.coords);

// --- Mapa ------------------------------------------------------------------
const construir = crearConstructor();
let contextos = new Map();
const caja = montarCajaDatos($("cajaDatos"), { estado });

const mapa = crearMapa($("mapa"), {
  alPasar: (info) => {
    const entrada = info.layer && contextos.get(info.layer.id);
    if (entrada?.tipo.describir && info.object) caja.mostrar(entrada.tipo.describir(info, entrada.ctx));
  },
});

estado.observar(
  (e) => [filtradas(e), conCoordenadas(e), e.coords, e.capas],
  ([todasFiltradas, situadas, coords, capas], e) => {
    const resultado = construir({ todas: e.filas, filtradas: todasFiltradas, conCoordenadas: situadas, coords, capas });
    contextos = resultado.contextos;
    mapa.setCapas(resultado.layers);
    caja.actualizar({ filtradas: todasFiltradas, conCoordenadas: situadas, capas, escala: resultado.escala });
  },
  { igual: (a, b) => a.every((x, i) => x === b[i]) },
);

estado.observar(
  (e) => e.tema,
  (tema) => {
    mapa.setTema(tema);
    document.body.dataset.logo = temaPorId(tema).logo;
  },
);

// --- Interfaz ----------------------------------------------------------------
montarAsistente($("asistente"), { estado, acciones, abrirArchivo, abrirEjemplo });

const paneles = montarMenu($("menu"), {
  pestanas: [
    { id: "capas", nombre: "Capas" },
    { id: "filtros", nombre: "Filtros" },
    { id: "interfaz", nombre: "Interfaz" },
    { id: "mapa", nombre: "Mapa" },
  ],
  alVolver: () => acciones.volverAlAsistente(),
  alCambiarAltura: () => setTimeout(() => mapa.redimensionar(), 350),
});
montarPanelCapas(paneles.capas, { estado, acciones });
montarPanelFiltros(paneles.filtros, { estado, acciones, filtradas });
montarPanelInterfaz(paneles.interfaz, { estado, acciones });
montarPanelMapa(paneles.mapa, { estado, acciones, mapa });
montarBuscador($("buscador"), { alElegir: (c) => mapa.irACaja(c) });

estado.observar(
  (e) => e.fase,
  (fase, e) => {
    const enApp = fase === "app";
    $("menu").hidden = !enApp;
    document.body.dataset.fase = fase;
    if (enApp) {
      cerrarAviso();
      const situadas = conCoordenadas(e);
      const pitch = e.capas.some((c) => ["calor3d", "hexagonos"].includes(c.tipo)) ? 45 : 0;
      if (situadas.length) mapa.encuadrar(situadas, e.coords, { pitch });
      else encuadrarArcos(e);
    }
  },
);

estado.observar(
  (e) => [e.fase, e.interfaz],
  ([fase, interfaz]) => {
    const enApp = fase === "app";
    $("cajaDatos").hidden = !enApp || !interfaz.info;
    $("buscador").hidden = !enApp || !interfaz.busqueda;
    mapa.mostrarControles(interfaz.controles);
  },
  { igual: (a, b) => a[0] === b[0] && a[1] === b[1] },
);

function encuadrarArcos(e) {
  const arco = e.capas.find((c) => c.tipo === "arcos")?.ajustes;
  if (!arco?.latOrigen) return;
  const puntos = filtradas(e).flatMap((f) => [
    { lat: f[arco.latOrigen], lon: f[arco.lonOrigen] },
    { lat: f[arco.latDestino], lon: f[arco.lonDestino] },
  ]);
  mapa.encuadrar(puntos.filter((p) => p.lat !== null && p.lon !== null), { lat: "lat", lon: "lon" });
}

// --- Carga de archivos -----------------------------------------------------
async function cargar(promesa, nombre) {
  const cargando = $("cargando");
  cargando.hidden = false;
  cargando.querySelector("p").textContent = `Leyendo ${nombre}…`;
  try {
    const resultado = await promesa;
    acciones.cargarDatos(resultado);
    informar(resultado);
    return resultado;
  } catch (error) {
    aviso(["No se ha podido leer el archivo.", error.message], "error", { duracion: 0 });
    return null;
  } finally {
    cargando.hidden = true;
  }
}

function informar({ filas, columnas, coords, avisos }) {
  const lineas = [`Archivo leído: ${formatear(filas.length)} filas y ${columnas.length} columnas.`, ...avisos];
  if (!coords) lineas.push("Elige las columnas de latitud y longitud.");
  aviso(lineas, coords ? "ok" : "atencion", { duracion: coords ? 5000 : 0 });
}

async function abrirArchivo(archivo) {
  await cargar(cargarArchivo(archivo), archivo.name);
}

async function abrirEjemplo(ejemplo, { directo = false } = {}) {
  const resultado = await cargar(cargarUrl(urlEjemplo(ejemplo.archivo), ejemplo.archivo), ejemplo.archivo);
  if (!resultado) return;
  for (const capa of ejemplo.capas) {
    const tipo = tipoDeCapa(capa.tipo);
    if (!tipo.usaCoordenadas || resultado.coords) acciones.anadirCapa(capa.tipo, capa.ajustes);
  }
  if (directo) acciones.terminarAsistente();
}

// datos.html enlaza a webapp.html?ejemplo=archivo.csv para abrir un ejemplo directamente.
const pedido = new URLSearchParams(location.search).get("ejemplo");
const ejemplo = pedido && buscarEjemplo(pedido);
if (ejemplo) abrirEjemplo(ejemplo, { directo: true });

// Para depurar desde la consola o las pruebas automáticas.
window.geodata = { estado, acciones, mapa };
