class ServicioCache { // Clase que maneja la caché de recetas, categorías, orígenes e ingredientes para evitar llamadas repetidas 
  constructor() {      // a la API y mejorar el rendimiento de la aplicación
    this.recetasCompletas = new Map();
    this.categorias = null;
    this.origenes = null;
    this.ingredientes = null;
  }

  obtenerReceta(idMeal) { // se encarga de obtener una receta completa de la caché por su ID, devolviendo null si no se encuentra
    if (!idMeal) return null;
    return this.recetasCompletas.get(String(idMeal)) || null;
  }

  guardarReceta(recetaNormalizada) { // se encarga de guardar una receta completa en la caché, utilizando su ID como clave
    if (recetaNormalizada && recetaNormalizada.id) {
      this.recetasCompletas.set(String(recetaNormalizada.id), recetaNormalizada);
    }
  }

  obtenerCategorias() {
    return this.categorias;
  }

  guardarCategorias(lista) {
    this.categorias = lista;
  }

  obtenerOrigenes() {
    return this.origenes;
  }

  guardarOrigenes(lista) {
    this.origenes = lista;
  }

  obtenerIngredientes() {
    return this.ingredientes;
  }

  guardarIngredientes(lista) {
    this.ingredientes = lista;
  }
}

const cacheMemoria = new ServicioCache();