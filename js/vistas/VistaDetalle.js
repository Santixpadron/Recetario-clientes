"use strict";

/**
 * Vista de Detalle.
 * TODO: cargar la receta con Cache.obtenerReceta + lookup.php, mostrar etiquetas,
 * ListaIngredientes, PasosPreparacion, video y relacionadas con Promise.allSettled.
 * El botón Volver debe regresar a Estado.origenDetalle conservando su estado.
 */
class VistaDetalle extends Pseudocomponente {
  constructor(contenedor, props = {}) {
    super(contenedor, props);
    this.estado = {
      id: props.id || null
    };
  }

  crear() {
    return DOM.crear("section", { clase: "vista vista--detalle" });
  }

  render() {
    DOM.vaciar(this.el);

    const cabecera = DOM.crear("header", { clase: "vista__cabecera" }, [
      DOM.crear("div", {}, [
        DOM.crear("h1", { clase: "vista__titulo", texto: "Detalle de receta" }),
        DOM.crear("p", {
          clase: "vista__subtitulo",
          texto: this.estado.id
            ? `Receta #${this.estado.id}`
            : "No se indicó una receta."
        })
      ]),
      DOM.crear("button", {
        clase: "boton boton--secundario",
        texto: "Volver",
        attrs: { type: "button", "data-accion": "volver" }
      })
    ]);

    const cuerpo = DOM.crear("div", { clase: "vista__cuerpo" }, [
      DOM.crear("p", {
        clase: "nota",
        texto:
          "TODO: lookup.php, caché en memoria, etiquetas normalizadas, ingredientes con imagen alternativa, pasos filtrados, video y recetas relacionadas."
      })
    ]);

    this.el.appendChild(cabecera);
    this.el.appendChild(cuerpo);
  }

  eventos() {
    this.escuchar(this.el, "click", (evento) => {
      if (evento.target.closest('[data-accion="volver"]')) {
        this.emitir("nav:volver", {});
      }
    });
  }

  actualizar(props = {}) {
    Object.assign(this.estado, props);
    if (this.el) this.render();
  }
}
