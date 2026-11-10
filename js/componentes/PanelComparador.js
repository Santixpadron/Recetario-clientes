"use strict";

/**
 * Panel A/B del comparador.
 * Buscador interno con debounce de 400 ms y cancelación con AbortController.
 * Emite "comparador:cambio" y "comparador:vaciar".
 */
class PanelComparador extends Pseudocomponente {
  constructor(contenedor, props = {}) {
    super(contenedor, props);
    this.estado = {
      panel: props.panel || "A",
      receta: props.receta || null,
      resultados: [],
      buscando: false
    };
    this._busquedaAbort = null;
    this._debounceId = null;
  }

  crear() {
    return DOM.crear("section", {
      clase: "panel",
      attrs: { "aria-labelledby": `panel-${this.estado.panel}-titulo` }
    });
  }

  render() {
    DOM.vaciar(this.el);
    const id = `panel-${this.estado.panel}`;

    const cabecera = DOM.crear("div", { clase: "panel__cabecera" }, [
      DOM.crear("h2", {
        clase: "panel__titulo",
        texto: `Receta ${this.estado.panel}`,
        attrs: { id: `${id}-titulo` }
      })
    ]);

    if (this.estado.receta) {
      cabecera.appendChild(
        DOM.crear("button", {
          clase: "boton boton--fantasma",
          texto: "Vaciar",
          attrs: { type: "button", "data-accion": "vaciar" }
        })
      );
    }

    const campo = DOM.crear("div", { clase: "campo sugerencias" }, [
      DOM.crear("label", {
        clase: "campo__etiqueta",
        texto: "Buscar receta",
        attrs: { for: `${id}-buscar` }
      }),
      DOM.crear("input", {
        clase: "campo__control",
        id: `${id}-buscar`,
        type: "search",
        placeholder: "Escribe al menos 2 caracteres…",
        attrs: { autocomplete: "off" }
      }),
      DOM.crear("ul", { clase: "panel__resultados", hidden: true }),
      DOM.crear("p", {
        clase: "campo__error",
        attrs: { role: "alert", hidden: true }
      })
    ]);

    this._input = campo.querySelector("input");
    this._resultados = campo.querySelector("ul");
    this._error = campo.querySelector(".campo__error");

    this.el.appendChild(cabecera);
    this.el.appendChild(campo);

    if (this.estado.receta) {
      this.el.appendChild(this._crearReceta(this.estado.receta));
    } else {
      this.el.appendChild(
        DOM.crear("p", {
          clase: "panel__vacio",
          texto: "Todavía no hay una receta en este panel."
        })
      );
    }
  }

  _crearReceta(receta) {
    const imagen = DOM.crear("img", {
      clase: "panel__imagen",
      src: receta.imagen || "assets/receta-placeholder.svg",
      alt: receta.nombre,
      loading: "lazy"
    });

    imagen.addEventListener(
      "error",
      () => {
        imagen.src = "assets/receta-placeholder.svg";
      },
      { once: true }
    );

    const meta = [receta.categoria, receta.origen].filter(Boolean).join(" · ");

    return DOM.crear("div", { clase: "panel__receta" }, [
      imagen,
      DOM.crear("h3", { clase: "tarjeta__titulo", texto: receta.nombre }),
      meta ? DOM.crear("p", { clase: "tarjeta__meta", texto: meta }) : null
    ]);
  }

  eventos() {
    this.escuchar(this.el, "input", (evento) => {
      if (evento.target === this._input) this._programarBusqueda();
    });

    this.escuchar(this.el, "keydown", (evento) => {
      if (evento.key === "Escape") this._ocultarResultados();
    });

    this.escuchar(this.el, "click", (evento) => {
      const vaciar = evento.target.closest('[data-accion="vaciar"]');
      if (vaciar) {
        this.emitir("comparador:vaciar", { panel: this.estado.panel });
        return;
      }

      const resultado = evento.target.closest("[data-id]");
      if (!resultado) return;

      const receta = this.estado.resultados.find(
        (item) => item.id === resultado.dataset.id
      );
      if (!receta) return;

      this.emitir("comparador:cambio", {
        panel: this.estado.panel,
        receta
      });

      this._input.value = "";
      this._ocultarResultados();
      this._ocultarError();
    });

    this.escuchar(document, "click", (evento) => {
      if (!this.el.contains(evento.target)) this._ocultarResultados();
    });
  }

  _programarBusqueda() {
    this.cancelarTemporizador(this._debounceId);
    this._busquedaAbort?.abort();
    this._busquedaAbort = null;

    const termino = this._input.value.trim();
    DOM.vaciar(this._resultados);
    this._resultados.hidden = true;

    if (!termino) {
      this._ocultarError();
      return;
    }

    if (termino.length < 2) {
      this._mostrarError("Escribe al menos 2 caracteres.");
      return;
    }

    this._ocultarError();
    this._debounceId = this.temporizador(() => this._buscar(termino), 400);
  }

  async _buscar(termino) {
    this._busquedaAbort?.abort();
    this._busquedaAbort = new AbortController();
    const { signal } = this._busquedaAbort;

    this.estado.buscando = true;
    this._mostrarBuscando();

    try {
      const data = await API.buscarPorNombre(termino, { signal });
      if (signal.aborted) return;

      this.estado.resultados = Recetas.recetasDesdeRespuesta(data);
      this.estado.buscando = false;
      this._renderResultados();
    } catch (error) {
      if (error.name === "AbortError") return;
      this.estado.buscando = false;
      this._mostrarError(error.message || "No se pudo buscar.");
    }
  }

  _mostrarBuscando() {
    DOM.vaciar(this._resultados);
    this._resultados.appendChild(
      DOM.crear("li", { clase: "panel__vacio", texto: "Buscando…" })
    );
    this._resultados.hidden = false;
  }

  _renderResultados() {
    DOM.vaciar(this._resultados);

    if (!this.estado.resultados.length) {
      this._resultados.appendChild(
        DOM.crear("li", { clase: "panel__vacio", texto: "Sin resultados." })
      );
      this._resultados.hidden = false;
      return;
    }

    for (const receta of this.estado.resultados) {
      const boton = DOM.crear(
        "button",
        {
          clase: "panel__resultado",
          attrs: { type: "button", "data-id": receta.id }
        },
        [
          DOM.crear("img", {
            src: receta.imagen || "assets/receta-placeholder.svg",
            alt: "",
            loading: "lazy"
          }),
          DOM.crear("span", { clase: "panel__resultado-texto" }, [
            DOM.crear("span", {
              clase: "panel__resultado-nombre",
              texto: receta.nombre
            }),
            DOM.crear("span", {
              clase: "panel__resultado-meta",
              texto: [receta.categoria, receta.origen]
                .filter(Boolean)
                .join(" · ")
            })
          ])
        ]
      );

      this._resultados.appendChild(DOM.crear("li", {}, [boton]));
    }

    this._resultados.hidden = false;
  }

  _mostrarError(mensaje) {
    this._error.textContent = mensaje;
    this._error.hidden = false;
  }

  _ocultarError() {
    this._error.textContent = "";
    this._error.hidden = true;
  }

  _ocultarResultados() {
    if (!this._resultados) return;
    this._resultados.hidden = true;
    DOM.vaciar(this._resultados);
  }

  actualizar(props = {}) {
    Object.assign(this.estado, props);
    if (this.el) this.render();
  }

  destruir() {
    this._busquedaAbort?.abort();
    this._busquedaAbort = null;
    this.cancelarTemporizador(this._debounceId);
    super.destruir();
  }
}
