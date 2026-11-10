"use strict";

/**
 * Cálculo de métricas del comparador.
 * La comparación de ingredientes y etiquetas ignora mayúsculas y espacios sobrantes.
 */
const Comparacion = {
  normalizar(texto) {
    return String(texto ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  },

  contarPalabras(texto) {
    const limpio = String(texto ?? "").trim();
    return limpio ? limpio.split(/\s+/).length : 0;
  },

  ingredientesUnicos(receta) {
    const mapa = new Map();
    for (const ingrediente of receta?.ingredientes ?? []) {
      const clave = this.normalizar(ingrediente.nombre);
      if (!clave || mapa.has(clave)) continue;
      mapa.set(clave, ingrediente.nombre.trim());
    }
    return mapa;
  },

  etiquetasUnicas(receta) {
    const mapa = new Map();
    for (const etiqueta of receta?.etiquetas ?? []) {
      const clave = this.normalizar(etiqueta);
      if (!clave || mapa.has(clave)) continue;
      mapa.set(clave, etiqueta.trim());
    }
    return mapa;
  },

  comparar(a, b) {
    if (!a || !b) return null;

    const ingredientesA = this.ingredientesUnicos(a);
    const ingredientesB = this.ingredientesUnicos(b);
    const comunes = [];
    const soloA = [];
    const soloB = [];

    for (const [clave, nombre] of ingredientesA) {
      if (ingredientesB.has(clave)) comunes.push(nombre);
      else soloA.push(nombre);
    }

    for (const [clave, nombre] of ingredientesB) {
      if (!ingredientesA.has(clave)) soloB.push(nombre);
    }

    const union = new Set([...ingredientesA.keys(), ...ingredientesB.keys()]);
    const similitud =
      union.size === 0 ? 0 : Math.round((comunes.length / union.size) * 100);

    const etiquetasA = this.etiquetasUnicas(a);
    const etiquetasB = this.etiquetasUnicas(b);
    const etiquetasComunes = [];
    for (const [clave, nombre] of etiquetasA) {
      if (etiquetasB.has(clave)) etiquetasComunes.push(nombre);
    }

    return {
      ingredientesA: ingredientesA.size,
      ingredientesB: ingredientesB.size,
      pasosA: (a.pasos ?? []).length,
      pasosB: (b.pasos ?? []).length,
      palabrasA: this.contarPalabras(a.instrucciones),
      palabrasB: this.contarPalabras(b.instrucciones),
      mismaCategoria: this.normalizar(a.categoria) === this.normalizar(b.categoria),
      mismoOrigen: this.normalizar(a.origen) === this.normalizar(b.origen),
      etiquetasComunes,
      videoA: Boolean(a.video),
      videoB: Boolean(b.video),
      ingredientesComunes: comunes,
      ingredientesSoloA: soloA,
      ingredientesSoloB: soloB,
      similitud,
      masSencilla: this.masSencilla(a, b)
    };
  },

  masSencilla(a, b) {
    const ingredientesA = this.ingredientesUnicos(a).size;
    const ingredientesB = this.ingredientesUnicos(b).size;
    if (ingredientesA !== ingredientesB) return ingredientesA < ingredientesB ? "A" : "B";

    const pasosA = (a.pasos ?? []).length;
    const pasosB = (b.pasos ?? []).length;
    if (pasosA !== pasosB) return pasosA < pasosB ? "A" : "B";

    const palabrasA = this.contarPalabras(a.instrucciones);
    const palabrasB = this.contarPalabras(b.instrucciones);
    if (palabrasA !== palabrasB) return palabrasA < palabrasB ? "A" : "B";

    return "empate";
  },

  menor(a, b) {
    if (a === b) return null;
    return a < b ? "A" : "B";
  }
};
