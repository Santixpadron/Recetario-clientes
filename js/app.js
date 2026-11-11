"use strict";

/**
 * AplicacionUmamiLab — orquestador de la SPA.
 *
 * Responsabilidad del Integrante 2. Enrutado por hash (compatible con
 * `file://`), estado compartido del comparador, diálogo de reemplazo accesible
 * y puente entre los `CustomEvent` de componentes y vistas.
 */
class AplicacionUmamiLab {
  constructor() {
    this.contenedorVista = document.getElementById("contenedor-vista");
    this.contenedorNavegacion = document.getElementById("contenedor-navegacion");
    this.contenedorDialogo = document.getElementById("contenedor-dialogo");
    this.regionAnuncios = document.getElementById("region-anuncios");
    this.main = document.getElementById("contenido-principal");

    this.vistaActual = null;
    this.nombreVista = "";
    this.parametrosVista = {};
    this.estadoVistas = { explorar: null, "categorias-origenes": null };
    this.comparador = { a: null, b: null };
    this.historialNavegacion = [];
    this.ignorarProximoHash = false;

    this.recetaPendiente = null;
    this.focoAnteriorDialogo = null;
    this.manejadorTecladoDialogo = null;

    this.barra = new BarraNavegacion(this.contenedorNavegacion, {
      vistaActual: "inicio",
      contadorComparador: 0
    });

    this.registrarEventos();
    this.renderizarRuta();
  }

  registrarEventos() {
    document.addEventListener("navegar-vista", (evento) => {
      if (evento.detail && evento.detail.vista) this.navegar(evento.detail.vista);
    });

    document.addEventListener("abrir-detalle", (evento) => {
      if (evento.detail && evento.detail.id) this.abrirDetalle(evento.detail.id);
    });

    document.addEventListener("volver-vista-origen", () => this.volver());

    document.addEventListener("abrir-ficha-categoria", (evento) => {
      if (!evento.detail || !evento.detail.categoria) return;
      this.navegar("categorias-origenes", {
        categoriaPreseleccionada: evento.detail.categoria,
        pestana: evento.detail.pestana || "categorias"
      });
    });

    document.addEventListener("agregar-comparador", (evento) => {
      if (evento.detail && evento.detail.receta) {
        this.agregarAlComparador(evento.detail.receta);
      }
    });

    document.addEventListener("seleccionar-receta-panel", (evento) => {
      if (evento.detail) this.seleccionarEnPanel(evento.detail);
    });

    document.addEventListener("vaciar-panel-comparador", (evento) => {
      if (evento.detail) this.vaciarPanel(evento.detail.indice);
    });

    document.addEventListener("intercambiar-comparador", () => this.intercambiar());

    window.addEventListener("hashchange", () => {
      if (this.ignorarProximoHash) {
        this.ignorarProximoHash = false;
        return;
      }

      this.historialNavegacion = [];
      this.renderizarRuta();
    });
  }

  /* ---------- Enrutado ---------- */

