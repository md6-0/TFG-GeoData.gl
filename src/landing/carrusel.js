/**
 * Carrusel de la portada.
 *
 * - Las diapositivas se deslizan (transform) en vez de aparecer y desaparecer.
 * - Flechas, puntos, teclado (← →) y gesto de deslizar con el dedo o el ratón.
 * - Pase automático cada 7 s que se para con el ratón sobre el texto, la imagen
 *   o los controles, con el foco dentro,
 *   cuando la pestaña no está visible y con el botón de pausa. Si el sistema pide
 *   reducir el movimiento, no arranca solo.
 * - Las diapositivas ocultas son `inert`: sus enlaces no reciben el foco.
 */
const INTERVALO = 7000;
const UMBRAL_GESTO = 50; // px que hay que arrastrar para cambiar de diapositiva

const carrusel = document.querySelector(".carrusel");
const pista = carrusel.querySelector(".carrusel-pista");
const diapositivas = [...pista.querySelectorAll(".diapositiva")];
const puntos = [...carrusel.querySelectorAll(".carrusel-puntos button")];
const botonPausa = carrusel.querySelector(".carrusel-pausa");

const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let actual = 0;
let temporizador = null;
// Tiempo ya consumido del intervalo actual: al reanudar tras pasar el ratón,
// el pase sigue donde iba la barrita en vez de empezar de cero.
let inicio = performance.now();
let consumido = 0;
let pausadoPorUsuario = reducirMovimiento;
let encima = false;

carrusel.style.setProperty("--intervalo", `${INTERVALO}ms`);

function mostrar(indice, { desdeUsuario = false } = {}) {
  actual = (indice + diapositivas.length) % diapositivas.length;
  consumido = 0;
  inicio = performance.now();
  pista.style.transform = `translateX(${-actual * 100}%)`;
  diapositivas.forEach((d, i) => {
    const visible = i === actual;
    d.inert = !visible;
    d.setAttribute("aria-hidden", String(!visible));
  });
  puntos.forEach((p, i) => (i === actual ? p.setAttribute("aria-current", "true") : p.removeAttribute("aria-current")));
  // Reinicia la barrita de progreso del punto activo.
  const barra = puntos[actual].querySelector("span");
  barra.style.animation = "none";
  void barra.offsetWidth;
  barra.style.animation = "";
  // Si el cambio lo pide la persona, lo anuncia el lector de pantalla.
  pista.setAttribute("aria-live", desdeUsuario ? "polite" : "off");
  programar();
}

// --- Pase automático ------------------------------------------------------------
function enMarcha() {
  return !pausadoPorUsuario && !encima && !document.hidden;
}

function programar() {
  clearTimeout(temporizador);
  carrusel.dataset.auto = pausadoPorUsuario ? "no" : "si";
  carrusel.dataset.pausado = enMarcha() ? "no" : "si";
  if (enMarcha()) temporizador = setTimeout(() => mostrar(actual + 1), restante());
}

function restante() {
  return Math.max(300, INTERVALO - consumido);
}

function pararTemporal(parar) {
  if (parar && !encima) consumido += performance.now() - inicio;
  if (!parar) inicio = performance.now();
  encima = parar;
  programar();
}

function actualizarBotonPausa() {
  botonPausa.textContent = pausadoPorUsuario ? "▶" : "❚❚";
  botonPausa.setAttribute("aria-label", pausadoPorUsuario ? "Reanudar el pase automático" : "Pausar el pase automático");
}

botonPausa.addEventListener("click", () => {
  pausadoPorUsuario = !pausadoPorUsuario;
  actualizarBotonPausa();
  if (!pausadoPorUsuario) mostrar(actual + 1);
  else programar();
});

// El carrusel ocupa casi toda la página: si se parara con el ratón en cualquier
// sitio, en un ordenador no avanzaría nunca. Se para solo al estar sobre lo que
// se lee o se pulsa.
for (const zona of carrusel.querySelectorAll(".diapositiva-texto, .diapositiva-imagen, .carrusel-flecha, .carrusel-controles")) {
  zona.addEventListener("mouseenter", () => pararTemporal(true));
  zona.addEventListener("mouseleave", () => pararTemporal(false));
}
// Solo el foco de teclado: un clic en «reanudar» deja el foco en el botón y no
// debe dejar el pase parado.
carrusel.addEventListener("focusin", (ev) => ev.target.matches(":focus-visible") && pararTemporal(true));
carrusel.addEventListener("focusout", (ev) => !carrusel.contains(ev.relatedTarget) && pararTemporal(false));
document.addEventListener("visibilitychange", programar);

// --- Controles ----------------------------------------------------------------------
carrusel.querySelector(".carrusel-anterior").addEventListener("click", () => mostrar(actual - 1, { desdeUsuario: true }));
carrusel.querySelector(".carrusel-siguiente").addEventListener("click", () => mostrar(actual + 1, { desdeUsuario: true }));
puntos.forEach((p, i) => p.addEventListener("click", () => mostrar(i, { desdeUsuario: true })));

document.addEventListener("keydown", (ev) => {
  if (ev.target.closest("input, textarea, select")) return;
  if (ev.key === "ArrowRight") mostrar(actual + 1, { desdeUsuario: true });
  if (ev.key === "ArrowLeft") mostrar(actual - 1, { desdeUsuario: true });
});

// --- Deslizar con el dedo o arrastrando con el ratón -----------------------------------
let gesto = null;

pista.addEventListener("pointerdown", (ev) => {
  if (ev.button !== 0 || ev.target.closest("a, button")) return;
  gesto = { x: ev.clientX, y: ev.clientY, id: ev.pointerId, ancho: pista.clientWidth, horizontal: null };
});

pista.addEventListener("pointermove", (ev) => {
  if (!gesto || ev.pointerId !== gesto.id) return;
  const dx = ev.clientX - gesto.x;
  const dy = ev.clientY - gesto.y;
  if (gesto.horizontal === null && Math.hypot(dx, dy) > 8) {
    gesto.horizontal = Math.abs(dx) > Math.abs(dy);
    if (gesto.horizontal) {
      pista.setPointerCapture(ev.pointerId);
      pista.classList.add("arrastrando");
    }
  }
  if (gesto.horizontal) {
    const desplazamiento = (-actual * gesto.ancho + dx) / gesto.ancho;
    pista.style.transform = `translateX(${desplazamiento * 100}%)`;
  }
});

function terminarGesto(ev) {
  if (!gesto || ev.pointerId !== gesto.id) return;
  const dx = ev.clientX - gesto.x;
  const eraHorizontal = gesto.horizontal;
  gesto = null;
  pista.classList.remove("arrastrando");
  if (!eraHorizontal) return;
  if (dx < -UMBRAL_GESTO) mostrar(actual + 1, { desdeUsuario: true });
  else if (dx > UMBRAL_GESTO) mostrar(actual - 1, { desdeUsuario: true });
  else mostrar(actual); // vuelve a su sitio
}

pista.addEventListener("pointerup", terminarGesto);
pista.addEventListener("pointercancel", terminarGesto);

// Evita que arrastrar una imagen abra el «arrastrar imagen» del navegador.
pista.addEventListener("dragstart", (ev) => ev.preventDefault());

actualizarBotonPausa();
mostrar(0);
