class ServicioCache {
  constructor() {
    this.recetasCompletas = new Map();
    this.categorias = null;
    this.origenes = null;
    this.ingredientes = null;
  }

  obtenerReceta(idMeal) {
    if (!idMeal) return null;
    return this.recetasCompletas.get(String(idMeal)) || null;
  }

  guardarReceta(recetaNormalizada) {
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