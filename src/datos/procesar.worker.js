import { procesarTexto } from "./procesar.js";

// Leer y convertir un CSV de decenas de MB bloquearía la página: lo hacemos aquí.
self.onmessage = async ({ data: { archivo, url, nombre } }) => {
  try {
    let texto;
    if (archivo) {
      texto = await archivo.text();
    } else {
      const respuesta = await fetch(url);
      if (!respuesta.ok) throw new Error(`No se ha podido descargar ${nombre} (HTTP ${respuesta.status}).`);
      texto = await respuesta.text();
    }
    self.postMessage({ ok: true, resultado: procesarTexto(texto, nombre) });
  } catch (error) {
    self.postMessage({ ok: false, mensaje: error.message });
  }
};
