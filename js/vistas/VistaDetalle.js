"use strict";

/**
 * VistaDetalle — ficha completa de una receta.
 *
 * Responsabilidad del Integrante 2. Carga la receta por id y, en paralelo,
 * consulta recetas relacionadas por categoría y por origen con
 * `Promise.allSettled` para tolerar el fallo de una de las dos fuentes.
 *
 * Eventos emitidos: `volver-vista-origen`, `agregar-comparador`.
 */
class VistaDetalle {
  constructor(contenedor, props = {}) {
    this.contenedor = contenedor;
    this.props = { id: "", origenVista: "explorar", ...props };
    this.estado = {
      cargando: true,
      error: "",
      receta: null,
      relacionadas: []
    };

    this.destruido = false;
    this.controlador = null;
    this.hijos = [];

    this.elemento = document.createElement("section");
    this.elemento.className = "vista detalle";

    this.manejadorClick = (evento) => this.manejarClick(evento);
    this.manejadorReintentar = () => this.cargar();

    this.elemento.addEventListener("click", this.manejadorClick);
    this.elemento.addEventListener("reintentar-accion", this.manejadorReintentar);

    if (contenedor) contenedor.appendChild(this.elemento);

    this.renderizar();
    this.cargar();
  }

  manejarClick(evento) {
    const accion = evento.target.closest("[data-accion]");
    if (!accion) return;

    if (accion.dataset.accion === "volver") {
      this.elemento.dispatchEvent(
        new CustomEvent("volver-vista-origen", { bubbles: true })
      );
    }

    if (accion.dataset.accion === "comparar" && this.estado.receta) {
      this.elemento.dispatchEvent(
        new CustomEvent("agregar-comparador", {
          bubbles: true,
          detail: { receta: this.estado.receta }
        })
      );
    }
  }

  async cargar() {
    if (this.destruido) return;

    const id = String(this.props.id || "").trim();
    if (!id) {
      this.estado = {
        ...this.estado,
        cargando: false,
        error: "No se indicó qué receta se debe mostrar."
      };
      this.renderizar();
      return;
    }

    if (this.controlador) this.controlador.abort();
    const controlador = new AbortController();
    this.controlador = controlador;

    this.estado = { ...this.estado, cargando: true, error: "", receta: null };
    this.renderizar();

    try {
      const receta = await ServicioApi.obtenerRecetaPorId(id, controlador.signal);
      if (this.destruido) return;

      this.estado = { ...this.estado, cargando: false, receta, error: "" };
      this.renderizar();
      document.title = `${receta.nombre} · UmamiLab`;

      await this.cargarRelacionadas(receta, controlador.signal);
    } catch (error) {
      if (this.destruido || ServicioApi.esCancelacion(error)) return;

      this.estado = {
        ...this.estado,
        cargando: false,
        error: error.message || "No se pudo cargar la receta."
      };
      this.renderizar();
    }
  }

  async cargarRelacionadas(receta, signal) {
    const tareas = [];

    if (receta.categoria && receta.categoria !== "Sin categoría") {
      tareas.push(ServicioApi.filtrarPorCategoria(receta.categoria, signal));
    }
    if (receta.origen && receta.origen !== "Desconocido") {
      tareas.push(ServicioApi.filtrarPorOrigen(receta.origen, signal));
    }

    if (tareas.length === 0 || this.destruido) return;

    const resultados = await Promise.allSettled(tareas);
    if (this.destruido || signal.aborted) return;

    const vistos = new Set([receta.id]);
    const relacionadas = [];

    resultados.forEach((resultado) => {
      if (resultado.status !== "fulfilled") return;
      resultado.value.forEach((candidata) => {
        if (!candidata.id || vistos.has(candidata.id)) return;
        vistos.add(candidata.id);
        relacionadas.push(candidata);
      });
    });

    this.estado = { ...this.estado, relacionadas: relacionadas.slice(0, 4) };
    this.renderizar();
  }

