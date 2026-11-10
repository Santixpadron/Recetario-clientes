"use strict";

/**
 * Formulario de criterios combinables de Explorar.
 * Valida en línea y no hace peticiones si la entrada es inválida.
 * Emite "busqueda:aplicar" y "busqueda:limpiar".
 */
class FormularioBusqueda extends Pseudocomponente {
  constructor(contenedor, props = {}) {
    super(contenedor, props);
    this.estado = {
      categorias: props.categorias || [],
      origenes: props.origenes || [],
      ingredientes: props.ingredientes || [],
      criterios: {
        nombre: "",
        categoria: "",
        origen: "",
        ingrediente: "",
        ...(props.criterios || {})
      },
      seccion: props.seccion || "explorar"
    };
  }

  crear() {
    return DOM.crear("form", {
      clase: "formulario",
      attrs: { novalidate: true }
    });
  }

  render() {
    DOM.vaciar(this.el);

    const campoNombre = DOM.crear("div", { clase: "campo" }, [
      DOM.crear("label", {
        clase: "campo__etiqueta",
        texto: "Nombre",
        attrs: { for: "busqueda-nombre" }
      }),
      DOM.crear("input", {
        clase: "campo__control",
        id: "busqueda-nombre",
        name: "nombre",
        type: "search",
        value: this.estado.criterios.nombre,
        placeholder: "Ej. chicken",
        attrs: { minlength: 2, autocomplete: "off" }
      })
    ]);

    const campoCategoria = this._crearSelect(
      "busqueda-categoria",
      "Categoría",
      "Todas",
      this.estado.categorias,
      this.estado.criterios.categoria
    );

    const campoOrigen = this._crearSelect(
      "busqueda-origen",
      "Origen",
      "Todos",
      this.estado.origenes,
      this.estado.criterios.origen
    );

    const campoIngrediente = DOM.crear("div", { clase: "campo sugerencias" }, [
      DOM.crear("label", {
        clase: "campo__etiqueta",
        texto: "Ingrediente",
        attrs: { for: "busqueda-ingrediente" }
      }),
      DOM.crear("input", {
        clase: "campo__control",
        id: "busqueda-ingrediente",
        name: "ingrediente",
        type: "search",
        value: this.estado.criterios.ingrediente,
        placeholder: "Ej. garlic",
        attrs: { autocomplete: "off" }
      }),
      DOM.crear("ul", { clase: "sugerencias__lista", hidden: true })
    ]);

    this._nombre = campoNombre.querySelector("input");
    this._categoria = campoCategoria.querySelector("select");
    this._origen = campoOrigen.querySelector("select");
    this._ingrediente = campoIngrediente.querySelector("input");
    this._sugerencias = campoIngrediente.querySelector("ul");

    this._error = DOM.crear("p", {
      clase: "campo__error",
      attrs: { role: "alert", hidden: true }
    });

    const acciones = DOM.crear("div", { clase: "formulario__acciones" }, [
      DOM.crear("button", {
        clase: "boton boton--primario",
        texto: "Buscar",
        attrs: { type: "submit" }
      }),
      DOM.crear("button", {
        clase: "boton boton--secundario",
        texto: "Limpiar",
        attrs: { type: "button", "data-accion": "limpiar" }
      })
    ]);

    this.el.appendChild(
      DOM.crear("div", { clase: "formulario__rejilla" }, [
        campoNombre,
        campoCategoria,
        campoOrigen,
        campoIngrediente
      ])
    );
    this.el.appendChild(this._error);
    this.el.appendChild(acciones);
  }

  _crearSelect(id, etiqueta, opcionVacia, opciones, valor) {
    const select = DOM.crear("select", {
      clase: "campo__control",
      id,
      name: id
    });

    select.appendChild(DOM.crear("option", { value: "", texto: opcionVacia }));

    for (const opcion of opciones) {
      const nombre = opcion.nombre || opcion;
      select.appendChild(DOM.crear("option", { value: nombre, texto: nombre }));
    }

    select.value = valor || "";

    return DOM.crear("div", { clase: "campo" }, [
      DOM.crear("label", {
        clase: "campo__etiqueta",
        texto: etiqueta,
        attrs: { for: id }
      }),
      select
    ]);
  }

