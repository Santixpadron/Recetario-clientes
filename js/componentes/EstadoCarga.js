"use strict";

/**
 * Estado de carga, vacío o error con la forma del contenido que reemplaza.
 * Emite "estado:reintentar" con { seccion } cuando se pulsa Reintentar.
 */
class EstadoCarga extends Pseudocomponente {
  constructor(contenedor, props = {}) {
    super(contenedor, props);
    this.estado = {
      variante: props.variante || "carga",
      tipo: props.tipo || "bloque",
      mensaje: props.mensaje || "",
      seccion: props.seccion || ""
    };
  }

  crear() {
    return DOM.crear("div", { clase: "estado" });
  }

  render() {
    DOM.vaciar(this.el);
    this.el.className = `estado estado--${this.estado.variante} estado--${this.estado.tipo}`;

    if (this.estado.variante === "carga") {
      const bloques = DOM.crear("div", { clase: "estado__esqueleto" }, [
        DOM.crear("span", { clase: "estado__bloque estado__bloque--titulo" }),
        DOM.crear("span", { clase: "estado__bloque" }),
        DOM.crear("span", { clase: "estado__bloque" }),
        DOM.crear("span", { clase: "estado__bloque estado__bloque--corto" })
      ]);
      this.el.appendChild(bloques);
      this.el.setAttribute("aria-busy", "true");
      return;
    }

    this.el.removeAttribute("aria-busy");

    const titulo =
      this.estado.variante === "error" ? "No se pudo cargar" : "Sin contenido";
    const mensaje =
      this.estado.mensaje ||
      (this.estado.variante === "error"
        ? "Intenta de nuevo en unos segundos."
        : "Todavía no hay información para mostrar.");

    this.el.appendChild(
      DOM.crear("h3", { clase: "estado__titulo", texto: titulo })
    );
    this.el.appendChild(
      DOM.crear("p", { clase: "estado__mensaje", texto: mensaje })
    );

    if (this.estado.variante === "error") {
      this.el.appendChild(
        DOM.crear("button", {
          clase: "boton boton--secundario",
          texto: "Reintentar",
          attrs: { type: "button", "data-accion": "reintentar" }
        })
      );
    }
  }

  eventos() {
    this.escuchar(this.el, "click", (evento) => {
      const boton = evento.target.closest('[data-accion="reintentar"]');
      if (!boton) return;
      this.emitir("estado:reintentar", { seccion: this.estado.seccion });
    });
  }

  actualizar(props = {}) {
    Object.assign(this.estado, props);
    if (this.el) this.render();
  }
}
