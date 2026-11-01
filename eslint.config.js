import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["dist/", "node_modules/", "public/"] },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: { ...globals.browser },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-var": "error",
      "prefer-const": "error",
      eqeqeq: ["error", "always"],
      // La interfaz se construye con nodos (ui/dom.js), nunca con HTML en cadenas.
      "no-restricted-properties": [
        "error",
        { property: "innerHTML", message: "Usa h() de ui/dom.js en vez de innerHTML." },
        { property: "outerHTML", message: "Usa h() de ui/dom.js en vez de outerHTML." },
      ],
    },
  },
  {
    files: ["tests/**", "*.config.js"],
    languageOptions: { globals: { ...globals.node } },
  },
];
