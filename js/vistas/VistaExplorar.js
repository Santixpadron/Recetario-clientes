"use strict";

/**
 * VistaExplorar — búsqueda combinada con `Promise.all`.
 *
 * PROVISIONAL — archivo asignado al Integrante 1.
 * Los filtros se ejecutan en paralelo y los resultados se intersectan por id.
 */
class VistaExplorar {
  constructor(contenedor, estadoPrevio = null) {
    this.contenedor = contenedor;
    this.destruido = false;
    this.hijos = [];
    this.controlador = null;
    this.tamanoPagina = 8;

    const previo = estadoPrevio || {};
    this.estado = {
      cargando: false,
      error: "",
      resultados: Array.isArray(previo.resultados) ? previo.resultados : [],
      criterios: previo.criterios || {},
      paginaActual: Number(previo.paginaActual) || 1,
      busquedaHecha: Boolean(previo.busquedaHecha)
    };

    this.elemento = document.createElement("section");
    this.elemento.className = "vista";

    this.manejadorEjecutar = (evento) => this.ejecutarBusqueda(evento.detail || {});
    this.manejadorLimpiar = () => this.limpiar();
    this.manejadorPagina = (evento) => {
      const pagina = Number(evento.detail && evento.detail.pagina);
      if (!Number.isFinite(pagina) || pagina === this.estado.paginaActual) return;
      this.estado.paginaActual = pagina;
      this.renderizarResultados();
    };
    this.manejadorReintentar = () => {
      if (this.estado.busquedaHecha) this.ejecutarBusqueda(this.estado.criterios);
    };

    this.elemento.addEventListener("ejecutar-busqueda", this.manejadorEjecutar);
    this.elemento.addEventListener("limpiar-busqueda", this.manejadorLimpiar);
    this.elemento.addEventListener("cambio-pagina", this.manejadorPagina);
    this.elemento.addEventListener("reintentar-accion", this.manejadorReintentar);

    if (contenedor) contenedor.appendChild(this.elemento);

    this.renderizar();
  }

  renderizar() {
    if (this.destruido) return;

    this.limpiarHijos();
    this.elemento.textContent = "";

    const encabezado = document.createElement("header");
    encabezado.className = "vista-encabezado";

    const titulo = document.createElement("h1");
    titulo.className = "vista-titulo";
    titulo.textContent = "Explorar recetas";

    const subtitulo = document.createElement("p");
    subtitulo.className = "vista-subtitulo";
    subtitulo.textContent =
      "Combina nombre, categoría, origen e ingrediente. Los filtros se resuelven en paralelo y se cruzan por receta.";

    encabezado.append(titulo, subtitulo);
    this.elemento.appendChild(encabezado);

    this.formulario = new FormularioBusqueda(this.elemento, {
      criterios: this.estado.criterios
    });

    this.zonaResultados = document.createElement("div");
    this.zonaResultados.className = "seccion";
    this.zonaResultados.setAttribute("aria-live", "polite");
    this.elemento.appendChild(this.zonaResultados);

    this.renderizarResultados();
  }

  async ejecutarBusqueda(criterios) {
    if (this.destruido) return;

    const limpios = {
      nombre: String(criterios.nombre || "").trim(),
      categoria: String(criterios.categoria || "").trim(),
      origen: String(criterios.origen || "").trim(),
      ingrediente: String(criterios.ingrediente || "").trim()
    };

    this.estado.criterios = limpios;

    if (!limpios.nombre && !limpios.categoria && !limpios.origen && !limpios.ingrediente) {
      this.estado = {
        ...this.estado,
        error: "",
        resultados: [],
        cargando: false,
        busquedaHecha: false
      };
      this.renderizarResultados();
      return;
    }

    if (this.controlador) this.controlador.abort();
    this.controlador = new AbortController();
    const { signal } = this.controlador;

    this.estado = {
      ...this.estado,
      cargando: true,
      error: "",
      resultados: [],
      paginaActual: 1,
      busquedaHecha: true
    };
    this.renderizarResultados();

    try {
      const tareas = [];

      if (limpios.nombre) {
        tareas.push(ServicioApi.buscarPorNombre(limpios.nombre, signal));
      }
      if (limpios.categoria) {
        tareas.push(ServicioApi.filtrarPorCategoria(limpios.categoria, signal));
      }
      if (limpios.origen) {
        tareas.push(ServicioApi.filtrarPorOrigen(limpios.origen, signal));
      }
      if (limpios.ingrediente) {
        tareas.push(ServicioApi.filtrarPorIngrediente(limpios.ingrediente, signal));
      }

      const listas = await Promise.all(tareas);
      if (this.destruido) return;

      let resultados = listas[0] || [];
      for (let i = 1; i < listas.length; i += 1) {
        const ids = new Set(listas[i].map((receta) => receta.id));
        resultados = resultados.filter((receta) => ids.has(receta.id));
      }

      resultados.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

      this.estado = {
        ...this.estado,
        cargando: false,
        resultados,
        paginaActual: 1
      };
      this.renderizarResultados();
    } catch (error) {
      if (this.destruido || ServicioApi.esCancelacion(error)) return;

      this.estado = {
        ...this.estado,
        cargando: false,
        error: error.message || "No se pudo completar la búsqueda."
      };
      this.renderizarResultados();
    }
  }