  eventos() {
    this.escuchar(this.el, "submit", (evento) => {
      evento.preventDefault();
      this._aplicar();
    });

    this.escuchar(this.el, "click", (evento) => {
      const limpiar = evento.target.closest('[data-accion="limpiar"]');
      if (limpiar) {
        this._limpiar();
        return;
      }

      const sugerencia = evento.target.closest("[data-sugerencia]");
      if (sugerencia) {
        this._ingrediente.value = sugerencia.dataset.sugerencia;
        this._ocultarSugerencias();
        this._ingrediente.focus();
      }
    });

    this.escuchar(this.el, "input", (evento) => {
      if (evento.target === this._ingrediente) this._filtrarSugerencias();
    });

    this.escuchar(this.el, "keydown", (evento) => {
      if (evento.key === "Escape") this._ocultarSugerencias();
    });

    this.escuchar(document, "click", (evento) => {
      if (!this.el.contains(evento.target)) this._ocultarSugerencias();
    });
  }

  _filtrarSugerencias() {
    const termino = this._ingrediente.value.trim().toLowerCase();
    DOM.vaciar(this._sugerencias);

    if (termino.length < 2) {
      this._sugerencias.hidden = true;
      return;
    }

    const coincidencias = this.estado.ingredientes
      .filter((item) => item.nombre.toLowerCase().includes(termino))
      .slice(0, 8);

    if (!coincidencias.length) {
      this._sugerencias.hidden = true;
      return;
    }

    for (const item of coincidencias) {
      this._sugerencias.appendChild(
        DOM.crear("li", {}, [
          DOM.crear("button", {
            clase: "sugerencias__boton",
            texto: item.nombre,
            attrs: { type: "button", "data-sugerencia": item.nombre }
          })
        ])
      );
    }

    this._sugerencias.hidden = false;
  }

  _aplicar() {
    const criterios = {
      nombre: this._nombre.value.trim(),
      categoria: this._categoria.value,
      origen: this._origen.value,
      ingrediente: this._ingrediente.value.trim()
    };

    if (criterios.nombre && criterios.nombre.length < 2) {
      this._mostrarError("El nombre debe tener al menos 2 caracteres.");
      this._nombre.focus();
      return;
    }

    if (criterios.ingrediente && criterios.ingrediente.length < 2) {
      this._mostrarError("El ingrediente debe tener al menos 2 caracteres.");
      this._ingrediente.focus();
      return;
    }

    if (
      !criterios.nombre &&
      !criterios.categoria &&
      !criterios.origen &&
      !criterios.ingrediente
    ) {
      this._mostrarError("Selecciona al menos un criterio.");
      return;
    }

    this._ocultarError();
    this.estado.criterios = criterios;
    this.emitir("busqueda:aplicar", criterios);
  }

  _limpiar() {
    this.estado.criterios = {
      nombre: "",
      categoria: "",
      origen: "",
      ingrediente: ""
    };

    this._nombre.value = "";
    this._categoria.value = "";
    this._origen.value = "";
    this._ingrediente.value = "";
    this._ocultarSugerencias();
    this._ocultarError();
    this.emitir("busqueda:limpiar", {});
  }

  _mostrarError(mensaje) {
    this._error.textContent = mensaje;
    this._error.hidden = false;
  }

  _ocultarError() {
    this._error.textContent = "";
    this._error.hidden = true;
  }

  _ocultarSugerencias() {
    if (!this._sugerencias) return;
    this._sugerencias.hidden = true;
    DOM.vaciar(this._sugerencias);
  }

  actualizar(props = {}) {
    Object.assign(this.estado, props);
    if (props.criterios) {
      this.estado.criterios = {
        ...this.estado.criterios,
        ...props.criterios
      };
    }
    if (this.el) this.render();
  }
}
