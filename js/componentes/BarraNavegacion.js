"use strict";

/**
 * Barra de navegación permanente.
 * Emite "nav:ir" con { vista }.
 */
class BarraNavegacion extends Pseudocomponente {
  constructor(contenedor, props = {}) {
    super(contenedor, props);
    this.estado = {
      vistaActiva: props.vistaActiva || "inicio",
      cantidadComparador: props.cantidadComparador || 0
    };
  }

  crear() {
    return DOM.crear("nav", {
      clase: "nav",
      attrs: { "aria-label": "Navegación principal" }
    });
  }

  render() {
    DOM.vaciar(this.el);

    const marca = DOM.crear(
      "a",
      {
        clase: "nav__marca",
        href: "#inicio",
        dataset: { vista: "inicio" }
      },
      [
        DOM.crear("img", {
          src: "assets/icono.svg",
          alt: "",
          attrs: { "aria-hidden": "true" }
        }),
        "Recetario"
      ]
    );

    const enlaces = [
      { vista: "inicio", etiqueta: "Inicio" },
      { vista: "explorar", etiqueta: "Explorar" },
      { vista: "categorias", etiqueta: "Categorías y orígenes" },
      { vista: "comparador", etiqueta: "Comparador" }
    ];

    const lista = DOM.crear("ul", { clase: "nav__lista" });

    for (const enlace of enlaces) {
      const activo = enlace.vista === this.estado.vistaActiva;

      const contenido = [enlace.etiqueta];

      if (enlace.vista === "comparador") {
        contenido.push(
          DOM.crear("span", {
            clase: "nav__badge",
            texto: String(this.estado.cantidadComparador),
            attrs: {
              "aria-label": `${this.estado.cantidadComparador} recetas en el comparador`
            }
          })
        );
      }

      const item = DOM.crear("li", {}, [
        DOM.crear(
          "a",
          {
            clase: "nav__enlace",
            href: `#${enlace.vista}`,
            dataset: { vista: enlace.vista },
            attrs: activo ? { "aria-current": "page" } : {}
          },
          contenido
        )
      ]);

      lista.appendChild(item);
    }

    this.el.appendChild(marca);
    this.el.appendChild(lista);
  }

  eventos() {
    this.escuchar(this.el, "click", (evento) => {
      const enlace = evento.target.closest("[data-vista]");
      if (!enlace) return;
      evento.preventDefault();
      this.emitir("nav:ir", { vista: enlace.dataset.vista });
    });
  }

  actualizar(props = {}) {
    Object.assign(this.estado, props);
    if (this.el) this.render();
  }
}
