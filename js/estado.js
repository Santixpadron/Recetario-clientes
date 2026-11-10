"use strict";

function crearEstadoInicial() {
  return {
    vista: "inicio",
    origenDetalle: null,
    explorar: {
      criterios: { nombre: "", categoria: "", origen: "", ingrediente: "" },
      resultados: [],
      pagina: 1,
      totalPaginas: 1
    },
    categorias: {
      pestana: "categorias",
      seleccion: null,
      pagina: 1
    },
    comparador: {
      A: null,
      B: null
    }
  };
}

/**
 * Estado global en memoria. No se persiste: recargar reinicia la sesión.
 * Las vistas se destruyen al navegar, pero este objeto se conserva.
 */
const Estado = crearEstadoInicial();

Estado.reiniciar = function reiniciar() {
  Object.assign(this, crearEstadoInicial());
};
