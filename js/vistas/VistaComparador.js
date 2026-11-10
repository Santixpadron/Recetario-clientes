"use strict";

/**
 * Vista del Comparador.
 * Compone dos PanelComparador reutilizados y la TablaComparacion.
 * Mantiene las recetas en Estado.comparador al navegar entre vistas.
 */
class VistaComparador extends Pseudocomponente {
  constructor(contenedor, props = {}) {
    super(contenedor, props);
    this.estado = {};
  }

  crear() {
    return DOM.crear("section", { clase: "vista vista--comparador" });
  }

  render() {
    this.destruirHijos();
    DOM.vaciar(this.el);

    const { A, B } = this.props.estado.comparador;

    const cabecera = DOM.crear("header", { clase: "vista__cabecera" }, [
      DOM.crear("div", {}, [
        DOM.crear("h1", { clase: "vista__titulo", texto: "Comparador" }),
        DOM.crear("p", {
          clase: "vista__subtitulo",
          texto: "Compara dos recetas y descubre cuál es más sencilla."
        })
      ])
    ]);

    const cuerpo = DOM.crear("div", { clase: "vista__cuerpo" });

    if (A && B) {
      cuerpo.appendChild(
        DOM.crear("div", { clase: "comparador__acciones" }, [
          DOM.crear("button", {
            clase: "boton boton--secundario",
            texto: "Intercambiar A y B",
            attrs: { type: "button", "data-accion": "intercambiar" }
          })
        ])
      );
    }

    const paneles = DOM.crear("div", { clase: "comparador__paneles" });
    cuerpo.appendChild(paneles);

    this.el.appendChild(cabecera);
    this.el.appendChild(cuerpo);

    this.agregarHijo(new PanelComparador(paneles, { panel: "A", receta: A }));
    this.agregarHijo(new PanelComparador(paneles, { panel: "B", receta: B }));

    if (A && B) {
      this.agregarHijo(
        new TablaComparacion(cuerpo, {
          comparacion: Comparacion.comparar(A, B),
          recetaA: A,
          recetaB: B
        })
      );
    } else {
      this.agregarHijo(
        new EstadoCarga(cuerpo, {
          variante: "vacio",
          tipo: "bloque",
          mensaje: "Agrega dos recetas para ver la comparación.",
          seccion: "comparador"
        })
      );
    }
  }

  eventos() {
    this.escuchar(this.el, "comparador:cambio", (evento) => {
      const { panel, receta } = evento.detail;
      const otro = panel === "A" ? "B" : "A";
      const otraReceta = this.props.estado.comparador[otro];

      if (otraReceta && otraReceta.id === receta.id) {
        Aviso.mostrar("No puedes comparar una receta consigo misma.", "error");
        return;
      }

      this.props.estado.comparador[panel] = receta;
      this.render();
      this.emitir("comparador:estado", {
        ...this.props.estado.comparador
      });
    });

    this.escuchar(this.el, "comparador:vaciar", (evento) => {
      const { panel } = evento.detail;
      this.props.estado.comparador[panel] = null;
      this.render();
      this.emitir("comparador:estado", {
        ...this.props.estado.comparador
      });
    });

    this.escuchar(this.el, "click", (evento) => {
      const boton = evento.target.closest('[data-accion="intercambiar"]');
      if (!boton) return;

      const { A, B } = this.props.estado.comparador;
      this.props.estado.comparador.A = B;
      this.props.estado.comparador.B = A;
      this.render();
      this.emitir("comparador:estado", {
        ...this.props.estado.comparador
      });
    });
  }
}
