"use strict";

/**
 * VistaComparador — composición de los paneles A/B y la tabla de métricas.
 *
 * Responsabilidad del Integrante 2. No guarda estado propio: el orquestador
 * (`app.js`) es la fuente de verdad y llama a `actualizar()`.
 *
 * Evento emitido: `intercambiar-comparador`.
 */
class VistaComparador {
  constructor(contenedor, props = {}) {
    this.contenedor = contenedor;
    this.props = { recetaA: null, recetaB: null, ...props };
    this.destruido = false;
    this.panelA = null;
    this.panelB = null;
    this.tabla = null;

    this.elemento = document.createElement("section");
    this.elemento.className = "vista comparador";

    this.manejadorClick = (evento) => {
      if (!evento.target.closest("[data-accion='intercambiar']")) return;
      this.elemento.dispatchEvent(
        new CustomEvent("intercambiar-comparador", { bubbles: true })
      );
    };

    this.elemento.addEventListener("click", this.manejadorClick);
    if (contenedor) contenedor.appendChild(this.elemento);

    this.renderizar();
  }

  actualizar(props = {}) {
    if (this.destruido) return;

    if (Object.prototype.hasOwnProperty.call(props, "recetaA")) {
      this.props.recetaA = props.recetaA || null;
    }
    if (Object.prototype.hasOwnProperty.call(props, "recetaB")) {
      this.props.recetaB = props.recetaB || null;
    }

    if (this.panelA) this.panelA.actualizar({ receta: this.props.recetaA });
    if (this.panelB) this.panelB.actualizar({ receta: this.props.recetaB });
    if (this.tabla) {
      this.tabla.actualizar({
        recetaA: this.props.recetaA,
        recetaB: this.props.recetaB
      });
    }

    const pista = this.elemento.querySelector("[data-rol='pista']");
    if (pista) pista.textContent = this.textoPista();
  }

  renderizar() {
    if (this.destruido) return;

    this.destruirHijos();
    this.elemento.textContent = "";

    const encabezado = document.createElement("header");
    encabezado.className = "vista-encabezado";

    const titulo = document.createElement("h1");
    titulo.className = "vista-titulo";
    titulo.textContent = "Comparador de recetas";

    const subtitulo = document.createElement("p");
    subtitulo.className = "vista-subtitulo";
    subtitulo.textContent =
      "Enfrenta dos recetas y descubre cuál usa menos ingredientes, cuántos pasos tiene cada una y qué ingredientes comparten.";

    const pista = document.createElement("p");
    pista.className = "texto-ayuda";
    pista.dataset.rol = "pista";
    pista.textContent = this.textoPista();

    encabezado.append(titulo, subtitulo, pista);
    this.elemento.appendChild(encabezado);

    const paneles = document.createElement("div");
    paneles.className = "comparador-paneles";

    this.panelA = new PanelComparador(paneles, {
      indice: "A",
      receta: this.props.recetaA
    });

    const intercambiar = document.createElement("button");
    intercambiar.type = "button";
    intercambiar.className = "comparador-intercambiar";
    intercambiar.dataset.accion = "intercambiar";
    intercambiar.textContent = "⇄";
    intercambiar.title = "Intercambiar los paneles A y B";
    intercambiar.setAttribute("aria-label", "Intercambiar las recetas de los paneles A y B");
    intercambiar.disabled = !this.props.recetaA && !this.props.recetaB;

    this.panelB = new PanelComparador(paneles, {
      indice: "B",
      receta: this.props.recetaB
    });

    paneles.append(this.panelA.elemento, intercambiar, this.panelB.elemento);
    this.elemento.appendChild(paneles);

    this.tabla = new TablaComparacion(this.elemento, {
      recetaA: this.props.recetaA,
      recetaB: this.props.recetaB
    });
  }

  textoPista() {
    const cantidad = [this.props.recetaA, this.props.recetaB].filter(Boolean).length;

    if (cantidad === 0) {
      return "Paso 1: elige una receta en cada panel usando el buscador.";
    }
    if (cantidad === 1) {
      return "Falta una receta: completa el otro panel para ver la tabla comparativa.";
    }
    return "Comparación completa: revisa las métricas y el veredicto final.";
  }

  destruirHijos() {
    if (this.panelA) this.panelA.destruir();
    if (this.panelB) this.panelB.destruir();
    if (this.tabla) this.tabla.destruir();
    this.panelA = null;
    this.panelB = null;
    this.tabla = null;
  }

  destruir() {
    if (this.destruido) return;

    this.destruido = true;
    this.destruirHijos();
    this.elemento.removeEventListener("click", this.manejadorClick);
    this.elemento.remove();
    this.elemento = null;
  }
}
