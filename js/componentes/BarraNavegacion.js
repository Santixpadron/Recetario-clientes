"use strict";

/**
 * BarraNavegacion — enlaces principales de la SPA.
 *
 * PROVISIONAL — archivo asignado al Integrante 1.
 * Emite `navegar-vista` con `{ vista }` y marca el enlace activo con
 * `aria-current="page"`.
 */
class BarraNavegacion {
  constructor(contenedor, props = {}) {
    this.contenedor = contenedor;
    this.props = { vistaActual: "inicio", contadorComparador: 0, ...props };
    this.destruido = false;

    this.enlaces = [
      { vista: "inicio", texto: "Inicio" },
      { vista: "explorar", texto: "Explorar" },
      { vista: "categorias-origenes", texto: "Categorías y orígenes" },
      { vista: "comparador", texto: "Comparador" }
    ];

    this.elemento = document.createElement("nav");
    this.elemento.className = "barra-navegacion";
    this.elemento.setAttribute("aria-label", "Navegación principal");

    this.manejadorClick = (evento) => {
      const enlace = evento.target.closest("a[data-vista]");
      if (!enlace) return;
      evento.preventDefault();
      this.elemento.dispatchEvent(
        new CustomEvent("navegar-vista", {
          bubbles: true,
          detail: { vista: enlace.dataset.vista }
        })
      );
    };

    this.elemento.addEventListener("click", this.manejadorClick);
    if (contenedor) contenedor.appendChild(this.elemento);

    this.renderizar();
  }

  actualizar(props = {}) {
    if (this.destruido) return;
    this.props = { ...this.props, ...props };
    this.renderizar();
  }

  renderizar() {
    if (this.destruido) return;
    this.elemento.textContent = "";

    const lista = document.createElement("ul");
    lista.className = "nav-lista";

    this.enlaces.forEach(({ vista, texto }) => {
      const item = document.createElement("li");
      const enlace = document.createElement("a");
      enlace.className = "nav-enlace";
      enlace.href = `#/${vista}`;
      enlace.dataset.vista = vista;
      enlace.textContent = texto;

      if (vista === this.props.vistaActual) {
        enlace.setAttribute("aria-current", "page");
      }

      if (vista === "comparador" && this.props.contadorComparador > 0) {
        const contador = document.createElement("span");
        contador.className = "nav-contador";
        contador.textContent = String(this.props.contadorComparador);
        contador.setAttribute(
          "aria-label",
          `${this.props.contadorComparador} recetas en el comparador`
        );
        enlace.appendChild(contador);
      }

      item.appendChild(enlace);
      lista.appendChild(item);
    });

    this.elemento.appendChild(lista);
  }

  destruir() {
    if (this.destruido) return;
    this.destruido = true;
    this.elemento.removeEventListener("click", this.manejadorClick);
    this.elemento.remove();
    this.elemento = null;
  }
}
