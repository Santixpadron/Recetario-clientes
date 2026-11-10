"use strict";

/**
 * Lista de ingredientes con imagen, nombre y medida.
 * Si la imagen no carga, usa la imagen alternativa de la pareja.
 */
class ListaIngredientes extends Pseudocomponente {
  constructor(contenedor, props = {}) {
    super(contenedor, props);
    this.estado = {
      ingredientes: props.ingredientes || [],
      imagenAlternativa:
        props.imagenAlternativa || "assets/ingrediente-placeholder.svg"
    };
  }

  crear() {
    return DOM.crear("ul", { clase: "lista-ingredientes" });
  }

  render() {
    DOM.vaciar(this.el);

    if (!this.estado.ingredientes.length) {
      this.el.appendChild(
        DOM.crear("li", {
          clase: "nota",
          texto: "Esta receta no tiene ingredientes registrados."
        })
      );
      return;
    }

    for (const ingrediente of this.estado.ingredientes) {
      const imagen = DOM.crear("img", {
        clase: "ingrediente__imagen",
        src: ingrediente.imagen || this.estado.imagenAlternativa,
        alt: ingrediente.nombre,
        loading: "lazy"
      });

      imagen.addEventListener(
        "error",
        () => {
          imagen.src = this.estado.imagenAlternativa;
        },
        { once: true }
      );

      this.el.appendChild(
        DOM.crear("li", { clase: "ingrediente" }, [
          imagen,
          DOM.crear("div", {}, [
            DOM.crear("div", {
              clase: "ingrediente__nombre",
              texto: ingrediente.nombre
            }),
            ingrediente.medida
              ? DOM.crear("div", {
                  clase: "ingrediente__medida",
                  texto: ingrediente.medida
                })
              : null
          ])
        ])
      );
    }
  }

  actualizar(props = {}) {
    Object.assign(this.estado, props);
    if (this.el) this.render();
  }
}
