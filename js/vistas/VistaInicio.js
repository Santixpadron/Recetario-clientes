"use strict";

/**
 * VistaInicio — portada con receta destacada, categorías y orígenes.
 *
 * PROVISIONAL — archivo asignado al Integrante 1.
 * Usa `Promise.allSettled` para que la portada siga funcionando aunque falle
 * una de las tres fuentes.
 */
class VistaInicio {
  constructor(contenedor) {
    this.contenedor = contenedor;
    this.destruido = false;
    this.hijos = [];
    this.controlador = null;

    this.estado = {
      cargando: true,
      error: "",
      receta: null,
      categorias: [],
      origenes: []
    };

    this.elemento = document.createElement("section");
    this.elemento.className = "vista";

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

    const tipo = accion.dataset.accion;

    if (tipo === "explorar" || tipo === "comparador") {
      this.elemento.dispatchEvent(
        new CustomEvent("navegar-vista", {
          bubbles: true,
          detail: { vista: tipo === "explorar" ? "explorar" : "comparador" }
        })
      );
      return;
    }

    if (tipo === "ver-categorias" || tipo === "ver-origenes") {
      this.elemento.dispatchEvent(
        new CustomEvent("navegar-vista", {
          bubbles: true,
          detail: { vista: "categorias-origenes" }
        })
      );
      return;
    }

    if (tipo === "ver-receta" && this.estado.receta) {
      this.elemento.dispatchEvent(
        new CustomEvent("abrir-detalle", {
          bubbles: true,
          detail: { id: this.estado.receta.id, receta: this.estado.receta }
        })
      );
      return;
    }

    if (tipo === "comparar" && this.estado.receta) {
      this.elemento.dispatchEvent(
        new CustomEvent("agregar-comparador", {
          bubbles: true,
          detail: { receta: this.estado.receta }
        })
      );
      return;
    }

    if (tipo === "categoria") {
      this.elemento.dispatchEvent(
        new CustomEvent("abrir-ficha-categoria", {
          bubbles: true,
          detail: {
            categoria: accion.dataset.grupo,
            pestana: accion.dataset.pestana || "categorias"
          }
        })
      );
    }
  }

  async cargar() {
    if (this.destruido) return;

    if (this.controlador) this.controlador.abort();
    this.controlador = new AbortController();

    this.estado = { ...this.estado, cargando: true, error: "" };
    this.renderizar();

    const resultados = await Promise.allSettled([
      ServicioApi.obtenerRecetaAleatoria(null, this.controlador.signal),
      ServicioApi.obtenerCategorias(),
      ServicioApi.obtenerOrigenes()
    ]);

    if (this.destruido) return;

    const receta = resultados[0].status === "fulfilled" ? resultados[0].value : null;
    const categorias = resultados[1].status === "fulfilled" ? resultados[1].value : [];
    const origenes = resultados[2].status === "fulfilled" ? resultados[2].value : [];

    const todoFallo = resultados.every((resultado) => resultado.status === "rejected");
    const primerError = resultados.find((resultado) => resultado.status === "rejected");

    this.estado = {
      cargando: false,
      error: todoFallo
        ? (primerError && primerError.reason && primerError.reason.message) ||
          "No se pudo cargar la portada."
        : "",
      receta,
      categorias,
      origenes
    };

    this.renderizar();
  }

  renderizar() {
    if (this.destruido) return;

    this.limpiarHijos();
    this.elemento.textContent = "";

    this.elemento.appendChild(this.crearHero());

    if (this.estado.cargando) {
      this.hijos.push(
        new EstadoCarga(this.elemento, { tipo: "tarjetas", cantidad: 3, seccion: "inicio" })
      );
      return;
    }

    if (this.estado.error) {
      this.hijos.push(
        new EstadoCarga(this.elemento, {
          error: true,
          titulo: "No se pudo cargar la portada",
          mensaje: this.estado.error,
          seccion: "inicio"
        })
      );
      return;
    }

    if (this.estado.receta) {
      this.elemento.appendChild(this.crearDestacada(this.estado.receta));
    }

    if (this.estado.categorias.length > 0) {
      this.elemento.appendChild(
        this.crearCatalogo(
          "Categorías",
          this.estado.categorias.slice(0, 8).map((categoria) => ({
            nombre: categoria.nombre,
            imagen: categoria.imagen
          })),
          "categorias",
          "ver-categorias"
        )
      );
    }

    if (this.estado.origenes.length > 0) {
      this.elemento.appendChild(
        this.crearCatalogo(
          "Orígenes",
          this.estado.origenes.slice(0, 8).map((origen) => ({
            nombre: origen,
            imagen: ""
          })),
          "origenes",
          "ver-origenes"
        )
      );
    }
  }

