import { resolve } from "node:path";
import { defineConfig } from "vite";

const raiz = import.meta.dirname;

export default defineConfig({
  // Rutas relativas: el build funciona igual en GitHub Pages (/TFG-GeoData.gl/) que en local.
  base: "./",
  build: {
    target: "es2022",
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      input: {
        index: resolve(raiz, "index.html"),
        webapp: resolve(raiz, "webapp.html"),
        datos: resolve(raiz, "datos.html"),
      },
    },
  },
  worker: { format: "es" },
  test: {
    environment: "node",
    include: ["tests/**/*.test.js"],
  },
});
