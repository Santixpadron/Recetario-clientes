"use strict";

class ErrorRed extends Error {
  constructor(causa) {
    super("No se pudo conectar con el servicio. Revisa tu conexión.");
    this.name = "ErrorRed";
    this.causa = causa;
  }
}

class ErrorServicio extends Error {
  constructor(estado) {
    super(`El servicio respondió con estado ${estado}.`);
    this.name = "ErrorServicio";
    this.estado = estado;
  }
}

/**
 * Función de petición centralizada.
 * - Verifica response.ok antes de leer el JSON.
 * - Distingue ErrorRed (sin conexión), ErrorServicio (estado HTTP) y AbortError.
 */
const API = {
  BASE: "https://www.themealdb.com/api/json/v1/1/",

  async peticion(ruta, opciones = {}) {
    try {
      const respuesta = await fetch(this.BASE + ruta, { signal: opciones.signal });
      if (!respuesta.ok) throw new ErrorServicio(respuesta.status);

      try {
        return await respuesta.json();
      } catch (error) {
        throw new ErrorServicio(respuesta.status);
      }
    } catch (error) {
      if (error.name === "AbortError") throw error;
      if (error instanceof ErrorServicio) throw error;
      throw new ErrorRed(error);
    }
  },

  buscarPorNombre(nombre, opciones = {}) {
    return this.peticion(`search.php?s=${encodeURIComponent(nombre)}`, opciones);
  },

  obtenerReceta(id, opciones = {}) {
    return this.peticion(`lookup.php?i=${encodeURIComponent(id)}`, opciones);
  },

  recetaAleatoria(opciones = {}) {
    return this.peticion("random.php", opciones);
  },

  listarCategorias(opciones = {}) {
    return this.peticion("categories.php", opciones);
  },

  listarOrigenes(opciones = {}) {
    return this.peticion("list.php?a=list", opciones);
  },

  listarIngredientes(opciones = {}) {
    return this.peticion("list.php?i=list", opciones);
  },

  filtrarPorCategoria(categoria, opciones = {}) {
    return this.peticion(`filter.php?c=${encodeURIComponent(categoria)}`, opciones);
  },

  filtrarPorOrigen(origen, opciones = {}) {
    return this.peticion(`filter.php?a=${encodeURIComponent(origen)}`, opciones);
  },

  filtrarPorIngrediente(ingrediente, opciones = {}) {
    return this.peticion(`filter.php?i=${encodeURIComponent(ingrediente)}`, opciones);
  }
};
