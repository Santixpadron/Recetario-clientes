"use strict";

/**
 * FormularioBusqueda — filtros combinados de Explorar.
 *
 * PROVISIONAL — archivo asignado al Integrante 1.
 * Emite `ejecutar-busqueda` con `{ nombre, categoria, origen, ingrediente }`
 * y `limpiar-busqueda`.
 */
class FormularioBusqueda {
  constructor(contenedor, props = {}) {
    this.contenedor = contenedor;
    this.props = { criterios: {}, ...props };
    this.destruido = false;

    this.elemento = document.createElement("form");
    this.elemento.className = "formulario-busqueda";
    this.elemento.noValidate = true;

    this.manejadorSubmit = (evento) => {
      evento.preventDefault();
      this.elemento.dispatchEvent(
        new CustomEvent("ejecutar-busqueda", {
          bubbles: true,
          detail: this.obtenerCriterios()
        })
      );
    };

    this.manejadorClick = (evento) => {
      if (!evento.target.closest("[data-accion='limpiar']")) return;
      this.elemento.reset();
      this.elemento.dispatchEvent(
        new CustomEvent("limpiar-busqueda", { bubbles: true })
      );
    };

    this.elemento.addEventListener("submit", this.manejadorSubmit);
    this.elemento.addEventListener("click", this.manejadorClick);

    if (contenedor) contenedor.appendChild(this.elemento);

    this.renderizar();
    this.cargarOpciones();
  }

  renderizar() {
    if (this.destruido) return;

    this.elemento.textContent = "";

    this.elemento.appendChild(
      this.crearCampo({
        id: "filtro-nombre",
        etiqueta: "Nombre",
        tipo: "search",
        marcador: "Ej. chicken, pasta…"
      })
    );

    this.elemento.appendChild(
      this.crearSelect({
        id: "filtro-categoria",
        etiqueta: "Categoría",
        textoInicial: "Todas las categorías"
      })
    );

    this.elemento.appendChild(
      this.crearSelect({
        id: "filtro-origen",
        etiqueta: "Origen",
        textoInicial: "Todos los orígenes"
      })
    );

    this.elemento.appendChild(
      this.crearCampo({
        id: "filtro-ingrediente",
        etiqueta: "Ingrediente",
        tipo: "search",
        marcador: "Ej. garlic, rice…"
      })
    );

    const acciones = document.createElement("div");
    acciones.className = "formulario-acciones";

    const buscar = document.createElement("button");
    buscar.type = "submit";
    buscar.className = "boton boton--primario";
    buscar.textContent = "Buscar recetas";

    const limpiar = document.createElement("button");
    limpiar.type = "button";
    limpiar.className = "boton boton--secundario";
    limpiar.dataset.accion = "limpiar";
    limpiar.textContent = "Limpiar";

    acciones.append(buscar, limpiar);
    this.elemento.appendChild(acciones);

    this.aplicarCriterios(this.props.criterios || {});
  }

  crearCampo({ id, etiqueta, tipo, marcador }) {
    const campo = document.createElement("div");
    campo.className = "campo";

    const label = document.createElement("label");
    label.className = "campo-etiqueta";
    label.htmlFor = id;
    label.textContent = etiqueta;

    const input = document.createElement("input");
    input.className = "campo-control";
    input.id = id;
    input.name = id.replace("filtro-", "");
    input.type = tipo;
    input.placeholder = marcador;
    input.autocomplete = "off";

    campo.append(label, input);
    return campo;
  }

  crearSelect({ id, etiqueta, textoInicial }) {
    const campo = document.createElement("div");
    campo.className = "campo";

    const label = document.createElement("label");
    label.className = "campo-etiqueta";
    label.htmlFor = id;
    label.textContent = etiqueta;

    const select = document.createElement("select");
    select.className = "campo-control";
    select.id = id;
    select.name = id.replace("filtro-", "");

    const opcion = document.createElement("option");
    opcion.value = "";
    opcion.textContent = textoInicial;
    select.appendChild(opcion);

    campo.append(label, select);
    return campo;
  }

  async cargarOpciones() {
    const resultados = await Promise.allSettled([
      ServicioApi.obtenerCategorias(),
      ServicioApi.obtenerOrigenes()
    ]);

    if (this.destruido) return;

    const categorias = resultados[0].status === "fulfilled" ? resultados[0].value : [];
    const origenes = resultados[1].status === "fulfilled" ? resultados[1].value : [];

    this.llenarSelect("filtro-categoria", categorias.map((c) => c.nombre));
    this.llenarSelect("filtro-origen", origenes);
    this.aplicarCriterios(this.props.criterios || {});
  }

  llenarSelect(id, valores) {
    const select = this.elemento.querySelector(`#${id}`);
    if (!select) return;

    const actual = select.value;
    select.textContent = "";

    const inicial = document.createElement("option");
    inicial.value = "";
    inicial.textContent = id.includes("categoria")
      ? "Todas las categorías"
      : "Todos los orígenes";
    select.appendChild(inicial);

    valores.forEach((valor) => {
      const opcion = document.createElement("option");
      opcion.value = valor;
      opcion.textContent = valor;
      select.appendChild(opcion);
    });

    select.value = valores.includes(actual) ? actual : "";
  }

  obtenerCriterios() {
    const leer = (id) => {
      const campo = this.elemento.querySelector(`#${id}`);
      return campo ? campo.value.trim() : "";
    };

    return {
      nombre: leer("filtro-nombre"),
      categoria: leer("filtro-categoria"),
      origen: leer("filtro-origen"),
      ingrediente: leer("filtro-ingrediente")
    };
  }

  aplicarCriterios(criterios) {
    const asignar = (id, valor) => {
      const campo = this.elemento.querySelector(`#${id}`);
      if (campo) campo.value = valor || "";
    };

    asignar("filtro-nombre", criterios.nombre);
    asignar("filtro-categoria", criterios.categoria);
    asignar("filtro-origen", criterios.origen);
    asignar("filtro-ingrediente", criterios.ingrediente);
  }

  destruir() {
    if (this.destruido) return;

    this.destruido = true;
    this.elemento.removeEventListener("submit", this.manejadorSubmit);
    this.elemento.removeEventListener("click", this.manejadorClick);
    this.elemento.remove();
    this.elemento = null;
  }
}
