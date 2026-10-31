/**
 * Carga un archivo del usuario o un ejemplo por URL, procesándolo en un worker.
 * @returns {Promise<ReturnType<import("./procesar.js").procesarTexto>>}
 */
export function cargarArchivo(archivo) {
  return enWorker({ archivo, nombre: archivo.name });
}

export function cargarUrl(url, nombre = url.split("/").pop()) {
  // El worker no resuelve rutas relativas igual que la página: le pasamos la absoluta.
  return enWorker({ url: new URL(url, document.baseURI).href, nombre });
}

function enWorker(mensaje) {
  return new Promise((resolver, rechazar) => {
    const worker = new Worker(new URL("./procesar.worker.js", import.meta.url), { type: "module" });
    worker.onmessage = ({ data }) => {
      worker.terminate();
      if (data.ok) resolver(data.resultado);
      else rechazar(new Error(data.mensaje));
    };
    worker.onerror = (evento) => {
      worker.terminate();
      rechazar(new Error(evento.message || "Error inesperado al leer el archivo."));
    };
    worker.postMessage(mensaje);
  });
}
