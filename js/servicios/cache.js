"use strict";

/**
 * Caché en memoria. Guarda promesas para deduplicar peticiones en vuelo.
 * Si una promesa falla, se elimina para permitir el reintento.
 */
const Cache = {
  recetas: new Map(),
  listas: new Map(),

  obtenerReceta(id, cargador) {
    const clave = String(id);
    if (this.recetas.has(clave)) return this.recetas.get(clave);

    const promesa = (async () => {
      try {
        const receta = await cargador();
        if (!receta) throw new Error("Receta no encontrada.");
        return receta;
      } catch (error) {
        this.recetas.delete(clave);
        throw error;
      }
    })();

    this.recetas.set(clave, promesa);
    return promesa;
  },

  obtenerLista(clave, cargador) {
    if (this.listas.has(clave)) return this.listas.get(clave);

    const promesa = (async () => {
      try {
        return await cargador();
      } catch (error) {
        this.listas.delete(clave);
        throw error;
      }
    })();

    this.listas.set(clave, promesa);
    return promesa;
  },

  tieneReceta(id) {
    return this.recetas.has(String(id));
  },

  limpiar() {
    this.recetas.clear();
    this.listas.clear();
  }
};