  crearHero() {
    const hero = document.createElement("section");
    hero.className = "hero";

    const contenido = document.createElement("div");
    contenido.className = "hero-contenido";

    const etiqueta = document.createElement("span");
    etiqueta.className = "hero-etiqueta";
    etiqueta.textContent = "Laboratorio gastronómico";

    const titulo = document.createElement("h1");
    titulo.className = "hero-titulo";
    titulo.textContent = "Descubre, compara y cocina mejor";

    const texto = document.createElement("p");
    texto.className = "hero-texto";
    texto.textContent =
      "Explora recetas de todo el mundo, revisa sus ingredientes y enfrenta dos opciones para elegir la más sencilla.";

    const acciones = document.createElement("div");
    acciones.className = "hero-acciones";

    const explorar = document.createElement("button");
    explorar.type = "button";
    explorar.className = "boton boton--primario";
    explorar.dataset.accion = "explorar";
    explorar.textContent = "Explorar recetas";

    const comparador = document.createElement("button");
    comparador.type = "button";
    comparador.className = "boton boton--secundario";
    comparador.dataset.accion = "comparador";
    comparador.textContent = "Abrir comparador";

    acciones.append(explorar, comparador);
    contenido.append(etiqueta, titulo, texto, acciones);

    const figura = document.createElement("figure");
    figura.className = "hero-figura";

    const imagen = document.createElement("img");
    imagen.src = "assets/ingrediente-default.svg";
    imagen.alt = "";
    imagen.width = 480;
    imagen.height = 360;

    figura.appendChild(imagen);
    hero.append(contenido, figura);
    return hero;
  }

  crearDestacada(receta) {
    const seccion = document.createElement("section");
    seccion.className = "seccion";

    const titulo = document.createElement("h2");
    titulo.className = "titulo-seccion";
    titulo.textContent = "Receta destacada";
    seccion.appendChild(titulo);

    const articulo = document.createElement("article");
    articulo.className = "destacada";

    const imagen = document.createElement("img");
    imagen.className = "destacada-imagen";
    imagen.src = receta.imagen || "assets/ingrediente-default.svg";
    imagen.alt = receta.imagen ? `Fotografía de ${receta.nombre}` : "";
    imagen.width = 480;
    imagen.height = 360;
    imagen.addEventListener("error", () => {
      imagen.onerror = null;
      imagen.src = "assets/ingrediente-default.svg";
    });

    const cuerpo = document.createElement("div");
    cuerpo.className = "destacada-cuerpo";

    const nombre = document.createElement("h3");
    nombre.className = "titulo-seccion";
    nombre.textContent = receta.nombre;

    const meta = document.createElement("p");
    meta.className = "tarjeta-meta";
    meta.textContent = [receta.categoria, receta.origen].filter(Boolean).join(" · ");

    const descripcion = document.createElement("p");
    descripcion.className = "texto-ayuda";
    descripcion.textContent = this.resumir(receta.instrucciones, 180);

    const acciones = document.createElement("div");
    acciones.className = "detalle-acciones";

    const ver = document.createElement("button");
    ver.type = "button";
    ver.className = "boton boton--primario";
    ver.dataset.accion = "ver-receta";
    ver.textContent = "Ver receta";

    const comparar = document.createElement("button");
    comparar.type = "button";
    comparar.className = "boton boton--secundario";
    comparar.dataset.accion = "comparar";
    comparar.textContent = "Comparar";

    acciones.append(ver, comparar);
    cuerpo.append(nombre, meta, descripcion, acciones);
    articulo.append(imagen, cuerpo);
    seccion.appendChild(articulo);

    return seccion;
  }

  crearCatalogo(tituloTexto, elementos, pestana, accionVerTodas) {
    const seccion = document.createElement("section");
    seccion.className = "seccion";

    const encabezado = document.createElement("div");
    encabezado.className = "encabezado-seccion";

    const titulo = document.createElement("h2");
    titulo.className = "titulo-seccion";
    titulo.textContent = tituloTexto;

    const verTodas = document.createElement("button");
    verTodas.type = "button";
    verTodas.className = "boton boton--fantasma boton--chico";
    verTodas.dataset.accion = accionVerTodas;
    verTodas.textContent = "Ver todos";

    encabezado.append(titulo, verTodas);
    seccion.appendChild(encabezado);

    const cuadricula = document.createElement("div");
    cuadricula.className = "fichas-grid";

    elementos.forEach((elemento) => {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "ficha";
      boton.dataset.accion = "categoria";
      boton.dataset.grupo = elemento.nombre;
      boton.dataset.pestana = pestana;
      boton.setAttribute("aria-label", `Ver recetas de ${elemento.nombre}`);

      const imagen = document.createElement("img");
      imagen.className = "ficha-imagen";
      imagen.src = elemento.imagen || "assets/ingrediente-default.svg";
      imagen.alt = "";
      imagen.loading = "lazy";
      imagen.width = 300;
      imagen.height = 188;
      imagen.addEventListener("error", () => {
        imagen.onerror = null;
        imagen.src = "assets/ingrediente-default.svg";
      });

      const nombre = document.createElement("span");
      nombre.className = "ficha-titulo";
      nombre.textContent = elemento.nombre;

      boton.append(imagen, nombre);
      cuadricula.appendChild(boton);
    });

    seccion.appendChild(cuadricula);
    return seccion;
  }

  resumir(texto, limite) {
    const limpio = String(texto || "").trim();
    if (!limpio) return "Sin descripción disponible.";
    if (limpio.length <= limite) return limpio;
    return `${limpio.slice(0, limite).trimEnd()}…`;
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
