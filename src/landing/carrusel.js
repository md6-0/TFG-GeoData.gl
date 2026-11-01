/**
 * Carrusel de la portada. Antes se elegía la diapositiva con un `switch` sobre
 * la clase CSS «0», «1»…; ahora el índice es la posición del botón.
 * También avanza con las flechas del teclado.
 */
const diapositivas = [...document.querySelectorAll(".slide")];
const bolas = [...document.querySelectorAll(".carruselControl .bola")];
let actual = 0;

function mostrar(i) {
  actual = (i + diapositivas.length) % diapositivas.length;
  diapositivas.forEach((d, j) => d.classList.toggle("slide-active", j === actual));
  bolas.forEach((b, j) => (j === actual ? b.setAttribute("aria-current", "true") : b.removeAttribute("aria-current")));
}

bolas.forEach((bola, i) => bola.addEventListener("click", () => mostrar(i)));

document.addEventListener("keydown", (ev) => {
  if (ev.key === "ArrowRight") mostrar(actual + 1);
  if (ev.key === "ArrowLeft") mostrar(actual - 1);
});
