/*
 Este archivo contiene la clase Paginador, que se encarga de crear y manejar un componente de paginación en la interfaz de usuario.

*/



class Paginador {
  constructor(contenedor, props = {}) {
    this.contenedor = contenedor;
    this.estado = {
      paginaActual: props.paginaActual || 1,
      totalPaginas: props.totalPaginas || 1
    };
    this.elemento = null;
    this.manejadorClick = null;
    this.crearElemento();
    this.renderizar();
    this.configurarEventos();
  }

  crearElemento() { /* se encarga de crear el elemento HTML del paginador */
    this.elemento = document.createElement('div');
    this.elemento.className = 'paginador-barra';
    this.contenedor.appendChild(this.elemento);
  }

  actualizar(paginaActual, totalPaginas) { /* se encarga de actualizar el estado del paginador y volver a renderizarlo */
    this.estado.paginaActual = paginaActual;
    this.estado.totalPaginas = totalPaginas;
    this.renderizar();
  }

  renderizar() { /* se encarga de renderizar el paginador en la interfaz de usuario */
    this.elemento.textContent = '';
    if (this.estado.totalPaginas <= 1) {
      this.elemento.style.display = 'none';
      return;
    }
    this.elemento.style.display = 'flex';

    const btnAnterior = document.createElement('button');
    btnAnterior.type = 'button';
    btnAnterior.className = 'btn';
    btnAnterior.dataset.direccion = 'anterior';
    btnAnterior.disabled = this.estado.paginaActual <= 1;
    btnAnterior.textContent = '← Anterior';

    const info = document.createElement('span');
    info.textContent = `Página ${this.estado.paginaActual} de ${this.estado.totalPaginas}`;

    const btnSiguiente = document.createElement('button');
    btnSiguiente.type = 'button';
    btnSiguiente.className = 'btn';
    btnSiguiente.dataset.direccion = 'siguiente';
    btnSiguiente.disabled = this.estado.paginaActual >= this.estado.totalPaginas;
    btnSiguiente.textContent = 'Siguiente →';

    this.elemento.appendChild(btnAnterior);
    this.elemento.appendChild(info);
    this.elemento.appendChild(btnSiguiente);
  }

  configurarEventos() { /* se encarga de configurar los eventos del paginador */
    this.manejadorClick = (e) => {
      const btn = e.target.closest('button[data-direccion]');
      if (!btn) return;
      const nuevaPagina =
        btn.dataset.direccion === 'anterior'
          ? this.estado.paginaActual - 1
          : this.estado.paginaActual + 1;

      if (nuevaPagina >= 1 && nuevaPagina <= this.estado.totalPaginas) {
        this.elemento.dispatchEvent(
          new CustomEvent('cambio-pagina', {
            bubbles: true,
            detail: { pagina: nuevaPagina }
          })
        );
      }
    };
    this.elemento.addEventListener('click', this.manejadorClick);
  }

  destruir() { /* se encarga de destruir el paginador y limpiar los eventos */
    if (this.elemento) {
      this.elemento.removeEventListener('click', this.manejadorClick);
      this.elemento.remove();
      this.elemento = null;
    }
  }
}