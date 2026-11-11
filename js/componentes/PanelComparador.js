"use strict";

/**
 * PanelComparador — panel A o B del comparador.
 *
 * Responsabilidad del Integrante 2. Busca recetas con debounce de 400 ms y
 * `AbortController`, permite elegir con ratón o teclado y emite:
 *   - `seleccionar-receta-panel` → { indice, receta }
 *   - `vaciar-panel-comparador`  → { indice }
 */
class PanelComparador {
  constructor(contenedor, props = {}) {
    this.contenedor = contenedor;
    this.props = { indice: "A", receta: null, ...props };
    this.estado = {
      receta: this.props.receta || null,
      sugerencias: [],
      indiceActivo: -1,
      cargando: false,
      error: ""
    };

    this.destruido = false;
    this.temporizador = null;
    this.controlador = null;
    this.consultaActual = "";

    this.idBase = `panel-${String(this.props.indice).toLowerCase()}`;

    this.elemento = document.createElement("section");
    this.elemento.className = "panel-comparador";
    this.elemento.setAttribute("aria-labelledby", `${this.idBase}-titulo`);

    this.manejadorClick = (evento) => {
      const quitar = evento.target.closest("[data-accion='quitar']");
      if (quitar) {
        this.elemento.dispatchEvent(
          new CustomEvent("vaciar-panel-comparador", {
            bubbles: true,
            detail: { indice: this.props.indice }
          })
        );
      }
    };

    this.elemento.addEventListener("click", this.manejadorClick);
    if (contenedor) contenedor.appendChild(this.elemento);

    this.renderizar();
  }

  actualizar(props = {}) {
    if (this.destruido) return;

    this.props = { ...this.props, ...props };
    if (Object.prototype.hasOwnProperty.call(props, "receta")) {
      this.estado.receta = props.receta || null;
      this.estado.sugerencias = [];
      this.estado.error = "";
    }

    this.renderizar();
  }

  renderizar() {
    if (this.destruido) return;

    this.elemento.textContent = "";

    const cabecera = document.createElement("div");
    cabecera.className = "panel-cabecera";

    const titulo = document.createElement("h3");
    titulo.className = "panel-titulo";
    titulo.id = `${this.idBase}-titulo`;

    const letra = document.createElement("span");
    letra.className = "panel-letra";
    letra.setAttribute("aria-hidden", "true");
    letra.textContent = this.props.indice;

    const textoTitulo = document.createElement("span");
    textoTitulo.textContent = `Receta ${this.props.indice}`;

    titulo.append(letra, textoTitulo);
    cabecera.appendChild(titulo);

    if (this.estado.receta) {
      const quitar = document.createElement("button");
      quitar.type = "button";
      quitar.className = "boton boton--fantasma boton--chico";
      quitar.dataset.accion = "quitar";
      quitar.textContent = "Quitar";
      quitar.setAttribute("aria-label", `Quitar la receta del panel ${this.props.indice}`);
      cabecera.appendChild(quitar);
    }

    this.elemento.appendChild(cabecera);

    if (this.estado.receta) this.renderizarReceta();
    else this.renderizarBuscador();
  }

  renderizarReceta() {
    const receta = this.estado.receta;

    const ficha = document.createElement("div");
    ficha.className = "panel-receta";

    const imagen = document.createElement("img");
    imagen.className = "panel-receta-imagen";
    imagen.src = receta.imagen || "assets/ingrediente-default.svg";
    imagen.alt = receta.imagen ? `Fotografía de ${receta.nombre}` : "";
    imagen.width = 74;
    imagen.height = 74;
    imagen.addEventListener("error", () => {
      imagen.onerror = null;
      imagen.src = "assets/ingrediente-default.svg";
    });

    const info = document.createElement("div");
    info.className = "panel-receta-info";

    const nombre = document.createElement("span");
    nombre.className = "panel-receta-nombre";
    nombre.textContent = receta.nombre;

    const meta = document.createElement("span");
    meta.className = "texto-ayuda";
    meta.textContent = [receta.categoria, receta.origen].filter(Boolean).join(" · ");

    info.append(nombre, meta);
    ficha.append(imagen, info);
    this.elemento.appendChild(ficha);

    const ingredientes = Array.isArray(receta.ingredientes) ? receta.ingredientes.length : 0;
    const pasos = Array.isArray(receta.pasos) ? receta.pasos.length : 0;

    const resumen = document.createElement("p");
    resumen.className = "texto-ayuda";
    resumen.textContent = `${ingredientes} ingredientes · ${pasos} pasos`;
    this.elemento.appendChild(resumen);
  }

  renderizarBuscador() {
    const vacio = document.createElement("div");
    vacio.className = "panel-vacio";

    const etiqueta = document.createElement("label");
    etiqueta.className = "campo-etiqueta";
    etiqueta.htmlFor = `${this.idBase}-busqueda`;
    etiqueta.textContent = `Buscar receta para el panel ${this.props.indice}`;

    const contenedorBusqueda = document.createElement("div");
    contenedorBusqueda.className = "panel-busqueda";

    const input = document.createElement("input");
    input.className = "campo-control";
    input.id = `${this.idBase}-busqueda`;
    input.type = "search";
    input.placeholder = "Ej. chicken, pasta, rice…";
    input.autocomplete = "off";
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-expanded", "false");
    input.setAttribute("aria-controls", `${this.idBase}-sugerencias`);

    const lista = document.createElement("ul");
    lista.className = "sugerencias";
    lista.id = `${this.idBase}-sugerencias`;
    lista.setAttribute("role", "listbox");
    lista.setAttribute("aria-label", `Sugerencias para el panel ${this.props.indice}`);
    lista.hidden = true;

    const estado = document.createElement("p");
    estado.className = "solo-lectores";
    estado.setAttribute("role", "status");

    const ayuda = document.createElement("p");
    ayuda.className = "texto-ayuda";
    ayuda.textContent = "Escribe al menos 2 caracteres y elige una receta.";

    contenedorBusqueda.append(input, lista, estado);
    vacio.append(etiqueta, contenedorBusqueda, ayuda);
    this.elemento.appendChild(vacio);

    this.input = input;
    this.lista = lista;
    this.estadoAnuncio = estado;

    input.addEventListener("input", () => this.programarBusqueda());
    input.addEventListener("keydown", (evento) => this.manejarTeclado(evento));
  }