  renderizar() {
    if (this.destruido) return;

    this.limpiarHijos();
    this.elemento.textContent = "";

    const volver = document.createElement("button");
    volver.type = "button";
    volver.className = "boton boton--fantasma detalle-volver";
    volver.dataset.accion = "volver";
    volver.textContent = "← Volver";
    this.elemento.appendChild(volver);

    if (this.estado.cargando) {
      this.hijos.push(new EstadoCarga(this.elemento, { tipo: "detalle", seccion: "detalle" }));
      return;
    }

    if (this.estado.error) {
      this.hijos.push(
        new EstadoCarga(this.elemento, {
          error: true,
          titulo: "No se pudo cargar la receta",
          mensaje: this.estado.error,
          seccion: "detalle"
        })
      );
      return;
    }

    if (!this.estado.receta) return;

    const receta = this.estado.receta;
    this.elemento.appendChild(this.crearPortada(receta));

    const cuerpo = document.createElement("div");
    cuerpo.className = "detalle-cuerpo";
    this.elemento.appendChild(cuerpo);

    this.hijos.push(
      new ListaIngredientes(cuerpo, { ingredientes: receta.ingredientes })
    );
    this.hijos.push(new PasosPreparacion(cuerpo, { pasos: receta.pasos }));

    if (this.estado.relacionadas.length > 0) {
      this.elemento.appendChild(this.crearRelacionadas(this.estado.relacionadas));
    }
  }

  crearPortada(receta) {
    const portada = document.createElement("article");
    portada.className = "detalle-hero";

    const imagen = document.createElement("img");
    imagen.className = "detalle-imagen";
    imagen.src = receta.imagen || "assets/ingrediente-default.svg";
    imagen.alt = receta.imagen ? `Fotografía de ${receta.nombre}` : "";
    imagen.width = 640;
    imagen.height = 480;
    imagen.addEventListener("error", () => {
      imagen.onerror = null;
      imagen.src = "assets/ingrediente-default.svg";
    });

    const info = document.createElement("div");
    info.className = "detalle-info";

    const titulo = document.createElement("h1");
    titulo.className = "detalle-titulo";
    titulo.textContent = receta.nombre;

    const meta = document.createElement("ul");
    meta.className = "detalle-meta";

    const datos = [
      receta.categoria,
      receta.origen,
      `${receta.ingredientes.length} ingredientes`,
      `${receta.pasos.length} pasos`
    ];

    datos.forEach((dato) => {
      const item = document.createElement("li");
      item.className = "chip";
      item.textContent = dato;
      meta.appendChild(item);
    });

    info.append(titulo, meta);

    if (receta.etiquetas.length > 0) {
      const etiquetas = document.createElement("p");
      etiquetas.className = "texto-ayuda";
      etiquetas.textContent = `Etiquetas: ${receta.etiquetas.join(", ")}`;
      info.appendChild(etiquetas);
    }

    const acciones = document.createElement("div");
    acciones.className = "detalle-acciones";

    const comparar = document.createElement("button");
    comparar.type = "button";
    comparar.className = "boton boton--primario";
    comparar.dataset.accion = "comparar";
    comparar.textContent = "Agregar al comparador";
    comparar.setAttribute("aria-label", `Agregar ${receta.nombre} al comparador`);
    acciones.appendChild(comparar);

    if (receta.youtube) {
      const video = document.createElement("a");
      video.className = "detalle-video";
      video.href = receta.youtube;
      video.target = "_blank";
      video.rel = "noopener noreferrer";
      video.textContent = "▶ Ver video de la receta";
      acciones.appendChild(video);
    }

    info.appendChild(acciones);
    portada.append(imagen, info);
    return portada;
  }

  crearRelacionadas(relacionadas) {
    const seccion = document.createElement("section");
    seccion.className = "seccion relacionadas";

    const titulo = document.createElement("h2");
    titulo.className = "titulo-seccion";
    titulo.textContent = "También te puede interesar";
    seccion.appendChild(titulo);

    const cuadricula = document.createElement("div");
    cuadricula.className = "cuadricula-recetas";
    seccion.appendChild(cuadricula);

    relacionadas.forEach((receta) => {
      this.hijos.push(new TarjetaReceta(cuadricula, { receta }));
    });

    return seccion;
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
    this.limpiarHijos();

    this.elemento.removeEventListener("click", this.manejadorClick);
    this.elemento.removeEventListener("reintentar-accion", this.manejadorReintentar);
    this.elemento.remove();
    this.elemento = null;
  }
}
