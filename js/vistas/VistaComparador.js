"use strict";

/* PROVISIONAL: marcador de posición. Se implementa en el siguiente commit. */
class VistaComparador {
  constructor(contenedor) {
    this.contenedor = contenedor;
    this.elemento = document.createElement("section");
    this.elemento.className = "vista estado-mensaje";
    this.elemento.textContent = "Vista VistaComparador en construcción.";
    if (contenedor) contenedor.appendChild(this.elemento);
  }

  destruir() {
    if (this.elemento) this.elemento.remove();
    this.elemento = null;
  }
}
