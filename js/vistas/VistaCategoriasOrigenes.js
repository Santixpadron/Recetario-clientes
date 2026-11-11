"use strict";

/**
 * VistaCategoriasOrigenes — pestañas de catálogos y recetas por grupo.
 *
 * Responsabilidad del Integrante 2. Corrige dos fallos del diseño original:
 *   - muestra un estado vacío cuando el grupo no tiene recetas;
 *   - destruye el Paginador anterior antes de crear uno nuevo.
 */
class VistaCategoriasOrigenes {
  constructor(contenedor, estadoInicial = null) {
    this.contenedor = contenedor;
    this.destruido = false;
    this.hijos = [];
    this.controladorGrupos = null;
    this.controladorRecetas = null;
    this.tamanoPagina = 8;

    const previo = estadoInicial || {};
    this.estado = {
      pestanaActiva: previo.pestanaActiva === "origenes" ? "origenes" : "categorias",
      grupos: [],
      cargandoGrupos: true,
      errorGrupos: "",
      seleccionActual: previo.seleccionActual || null,
      recetasGrupo: Array.isArray(previo.recetasGrupo) ? previo.recetasGrupo : [],
      cargandoRecetas: false,
      errorRecetas: "",
      paginaActual: Number(previo.paginaActual) || 1
    };

    this.elemento = document.createElement("section");
    this.elemento.className = "vista";

    this.manejadorClick = (evento) => this.manejarClick(evento);
    this.manejadorTeclado = (evento) => this.manejarTecladoPestanas(evento);
    this.manejadorPagina = (evento) => {
      const pagina = Number(evento.detail && evento.detail.pagina);
      if (!Number.isFinite(pagina) || pagina === this.estado.paginaActual) return;
      this.estado.paginaActual = pagina;
      this.renderizar();
    };
    this.manejadorReintentar = (evento) => {
      const seccion = evento.detail && evento.detail.seccion;
      if (seccion === "recetas") {
        this.cargarRecetas();
      } else {
        this.cargarGrupos(true);
        if (this.estado.seleccionActual) this.cargarRecetas();
      }
    };

    this.elemento.addEventListener("click", this.manejadorClick);
    this.elemento.addEventListener("keydown", this.manejadorTeclado);
    this.elemento.addEventListener("cambio-pagina", this.manejadorPagina);
    this.elemento.addEventListener("reintentar-accion", this.manejadorReintentar);

    if (contenedor) contenedor.appendChild(this.elemento);

    this.renderizar();
    this.cargarGrupos();

    if (this.estado.seleccionActual) this.cargarRecetas();
  }

  manejarClick(evento) {
    const pestana = evento.target.closest("[data-pestana]");
    if (pestana) {
      this.cambiarPestana(pestana.dataset.pestana);
      return;
    }

    const grupo = evento.target.closest("[data-grupo]");
    if (grupo) {
      this.seleccionarGrupo(grupo.dataset.grupo);
      return;
    }

    if (evento.target.closest("[data-accion='cerrar-grupo']")) {
      this.estado.seleccionActual = null;
      this.estado.recetasGrupo = [];
      this.estado.paginaActual = 1;
      this.estado.errorRecetas = "";
      this.renderizar();
    }
  }

  manejarTecladoPestanas(evento) {
    const pestana = evento.target.closest("[data-pestana]");
    if (!pestana) return;

    const pestanas = ["categorias", "origenes"];
    const actual = pestanas.indexOf(pestana.dataset.pestana);
    let destino = null;

    if (evento.key === "ArrowRight") destino = (actual + 1) % pestanas.length;
    if (evento.key === "ArrowLeft") destino = (actual - 1 + pestanas.length) % pestanas.length;
    if (evento.key === "Home") destino = 0;
    if (evento.key === "End") destino = pestanas.length - 1;

    if (destino === null) return;

    evento.preventDefault();
    this.cambiarPestana(pestanas[destino]);

    const nueva = this.elemento.querySelector(`[data-pestana="${pestanas[destino]}"]`);
    if (nueva) nueva.focus();
  }

  cambiarPestana(pestana) {
    if (pestana !== "categorias" && pestana !== "origenes") return;
    if (pestana === this.estado.pestanaActiva) return;

    this.estado.pestanaActiva = pestana;
    this.estado.grupos = [];
    this.estado.seleccionActual = null;
    this.estado.recetasGrupo = [];
    this.estado.paginaActual = 1;
    this.estado.errorGrupos = "";
    this.estado.errorRecetas = "";
    this.renderizar();
    this.cargarGrupos(true);
  }

  seleccionarGrupo(nombre) {
    const limpio = String(nombre || "").trim();
    if (!limpio) return;

    if (limpio === this.estado.seleccionActual) {
      this.estado.seleccionActual = null;
      this.estado.recetasGrupo = [];
      this.estado.paginaActual = 1;
      this.estado.errorRecetas = "";
      this.renderizar();
      return;
    }

    this.estado.seleccionActual = limpio;
    this.cargarRecetas();
  }

