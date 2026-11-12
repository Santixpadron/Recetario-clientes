const URL_BASE_API = 'https://www.themealdb.com/api/json/v1/1/';

class ErrorApi extends Error {
  constructor(tipo, mensaje, codigoEstado = null) {
    super(mensaje);
    this.tipo = tipo; // 'SIN_CONEXION' | 'SERVICIO_NO_DISPONIBLE' | 'ABORTADO'
    this.codigoEstado = codigoEstado;
  }
}

const ServicioApi = {
  esCancelacion(error) {
    return Boolean(
      error &&
        (error.tipo === 'ABORTADO' || error.name === 'AbortError')
    );
  },

  async peticionCentralizada(endpoint, opciones = {}) {
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

  async buscarPorNombre(nombre, signal) {
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

  async obtenerRecetaPorId(id, signal) {
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

  async obtenerRecetaAleatoria(idExcluir = null, signal) {
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

  async obtenerCategorias() {
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

  async obtenerOrigenes() {
    const enCache = cacheMemoria.obtenerOrigenes();
    if (enCache) return enCache;

    const datos = await this.peticionCentralizada('list.php?a=list');
    const lista = (datos.meals || [])
      .map((m) => (m.strArea || '').trim())
      .filter(Boolean);
    cacheMemoria.guardarOrigenes(lista);
    return lista;
  },

  async obtenerIngredientes() {
    const enCache = cacheMemoria.obtenerIngredientes();
    if (enCache) return enCache;

    const datos = await this.peticionCentralizada('list.php?i=list');
    const lista = (datos.meals || [])
      .map((m) => (m.strIngredient || '').trim())
      .filter(Boolean);
    cacheMemoria.guardarIngredientes(lista);
    return lista;
  },

  async filtrarPorCategoria(categoria, signal) {
    const datos = await this.peticionCentralizada(
      `filter.php?c=${encodeURIComponent(categoria)}`,
      { signal }
    );
    if (!datos.meals) return [];
    return datos.meals.map((m) => ServicioRecetas.normalizarResumen(m));
  },

  async filtrarPorOrigen(origen, signal) {
    const datos = await this.peticionCentralizada(
      `filter.php?a=${encodeURIComponent(origen)}`,
      { signal }
    );
    if (!datos.meals) return [];
    return datos.meals.map((m) => ServicioRecetas.normalizarResumen(m));
  },

  async filtrarPorIngrediente(ingrediente, signal) {
    const datos = await this.peticionCentralizada(
      `filter.php?i=${encodeURIComponent(ingrediente)}`,
      { signal }
    );
    if (!datos.meals) return [];
    return datos.meals.map((m) => ServicioRecetas.normalizarResumen(m));
  }
};