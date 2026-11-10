"use strict";

/**
 * Pasos de preparación numerados.
 * Los pasos ya vienen filtrados desde Recetas.parsearPasos().
 */
class PasosPreparacion extends Pseudocomponente {
  constructor(contenedor, props = {}) {
    super(contenedor, props);
    this.estado = {
      pasos: props.pasos || []
    };
  }

  crear() {
    return DOM.crear("div", { clase: "pasos-contenedor" });
  }

  render() {
    DOM.vaciar(this.el);

    if (!this.estado.pasos.length) {
      this.el.appendChild(
        DOM.crear("p", {
          clase: "nota",
          texto: "Esta receta no tiene pasos registrados."
        })
      );
      return;
    }

    const lista = DOM.crear("ol", { clase: "pasos" });

    for (const paso of this.estado.pasos) {
      lista.appendChild(DOM.crear("li", { texto: paso }));
    }

    this.el.appendChild(lista);
  }

  actualizar(props = {}) {
    Object.assign(this.estado, props);
    if (this.el) this.render();
  }
}
