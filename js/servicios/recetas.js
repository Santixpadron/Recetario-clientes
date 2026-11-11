"use strict";

/**
 * Normalización de las respuestas de TheMealDB.
 *
 * Responsabilidad del Integrante 2. Convierte los objetos crudos de la API en
 * un modelo estable para toda la aplicación: resumen para tarjetas y receta
 * completa para el detalle y el comparador.
 */
const ServicioRecetas = {
  texto(valor) {
    return typeof valor === "string" ? valor.trim() : "";
  },

  /** Clave de comparación: sin mayúsculas, sin acentos y con espacios simples. */
  clave(texto) {
    return this.texto(texto)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ");
  },

  normalizarResumen(cruda) {
    const datos = cruda || {};
    return {
      id: String(datos.idMeal || ""),
      nombre: this.texto(datos.strMeal),
      imagen: this.texto(datos.strMealThumb),
      categoria: this.texto(datos.strCategory),
      origen: this.texto(datos.strArea),
      completa: false
    };
  },

  normalizarEtiquetas(crudas) {
    if (!crudas) return [];

    const vistas = new Set();
    const etiquetas = [];

    String(crudas)
      .split(",")
      .map((etiqueta) => etiqueta.trim())
      .filter(Boolean)
      .forEach((etiqueta) => {
        const clave = this.clave(etiqueta);
        if (clave && !vistas.has(clave)) {
          vistas.add(clave);
          etiquetas.push(etiqueta);
        }
      });

    return etiquetas;
  },

  obtenerImagenIngrediente(nombre) {
    const limpio = this.texto(nombre);
    if (!limpio) return "assets/ingrediente-default.svg";
    return `https://www.themealdb.com/images/ingredients/${encodeURIComponent(limpio)}.png`;
  },

  normalizarCompleta(cruda) {
    const datos = cruda || {};
    const ingredientes = [];

    for (let i = 1; i <= 20; i += 1) {
      const nombre = this.texto(datos[`strIngredient${i}`]);
      if (!nombre) continue;

      const medida = this.texto(datos[`strMeasure${i}`]);
      ingredientes.push({
        nombre,
        medida: medida || "Al gusto",
        imagen: this.obtenerImagenIngrediente(nombre)
      });
    }

    const instrucciones = this.texto(datos.strInstructions);
    const etiquetas = this.normalizarEtiquetas(datos.strTags);

    return {
      id: String(datos.idMeal || ""),
      nombre: this.texto(datos.strMeal) || "Receta sin nombre",
      imagen: this.texto(datos.strMealThumb),
      categoria: this.texto(datos.strCategory) || "Sin categoría",
      origen: this.texto(datos.strArea) || "Desconocido",
      instrucciones,
      pasos: this.extraerPasos(instrucciones),
      cantidadPalabras: instrucciones
        ? instrucciones.split(/\s+/).filter(Boolean).length
        : 0,
      etiquetas,
      youtube: this.texto(datos.strYoutube) || null,
      ingredientes,
      completa: true
    };
  },

  /**
   * Divide las instrucciones en pasos legibles.
   * Descarta encabezados como "Step 1" o "Paso 2:" y, si la API devuelve todo
   * en un único párrafo, separa por marcas de paso o por oraciones.
   */
  extraerPasos(textoInstrucciones) {
    const texto = this.texto(textoInstrucciones);
    if (!texto) return [];

    let lineas = texto
      .split(/\r?\n/)
      .map((linea) => linea.trim())
      .filter(Boolean);

    if (lineas.length === 1) {
      const porMarcas = lineas[0]
        .split(/(?=(?:step|paso)\s*\d+\s*[:.)\-–—])/i)
        .map((parte) => parte.trim())
        .filter(Boolean);

      lineas = porMarcas.length > 1 ? porMarcas : this.dividirOraciones(lineas[0]);
    }

    const soloEncabezado = /^(?:(?:step|paso)\s*)?\d+\s*[:.)\-–—]*$/i;
    const prefijoPaso = /^(?:(?:step|paso)\s*\d+\s*[:.)\-–—]+|\d+\s*[:.)\-–—]+)\s*/i;
    const pasos = [];

    lineas.forEach((linea) => {
      const limpia = linea.replace(prefijoPaso, "").trim();
      if (!limpia || soloEncabezado.test(limpia)) return;
      pasos.push(limpia);
    });

    return pasos;
  },

  dividirOraciones(texto) {
    const oraciones = texto
      .split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ0-9¿¡])/)
      .map((oracion) => oracion.trim())
      .filter(Boolean);

    return oraciones.length > 1 ? oraciones : [texto];
  }
};
