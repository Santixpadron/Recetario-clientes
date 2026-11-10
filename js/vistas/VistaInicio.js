"use strict";

/**
 * Vista de Inicio.
 * TODO: cargar random.php + categories.php con Promise.allSettled,
 * mostrar la receta destacada, evitar repetición consecutiva y pintar categorías.
 */
class VistaInicio extends Pseudocomponente {
  constructor(contenedor, props = {}) {
    super(contenedor, props);
    this.estado = {};
  }

  crear() {
    return DOM.crear("section", { clase: "vista vista--inicio" });
  }

  render() {
    DOM.vaciar(this.el);

    const cabecera = DOM.crear("header", { clase: "vista__cabecera" }, [
      DOM.crear("div", {}, [
        DOM.crear("h1", { clase: "vista__titulo", texto: "Inicio" }),
        DOM.crear("p", {
          clase: "vista__subtitulo",
          texto: "Una receta al azar y todas las categorías para empezar."
        })
      ])
    ]);

    const hero = DOM.crear("section", { clase: "hero" }, [
      DOM.crear("div", {}, [
        DOM.crear("p", { clase: "nota", texto: "Receta destacada" }),
        DOM.crear("h2", {
          clase: "hero__titulo",
          texto: "Pendiente: random.php"
        }),
        DOM.crear("p", {
          clase: "hero__texto",
          texto:
            "Aquí se mostrará la receta aleatoria con imagen, nombre, categoría y origen."
        }),
        DOM.crear("button", {
          clase: "boton boton--primario",
          texto: "Otra receta",
          attrs: { type: "button", "data-accion": "otra" }
        })
      ]),
      DOM.crear("div", {
        clase: "hero__media",
        texto: "Imagen de la receta destacada"
      })
    ]);

    const categorias = DOM.crear("section", {}, [
      DOM.crear("h2", { clase: "seccion__titulo", texto: "Categorías" }),
      DOM.crear(
        "div",
        { clase: "rejilla" },
        [1, 2, 3].map((numero) =>
          DOM.crear("article", { clase: "tarjeta" }, [
            DOM.crear("div", { clase: "tarjeta__imagen" }),
            DOM.crear("div", { clase: "tarjeta__cuerpo" }, [
              DOM.crear("h3", {
                clase: "tarjeta__titulo",
                texto: `Categoría ${numero}`
              }),
              DOM.crear("p", {
                clase: "tarjeta__meta",
                texto: "Pendiente: categories.php"
              })
            ])
          ])
        )
      )
    ]);

    this.el.appendChild(cabecera);
    this.el.appendChild(DOM.crear("div", { clase: "vista__cuerpo" }, [hero, categorias]));
    this.el.appendChild(
      DOM.crear("p", {
        clase: "nota",
        texto:
          "TODO: peticiones en paralelo con Promise.allSettled, estados de carga/error por sección y reintento independiente."
      })
    );
  }

  eventos() {
    this.escuchar(this.el, "click", (evento) => {
      if (evento.target.closest('[data-accion="otra"]')) {
        Aviso.mostrar(
          "Pendiente: implementar la receta destacada y el botón Otra receta.",
          "info"
        );
      }
    });
  }
}
