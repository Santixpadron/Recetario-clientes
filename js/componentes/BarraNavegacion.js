class BarraNavegacion {
  constructor(contenedor, props = {}) {
    this.contenedor = contenedor;
    this.estado = {
      vistaActiva: props.vistaActiva || 'inicio',
      cantidadComparador: props.cantidadComparador || 0
    };
    this.elemento = null;
    this.manejadorClick = null;
    this.crearElemento();
    this.renderizar();
    this.configurarEventos();
  }

  crearElemento() {
    this.elemento = document.createElement('nav');
    this.elemento.className = 'barra-nav';
    this.elemento.setAttribute('aria-label', 'Navegación principal');
    this.contenedor.appendChild(this.elemento);
  }

  actualizarEstado(nuevoEstado) {
    this.estado = { ...this.estado, ...nuevoEstado };
    this.renderizar();
  }

  renderizar() {
    this.elemento.textContent = '';

    const botonLogo = document.createElement('button');
    botonLogo.type = 'button';
    botonLogo.className = 'marca-logo';
    botonLogo.dataset.vista = 'inicio';

    const textoLogo = document.createElement('span');
    textoLogo.textContent = 'UmamiLab';
    const subLogo = document.createElement('span');
    subLogo.className = 'marca-subtitulo';
    subLogo.textContent = 'TheMealDB';

    botonLogo.appendChild(textoLogo);
    botonLogo.appendChild(subLogo);

    const lista = document.createElement('ul');
    lista.className = 'nav-lista';

    const items = [
      { id: 'inicio', texto: 'Inicio' },
      { id: 'explorar', texto: 'Explorar' },
      { id: 'categorias-origenes', texto: 'Categorías y orígenes' },
      { id: 'comparador', texto: 'Comparador', conContador: true }
    ];

    items.forEach((item) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.vista = item.id;
      btn.className = `nav-boton ${this.estado.vistaActiva === item.id ? 'activo' : ''}`;
      if (this.estado.vistaActiva === item.id) {
        btn.setAttribute('aria-current', 'page');
      }

      const spanTexto = document.createElement('span');
      spanTexto.textContent = item.texto;
      btn.appendChild(spanTexto);

      if (item.conContador) {
        const badge = document.createElement('span');
        badge.className = 'insignia-comparador';
        badge.textContent = `${this.estado.cantidadComparador}/2`;
        btn.appendChild(badge);
      }

      li.appendChild(btn);
      lista.appendChild(li);
    });

    this.elemento.appendChild(botonLogo);
    this.elemento.appendChild(lista);
  }

  configurarEventos() {
    this.manejadorClick = (e) => {
      const boton = e.target.closest('[data-vista]');
      if (!boton) return;
      const destino = boton.dataset.vista;
      this.elemento.dispatchEvent(
        new CustomEvent('navegar-vista', {
          bubbles: true,
          detail: { vista: destino }
        })
      );
    };
    this.elemento.addEventListener('click', this.manejadorClick);
  }

  destruir() {
    if (this.elemento) {
      this.elemento.removeEventListener('click', this.manejadorClick);
      this.elemento.remove();
      this.elemento = null;
    }
  }
}