  limpiar() {
    if (this.controlador) this.controlador.abort();
    this.estado = {
      cargando: false,
      error: "",
      resultados: [],
      criterios: {},
      paginaActual: 1,
      busquedaHecha: false
    };
    this.renderizarResultados();
  }

  renderizarResultados() {
    if (this.destruido || !this.zonaResultados) return;

    this.limpiarHijos();
    this.zonaResultados.textContent = "";

    if (this.estado.cargando) {
      this.hijos.push(
        new EstadoCarga(this.zonaResultados, {
          tipo: "tarjetas",
          cantidad: 6,
          seccion: "explorar"
        })
      );
      return;
    }

    if (this.estado.error) {
      this.hijos.push(
        new EstadoCarga(this.zonaResultados, {
          error: true,
          titulo: "No se pudo buscar",
          mensaje: this.estado.error,
          seccion: "explorar"
        })
      );
      return;
    }

    if (!this.estado.busquedaHecha) {
      this.hijos.push(
        new EstadoCarga(this.zonaResultados, {
          titulo: "Empieza a explorar",
          mensaje: "Escribe un nombre, elige una categoría u origen, o busca por ingrediente."
        })
      );
      return;
    }

    if (this.estado.resultados.length === 0) {
      this.hijos.push(
        new EstadoCarga(this.zonaResultados, {
          titulo: "Sin recetas para esa combinación",
          mensaje: "Prueba quitando algún filtro o usando términos más generales."
        })
      );
      return;
    }

    const total = this.estado.resultados.length;
    const totalPaginas = Math.max(1, Math.ceil(total / this.tamanoPagina));
    const pagina = Math.min(Math.max(1, this.estado.paginaActual), totalPaginas);
    this.estado.paginaActual = pagina;

    const inicio = (pagina - 1) * this.tamanoPagina;
    const paginaRecetas = this.estado.resultados.slice(inicio, inicio + this.tamanoPagina);

    const resumen = document.createElement("p");
    resumen.className = "texto-ayuda";
    resumen.textContent = `${total} receta${total === 1 ? "" : "s"} encontrada${total === 1 ? "" : "s"}.`;
    this.zonaResultados.appendChild(resumen);

    const cuadricula = document.createElement("div");
    cuadricula.className = "cuadricula-recetas";
    this.zonaResultados.appendChild(cuadricula);

    paginaRecetas.forEach((receta) => {
      this.hijos.push(new TarjetaReceta(cuadricula, { receta }));
    });

    const pie = document.createElement("div");
    this.zonaResultados.appendChild(pie);
    this.hijos.push(new Paginador(pie, { paginaActual: pagina, totalPaginas }));
  }

  obtenerEstadoConservado() {
    return {
      resultados: this.estado.resultados,
      criterios: this.estado.criterios,
      paginaActual: this.estado.paginaActual,
      busquedaHecha: this.estado.busquedaHecha
    };
  }

  limpiarHijos() {
    this.hijos.forEach((hijo) => {
      if (hijo && typeof hijo.destruir === "function") hijo.destruir();
    });
    this.hijos = [];
  }

  destruir() {
    if (this.destruido) return;

    this.destruido = true;
    if (this.controlador) this.controlador.abort();
    if (this.formulario) this.formulario.destruir();
    this.limpiarHijos();

    this.elemento.removeEventListener("ejecutar-busqueda", this.manejadorEjecutar);
    this.elemento.removeEventListener("limpiar-busqueda", this.manejadorLimpiar);
    this.elemento.removeEventListener("cambio-pagina", this.manejadorPagina);
    this.elemento.removeEventListener("reintentar-accion", this.manejadorReintentar);
    this.elemento.remove();
    this.elemento = null;
  }
}
