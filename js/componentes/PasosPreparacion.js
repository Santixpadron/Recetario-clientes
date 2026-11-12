"use strict";

/**
 * PasosPreparacion — listado numerado de pasos.
 *
 * Responsabilidad del Integrante 2.
 */
class PasosPreparacion {
  constructor(contenedor, props = {}) {
    this.contenedor = contenedor;
    this.props = { pasos: [], ...props };
    this.estado = { pasos: Array.isArray(this.props.pasos) ? this.props.pasos : [] };
    this.destruido = false;

    this.elemento = document.createElement("section");
    this.elemento.className = "detalle-bloque";
    this.elemento.setAttribute("aria-labelledby", "titulo-pasos");

    if (contenedor) contenedor.appendChild(this.elemento);
    this.renderizar();
  }

  actualizar(props = {}) {
    if (this.destruido) return;
    this.props = { ...this.props, ...props };
    this.estado = {
      ...this.estado,
      ...(Array.isArray(this.props.pasos) ? { pasos: this.props.pasos } : {})
    };
    this.renderizar();
  }

  renderizar() {
    if (this.destruido) return;

    this.elemento.textContent = "";
    const pasos = Array.isArray(this.estado.pasos) ? this.estado.pasos : [];

    const titulo = document.createElement("h2");
    titulo.className = "titulo-seccion";
    titulo.id = "titulo-pasos";
    titulo.textContent = `Pasos de preparación (${pasos.length})`;
    this.elemento.appendChild(titulo);

    if (pasos.length === 0) {
      const vacio = document.createElement("p");
      vacio.className = "texto-ayuda";
      vacio.textContent = "Esta receta no tiene instrucciones registradas.";
      this.elemento.appendChild(vacio);
      return;
    }

    const lista = document.createElement("ol");
    lista.className = "lista-pasos";

    pasos.forEach((textoPaso, indice) => {
      const item = document.createElement("li");
      item.className = "item-paso";

      const numero = document.createElement("span");
      numero.className = "numero-paso";
      numero.setAttribute("aria-hidden", "true");
      numero.textContent = String(indice + 1);

      const parrafo = document.createElement("p");
      parrafo.textContent = textoPaso;

      item.append(numero, parrafo);
      lista.appendChild(item);
    });

    this.elemento.appendChild(lista);
  }

  destruir() {
    if (this.destruido) return;
    this.destruido = true;
    this.elemento.remove();
    this.elemento = null;
  }
}
