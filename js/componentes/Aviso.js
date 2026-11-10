"use strict";

/**
 * Mensajes flotantes integrados al DOM. No usa alert().
 */
class Aviso {
  constructor(mensaje, tipo = "info", duracion = 4000) {
    this.mensaje = mensaje;
    this.tipo = tipo;
    this.duracion = duracion;
    this.el = null;
    this._timeout = null;
  }

  montar() {
    const raiz = document.getElementById("avisos") || document.body;

    this.el = DOM.crear(
      "div",
      {
        clase: `aviso aviso--${this.tipo}`,
        attrs: { role: this.tipo === "error" ? "alert" : "status" }
      },
      [
        DOM.crear("p", { clase: "aviso__texto", texto: this.mensaje }),
        DOM.crear("button", {
          clase: "aviso__cerrar",
          texto: "×",
          attrs: { type: "button", "aria-label": "Cerrar aviso" },
          on: { click: () => this.destruir() }
        })
      ]
    );

    raiz.appendChild(this.el);

    if (this.duracion > 0) {
      this._timeout = setTimeout(() => this.destruir(), this.duracion);
    }

    return this.el;
  }

  destruir() {
    if (this._timeout) clearTimeout(this._timeout);
    this._timeout = null;
    if (this.el?.parentNode) this.el.parentNode.removeChild(this.el);
    this.el = null;
  }

  static mostrar(mensaje, tipo = "info", duracion = 4000) {
    const aviso = new Aviso(mensaje, tipo, duracion);
    aviso.montar();
    return aviso;
  }
}