  programarBusqueda() {
    if (this.destruido || !this.input) return;

    window.clearTimeout(this.temporizador);
    if (this.controlador) this.controlador.abort();

    const consulta = this.input.value.trim();
    this.consultaActual = consulta;
    this.estado.indiceActivo = -1;

    if (consulta.length < 2) {
      this.estado.sugerencias = [];
      this.ocultarSugerencias();
      if (this.estadoAnuncio) this.estadoAnuncio.textContent = "";
      return;
    }

    this.temporizador = window.setTimeout(() => this.buscar(consulta), 400);
  }

  async buscar(consulta) {
    if (this.destruido) return;

    this.controlador = new AbortController();
    const { signal } = this.controlador;

    if (this.estadoAnuncio) this.estadoAnuncio.textContent = "Buscando recetas…";

    try {
      const resultados = await ServicioApi.buscarPorNombre(consulta, signal);

      if (this.destruido || consulta !== this.consultaActual) return;

      this.estado.sugerencias = resultados
        .filter((receta) => receta.id && receta.nombre)
        .slice(0, 6);
      this.estado.indiceActivo = -1;
      this.renderizarSugerencias();

      if (this.estadoAnuncio) {
        this.estadoAnuncio.textContent =
          this.estado.sugerencias.length === 0
            ? "No se encontraron recetas."
            : `${this.estado.sugerencias.length} sugerencias disponibles.`;
      }
    } catch (error) {
      if (this.destruido || ServicioApi.esCancelacion(error)) return;
      this.estado.sugerencias = [];
      this.ocultarSugerencias();
      if (this.estadoAnuncio) {
        this.estadoAnuncio.textContent = error.message || "No se pudo buscar.";
      }
    }
  }

  renderizarSugerencias() {
    if (this.destruido || !this.lista) return;

    this.lista.textContent = "";
    const sugerencias = this.estado.sugerencias;

    if (sugerencias.length === 0) {
      this.ocultarSugerencias();
      return;
    }

    sugerencias.forEach((receta, indice) => {
      const item = document.createElement("li");
      item.className = "sugerencia";
      item.id = `${this.idBase}-opcion-${indice}`;
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", "false");
      item.dataset.indice = String(indice);

      const nombre = document.createElement("strong");
      nombre.textContent = receta.nombre;

      const meta = document.createElement("span");
      meta.className = "texto-ayuda";
      meta.textContent = [receta.categoria, receta.origen].filter(Boolean).join(" · ");

      item.append(nombre);
      if (meta.textContent) item.append(document.createTextNode(" — "), meta);

      item.addEventListener("click", () => this.seleccionar(indice));
      this.lista.appendChild(item);
    });

    this.lista.hidden = false;
    this.input.setAttribute("aria-expanded", "true");
  }

  ocultarSugerencias() {
    if (!this.lista) return;
    this.lista.hidden = true;
    this.lista.textContent = "";
    this.input.setAttribute("aria-expanded", "false");
    this.input.removeAttribute("aria-activedescendant");
  }

  manejarTeclado(evento) {
    const sugerencias = this.estado.sugerencias;
    if (sugerencias.length === 0) return;

    if (evento.key === "ArrowDown" || evento.key === "ArrowUp") {
      evento.preventDefault();
      const delta = evento.key === "ArrowDown" ? 1 : -1;
      const total = sugerencias.length;
      const siguiente = (this.estado.indiceActivo + delta + total) % total;
      this.marcarActivo(siguiente);
      return;
    }

    if (evento.key === "Enter" && this.estado.indiceActivo >= 0) {
      evento.preventDefault();
      this.seleccionar(this.estado.indiceActivo);
      return;
    }

    if (evento.key === "Escape") {
      this.ocultarSugerencias();
      this.estado.indiceActivo = -1;
    }
  }

  marcarActivo(indice) {
    this.estado.indiceActivo = indice;
    const opciones = Array.from(this.lista.querySelectorAll("[role='option']"));

    opciones.forEach((opcion, posicion) => {
      const activa = posicion === indice;
      opcion.classList.toggle("activa", activa);
      opcion.setAttribute("aria-selected", String(activa));
    });

    const activa = opciones[indice];
    if (activa) {
      this.input.setAttribute("aria-activedescendant", activa.id);
      activa.scrollIntoView({ block: "nearest" });
    }
  }

  seleccionar(indice) {
    const receta = this.estado.sugerencias[indice];
    if (!receta || this.destruido) return;

    this.estado.receta = receta;
    this.estado.sugerencias = [];
    this.ocultarSugerencias();
    this.renderizar();

    this.elemento.dispatchEvent(
      new CustomEvent("seleccionar-receta-panel", {
        bubbles: true,
        detail: { indice: this.props.indice, receta }
      })
    );
  }

  destruir() {
    if (this.destruido) return;

    this.destruido = true;
    window.clearTimeout(this.temporizador);
    if (this.controlador) this.controlador.abort();
    this.elemento.removeEventListener("click", this.manejadorClick);
    this.elemento.remove();
    this.elemento = null;
    this.input = null;
    this.lista = null;
    this.estadoAnuncio = null;
  }
}
