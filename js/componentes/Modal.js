"use strict";

/**
 * Diálogo integrado al DOM. Sustituye a alert/confirm/prompt.
 * Emite "modal:opcion" con { valor } y "modal:cerrar" con {}.
 */
class Modal extends Pseudocomponente {
  constructor(contenedor, props = {}) {
    super(contenedor, props);
    Modal.contador += 1;
    this._id = `modal-${Modal.contador}`;
    this._focoAnterior = document.activeElement;
    this.estado = {
      titulo: props.titulo || "Aviso",
      mensaje: props.mensaje || "",
      opciones: props.opciones || [],
      cancelable: props.cancelable !== false
    };
  }

  crear() {
    return DOM.crear("div", {
      clase: "modal",
      attrs: {
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": `${this._id}-titulo`
      }
    });
  }

  montar() {
    const el = super.montar();
    const primero = this.el?.querySelector("button");
    if (primero) primero.focus();
    return el;
  }

  render() {
    DOM.vaciar(this.el);

    const acciones = [];

    for (const opcion of this.estado.opciones) {
      acciones.push(
        DOM.crear("button", {
          clase: "boton boton--primario",
          texto: opcion.etiqueta,
          attrs: {
            type: "button",
            "data-valor": opcion.valor
          }
        })
      );
    }

    if (this.estado.cancelable) {
      acciones.push(
        DOM.crear("button", {
          clase: "boton boton--secundario",
          texto: "Cancelar",
          attrs: { type: "button", "data-accion": "cerrar" }
        })
      );
    }

    const caja = DOM.crear("div", { clase: "modal__caja" }, [
      DOM.crear("h2", {
        clase: "modal__titulo",
        texto: this.estado.titulo,
        attrs: { id: `${this._id}-titulo` }
      }),
      DOM.crear("p", { clase: "modal__mensaje", texto: this.estado.mensaje }),
      DOM.crear("div", { clase: "modal__acciones" }, acciones)
    ]);

    this.el.appendChild(caja);
  }

  eventos() {
    this.escuchar(this.el, "click", (evento) => {
      if (evento.target === this.el) {
        if (this.estado.cancelable) this.cerrar();
        return;
      }

      const botonCerrar = evento.target.closest('[data-accion="cerrar"]');
      if (botonCerrar) {
        this.cerrar();
        return;
      }

      const botonOpcion = evento.target.closest("[data-valor]");
      if (botonOpcion) {
        this.emitir("modal:opcion", { valor: botonOpcion.dataset.valor });
        this.cerrar();
      }
    });

    this.escuchar(document, "keydown", (evento) => {
      if (evento.key === "Escape" && this.estado.cancelable) this.cerrar();
    });
  }

  cerrar() {
    this.emitir("modal:cerrar", {});
    this.destruir();
  }

  destruir() {
    const foco = this._focoAnterior;
    super.destruir();
    if (foco && typeof foco.focus === "function") foco.focus();
  }
}

Modal.contador = 0;
