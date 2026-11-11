"use strict";

/**
 * TarjetaReceta — ficha resumida de una receta.
 *
 * PROVISIONAL — archivo asignado al Integrante 1.
 * Emite `abrir-detalle` y `agregar-comparador`. Incluye la corrección del bug
 * de `actualizar()` tras `destruir()` detectado en el documento original.
 */
class TarjetaReceta {
  constructor(contenedor, props = {}) {
    this.contenedor = contenedor;
    this.props = { receta: null, ...props };
    this.destruido = false;

    this.elemento = document.createElement("article");
    this.elemento.className = "tarjeta-receta";

    this.manejadorClick = (evento) => {
      const boton = evento.target.closest("[data-accion]");
      if (!boton || !this.props.receta) return;

      if (boton.dataset.accion === "abrir") {
        this.elemento.dispatchEvent(
          new CustomEvent("abrir-detalle", {
            bubbles: true,
            detail: { id: this.props.receta.id, receta: this.props.receta }
          })
        );
      }

      if (boton.dataset.accion === "comparar") {
        this.elemento.dispatchEvent(
          new CustomEvent("agregar-comparador", {
            bubbles: true,
            detail: { receta: this.props.receta }
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
    this.renderizar();
  }

  renderizar() {
    if (this.destruido) return;

    this.elemento.textContent = "";
    const receta = this.props.receta;
    if (!receta) return;

    const imagen = document.createElement("img");
    imagen.className = "tarjeta-imagen";
    imagen.src = receta.imagen || "assets/ingrediente-default.svg";
    imagen.alt = receta.imagen ? `Fotografía de ${receta.nombre}` : "";
    imagen.loading = "lazy";
    imagen.width = 400;
    imagen.height = 300;
    imagen.addEventListener("error", () => {
      imagen.onerror = null;
      imagen.src = "assets/ingrediente-default.svg";
    });

    const cuerpo = document.createElement("div");
    cuerpo.className = "tarjeta-cuerpo";

    const titulo = document.createElement("h3");
    titulo.className = "tarjeta-titulo";
    titulo.textContent = receta.nombre;

    cuerpo.appendChild(titulo);

    const metadatos = [receta.categoria, receta.origen].filter(Boolean);
    if (metadatos.length > 0) {
      const meta = document.createElement("p");
      meta.className = "tarjeta-meta";
      meta.textContent = metadatos.join(" · ");
      cuerpo.appendChild(meta);
    }

    const acciones = document.createElement("div");
    acciones.className = "tarjeta-acciones";

    const ver = document.createElement("button");
    ver.type = "button";
    ver.className = "tarjeta-boton tarjeta-boton--principal";
    ver.dataset.accion = "abrir";
    ver.textContent = "Ver receta";
    ver.setAttribute("aria-label", `Ver la receta ${receta.nombre}`);

    const comparar = document.createElement("button");
    comparar.type = "button";
    comparar.className = "tarjeta-boton";
    comparar.dataset.accion = "comparar";
    comparar.textContent = "Comparar";
    comparar.setAttribute("aria-label", `Agregar ${receta.nombre} al comparador`);

    acciones.append(ver, comparar);
    cuerpo.appendChild(acciones);

    this.elemento.append(imagen, cuerpo);
  }

  destruir() {
    if (this.destruido) return;
    this.destruido = true;
    this.elemento.removeEventListener("click", this.manejadorClick);
    this.elemento.remove();
    this.elemento = null;
  }
}
