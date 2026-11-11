"use strict";

/**
 * TablaComparacion — tabla semántica de métricas y veredicto.
 *
 * Responsabilidad del Integrante 2. Usa <table> real (no una cuadrícula de
 * <div>) y resalta el valor menor de cada métrica numérica.
 */
class TablaComparacion {
  constructor(contenedor, props = {}) {
    this.contenedor = contenedor;
    this.props = { recetaA: null, recetaB: null, ...props };
    this.destruido = false;

    this.elemento = document.createElement("div");
    this.elemento.className = "comparador";

    if (contenedor) contenedor.appendChild(this.elemento);
    this.renderizar();
  }

  actualizar(props = {}) {
    if (this.destruido) return;
    this.props = { ...this.props, ...props };
    this.renderizar();
  }

  renderizar() {
    if (this.destruido) return;

    this.elemento.textContent = "";
    const { recetaA, recetaB } = this.props;

    if (!recetaA || !recetaB) {
      const vacio = document.createElement("div");
      vacio.className = "estado-mensaje";

      const icono = document.createElement("span");
      icono.className = "estado-mensaje-icono";
      icono.setAttribute("aria-hidden", "true");
      icono.textContent = "⚖";

      const titulo = document.createElement("p");
      titulo.className = "estado-mensaje-titulo";
      titulo.textContent = "Faltan recetas por elegir";

      const texto = document.createElement("p");
      texto.className = "estado-mensaje-texto";
      texto.textContent = "Selecciona una receta en cada panel para ver la comparación.";

      vacio.append(icono, titulo, texto);
      this.elemento.appendChild(vacio);
      return;
    }

    let metricas;
    try {
      metricas = ServicioComparacion.calcularMetricas(recetaA, recetaB);
    } catch (error) {
      const aviso = document.createElement("p");
      aviso.className = "estado-mensaje estado-mensaje--error";
      aviso.textContent = error.message;
      this.elemento.appendChild(aviso);
      return;
    }

    this.elemento.appendChild(this.crearTabla(metricas));
    this.elemento.appendChild(this.crearVeredicto(metricas));
  }

  crearTabla(metricas) {
    const envoltura = document.createElement("div");
    envoltura.className = "tabla-envoltura";

    const tabla = document.createElement("table");
    tabla.className = "tabla-comparacion";

    const caption = document.createElement("caption");
    caption.textContent = "Comparación lado a lado de las recetas seleccionadas";
    tabla.appendChild(caption);

    const thead = document.createElement("thead");
    const filaCabecera = document.createElement("tr");

    const thMetrica = document.createElement("th");
    thMetrica.scope = "col";
    thMetrica.textContent = "Métrica";

    const thA = document.createElement("th");
    thA.scope = "col";
    thA.textContent = `A · ${this.props.recetaA.nombre}`;

    const thB = document.createElement("th");
    thB.scope = "col";
    thB.textContent = `B · ${this.props.recetaB.nombre}`;

    filaCabecera.append(thMetrica, thA, thB);
    thead.appendChild(filaCabecera);
    tabla.appendChild(thead);

    const tbody = document.createElement("tbody");

    tbody.appendChild(
      this.crearFilaNumerica(
        "Cantidad de ingredientes",
        metricas.cantIngredientes.a,
        metricas.cantIngredientes.b
      )
    );
    tbody.appendChild(
      this.crearFilaNumerica("Cantidad de pasos", metricas.cantPasos.a, metricas.cantPasos.b)
    );
    tbody.appendChild(
      this.crearFilaNumerica(
        "Extensión de las instrucciones (palabras)",
        metricas.extensionPalabras.a,
        metricas.extensionPalabras.b
      )
    );
    tbody.appendChild(
      this.crearFilaTexto(
        "Categoría",
        metricas.categoria.a,
        metricas.categoria.b,
        metricas.categoria.coinciden
      )
    );
    tbody.appendChild(
      this.crearFilaTexto("Origen", metricas.origen.a, metricas.origen.b, metricas.origen.coinciden)
    );

    tbody.appendChild(
      this.crearFilaSimple(
        "Ingredientes en común",
        `${metricas.ingredientesComunes.length} de ${new Set([
          ...metricas.ingredientesComunes,
          ...metricas.exclusivosA,
          ...metricas.exclusivosB
        ]).size}`
      )
    );

    tbody.appendChild(
      this.crearFilaSimple(
        "Ingredientes exclusivos",
        `A: ${this.formatearLista(metricas.exclusivosA)} · B: ${this.formatearLista(metricas.exclusivosB)}`
      )
    );

    tbody.appendChild(
      this.crearFilaSimple(
        "Etiquetas en común",
        metricas.etiquetasComunes.length > 0
          ? metricas.etiquetasComunes.join(", ")
          : "Sin etiquetas en común"
      )
    );

    tbody.appendChild(
      this.crearFilaSimple(
        "Video disponible",
        `A: ${metricas.video.a ? "Sí" : "No"} · B: ${metricas.video.b ? "Sí" : "No"}`
      )
    );

    tbody.appendChild(
      this.crearFilaSimple("Similitud de ingredientes", `${metricas.similitud} %`)
    );

    tabla.appendChild(tbody);
    envoltura.appendChild(tabla);
    return envoltura;
  }

