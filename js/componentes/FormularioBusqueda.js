"use strict";

/* PROVISIONAL: marcador de posición. Se implementa en el siguiente commit. */
class FormularioBusqueda {
  constructor(contenedor) {
    this.contenedor = contenedor;
    this.elemento = document.createElement("div");
    this.elemento.className = "estado-mensaje";
    this.elemento.textContent = "Componente FormularioBusqueda en construcción.";
    if (contenedor) contenedor.appendChild(this.elemento);
  }

  destruir() {
    if (this.elemento) this.elemento.remove();
    this.elemento = null;
  }
}