  parsearHash() {
    const crudo = window.location.hash.replace(/^#\/?/, "");
    if (!crudo) return { vista: "inicio", parametros: {} };

    const partes = crudo.split("/");
    const vista = partes[0];

    if (vista === "detalle") {
      return {
        vista: "detalle",
        parametros: { id: decodeURIComponent(partes[1] || "") }
      };
    }

    if (["inicio", "explorar", "categorias-origenes", "comparador"].includes(vista)) {
      return { vista, parametros: {} };
    }

    return { vista: "inicio", parametros: {} };
  }

  construirHash(nombre, parametros = {}) {
    if (nombre === "detalle") {
      return `#/detalle/${encodeURIComponent(parametros.id || "")}`;
    }
    return `#/${nombre}`;
  }

  renderizarRuta() {
    const { vista, parametros } = this.parsearHash();
    this.mostrarVista(vista, parametros);
  }

  navegar(nombre, parametros = {}) {
    const hash = this.construirHash(nombre, parametros);

    if (window.location.hash === hash) {
      this.mostrarVista(nombre, parametros);
      return;
    }

    this.historialNavegacion.push(window.location.hash || "#/inicio");
    this.ignorarProximoHash = true;
    window.location.hash = hash;
    this.mostrarVista(nombre, parametros);
  }

  navegarHash(hash) {
    if (!hash || window.location.hash === hash) {
      this.renderizarRuta();
      return;
    }

    this.ignorarProximoHash = true;
    window.location.hash = hash;
    this.renderizarRuta();
  }

  volver() {
    const anterior = this.historialNavegacion.pop();

    if (anterior && anterior !== window.location.hash) {
      this.navegarHash(anterior);
      return;
    }

    this.navegar("explorar");
  }

  abrirDetalle(id) {
    const limpio = String(id || "").trim();
    if (!limpio) return;
    this.navegar("detalle", { id: limpio });
  }

  mostrarVista(nombre, parametros = {}) {
    this.guardarEstadoActual();

    if (this.vistaActual && typeof this.vistaActual.destruir === "function") {
      this.vistaActual.destruir();
    }
    this.vistaActual = null;

    this.nombreVista = nombre;
    this.parametrosVista = parametros;
    this.contenedorVista.textContent = "";

    this.barra.actualizar({
      vistaActual: nombre,
      contadorComparador: this.contadorComparador()
    });

    if (nombre === "inicio") {
      this.vistaActual = new VistaInicio(this.contenedorVista);
    } else if (nombre === "explorar") {
      this.vistaActual = new VistaExplorar(
        this.contenedorVista,
        this.estadoVistas.explorar
      );
    } else if (nombre === "categorias-origenes") {
      const estadoInicial = parametros.categoriaPreseleccionada
        ? {
            pestanaActiva: parametros.pestana === "origenes" ? "origenes" : "categorias",
            seleccionActual: parametros.categoriaPreseleccionada,
            recetasGrupo: [],
            paginaActual: 1
          }
        : this.estadoVistas["categorias-origenes"];

      this.vistaActual = new VistaCategoriasOrigenes(this.contenedorVista, estadoInicial);
    } else if (nombre === "comparador") {
      this.vistaActual = new VistaComparador(this.contenedorVista, {
        recetaA: this.comparador.a,
        recetaB: this.comparador.b
      });
    } else if (nombre === "detalle") {
      this.vistaActual = new VistaDetalle(this.contenedorVista, {
        id: parametros.id
      });
    } else {
      this.vistaActual = new VistaInicio(this.contenedorVista);
    }

    this.actualizarTitulo(nombre);
    this.main.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  guardarEstadoActual() {
    if (!this.vistaActual) return;
    if (typeof this.vistaActual.obtenerEstadoConservado !== "function") return;
    if (!Object.prototype.hasOwnProperty.call(this.estadoVistas, this.nombreVista)) return;

    this.estadoVistas[this.nombreVista] = this.vistaActual.obtenerEstadoConservado();
  }

  actualizarTitulo(nombre) {
    const titulos = {
      inicio: "UmamiLab — Exploración y comparación gastronómica",
      explorar: "Explorar recetas · UmamiLab",
      "categorias-origenes": "Categorías y orígenes · UmamiLab",
      comparador: "Comparador de recetas · UmamiLab",
      detalle: "Detalle de la receta · UmamiLab"
    };

    document.title = titulos[nombre] || "UmamiLab";
  }

  /* ---------- Comparador ---------- */

  contadorComparador() {
    return [this.comparador.a, this.comparador.b].filter(Boolean).length;
  }

  estaEnComparador(id) {
    const buscado = String(id);
    return [this.comparador.a, this.comparador.b].some(
      (receta) => receta && String(receta.id) === buscado
    );
  }

  async obtenerCompleta(receta) {
    if (receta && receta.completa) return receta;
    return ServicioApi.obtenerRecetaPorId(receta.id);
  }

  async agregarAlComparador(recetaResumen) {
    if (!recetaResumen || !recetaResumen.id) return;

    this.anunciar(`Preparando ${recetaResumen.nombre || "la receta"}…`);

    try {
      const receta = await this.obtenerCompleta(recetaResumen);

      if (this.estaEnComparador(receta.id)) {
        this.anunciar(`${receta.nombre} ya está en el comparador.`);
        return;
      }

      if (!this.comparador.a) {
        this.comparador.a = receta;
        this.anunciar(`${receta.nombre} se agregó al panel A.`);
      } else if (!this.comparador.b) {
        this.comparador.b = receta;
        this.anunciar(`${receta.nombre} se agregó al panel B.`);
      } else {
        this.abrirDialogoReemplazo(receta);
        return;
      }

      this.actualizarVistaComparador();
    } catch (error) {
      this.anunciar(error.message || "No se pudo agregar la receta al comparador.");
    }
  }

  async seleccionarEnPanel({ indice, receta }) {
    if (!receta || !receta.id) return;
    const panel = indice === "A" ? "a" : "b";
    const otro = panel === "a" ? this.comparador.b : this.comparador.a;

    try {
      const completa = await this.obtenerCompleta(receta);

      if (otro && String(otro.id) === String(completa.id)) {
        this.anunciar(`${completa.nombre} ya ocupa el otro panel.`);
        this.actualizarVistaComparador();
        return;
      }

      this.comparador[panel] = completa;
      this.actualizarVistaComparador();
      this.anunciar(`${completa.nombre} se agregó al panel ${indice}.`);
    } catch (error) {
      this.anunciar(error.message || "No se pudo cargar la receta seleccionada.");
      this.actualizarVistaComparador();
    }
  }

  vaciarPanel(indice) {
    const panel = indice === "A" ? "a" : "b";
    this.comparador[panel] = null;
    this.actualizarVistaComparador();
    this.anunciar(`Panel ${indice} vaciado.`);
  }

  intercambiar() {
    const temporal = this.comparador.a;
    this.comparador.a = this.comparador.b;
    this.comparador.b = temporal;
    this.actualizarVistaComparador();
    this.anunciar("Se intercambiaron las recetas de los paneles A y B.");
  }

  actualizarVistaComparador() {
    this.barra.actualizar({
      vistaActual: this.nombreVista,
      contadorComparador: this.contadorComparador()
    });

    if (this.nombreVista === "comparador" && this.vistaActual) {
      this.vistaActual.actualizar({
        recetaA: this.comparador.a,
        recetaB: this.comparador.b
      });
    }
  }

  /* ---------- Diálogo de reemplazo ---------- */

  abrirDialogoReemplazo(receta) {
    this.cerrarDialogo(false);
    this.recetaPendiente = receta;
    this.focoAnteriorDialogo = document.activeElement;

    const fondo = document.createElement("div");
    fondo.className = "dialogo-fondo";

    const dialogo = document.createElement("div");
    dialogo.className = "dialogo";
    dialogo.setAttribute("role", "dialog");
    dialogo.setAttribute("aria-modal", "true");
    dialogo.setAttribute("aria-labelledby", "titulo-dialogo-reemplazo");
    dialogo.setAttribute("aria-describedby", "texto-dialogo-reemplazo");

    const titulo = document.createElement("h2");
    titulo.className = "dialogo-titulo";
    titulo.id = "titulo-dialogo-reemplazo";
    titulo.textContent = "El comparador está completo";

    const texto = document.createElement("p");
    texto.className = "dialogo-texto";
    texto.id = "texto-dialogo-reemplazo";
    texto.textContent = `Ya hay dos recetas en el comparador. ¿En qué panel quieres colocar «${receta.nombre}»?`;

    const acciones = document.createElement("div");
    acciones.className = "dialogo-acciones";

    const botonA = document.createElement("button");
    botonA.type = "button";
    botonA.className = "boton boton--secundario";
    botonA.textContent = `Reemplazar A${
      this.comparador.a ? ` (${this.comparador.a.nombre})` : ""
    }`;

    const botonB = document.createElement("button");
    botonB.type = "button";
    botonB.className = "boton boton--secundario";
    botonB.textContent = `Reemplazar B${
      this.comparador.b ? ` (${this.comparador.b.nombre})` : ""
    }`;

    const cancelar = document.createElement("button");
    cancelar.type = "button";
    cancelar.className = "boton boton--primario";
    cancelar.textContent = "Cancelar";

    botonA.addEventListener("click", () => {
      const receta = this.recetaPendiente;
      this.comparador.a = receta;
      this.cerrarDialogo();
      this.actualizarVistaComparador();
      this.anunciar(`${receta.nombre} se colocó en el panel A.`);
    });

    botonB.addEventListener("click", () => {
      const receta = this.recetaPendiente;
      this.comparador.b = receta;
      this.cerrarDialogo();
      this.actualizarVistaComparador();
      this.anunciar(`${receta.nombre} se colocó en el panel B.`);
    });

    cancelar.addEventListener("click", () => this.cerrarDialogo());

    fondo.addEventListener("click", (evento) => {
      if (evento.target === fondo) this.cerrarDialogo();
    });

    acciones.append(botonA, botonB, cancelar);
    dialogo.append(titulo, texto, acciones);
    fondo.appendChild(dialogo);
    this.contenedorDialogo.appendChild(fondo);

    this.manejadorTecladoDialogo = (evento) => this.manejarTecladoDialogo(evento);
    document.addEventListener("keydown", this.manejadorTecladoDialogo);

    botonA.focus();
  }

  manejarTecladoDialogo(evento) {
    if (!this.contenedorDialogo.firstChild) return;

    if (evento.key === "Escape") {
      evento.preventDefault();
      this.cerrarDialogo();
      return;
    }

    if (evento.key !== "Tab") return;

    const enfocables = Array.from(
      this.contenedorDialogo.querySelectorAll(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
      )
    ).filter((elemento) => !elemento.disabled);

    if (enfocables.length === 0) return;

    const primero = enfocables[0];
    const ultimo = enfocables[enfocables.length - 1];

    if (evento.shiftKey && document.activeElement === primero) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault();
      primero.focus();
    }
  }

  cerrarDialogo(restaurarFoco = true) {
    if (this.manejadorTecladoDialogo) {
      document.removeEventListener("keydown", this.manejadorTecladoDialogo);
      this.manejadorTecladoDialogo = null;
    }

    this.contenedorDialogo.textContent = "";
    this.recetaPendiente = null;

    if (restaurarFoco && this.focoAnteriorDialogo) {
      this.focoAnteriorDialogo.focus();
      this.focoAnteriorDialogo = null;
    }
  }

  /* ---------- Utilidades ---------- */

  anunciar(mensaje) {
    if (!this.regionAnuncios) return;

    this.regionAnuncios.textContent = "";
    window.setTimeout(() => {
      this.regionAnuncios.textContent = mensaje;
    }, 30);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new AplicacionUmamiLab();
});
