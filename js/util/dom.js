"use strict";

/**
 * Utilidades mínimas para construir DOM sin innerHTML.
 * Los datos de la API siempre se insertan con textContent o como atributos.
 */
const DOM = {
  crear(etiqueta, props = {}, hijos = []) {
    const el = document.createElement(etiqueta);

    for (const [clave, valor] of Object.entries(props)) {
      if (valor === undefined || valor === null || valor === false) continue;

      if (clave === "clase") {
        el.className = valor;
        continue;
      }
      if (clave === "texto") {
        el.textContent = valor;
        continue;
      }
      if (clave === "dataset") {
        Object.assign(el.dataset, valor);
        continue;
      }
      if (clave === "attrs") {
        for (const [atributo, valorAtributo] of Object.entries(valor)) {
          if (valorAtributo === undefined || valorAtributo === null || valorAtributo === false) continue;
          el.setAttribute(atributo, valorAtributo === true ? "" : String(valorAtributo));
        }
        continue;
      }
      if (clave === "on") {
        for (const [evento, manejador] of Object.entries(valor)) {
          el.addEventListener(evento, manejador);
        }
        continue;
      }
      if (clave === "estilo") {
        Object.assign(el.style, valor);
        continue;
      }
      if (clave in el) {
        el[clave] = valor;
      } else {
        el.setAttribute(clave, String(valor));
      }
    }

    const listaHijos = Array.isArray(hijos) ? hijos : [hijos];
    for (const hijo of listaHijos) {
      if (hijo === undefined || hijo === null || hijo === false) continue;
      if (typeof hijo === "string" || typeof hijo === "number") {
        el.appendChild(document.createTextNode(String(hijo)));
      } else {
        el.appendChild(hijo);
      }
    }

    return el;
  },

  vaciar(elemento) {
    while (elemento.firstChild) elemento.removeChild(elemento.firstChild);
  },

  qs(selector, raiz = document) {
    return raiz.querySelector(selector);
  },

  qsa(selector, raiz = document) {
    return Array.from(raiz.querySelectorAll(selector));
  },

  texto(valor) {
    return String(valor ?? "").trim();
  }
};
