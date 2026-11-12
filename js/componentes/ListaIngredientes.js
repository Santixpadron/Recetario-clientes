"use strict";

/**
 * ListaIngredientes — cuadrícula de ingredientes con imagen y medida.
 *
 * Responsabilidad del Integrante 2. Si la imagen del ingrediente no existe en
 * TheMealDB se usa el SVG local `assets/ingrediente-default.svg` sin bucles de
 * error.
 */
class ListaIngredientes {
  constructor(contenedor, props = {}) {
    this.contenedor = contenedor;
    this.props = { ingredientes: [], ...props };
    this.estado = { ingredientes: Array.isArray(this.props.ingredientes) ? this.props.ingredientes : [] };
    this.destruido = false;

    this.elemento = document.createElement("section");
    this.elemento.className = "detalle-bloque";
    this.elemento.setAttribute("aria-labelledby", "titulo-ingredientes");

    if (contenedor) contenedor.appendChild(this.elemento);
    this.renderizar();
  }

  actualizar(props = {}) {
    if (this.destruido) return;
    this.props = { ...this.props, ...props };
    this.estado = {
      ...this.estado,
      ...(Array.isArray(this.props.ingredientes) ? { ingredientes: this.props.ingredientes } : {})
    };
    this.renderizar();
  }

  renderizar() {
    if (this.destruido) return;

    this.elemento.textContent = "";
    const ingredientes = Array.isArray(this.estado.ingredientes)
      ? this.estado.ingredientes
      : [];

    const titulo = document.createElement("h2");
    titulo.className = "titulo-seccion";
    titulo.id = "titulo-ingredientes";
    titulo.textContent = `Ingredientes (${ingredientes.length})`;
    this.elemento.appendChild(titulo);

    if (ingredientes.length === 0) {
      const vacio = document.createElement("p");
      vacio.className = "texto-ayuda";
      vacio.textContent = "Esta receta no tiene ingredientes registrados.";
      this.elemento.appendChild(vacio);
      return;
    }

    const lista = document.createElement("ul");
    lista.className = "ingredientes-grid";

    ingredientes.forEach((ingrediente) => {
      const item = document.createElement("li");
      item.className = "ingrediente";

      const imagen = document.createElement("img");
      imagen.className = "ingrediente-imagen";
      imagen.src = ingrediente.imagen || "assets/ingrediente-default.svg";
      imagen.alt = `Ingrediente: ${ingrediente.nombre}`;
      imagen.loading = "lazy";
      imagen.width = 64;
      imagen.height = 64;
      imagen.addEventListener("error", () => {
        imagen.onerror = null;
        imagen.src = "assets/ingrediente-default.svg";
        imagen.alt = "Ingrediente sin imagen disponible";
      });

      const nombre = document.createElement("span");
      nombre.className = "ingrediente-nombre";
      nombre.textContent = ingrediente.nombre;

      const medida = document.createElement("span");
      medida.className = "ingrediente-medida";
      medida.textContent = ingrediente.medida || "Al gusto";

      item.append(imagen, nombre, medida);
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
