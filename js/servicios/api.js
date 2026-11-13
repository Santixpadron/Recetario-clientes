const URL_BASE_API = 'https://www.themealdb.com/api/json/v1/1/';

class ErrorApi extends Error { // se encarga de representar un error de la API, con un tipo y un mensaje descriptivo
  constructor(tipo, mensaje, codigoEstado = null) {
    super(mensaje);
    this.tipo = tipo; // 'SIN_CONEXION' | 'SERVICIO_NO_DISPONIBLE' | 'ABORTADO'
    this.codigoEstado = codigoEstado;
  }
}

const ServicioApi = { // se encarga de manejar las peticiones a la API de TheMealDB, incluyendo la búsqueda de recetas, obtención de detalles y filtrado por categorías, origenes e ingredientes
  esCancelacion(error) {
    return Boolean(
      error &&
        (error.tipo === 'ABORTADO' || error.name === 'AbortError')
    );
  },

  async peticionCentralizada(endpoint, opciones = {}) { // se encarga de realizar una petición a la API de TheMealDB, manejando errores de conexión, estado de respuesta y parseo de JSON
    let respuesta;
    try {
      respuesta = await fetch(`${URL_BASE_API}${endpoint}`, {
        signal: opciones.signal
      });
    } catch (error) {
      if (error && error.name === 'AbortError') {
        throw new ErrorApi('ABORTADO', 'Petición cancelada por el usuario.');
      }
      throw new ErrorApi(
        'SIN_CONEXION',
        'No fue posible conectar con el servidor. Verifica tu conexión a internet.'
      );
    }

    if (!respuesta.ok) {
      throw new ErrorApi(
        'SERVICIO_NO_DISPONIBLE',
        `El servicio respondió con un estado de error (${respuesta.status}).`,
        respuesta.status
      );
    }

    try {
      return await respuesta.json();
    } catch (error) {
      throw new ErrorApi('SERVICIO_NO_DISPONIBLE', 'Respuesta inválida del servidor.');
    }
  },

  async buscarPorNombre(nombre, signal) { // se encarga de buscar recetas por nombre en la API de TheMealDB, normalizando los resultados y almacenándolos en caché
    const datos = await this.peticionCentralizada(
      `search.php?s=${encodeURIComponent(nombre.trim())}`,
      { signal }
    );
    if (!datos.meals) return [];
    return datos.meals.map((item) => {
      const normalizada = ServicioRecetas.normalizarCompleta(item);
      cacheMemoria.guardarReceta(normalizada);
      return normalizada;
    });
  },

  async obtenerRecetaPorId(id, signal) { // se encarga de obtener los detalles de una receta por su ID en la API de TheMealDB, normalizando el resultado y almacenándolo en caché
    const enCache = cacheMemoria.obtenerReceta(id);
    if (enCache) return enCache;

    const datos = await this.peticionCentralizada(
      `lookup.php?i=${encodeURIComponent(id)}`,
      { signal }
    );
    if (!datos.meals || !datos.meals[0]) {
      throw new ErrorApi('SERVICIO_NO_DISPONIBLE', 'No se encontró la receta solicitada.');
    }
    const normalizada = ServicioRecetas.normalizarCompleta(datos.meals[0]);
    cacheMemoria.guardarReceta(normalizada);
    return normalizada;
  },

  async obtenerRecetaAleatoria(idExcluir = null, signal) { // se encarga de obtener una receta aleatoria de la API de TheMealDB, evitando un ID específico si se proporciona, normalizando el resultado y almacenándolo en caché
    let intentos = 0;
    while (intentos < 5) {
      intentos++;
      const datos = await this.peticionCentralizada('random.php', { signal });
      if (datos.meals && datos.meals[0]) {
        const normalizada = ServicioRecetas.normalizarCompleta(datos.meals[0]);
        cacheMemoria.guardarReceta(normalizada);
        if (!idExcluir || normalizada.id !== String(idExcluir) || intentos === 5) {
          return normalizada;
        }
      }
    }
    throw new ErrorApi('SERVICIO_NO_DISPONIBLE', 'No se pudo obtener una receta aleatoria.');
  },

  async obtenerCategorias() { // se encarga de obtener la lista de categorías de recetas de la API de TheMealDB, normalizando los resultados y almacenándolos en caché
    const enCache = cacheMemoria.obtenerCategorias();
    if (enCache) return enCache;

    const datos = await this.peticionCentralizada('categories.php');
    const lista = (datos.categories || []).map((c) => ({
      id: c.idCategory,
      nombre: c.strCategory,
      imagen: c.strCategoryThumb,
      descripcion: (c.strCategoryDescription || '').trim()
    }));
    cacheMemoria.guardarCategorias(lista);
    return lista;
  },

  async obtenerOrigenes() { // se encarga de obtener la lista de orígenes de recetas de la API de TheMealDB, normalizando los resultados y almacenándolos en caché
    const enCache = cacheMemoria.obtenerOrigenes();
    if (enCache) return enCache;

    const datos = await this.peticionCentralizada('list.php?a=list');
    const lista = (datos.meals || [])
      .map((m) => (m.strArea || '').trim())
      .filter(Boolean);
    cacheMemoria.guardarOrigenes(lista);
    return lista;
  },

  async obtenerIngredientes() { // se encarga de obtener la lista de ingredientes de recetas de la API de TheMealDB, normalizando los resultados y almacenándolos en caché
    const enCache = cacheMemoria.obtenerIngredientes();
    if (enCache) return enCache;

    const datos = await this.peticionCentralizada('list.php?i=list');
    const lista = (datos.meals || [])
      .map((m) => (m.strIngredient || '').trim())
      .filter(Boolean);
    cacheMemoria.guardarIngredientes(lista);
    return lista;
  },

  async filtrarPorCategoria(categoria, signal) { // se encarga de filtrar recetas por categoría en la API de TheMealDB, normalizando los resultados y almacenándolos en caché
    const datos = await this.peticionCentralizada(
      `filter.php?c=${encodeURIComponent(categoria)}`,
      { signal }
    );
    if (!datos.meals) return [];
    return datos.meals.map((m) => ServicioRecetas.normalizarResumen(m));
  },

  async filtrarPorOrigen(origen, signal) { // se encarga de filtrar recetas por origen en la API de TheMealDB, normalizando los resultados y almacenándolos en caché
    const datos = await this.peticionCentralizada(
      `filter.php?a=${encodeURIComponent(origen)}`,
      { signal }
    );
    if (!datos.meals) return [];
    return datos.meals.map((m) => ServicioRecetas.normalizarResumen(m));
  },

  async filtrarPorIngrediente(ingrediente, signal) { // se encarga de filtrar recetas por ingrediente en la API de TheMealDB, normalizando los resultados y almacenándolos en caché
    const datos = await this.peticionCentralizada(
      `filter.php?i=${encodeURIComponent(ingrediente)}`,
      { signal }
    );
    if (!datos.meals) return [];
    return datos.meals.map((m) => ServicioRecetas.normalizarResumen(m));
  }
};