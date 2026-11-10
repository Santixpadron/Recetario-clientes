"use strict";

/**
 * Tarjeta reutilizable de receta.
 * Emite "receta:abrir", "receta:comparar" y "tarjeta:reintentar".
 */
class TarjetaReceta extends Pseudocomponente {
  constructor(contenedor, props = {}) {
    super(contenedor, props);
    this.estado = {
      receta: props.receta || null,
      completa: Boolean(props.completa),
      cargando: Boolean(props.cargando),
      error: Boolean(props.error)
    };
  }

  crear() {
    return DOM.crear("article", { clase: "tarjeta" });
  }

  render() {
    DOM.vaciar(this.el);
    this.el.className = this.estado.error ? "tarjeta tarjeta--incompleta" : "tarjeta";

    if (this.estado.cargando || !this.estado.receta) {
      this.el.appendChild(DOM.crear("div", { clase: "tarjeta__imagen" }));
      this.el.appendChild(
        DOM.crear("div", { clase: "tarjeta__cuerpo" }, [
          DOM.crear("span", { clase: "estado__bloque estado__bloque--titulo" }),
          DOM.crear("span", { clase: "estado__bloque" }),
          DOM.crear("span", { clase: "estado__bloque estado__bloque--corto" })
        ])
      );
      return;
    }

    const receta = this.estado.receta;

    const imagen = DOM.crear("img", {
      clase: "tarjeta__imagen",
      src: receta.imagen || "assets/receta-placeholder.svg",
      alt: receta.nombre,
      loading: "lazy"
    });
    imagen.addEventListener(
      "error",
      () => {
        imagen.src = "assets/receta-placeholder.svg";
      },
      { once: true }
    );

    const cuerpo = DOM.crear("div", { clase: "tarjeta__cuerpo" }, [
      DOM.crear("h3", { clase: "tarjeta__titulo", texto: receta.nombre })
    ]);

    if (this.estado.completa) {
      const meta = [
        receta.categoria,
        receta.origen,
        `${receta.ingredientes?.length ?? 0} ingredientes`
      ].filter(Boolean);
      cuerpo.appendChild(
        DOM.crear("p", { clase: "tarjeta__meta", texto: meta.join(" · ") })
      );
    } else if (this.estado.error) {
      cuerpo.appendChild(
        DOM.crear("span", {
          clase: "tarjeta__insignia",
          texto: "Datos incompletos"
        })
      );
    }

    const acciones = DOM.crear("div", { clase: "tarjeta__acciones" }, [
      DOM.crear("button", {
        clase: "boton boton--secundario",
        texto: "Ver detalle",
        attrs: { type: "button", "data-accion": "abrir" }
      }),
      DOM.crear("button", {
        clase: "boton boton--primario",
        texto: "Comparar",
        attrs: { type: "button", "data-accion": "comparar" }
      })
    ]);

    if (this.estado.error) {
      acciones.appendChild(
        DOM.crear("button", {
          clase: "boton boton--fantasma",
          texto: "Reintentar",
          attrs: { type: "button", "data-accion": "reintentar" }
        })
      );
    }

    cuerpo.appendChild(acciones);
    this.el.appendChild(imagen);
    this.el.appendChild(cuerpo);
  }

  eventos() {
    this.escuchar(this.el, "click", (evento) => {
      const boton = evento.target.closest("[data-accion]");
      if (!boton) return;

      const receta = this.estado.receta;
      if (!receta) return;

      const accion = boton.dataset.accion;
      if (accion === "abrir") this.emitir("receta:abrir", { id: receta.id });
      if (accion === "comparar") this.emitir("receta:comparar", { receta });
      if (accion === "reintentar") this.emitir("tarjeta:reintentar", { id: receta.id });
    });
  }

  actualizar(receta, completa = false, cargando = false, error = false) {
    this.estado = { receta, completa, cargando, error };
    if (this.el) this.render();
  }
}
