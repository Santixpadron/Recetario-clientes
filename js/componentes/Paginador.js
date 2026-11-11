"use strict";

/**
 * Paginador — navegación entre páginas de resultados.
 *
 * PROVISIONAL — archivo asignado al Integrante 1.
 * Emite `cambio-pagina` con `{ pagina }`.
 */
class Paginador {
  constructor(contenedor, props = {}) {
    this.contenedor = contenedor;
    this.props = { paginaActual: 1, totalPaginas: 1, ...props };
    this.destruido = false;

    this.elemento = document.createElement("nav");
    this.elemento.className = "paginador";
    this.elemento.setAttribute("aria-label", "Paginación de resultados");

    this.manejadorClick = (evento) => {
      const boton = evento.target.closest("button[data-pagina]");
      if (!boton || boton.disabled) return;

      const pagina = Number(boton.dataset.pagina);
      if (!Number.isFinite(pagina) || pagina === this.props.paginaActual) return;

      this.elemento.dispatchEvent(
        new CustomEvent("cambio-pagina", { bubbles: true, detail: { pagina } })
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
    const { paginaActual, totalPaginas } = this.props;

    if (totalPaginas <= 1) return;

    const anterior = document.createElement("button");
    anterior.type = "button";
    anterior.className = "paginador-boton";
    anterior.dataset.pagina = String(paginaActual - 1);
    anterior.textContent = "← Anterior";
    anterior.disabled = paginaActual <= 1;

    const info = document.createElement("span");
    info.className = "paginador-info";
    info.setAttribute("aria-live", "polite");
    info.textContent = `Página ${paginaActual} de ${totalPaginas}`;

    const siguiente = document.createElement("button");
    siguiente.type = "button";
    siguiente.className = "paginador-boton";
    siguiente.dataset.pagina = String(paginaActual + 1);
    siguiente.textContent = "Siguiente →";
    siguiente.disabled = paginaActual >= totalPaginas;

    this.elemento.append(anterior, info, siguiente);
  }

  destruir() {
    if (this.destruido) return;
    this.destruido = true;
    this.elemento.removeEventListener("click", this.manejadorClick);
    this.elemento.remove();
    this.elemento = null;
  }
}