  async cargarGrupos(forzar = false) {
    if (this.destruido) return;

    if (!forzar && this.estado.grupos.length > 0) return;

    if (this.controladorGrupos) this.controladorGrupos.abort();
    this.controladorGrupos = new AbortController();

    this.estado = {
      ...this.estado,
      cargandoGrupos: true,
      errorGrupos: ""
    };
    this.renderizar();

    try {
      let grupos;

      if (this.estado.pestanaActiva === "categorias") {
        const categorias = await ServicioApi.obtenerCategorias();
        grupos = categorias.map((categoria) => ({
          nombre: categoria.nombre,
          imagen: categoria.imagen,
          descripcion: categoria.descripcion
        }));
      } else {
        const origenes = await ServicioApi.obtenerOrigenes();
        grupos = origenes.map((origen) => ({
          nombre: origen,
          imagen: "",
          descripcion: ""
        }));
      }

      if (this.destruido) return;

      this.estado = {
        ...this.estado,
        grupos,
        cargandoGrupos: false,
        errorGrupos: ""
      };
      this.renderizar();
    } catch (error) {
      if (this.destruido || ServicioApi.esCancelacion(error)) return;

      this.estado = {
        ...this.estado,
        cargandoGrupos: false,
        errorGrupos: error.message || "No se pudieron cargar los grupos."
      };
      this.renderizar();
    }
  }

  async cargarRecetas() {
    if (this.destruido || !this.estado.seleccionActual) return;

    if (this.controladorRecetas) this.controladorRecetas.abort();
    this.controladorRecetas = new AbortController();

    const grupo = this.estado.seleccionActual;
    this.estado = {
      ...this.estado,
      cargandoRecetas: true,
      errorRecetas: "",
      recetasGrupo: [],
      paginaActual: 1
    };
    this.renderizar();

    try {
      const recetas =
        this.estado.pestanaActiva === "categorias"
          ? await ServicioApi.filtrarPorCategoria(grupo, this.controladorRecetas.signal)
          : await ServicioApi.filtrarPorOrigen(grupo, this.controladorRecetas.signal);

      if (this.destruido || grupo !== this.estado.seleccionActual) return;

      this.estado = {
        ...this.estado,
        recetasGrupo: recetas,
        cargandoRecetas: false,
        errorRecetas: ""
      };
      this.renderizar();
    } catch (error) {
      if (this.destruido || ServicioApi.esCancelacion(error)) return;

      this.estado = {
        ...this.estado,
        cargandoRecetas: false,
        errorRecetas: error.message || "No se pudieron cargar las recetas."
      };
      this.renderizar();
    }
  }

  renderizar() {
    if (this.destruido) return;

    this.limpiarHijos();
    this.elemento.textContent = "";

    this.elemento.appendChild(this.crearEncabezado());
    this.elemento.appendChild(this.crearPestanas());
    this.elemento.appendChild(this.crearPanelGrupos());

    if (this.estado.seleccionActual) {
      this.elemento.appendChild(this.crearResultados());
    }
  }

  crearEncabezado() {
    const encabezado = document.createElement("header");
    encabezado.className = "vista-encabezado";

    const titulo = document.createElement("h1");
    titulo.className = "vista-titulo";
    titulo.textContent = "Categorías y orígenes";

    const texto = document.createElement("p");
    texto.className = "vista-subtitulo";
    texto.textContent =
      "Explora el recetario por tipo de plato o por cocina de origen. Elige una ficha para ver sus recetas.";

    encabezado.append(titulo, texto);
    return encabezado;
  }

  crearPestanas() {
    const contenedor = document.createElement("div");
    contenedor.className = "pestanas";
    contenedor.setAttribute("role", "tablist");
    contenedor.setAttribute("aria-label", "Catálogos disponibles");

    [
      { id: "categorias", texto: "Categorías" },
      { id: "origenes", texto: "Orígenes" }
    ].forEach((pestana) => {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "pestana";
      boton.dataset.pestana = pestana.id;
      boton.id = `tab-${pestana.id}`;
      boton.setAttribute("role", "tab");
      boton.setAttribute("aria-selected", String(this.estado.pestanaActiva === pestana.id));
      boton.setAttribute("aria-controls", "panel-grupos");
      boton.tabIndex = this.estado.pestanaActiva === pestana.id ? 0 : -1;
      boton.textContent = pestana.texto;
      contenedor.appendChild(boton);
    });

    return contenedor;
  }

