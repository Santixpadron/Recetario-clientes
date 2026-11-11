"use strict";

/**
 * Caché en memoria de UmamiLab.
 *
 * PROVISIONAL — archivo asignado al Integrante 1.
 * Se deja una versión funcional para que la mitad del Integrante 2 pueda
 * ejecutarse y probarse. No usa localStorage: la caché vive solo en la sesión.
 */
class ServicioCache {
  constructor() {
    this.recetas = new Map();
    this.categorias = null;
    this.origenes = null;
    this.ingredientes = null;
    this.enVuelo = new Map();
  }

  obtenerReceta(id) {
    return this.recetas.get(String(id)) || null;
  }

  guardarReceta(receta) {
    if (receta && receta.id) this.recetas.set(String(receta.id), receta);
    return receta;
  }

  obtenerCategorias() {
    return this.categorias;
  }

  guardarCategorias(lista) {
    this.categorias = Array.isArray(lista) ? lista : [];
    return this.categorias;
  }

  obtenerOrigenes() {
    return this.origenes;
  }

  guardarOrigenes(lista) {
    this.origenes = Array.isArray(lista) ? lista : [];
    return this.origenes;
  }

  obtenerIngredientes() {
    return this.ingredientes;
  }

  guardarIngredientes(lista) {
    this.ingredientes = Array.isArray(lista) ? lista : [];
    return this.ingredientes;
  }

  /**
   * Deduplica peticiones simultáneas: si dos vistas piden lo mismo a la vez,
   * ambas reciben la misma promesa en lugar de lanzar dos fetch.
   */
  pedirUnaVez(clave, productor) {
    if (this.enVuelo.has(clave)) return this.enVuelo.get(clave);

    const promesa = Promise.resolve()
      .then(productor)
      .finally(() => this.enVuelo.delete(clave));

    this.enVuelo.set(clave, promesa);
    return promesa;
  }

  limpiar() {
    this.recetas.clear();
    this.categorias = null;
    this.origenes = null;
    this.ingredientes = null;
    this.enVuelo.clear();
  }
}

const cacheMemoria = new ServicioCache();
