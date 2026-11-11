"use strict";

/**
 * Servicio de acceso a TheMealDB.
 *
 * PROVISIONAL — archivo asignado al Integrante 1.
 * Versión funcional mínima: una única petición centralizada, validación de
 * `response.ok`, errores tipificados y apoyo en `cacheMemoria`.
 */
const URL_BASE_API = "https://www.themealdb.com/api/json/v1/1/";

class ErrorApi extends Error {
  constructor(tipo, mensaje, codigoEstado = null) {
    super(mensaje);
    this.name = "ErrorApi";
    this.tipo = tipo; // 'SIN_CONEXION' | 'SERVICIO_NO_DISPONIBLE' | 'ABORTADO'
    this.codigoEstado = codigoEstado;
  }
}

const ServicioApi = {
  async peticionCentralizada(endpoint, opciones = {}) {
    let respuesta;

    try {
      respuesta = await fetch(`${URL_BASE_API}${endpoint}`, {
        signal: opciones.signal
      });
    } catch (error) {
      if (error && error.name === "AbortError") {
        throw new ErrorApi("ABORTADO", "Petición cancelada.");
      }
      throw new ErrorApi(
        "SIN_CONEXION",
        "No fue posible conectar con el servidor. Verifica tu conexión a internet."
      );
    }

    if (!respuesta.ok) {
      throw new ErrorApi(
        "SERVICIO_NO_DISPONIBLE",
        `El servicio respondió con un estado de error (${respuesta.status}).`,
        respuesta.status
      );
    }

    try {
      return await respuesta.json();
    } catch (error) {
      throw new ErrorApi("SERVICIO_NO_DISPONIBLE", "Respuesta inválida del servidor.");
    }
  },

  async buscarPorNombre(nombre, signal) {
    const consulta = String(nombre || "").trim();
    if (!consulta) return [];

    const datos = await this.peticionCentralizada(
      `search.php?s=${encodeURIComponent(consulta)}`,
      { signal }
    );

    if (!Array.isArray(datos.meals)) return [];

    return datos.meals.map((cruda) => {
      const receta = ServicioRecetas.normalizarCompleta(cruda);
      return cacheMemoria.guardarReceta(receta);
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
      throw new ErrorApi("SERVICIO_NO_DISPONIBLE", "No se encontró la receta solicitada.");
    }

    return cacheMemoria.guardarReceta(ServicioRecetas.normalizarCompleta(datos.meals[0]));
  },

  async obtenerRecetaAleatoria(idExcluir = null, signal) {
    for (let intento = 1; intento <= 5; intento += 1) {
      const datos = await this.peticionCentralizada("random.php", { signal });
      const cruda = datos.meals && datos.meals[0];

      if (cruda) {
        const receta = cacheMemoria.guardarReceta(ServicioRecetas.normalizarCompleta(cruda));
        if (!idExcluir || receta.id !== String(idExcluir) || intento === 5) {
          return receta;
        }
      }
    }

    throw new ErrorApi("SERVICIO_NO_DISPONIBLE", "No se pudo obtener una receta aleatoria.");
  },

  async obtenerCategorias() {
    const enCache = cacheMemoria.obtenerCategorias();
    if (enCache) return enCache;

    return cacheMemoria.pedirUnaVez("categorias", async () => {
      const datos = await this.peticionCentralizada("categories.php");
      const lista = (datos.categories || []).map((categoria) => ({
        id: String(categoria.idCategory || categoria.strCategory || ""),
        nombre: String(categoria.strCategory || "").trim(),
        imagen: String(categoria.strCategoryThumb || "").trim(),
        descripcion: String(categoria.strCategoryDescription || "").trim()
      }));

      return cacheMemoria.guardarCategorias(lista);
    });
  },

  async obtenerOrigenes() {
    const enCache = cacheMemoria.obtenerOrigenes();
    if (enCache) return enCache;

    return cacheMemoria.pedirUnaVez("origenes", async () => {
      const datos = await this.peticionCentralizada("list.php?a=list");
      const lista = (datos.meals || [])
        .map((item) => String(item.strArea || "").trim())
        .filter(Boolean);

      return cacheMemoria.guardarOrigenes(lista);
    });
  },

  async obtenerIngredientes() {
    const enCache = cacheMemoria.obtenerIngredientes();
    if (enCache) return enCache;

    return cacheMemoria.pedirUnaVez("ingredientes", async () => {
      const datos = await this.peticionCentralizada("list.php?i=list");
      const lista = (datos.meals || [])
        .map((item) => String(item.strIngredient || "").trim())
        .filter(Boolean);

      return cacheMemoria.guardarIngredientes(lista);
    });
  },

  async filtrarPorCategoria(categoria, signal) {
    const datos = await this.peticionCentralizada(
      `filter.php?c=${encodeURIComponent(categoria)}`,
      { signal }
    );

    if (!Array.isArray(datos.meals)) return [];
    return datos.meals.map((item) => ServicioRecetas.normalizarResumen(item));
  },

  async filtrarPorOrigen(origen, signal) {
    const datos = await this.peticionCentralizada(
      `filter.php?a=${encodeURIComponent(origen)}`,
      { signal }
    );

    if (!Array.isArray(datos.meals)) return [];
    return datos.meals.map((item) => ServicioRecetas.normalizarResumen(item));
  },

  async filtrarPorIngrediente(ingrediente, signal) {
    const datos = await this.peticionCentralizada(
      `filter.php?i=${encodeURIComponent(ingrediente)}`,
      { signal }
    );

    if (!Array.isArray(datos.meals)) return [];
    return datos.meals.map((item) => ServicioRecetas.normalizarResumen(item));
  },

  esCancelacion(error) {
    return Boolean(error && (error.tipo === "ABORTADO" || error.name === "AbortError"));
  }
};
