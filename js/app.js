"use strict";

const VISTAS = {
  inicio: VistaInicio,
  explorar: VistaExplorar,
  detalle: VistaDetalle,
  categorias: VistaCategoriasOrigenes,
  comparador: VistaComparador
};

const TITULOS = {
  inicio: "Inicio",
  explorar: "Explorar",
  detalle: "Detalle",
  categorias: "Categorías y orígenes",
  comparador: "Comparador"
};

let barra = null;
let vistaActual = null;
let contenedorVista = null;

document.addEventListener("DOMContentLoaded", iniciar);

function iniciar() {
  contenedorVista = document.getElementById("vista");
  const contenedorBarra = document.getElementById("barra-navegacion");

  barra = new BarraNavegacion(contenedorBarra, {
    vistaActiva: "inicio",
    cantidadComparador: contarComparador()
  });
  barra.montar();

  document.addEventListener("nav:ir", (evento) => {
    navegar(evento.detail.vista);
  });

  document.addEventListener("nav:volver", () => {
    navegar(Estado.origenDetalle?.vista || "inicio");
  });

  document.addEventListener("receta:abrir", (evento) => {
    Estado.origenDetalle = { vista: Estado.vista };
    navegar("detalle", { id: evento.detail.id });
  });

  document.addEventListener("receta:comparar", (evento) => {
    agregarAlComparador(evento.detail.receta);
  });

  document.addEventListener("comparador:estado", (evento) => {
    Estado.comparador = {
      A: evento.detail.A || null,
      B: evento.detail.B || null
    };
    actualizarBarra();
  });

  navegar("inicio");

  window.App = { navegar, Estado, Cache, API, Recetas, Comparacion };
}

function navegar(vista, props = {}) {
  const Clase = VISTAS[vista];

  if (!Clase) {
    Aviso.mostrar(`La vista "${vista}" no existe.`, "error");
    return;
  }

  if (vistaActual) {
    vistaActual.destruir();
    vistaActual = null;
  }

  Estado.vista = vista;

  vistaActual = new Clase(contenedorVista, {
    ...props,
    estado: Estado,
    navegar
  });

  vistaActual.montar();

  actualizarBarra();
  document.title = `${TITULOS[vista] || vista} — Recetario`;
  contenedorVista.focus({ preventScroll: true });
}

function contarComparador() {
  return (Estado.comparador.A ? 1 : 0) + (Estado.comparador.B ? 1 : 0);
}

function actualizarBarra() {
  if (!barra) return;
  barra.actualizar({
    vistaActiva: Estado.vista,
    cantidadComparador: contarComparador()
  });
}

function agregarAlComparador(receta) {
  if (!receta) return;

  const { A, B } = Estado.comparador;

  if ((A && A.id === receta.id) || (B && B.id === receta.id)) {
    Aviso.mostrar("Esa receta ya está en el comparador.", "error");
    return;
  }

  if (!A) {
    Estado.comparador.A = receta;
  } else if (!B) {
    Estado.comparador.B = receta;
  } else {
    abrirModalReemplazo(receta);
    return;
  }

  actualizarBarra();
  refrescarVistaComparador();
  Aviso.mostrar(
    `"${receta.nombre}" agregada al panel ${!A ? "A" : "B"}.`,
    "exito"
  );
}

function abrirModalReemplazo(receta) {
  const modal = new Modal(document.body, {
    titulo: "Comparador lleno",
    mensaje: `¿En qué panel quieres colocar "${receta.nombre}"?`,
    opciones: [
      { etiqueta: "Panel A", valor: "A" },
      { etiqueta: "Panel B", valor: "B" }
    ],
    cancelable: true
  });

  modal.montar();

  modal.escuchar(modal.el, "modal:opcion", (evento) => {
    Estado.comparador[evento.detail.valor] = receta;
    modal.destruir();
    actualizarBarra();
    refrescarVistaComparador();
    Aviso.mostrar(
      `"${receta.nombre}" colocada en el panel ${evento.detail.valor}.`,
      "exito"
    );
  });

  modal.escuchar(modal.el, "modal:cerrar", () => modal.destruir());
}

function refrescarVistaComparador() {
  if (Estado.vista === "comparador" && vistaActual) {
    vistaActual.render();
  }
}
