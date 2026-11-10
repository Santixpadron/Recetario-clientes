class EstadoCarga {
  constructor(contenedor, props = {}) {
    this.contenedor = contenedor;
    this.estado = {
      modo: props.modo || 'cargando', // 'cargando' | 'vacio' | 'error'
      forma: props.forma || 'tarjetas', // 'tarjetas' | 'destacada' | 'detalle'
      cantidad: props.cantidad || 6,
      titulo: props.titulo || '',
      mensaje: props.mensaje || '',
      mostrarReintentar: Boolean(props.mostrarReintentar)
    };
    this.elemento = null;
    this.manejadorReintentar = null;
    this.crearElemento();
    this.renderizar();
    this.configurarEventos();
  }

  crearElemento() {
    this.elemento = document.createElement('div');
    this.contenedor.appendChild(this.elemento);
  }

  renderizar() {
    this.elemento.textContent = '';

    if (this.estado.modo === 'cargando') {
      if (this.estado.forma === 'destacada') {
        const esq = document.createElement('div');
        esq.className = 'esqueleto-pulso esqueleto-destacada';
        this.elemento.appendChild(esq);
      } else if (this.estado.forma === 'detalle') {
        const esq = document.createElement('div');
        esq.className = 'esqueleto-pulso esqueleto-detalle';
        this.elemento.appendChild(esq);
      } else {
        const grid = document.createElement('div');
        grid.className = 'cuadricula-tarjetas';
        for (let i = 0; i < this.estado.cantidad; i++) {
          const item = document.createElement('div');
          item.className = 'esqueleto-pulso esqueleto-tarjeta';
          grid.appendChild(item);
        }
        this.elemento.appendChild(grid);
      }
      return;
    }

    const bloque = document.createElement('div');
    bloque.className = `bloque-estado ${this.estado.modo === 'error' ? 'es-error' : ''}`;

    const tituloEl = document.createElement('h3');
    tituloEl.textContent =
      this.estado.titulo ||
      (this.estado.modo === 'error' ? 'Ocurrió un inconveniente' : 'Sin resultados para mostrar');
    bloque.appendChild(tituloEl);

    if (this.estado.mensaje) {
      const parrafo = document.createElement('p');
      parrafo.textContent = this.estado.mensaje;
      bloque.appendChild(parrafo);
    }

    if (this.estado.mostrarReintentar) {
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'btn btn-primario btn-reintentar';
      boton.textContent = 'Reintentar';
      bloque.appendChild(boton);
    }

    this.elemento.appendChild(bloque);
  }

  configurarEventos() {
    this.manejadorReintentar = (e) => {
      if (e.target.classList.contains('btn-reintentar')) {
        this.elemento.dispatchEvent(
          new CustomEvent('reintentar-accion', { bubbles: true })
        );
      }
    };
    this.elemento.addEventListener('click', this.manejadorReintentar);
  }

  destruir() {
    if (this.elemento) {
      this.elemento.removeEventListener('click', this.manejadorReintentar);
      this.elemento.remove();
      this.elemento = null;
    }
  }
}