  crearFilaNumerica(etiqueta, valorA, valorB) {
    const fila = document.createElement("tr");

    const th = document.createElement("th");
    th.scope = "row";
    th.textContent = etiqueta;

    fila.appendChild(th);
    fila.appendChild(this.crearCeldaNumerica(valorA, valorA < valorB));
    fila.appendChild(this.crearCeldaNumerica(valorB, valorB < valorA));
    return fila;
  }

  crearCeldaNumerica(valor, esMenor) {
    const celda = document.createElement("td");

    if (esMenor) {
      const resaltado = document.createElement("span");
      resaltado.className = "valor-menor";
      resaltado.textContent = String(valor);
      resaltado.title = "Valor menor";
      celda.appendChild(resaltado);
    } else {
      celda.textContent = String(valor);
    }

    return celda;
  }

  crearFilaTexto(etiqueta, valorA, valorB, coinciden) {
    const fila = document.createElement("tr");

    const th = document.createElement("th");
    th.scope = "row";
    th.textContent = etiqueta;

    const celdaA = document.createElement("td");
    celdaA.textContent = valorA;

    const celdaB = document.createElement("td");
    celdaB.textContent = valorB;

    const estado = document.createElement("span");
    estado.className = `insignia ${coinciden ? "insignia--si" : "insignia--no"}`;
    estado.textContent = coinciden ? "Coinciden" : "Difieren";
    celdaB.appendChild(document.createTextNode(" "));
    celdaB.appendChild(estado);

    fila.append(th, celdaA, celdaB);
    return fila;
  }

  crearFilaSimple(etiqueta, texto) {
    const fila = document.createElement("tr");

    const th = document.createElement("th");
    th.scope = "row";
    th.textContent = etiqueta;

    const celda = document.createElement("td");
    celda.colSpan = 2;
    celda.textContent = texto;

    fila.append(th, celda);
    return fila;
  }

  crearVeredicto(metricas) {
    const caja = document.createElement("section");
    caja.className = "veredicto";
    caja.setAttribute("aria-label", "Veredicto de la comparación");

    const titulo = document.createElement("h3");
    titulo.className = "veredicto-titulo";

    const texto = document.createElement("p");
    texto.className = "veredicto-texto";

    if (metricas.masSencilla === "EMPATE") {
      titulo.textContent = "Empate técnico";
      texto.textContent = `${metricas.motivoSencilla} Comparten ${metricas.ingredientesComunes.length} ingredientes (${metricas.similitud} % de similitud).`;
    } else {
      const ganadora =
        metricas.masSencilla === "A" ? this.props.recetaA.nombre : this.props.recetaB.nombre;
      titulo.textContent = `La receta más sencilla es ${ganadora}`;
      texto.textContent = `${metricas.motivoSencilla} Comparten ${metricas.ingredientesComunes.length} ingredientes (${metricas.similitud} % de similitud).`;
    }

    caja.append(titulo, texto);
    return caja;
  }

  formatearLista(lista) {
    if (!Array.isArray(lista) || lista.length === 0) return "ninguno";
    return lista.join(", ");
  }

  destruir() {
    if (this.destruido) return;
    this.destruido = true;
    this.elemento.remove();
    this.elemento = null;
  }
}
