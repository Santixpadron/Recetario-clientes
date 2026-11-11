"use strict";

/**
 * EstadoCarga — esqueletos y mensajes de estado.
 *
 * PROVISIONAL — archivo asignado al Integrante 1.
 * Versión funcional para que las vistas del Integrante 2 puedan mostrar carga,
 * error y estados vacíos. Emite `reintentar-accion` al pulsar "Reintentar".
 */
class EstadoCarga {
  constructor(contenedor, props = {}) {
    this.contenedor = contenedor;
    this.props = {
      tipo: "tarjetas",
      cantidad: 6,
      titulo: "",
      mensaje: "",
      error: false,
      seccion: "",
      textoBoton: "Reintentar",
      ...props
    };
    this.destruido = false;

    this.elemento = document.createElement("div");
    this.elemento.className = "estado-carga";

    if (contenedor) contenedor.appendChild(this.elemento);

    this.manejadorClick = (evento) => {
      const boton = evento.target.closest("[data-accion='reintentar']");
      if (!boton) return;
      this.elemento.dispatchEvent(
        new CustomEvent("reintentar-accion", {
          bubbles: true,
          detail: { seccion: this.props.seccion }
        })
      );
    };

    this.elemento.addEventListener("click", this.manejadorClick);
    this.renderizar();
  }

  actualizar(props = {}) {
    if (this.destruido) return;
    this.props = { ...this.props, ...props };
    this.renderizar();
  }

  renderizar() {
    if (this.destruido) return;

    this.elemento.textContent = "";
    const { tipo, cantidad, titulo, mensaje, error } = this.props;

    if (error || mensaje) {
      this.elemento.appendChild(this.crearMensaje({ error, titulo, mensaje }));
      return;
    }

    this.elemento.setAttribute("aria-busy", "true");
    this.elemento.setAttribute("role", "status");

    const aviso = document.createElement("span");
    aviso.className = "solo-lectores";
    aviso.textContent = "Cargando contenido…";
    this.elemento.appendChild(aviso);

    if (tipo === "detalle") {
      this.elemento.appendChild(this.crearEsqueletoDetalle());
      return;
    }

    const cuadricula = document.createElement("div");
    cuadricula.className = "esqueleto-cuadricula";

    const total = Math.max(1, Number(cantidad) || 6);
    for (let i = 0; i < total; i += 1) {
      const tarjeta = document.createElement("div");
      tarjeta.className = "esqueleto-tarjeta";

      const imagen = document.createElement("div");
      imagen.className = "esqueleto esqueleto-imagen";

      const linea = document.createElement("div");
      linea.className = "esqueleto esqueleto-linea";

      const lineaCorta = document.createElement("div");
      lineaCorta.className = "esqueleto esqueleto-linea esqueleto-linea--corta";

      tarjeta.append(imagen, linea, lineaCorta);
      cuadricula.appendChild(tarjeta);
    }

    this.elemento.appendChild(cuadricula);
  }

  crearEsqueletoDetalle() {
    const bloque = document.createElement("div");
    bloque.className = "esqueleto-tarjeta";
    bloque.style.padding = "1.5rem";

    const imagen = document.createElement("div");
    imagen.className = "esqueleto";
    imagen.style.minHeight = "220px";

    const titulo = document.createElement("div");
    titulo.className = "esqueleto esqueleto-linea";

    const texto = document.createElement("div");
    texto.className = "esqueleto esqueleto-linea";

    const corto = document.createElement("div");
    corto.className = "esqueleto esqueleto-linea esqueleto-linea--corta";

    bloque.append(imagen, titulo, texto, corto);
    return bloque;
  }

  crearMensaje({ error, titulo, mensaje }) {
    const caja = document.createElement("div");
    caja.className = `estado-mensaje${error ? " estado-mensaje--error" : ""}`;

    const icono = document.createElement("span");
    icono.className = "estado-mensaje-icono";
    icono.setAttribute("aria-hidden", "true");
    icono.textContent = error ? "⚠" : "🍽";

    const encabezado = document.createElement("p");
    encabezado.className = "estado-mensaje-titulo";
    encabezado.textContent = titulo || (error ? "Algo salió mal" : "Sin resultados");

    caja.append(icono, encabezado);

    if (mensaje) {
      const parrafo = document.createElement("p");
      parrafo.className = "estado-mensaje-texto";
      parrafo.textContent = mensaje;
      caja.appendChild(parrafo);
    }

    if (error) {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "boton boton--secundario";
      boton.dataset.accion = "reintentar";
      boton.textContent = this.props.textoBoton || "Reintentar";
      caja.appendChild(boton);
    }

    return caja;
  }

  destruir() {
    if (this.destruido) return;
    this.destruido = true;
    this.elemento.removeEventListener("click", this.manejadorClick);
    this.elemento.remove();
    this.elemento = null;
  }
}
