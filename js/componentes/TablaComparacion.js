"use strict";

/**
 * Tabla de métricas del comparador.
 * Resalta el menor valor en las métricas numéricas.
 */
class TablaComparacion extends Pseudocomponente {
  constructor(contenedor, props = {}) {
    super(contenedor, props);
    this.estado = {
      comparacion: props.comparacion || null,
      recetaA: props.recetaA || null,
      recetaB: props.recetaB || null
    };
  }

  crear() {
    return DOM.crear("section", {
      clase: "comparacion",
      attrs: { "aria-label": "Comparación de recetas" }
    });
  }

  render() {
    DOM.vaciar(this.el);

    const comparacion = this.estado.comparacion;
    if (!comparacion) {
      this.el.appendChild(
        DOM.crear("p", {
          clase: "nota",
          texto: "Agrega dos recetas para ver la comparación."
        })
      );
      return;
    }

    const nombreA = this.estado.recetaA?.nombre || "Receta A";
    const nombreB = this.estado.recetaB?.nombre || "Receta B";

    this.el.appendChild(
      DOM.crear("div", { clase: "comparacion__aviso" }, [
        DOM.crear("strong", { texto: "Receta más sencilla: " }),
        document.createTextNode(this._textoMasSencilla(comparacion, nombreA, nombreB))
      ])
    );

    const tabla = DOM.crear("table");
    const thead = DOM.crear("thead");
    thead.appendChild(
      DOM.crear("tr", {}, [
        DOM.crear("th", { texto: "Métrica", attrs: { scope: "col" } }),
        DOM.crear("th", { texto: `A: ${nombreA}`, attrs: { scope: "col" } }),
        DOM.crear("th", { texto: `B: ${nombreB}`, attrs: { scope: "col" } })
      ])
    );

    const tbody = DOM.crear("tbody");
    tbody.appendChild(
      this._filaNumerica(
        "Cantidad de ingredientes",
        comparacion.ingredientesA,
        comparacion.ingredientesB
      )
    );
    tbody.appendChild(
      this._filaNumerica(
        "Cantidad de pasos",
        comparacion.pasosA,
        comparacion.pasosB
      )
    );
    tbody.appendChild(
      this._filaNumerica(
        "Palabras en las instrucciones",
        comparacion.palabrasA,
        comparacion.palabrasB
      )
    );
    tbody.appendChild(
      this._filaCoincidencia(
        "Categoría",
        this.estado.recetaA?.categoria,
        this.estado.recetaB?.categoria,
        comparacion.mismaCategoria
      )
    );
    tbody.appendChild(
      this._filaCoincidencia(
        "Origen",
        this.estado.recetaA?.origen,
        this.estado.recetaB?.origen,
        comparacion.mismoOrigen
      )
    );
    tbody.appendChild(
      this._filaTexto(
        "Etiquetas en común",
        this._lista(comparacion.etiquetasComunes, "Ninguna")
      )
    );
    tbody.appendChild(
      this._filaVideo(comparacion.videoA, comparacion.videoB)
    );
    tbody.appendChild(
      this._filaTexto(
        "Ingredientes en común",
        this._lista(comparacion.ingredientesComunes, "Ninguno")
      )
    );
    tbody.appendChild(
      this._filaTexto(
        "Ingredientes solo en A",
        this._lista(comparacion.ingredientesSoloA, "Ninguno")
      )
    );
    tbody.appendChild(
      this._filaTexto(
        "Ingredientes solo en B",
        this._lista(comparacion.ingredientesSoloB, "Ninguno")
      )
    );
    tbody.appendChild(this._filaSimilitud(comparacion.similitud));

    tabla.appendChild(thead);
    tabla.appendChild(tbody);
    this.el.appendChild(tabla);
  }

  _filaNumerica(etiqueta, a, b) {
    const menor = Comparacion.menor(a, b);

    return DOM.crear("tr", {}, [
      DOM.crear("th", { texto: etiqueta, attrs: { scope: "row" } }),
      DOM.crear("td", {
        clase: menor === "A" ? "comparacion__menor" : "",
        texto: String(a)
      }),
      DOM.crear("td", {
        clase: menor === "B" ? "comparacion__menor" : "",
        texto: String(b)
      })
    ]);
  }

  _filaCoincidencia(etiqueta, a, b, coincide) {
    const textoEstado = coincide ? "Coinciden" : "No coinciden";
    const clase = coincide
      ? "comparacion__coincide"
      : "comparacion__no-coincide";

    return DOM.crear("tr", {}, [
      DOM.crear("th", { texto: etiqueta, attrs: { scope: "row" } }),
      DOM.crear("td", {}, [
        document.createTextNode(`${a || "—"} `),
        DOM.crear("span", { clase, texto: textoEstado })
      ]),
      DOM.crear("td", {}, [
        document.createTextNode(`${b || "—"} `),
        DOM.crear("span", { clase, texto: textoEstado })
      ])
    ]);
  }

  _filaTexto(etiqueta, valor) {
    return DOM.crear("tr", {}, [
      DOM.crear("th", { texto: etiqueta, attrs: { scope: "row" } }),
      DOM.crear("td", { texto: valor, attrs: { colspan: 2 } })
    ]);
  }

  _filaVideo(a, b) {
    return DOM.crear("tr", {}, [
      DOM.crear("th", { texto: "Video", attrs: { scope: "row" } }),
      DOM.crear("td", { texto: a ? "Sí" : "No" }),
      DOM.crear("td", { texto: b ? "Sí" : "No" })
    ]);
  }

  _filaSimilitud(similitud) {
    return DOM.crear("tr", {}, [
      DOM.crear("th", { texto: "Similitud", attrs: { scope: "row" } }),
      DOM.crear("td", { texto: `${similitud}%`, attrs: { colspan: 2 } })
    ]);
  }

  _lista(valores, vacio) {
    return valores?.length ? valores.join(", ") : vacio;
  }

  _textoMasSencilla(comparacion, nombreA, nombreB) {
    if (comparacion.masSencilla === "empate") return "Empate.";
    return comparacion.masSencilla === "A"
      ? `A (${nombreA}).`
      : `B (${nombreB}).`;
  }

  actualizar(props = {}) {
    Object.assign(this.estado, props);
    if (this.el) this.render();
  }
}