  crearPanelGrupos() {
    const panel = document.createElement("div");
    panel.id = "panel-grupos";
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", `tab-${this.estado.pestanaActiva}`);
    panel.className = "seccion";

    if (this.estado.cargandoGrupos) {
      this.hijos.push(
        new EstadoCarga(panel, {
          tipo: "tarjetas",
          cantidad: 6,
          seccion: "grupos"
        })
      );
      return panel;
    }

    if (this.estado.errorGrupos) {
      this.hijos.push(
        new EstadoCarga(panel, {
          error: true,
          titulo: "No se pudieron cargar los catálogos",
          mensaje: this.estado.errorGrupos,
          seccion: "grupos"
        })
      );
      return panel;
    }

    if (this.estado.grupos.length === 0) {
      this.hijos.push(
        new EstadoCarga(panel, {
          titulo: "Sin grupos disponibles",
          mensaje: "TheMealDB no devolvió elementos para esta pestaña."
        })
      );
      return panel;
    }

    const cuadricula = document.createElement("div");
    cuadricula.className = "fichas-grid";

    this.estado.grupos.forEach((grupo) => {
      cuadricula.appendChild(this.crearFicha(grupo));
    });

    panel.appendChild(cuadricula);
    return panel;
  }

  crearFicha(grupo) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "ficha ficha-categoria";
    boton.dataset.grupo = grupo.nombre;
    boton.setAttribute("aria-pressed", String(this.estado.seleccionActual === grupo.nombre));
    boton.setAttribute(
      "aria-label",
      `Ver recetas de ${grupo.nombre}`
    );

    const imagen = document.createElement("img");
    imagen.className = "ficha-imagen";
    imagen.src = grupo.imagen || "assets/ingrediente-default.svg";
    imagen.alt = "";
    imagen.loading = "lazy";
    imagen.width = 300;
    imagen.height = 188;
    imagen.addEventListener("error", () => {
      imagen.onerror = null;
      imagen.src = "assets/ingrediente-default.svg";
    });

    const titulo = document.createElement("span");
    titulo.className = "ficha-titulo";
    titulo.textContent = grupo.nombre;

    boton.append(imagen, titulo);
    return boton;
  }

  crearResultados() {
    const seccion = document.createElement("section");
    seccion.className = "seccion";

    const encabezado = document.createElement("div");
    encabezado.className = "grupo-encabezado";

    const titulo = document.createElement("h2");
    titulo.className = "grupo-titulo";
    titulo.textContent = this.estado.seleccionActual;

    const cerrar = document.createElement("button");
    cerrar.type = "button";
    cerrar.className = "boton boton--secundario boton--chico";
    cerrar.dataset.accion = "cerrar-grupo";
    cerrar.textContent = "Cerrar grupo";

    encabezado.append(titulo, cerrar);
    seccion.appendChild(encabezado);

    if (this.estado.cargandoRecetas) {
      this.hijos.push(
        new EstadoCarga(seccion, { tipo: "tarjetas", cantidad: 6, seccion: "recetas" })
      );
      return seccion;
    }

    if (this.estado.errorRecetas) {
      this.hijos.push(
        new EstadoCarga(seccion, {
          error: true,
          titulo: "No se pudieron cargar las recetas",
          mensaje: this.estado.errorRecetas,
          seccion: "recetas"
        })
      );
      return seccion;
    }

    if (this.estado.recetasGrupo.length === 0) {
      this.hijos.push(
        new EstadoCarga(seccion, {
          titulo: "Este grupo no tiene recetas",
          mensaje: `TheMealDB no devolvió recetas para ${this.estado.seleccionActual}. Prueba con otro grupo.`
        })
      );
      return seccion;
    }

    const totalPaginas = Math.max(
      1,
      Math.ceil(this.estado.recetasGrupo.length / this.tamanoPagina)
    );
    const pagina = Math.min(Math.max(1, this.estado.paginaActual), totalPaginas);
    this.estado.paginaActual = pagina;

    const inicio = (pagina - 1) * this.tamanoPagina;
    const paginaRecetas = this.estado.recetasGrupo.slice(inicio, inicio + this.tamanoPagina);

    const cuadricula = document.createElement("div");
    cuadricula.className = "cuadricula-recetas";
    seccion.appendChild(cuadricula);

    paginaRecetas.forEach((receta) => {
      this.hijos.push(new TarjetaReceta(cuadricula, { receta }));
    });

    const pie = document.createElement("div");
    seccion.appendChild(pie);
    this.hijos.push(
      new Paginador(pie, { paginaActual: pagina, totalPaginas })
    );

    return seccion;
  }

  obtenerEstadoConservado() {
    return {
      pestanaActiva: this.estado.pestanaActiva,
      seleccionActual: this.estado.seleccionActual,
      recetasGrupo: this.estado.recetasGrupo,
      paginaActual: this.estado.paginaActual
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
    if (this.controladorGrupos) this.controladorGrupos.abort();
    if (this.controladorRecetas) this.controladorRecetas.abort();
    this.limpiarHijos();

    this.elemento.removeEventListener("click", this.manejadorClick);
    this.elemento.removeEventListener("keydown", this.manejadorTeclado);
    this.elemento.removeEventListener("cambio-pagina", this.manejadorPagina);
    this.elemento.removeEventListener("reintentar-accion", this.manejadorReintentar);
    this.elemento.remove();
    this.elemento = null;
  }
}
