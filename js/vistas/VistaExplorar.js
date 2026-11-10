"use strict";

/**
 * Vista de Explorar.
 * TODO: cargar listas auxiliares, ejecutar peticiones por criterio en paralelo,
 * intersectar por idMeal, ordenar, paginar de 12 en 12 y resolver las tarjetas
 * visibles con Promise.allSettled.
 */
class VistaExplorar extends Pseudocomponente {
  constructor(contenedor, props = {}) {
    super(contenedor, props);
    this.estado = {};
  }

  crear() {
    return DOM.crear("section", { clase: "vista vista--explorar" });
  }

  render() {
    this.destruirHijos();
    DOM.vaciar(this.el);

    const cabecera = DOM.crear("header", { clase: "vista__cabecera" }, [
      DOM.crear("div", {}, [
        DOM.crear("h1", { clase: "vista__titulo", texto: "Explorar" }),
        DOM.crear("p", {
          clase: "vista__subtitulo",
          texto: "Combina nombre, categoría, origen e ingrediente."
        })
      ])
    ]);

    this.cuerpo = DOM.crear("div", { clase: "vista__cuerpo" });

    this.el.appendChild(cabecera);
    this.el.appendChild(this.cuerpo);

    this.agregarHijo(
      new FormularioBusqueda(this.cuerpo, {
        categorias: [],
        origenes: [],
        ingredientes: [],
        criterios: this.props.estado.explorar.criterios,
        seccion: "explorar"
      })
    );

    this.agregarHijo(
      new EstadoCarga(this.cuerpo, {
        variante: "vacio",
        tipo: "bloque",
        mensaje: "Aún no hay búsqueda. Aplica al menos un criterio.",
        seccion: "explorar"
      })
    );

    this.cuerpo.appendChild(
      DOM.crear("p", {
        clase: "nota",
        texto:
          "TODO: peticiones en paralelo por criterio, intersección por idMeal, orden alfabético, paginación de 12 y tarjetas con detalle resuelto en paralelo."
      })
    );
  }

  eventos() {
    this.escuchar(this.el, "busqueda:aplicar", (evento) => {
      this.props.estado.explorar.criterios = { ...evento.detail };
      Aviso.mostrar(
        "Pendiente: ejecutar la búsqueda combinada y pintar resultados.",
        "info"
      );
    });

    this.escuchar(this.el, "busqueda:limpiar", () => {
      this.props.estado.explorar = {
        criterios: { nombre: "", categoria: "", origen: "", ingrediente: "" },
        resultados: [],
        pagina: 1,
        totalPaginas: 1
      };
      Aviso.mostrar("Búsqueda limpiada.", "info");
    });

    this.escuchar(this.el, "pagina:cambiar", (evento) => {
      this.props.estado.explorar.pagina = evento.detail.pagina;
      Aviso.mostrar(
        `Pendiente: cargar la página ${evento.detail.pagina}.`,
        "info"
      );
    });
  }
}
