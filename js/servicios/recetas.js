"use strict";

/**
 * Normalización de respuestas de TheMealDB.
 * Aquí se concentran ingredientes, pasos, etiquetas y listas auxiliares.
 */
const Recetas = {
  texto(valor) {
    return String(valor ?? "").trim();
  },

  normalizarResumen(raw) {
    return {
      id: String(raw?.idMeal ?? ""),
      nombre: this.texto(raw?.strMeal),
      imagen: this.texto(raw?.strMealThumb)
    };
  },

  normalizarReceta(raw) {
    return {
      id: String(raw?.idMeal ?? ""),
      nombre: this.texto(raw?.strMeal),
      imagen: this.texto(raw?.strMealThumb),
      categoria: this.texto(raw?.strCategory),
      origen: this.texto(raw?.strArea),
      instrucciones: this.texto(raw?.strInstructions),
      pasos: this.parsearPasos(raw?.strInstructions),
      etiquetas: this.parsearEtiquetas(raw?.strTags),
      video: this.texto(raw?.strYoutube) || null,
      ingredientes: this.extraerIngredientes(raw)
    };
  },

  extraerIngredientes(raw) {
    const ingredientes = [];
    if (!raw) return ingredientes;

    for (let i = 1; i <= 20; i += 1) {
      const nombre = this.texto(raw[`strIngredient${i}`]);
      const medida = this.texto(raw[`strMeasure${i}`]);
      if (!nombre) continue;

      ingredientes.push({
        nombre,
        medida,
        imagen: this.imagenIngrediente(nombre)
      });
    }

    return ingredientes;
  },

  parsearPasos(instrucciones) {
    const lineas = String(instrucciones ?? "")
      .split(/\r?\n/)
      .map((linea) => linea.trim())
      .filter((linea) => linea.length > 0);

    // Solo se descartan las líneas que son únicamente un encabezado
    // ("STEP 1", "Paso 1:", "1."). Una línea con contenido se conserva.
    const soloEncabezado = /^(step|paso)\s*\d+\s*[.)\-:]?$/i;
    const soloNumero = /^\d+\s*[.)\-:]?$/;

    return lineas.filter(
      (linea) => !soloEncabezado.test(linea) && !soloNumero.test(linea)
    );
  },

  parsearEtiquetas(tags) {
    const etiquetas = [];
    const vistas = new Set();

    for (const parte of String(tags ?? "").split(",")) {
      const etiqueta = parte.trim();
      if (!etiqueta) continue;

      const clave = etiqueta.toLowerCase();
      if (vistas.has(clave)) continue;

      vistas.add(clave);
      etiquetas.push(etiqueta);
    }

    return etiquetas;
  },

  imagenIngrediente(nombre) {
    return `https://www.themealdb.com/images/ingredients/${encodeURIComponent(nombre)}.png`;
  },

  normalizarCategorias(data) {
    return (data?.categories ?? [])
      .map((categoria) => ({
        id: String(categoria.idCategory ?? ""),
        nombre: this.texto(categoria.strCategory),
        imagen: this.texto(categoria.strCategoryThumb),
        descripcion: this.texto(categoria.strCategoryDescription)
      }))
      .filter((categoria) => categoria.nombre);
  },

  normalizarOrigenes(data) {
    return (data?.meals ?? [])
      .map((origen) => ({ nombre: this.texto(origen.strArea) }))
      .filter((origen) => origen.nombre);
  },

  normalizarIngredientes(data) {
    return (data?.meals ?? [])
      .map((ingrediente) => ({ nombre: this.texto(ingrediente.strIngredient) }))
      .filter((ingrediente) => ingrediente.nombre);
  },

  recetaDesdeRespuesta(data) {
    const raw = data?.meals?.[0];
    return raw ? this.normalizarReceta(raw) : null;
  },

  recetasDesdeRespuesta(data) {
    return (data?.meals ?? []).map((raw) => this.normalizarReceta(raw));
  },

  resumenesDesdeRespuesta(data) {
    return (data?.meals ?? []).map((raw) => this.normalizarResumen(raw));
  },

  recortarDescripcion(texto, maximo = 120) {
    const limpio = this.texto(texto);
    if (limpio.length <= maximo) return limpio;
    return `${limpio.slice(0, maximo).trimEnd()}…`;
  }
};
