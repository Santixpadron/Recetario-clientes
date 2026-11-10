"use strict";

/**
 * Vista de Categorías y Orígenes.
 * TODO: categories.php y list.php?a=list; ficha con descripción completa,
 * cantidad de recetas y tarjetas con la misma paginación de Explorar.
 */
class VistaCategoriasOrigenes extends Pseudocomponente {
  constructor(contenedor, props = {}) {
    super(contenedor, props);
    this.estado = {
      pestana: props.estado?.categorias?.pestana || "categorias"
    };
  }

  crear() {
    return DOM.crear("section", { clase: "vista vista--categorias" });
  }

  render() {
    DOM.vaciar(this.el);

    const cabecera = DOM.crear("header", { clase: "vista__cabecera" }, [
      DOM.crear("div", {}, [
        DOM.crear("h1", {
          clase: "vista__titulo",
          texto: "Categorías y orígenes"
        }),
        DOM.crear("p", {
          clase: "vista__subtitulo",
          texto: "Explora las recetas por tipo de plato o por cocina."
        })
      ])
    ]);

    const pestanas = DOM.crear("div", {
      clase: "pestanas",
      attrs: { role: "tablist", "aria-label": "Categorías y orígenes" }
    });

    const opciones = [
      { valor: "categorias", etiqueta: "Categorías" },
      { valor: "origenes", etiqueta: "Orígenes" }
    ];

    for (const opcion of opciones) {
      const activa = this.estado.pestana === opcion.valor;
      pestanas.appendChild(
        DOM.crear("button", {
          clase: "pestana",
          texto: opcion.etiqueta,
          attrs: {
            type: "button",
            role: "tab",
            "aria-selected": activa ? "true" : "false",
            "data-pestana": opcion.valor
          }
        })
      );
    }

    const cuerpo = DOM.crear("div", { clase: "vista__cuerpo" }, [
      DOM.crear("p", {
        clase: "nota",
        texto:
          "TODO: cargar categorías y orígenes, mostrar la ficha seleccionada, el conteo de recetas y la paginación reutilizando TarjetaReceta y Paginador."
      })
    ]);

    this.el.appendChild(cabecera);
    this.el.appendChild(pestanas);
    this.el.appendChild(cuerpo);
  }

  eventos() {
    this.escuchar(this.el, "click", (evento) => {
      const pestana = evento.target.closest("[data-pestana]");
      if (!pestana) return;

      this.estado.pestana = pestana.dataset.pestana;
      this.props.estado.categorias.pestana = this.estado.pestana;
      this.render();
    });
  }
}
