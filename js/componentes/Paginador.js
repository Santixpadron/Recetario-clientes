"use strict";

/**
 * Paginación en cliente. Emite "pagina:cambiar" con { pagina, seccion }.
 */
class Paginador extends Pseudocomponente {
  constructor(contenedor, props = {}) {
    super(contenedor, props);
    this.estado = {
      pagina: props.pagina || 1,
      totalPaginas: props.totalPaginas || 1,
      seccion: props.seccion || ""
    };
  }

  crear() {
    return DOM.crear("nav", {
      clase: "paginador",
      attrs: { "aria-label": "Paginación de resultados" }
    });
  }

  render() {
    DOM.vaciar(this.el);
    this.el.hidden = this.estado.totalPaginas <= 1;
    if (this.el.hidden) return;

    const anterior = DOM.crear("button", {
      clase: "boton boton--secundario",
      texto: "Anterior",
      attrs: { type: "button", "data-accion": "anterior" }
    });
    anterior.disabled = this.estado.pagina <= 1;

    const siguiente = DOM.crear("button", {
      clase: "boton boton--secundario",
      texto: "Siguiente",
      attrs: { type: "button", "data-accion": "siguiente" }
    });
    siguiente.disabled = this.estado.pagina >= this.estado.totalPaginas;

    this.el.appendChild(anterior);
    this.el.appendChild(
      DOM.crear("p", {
        clase: "paginador__texto",
        texto: `Página ${this.estado.pagina} de ${this.estado.totalPaginas}`
      })
    );
    this.el.appendChild(siguiente);
  }

  eventos() {
    this.escuchar(this.el, "click", (evento) => {
      const boton = evento.target.closest("[data-accion]");
      if (!boton) return;

      const delta = boton.dataset.accion === "anterior" ? -1 : 1;
      const pagina = Math.min(
        this.estado.totalPaginas,
        Math.max(1, this.estado.pagina + delta)
      );

      if (pagina === this.estado.pagina) return;
      this.emitir("pagina:cambiar", {
        pagina,
        seccion: this.estado.seccion
      });
    });
  }

  actualizar(props = {}) {
    Object.assign(this.estado, props);
    if (this.el) this.render();
  }
}
