"use strict";

/**
 * Métricas del comparador de recetas.
 *
 * Responsabilidad del Integrante 2. Todo cálculo ignora mayúsculas, acentos y
 * espacios sobrantes para que "Chicken" y " chicken " cuenten como iguales.
 */
const ServicioComparacion = { // se encarga de calcular métricas de comparación entre dos recetas completas,
//  incluyendo similitud de ingredientes, pasos, palabras, categoría, origen y etiquetas
  normalizar(texto) {
    return String(texto ?? "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ");
  },

  mapaEntidades(lista, obtenerNombre) {
    const mapa = new Map();

    (Array.isArray(lista) ? lista : []).forEach((elemento) => {
      const nombre = String(obtenerNombre(elemento) ?? "").trim();
      const clave = this.normalizar(nombre);
      if (clave && !mapa.has(clave)) mapa.set(clave, nombre);
    });

    return mapa;
  },

  contarPalabras(receta) {
    if (Number.isFinite(receta.cantidadPalabras)) return receta.cantidadPalabras;

    const texto = String(receta.instrucciones ?? "").trim();
    return texto ? texto.split(/\s+/).filter(Boolean).length : 0;
  },

  calcularMetricas(recetaA, recetaB) {
    if (!recetaA || !recetaB) {
      throw new Error("Se necesitan dos recetas completas para comparar.");
    }

    const mapaIngredientesA = this.mapaEntidades(recetaA.ingredientes, (item) => item.nombre);
    const mapaIngredientesB = this.mapaEntidades(recetaB.ingredientes, (item) => item.nombre);

    const ingredientesComunes = [];
    const exclusivosA = [];
    const exclusivosB = [];

    mapaIngredientesA.forEach((nombre, clave) => {
      if (mapaIngredientesB.has(clave)) ingredientesComunes.push(nombre);
      else exclusivosA.push(nombre);
    });

    mapaIngredientesB.forEach((nombre, clave) => {
      if (!mapaIngredientesA.has(clave)) exclusivosB.push(nombre);
    });

    const mapaEtiquetasA = this.mapaEntidades(recetaA.etiquetas, (etiqueta) => etiqueta);
    const mapaEtiquetasB = this.mapaEntidades(recetaB.etiquetas, (etiqueta) => etiqueta);
    const etiquetasComunes = [];

    mapaEtiquetasA.forEach((etiqueta, clave) => {
      if (mapaEtiquetasB.has(clave)) etiquetasComunes.push(etiqueta);
    });

    const cantIngredientesA = mapaIngredientesA.size;
    const cantIngredientesB = mapaIngredientesB.size;
    const cantPasosA = Array.isArray(recetaA.pasos) ? recetaA.pasos.length : 0;
    const cantPasosB = Array.isArray(recetaB.pasos) ? recetaB.pasos.length : 0;
    const palabrasA = this.contarPalabras(recetaA);
    const palabrasB = this.contarPalabras(recetaB);

    const totalDistintos =
      ingredientesComunes.length + exclusivosA.length + exclusivosB.length;
    const similitud =
      totalDistintos > 0
        ? Math.round((ingredientesComunes.length / totalDistintos) * 100)
        : 0;

    let masSencilla = "EMPATE";
    let motivoSencilla = "Ambas recetas empatan en ingredientes, pasos y palabras.";

    if (cantIngredientesA !== cantIngredientesB) {
      masSencilla = cantIngredientesA < cantIngredientesB ? "A" : "B";
      motivoSencilla = "Menor cantidad de ingredientes.";
    } else if (cantPasosA !== cantPasosB) {
      masSencilla = cantPasosA < cantPasosB ? "A" : "B";
      motivoSencilla = "Empate en ingredientes; menor cantidad de pasos.";
    } else if (palabrasA !== palabrasB) {
      masSencilla = palabrasA < palabrasB ? "A" : "B";
      motivoSencilla = "Empate en ingredientes y pasos; instrucciones más breves.";
    }

    return {
      cantIngredientes: { a: cantIngredientesA, b: cantIngredientesB },
      cantPasos: { a: cantPasosA, b: cantPasosB },
      extensionPalabras: { a: palabrasA, b: palabrasB },
      categoria: {
        a: recetaA.categoria,
        b: recetaB.categoria,
        coinciden: this.normalizar(recetaA.categoria) === this.normalizar(recetaB.categoria)
      },
      origen: {
        a: recetaA.origen,
        b: recetaB.origen,
        coinciden: this.normalizar(recetaA.origen) === this.normalizar(recetaB.origen)
      },
      etiquetasComunes,
      video: { a: Boolean(recetaA.youtube), b: Boolean(recetaB.youtube) },
      ingredientesComunes,
      exclusivosA,
      exclusivosB,
      similitud,
      masSencilla,
      motivoSencilla
    };
  }
};
// la lógica de comparación de recetas se encuentra en el objeto ServicioComparacion, que proporciona métodos para normalizar texto,
//  mapear entidades, contar palabras y calcular métricas de similitud entre dos recetas completas.  