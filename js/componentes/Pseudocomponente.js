"use strict";

/**
 * Clase base de todos los pseudocomponentes.
 * Contrato: crear() -> render() -> eventos(); destruir() limpia todo.
 */
class Pseudocomponente {
  constructor(contenedor, props = {}) {
    this.contenedor = contenedor;
    this.props = props;
    this.estado = {};
    this.el = null;
    this.hijos = [];
    this._abort = new AbortController();
    this._temporizadores = new Set();
  }

  montar() {
    this.el = this.crear();
    if (this.el) this.contenedor.appendChild(this.el);
    this.render();
    this.eventos();
    return this.el;
  }

  crear() {
    throw new Error("Cada pseudocomponente debe implementar crear().");
  }

  render() {}

  eventos() {}

  actualizar(props = {}) {
    Object.assign(this.props, props);
    if (this.el) this.render();
  }

  emitir(nombre, detail = {}) {
    if (!this.el) return;
    this.el.dispatchEvent(
      new CustomEvent(nombre, { detail, bubbles: true })
    );
  }

  escuchar(elemento, evento, manejador, opciones = {}) {
    elemento.addEventListener(evento, manejador, {
      ...opciones,
      signal: this._abort.signal
    });
  }

  agregarHijo(componente) {
    this.hijos.push(componente);
    componente.montar();
    return componente;
  }

  destruirHijos() {
    for (const hijo of this.hijos) hijo.destruir();
    this.hijos = [];
  }

  temporizador(fn, ms) {
    const id = setTimeout(() => {
      this._temporizadores.delete(id);
      fn();
    }, ms);
    this._temporizadores.add(id);
    return id;
  }

  cancelarTemporizador(id) {
    if (!id) return;
    clearTimeout(id);
    this._temporizadores.delete(id);
  }

  destruir() {
    this.destruirHijos();
    this._abort.abort();

    for (const id of this._temporizadores) clearTimeout(id);
    this._temporizadores.clear();

    if (this.el?.parentNode) this.el.parentNode.removeChild(this.el);
    this.el = null;
  }
}
