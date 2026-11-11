"use strict";

/* PROVISIONAL: orquestador mínimo. Se implementa en el commit de vistas. */
class AplicacionUmamiLab {
  constructor() {
    this.contenedor = document.getElementById("contenedor-vista");
    this.contenedor.textContent = "UmamiLab en construcción.";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new AplicacionUmamiLab();
});
