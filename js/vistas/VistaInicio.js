class VistaInicio {
  constructor(contenedor) {
    this.contenedor = contenedor;
    this.estado = {
      recetaDestacada: null,
      categorias: [],
      destruida: false
    };
    this.componentesHijos = [];
    this.elemento = null;
    this.crearElemento();
    this.renderizarEstructuraBase();
    this.configurarEventos();
    this.cargarDatosIniciales();
  }

  crearElemento() {
    this.elemento = document.createElement('div');
    this.elemento.className = 'vista-animada';
    this.contenedor.appendChild(this.elemento);
  }

  renderizarEstructuraBase() {
    this.elemento.textContent = '';

    // Sección Receta Destacada
    const secDestacada = document.createElement('section');
    secDestacada.className = 'seccion-bloque';

    const encDestacada = document.createElement('div');
    encDestacada.className = 'encabezado-seccion';
    const h2Dest = document.createElement('h1');
    h2Dest.className = 'titulo-seccion';
    h2Dest.textContent = 'Receta Destacada del Momento';

    const btnOtra = document.createElement('button');
    btnOtra.type = 'button';
    btnOtra.className = 'btn btn-primario btn-otra-receta';
    btnOtra.textContent = 'Otra receta al azar';

    encDestacada.appendChild(h2Dest);
    encDestacada.appendChild(btnOtra);

    this.zonaDestacada = document.createElement('div');
    secDestacada.appendChild(encDestacada);
    secDestacada.appendChild(this.zonaDestacada);

    // Sección Cuadrícula de Categorías
    const secCategorias = document.createElement('section');
    secCategorias.className = 'seccion-bloque';
    const h2Cat = document.createElement('h2');
    h2Cat.className = 'titulo-seccion';
    h2Cat.style.marginBottom = '1.25rem';
    h2Cat.textContent = 'Explorar por Categorías';

    this.zonaCategorias = document.createElement('div');
    secCategorias.appendChild(h2Cat);
    secCategorias.appendChild(this.zonaCategorias);

    this.elemento.appendChild(secDestacada);
    this.elemento.appendChild(secCategorias);
  }

  async cargarDatosIniciales() {
    const cargaDest = new EstadoCarga(this.zonaDestacada, {
      modo: 'cargando',
      forma: 'destacada'
    });
    const cargaCat = new EstadoCarga(this.zonaCategorias, {
      modo: 'cargando',
      forma: 'tarjetas',
      cantidad: 6
    });
    this.componentesHijos.push(cargaDest, cargaCat);

    const [resDestacada, resCategorias] = await Promise.allSettled([
      ServicioApi.obtenerRecetaAleatoria(),
      ServicioApi.obtenerCategorias()
    ]);

    if (this.estado.destruida) return;
    cargaDest.destruir();
    cargaCat.destruir();

    if (resDestacada.status === 'fulfilled') {
      this.estado.recetaDestacada = resDestacada.value;
      this.renderizarDestacada();
    } else {
      this.mostrarErrorDestacada(resDestacada.reason?.message);
    }

    if (resCategorias.status === 'fulfilled') {
      this.estado.categorias = resCategorias.value;
      this.renderizarCategorias();
    } else {
      this.mostrarErrorCategorias(resCategorias.reason?.message);
    }
  }

  async cargarOtraAleatoria() {
    const idAnterior = this.estado.recetaDestacada ? this.estado.recetaDestacada.id : null;
    this.zonaDestacada.textContent = '';
    const indicador = new EstadoCarga(this.zonaDestacada, {
      modo: 'cargando',
      forma: 'destacada'
    });
    this.componentesHijos.push(indicador);

    try {
      const nueva = await ServicioApi.obtenerRecetaAleatoria(idAnterior);
      if (this.estado.destruida) return;
      indicador.destruir();
      this.estado.recetaDestacada = nueva;
      this.renderizarDestacada();
    } catch (error) {
      if (this.estado.destruida) return;
      indicador.destruir();
      this.mostrarErrorDestacada(error.message);
    }
  }

  renderizarDestacada() {
    this.zonaDestacada.textContent = '';
    const r = this.estado.recetaDestacada;
    if (!r) return;

    const card = document.createElement('article');
    card.className = 'tarjeta-destacada';

    const img = document.createElement('img');
    img.className = 'destacada-imagen';
    img.src = r.imagen;
    img.alt = r.nombre;

    const contenido = document.createElement('div');
    contenido.className = 'destacada-contenido';

    const badges = document.createElement('div');
    badges.className = 'insignias-fila';

    const bCat = document.createElement('span');
    bCat.className = 'pildora';
    bCat.textContent = r.categoria;

    const bOri = document.createElement('span');
    bOri.className = 'pildora pildora-origen';
    bOri.textContent = r.origen;

    badges.appendChild(bCat);
    badges.appendChild(bOri);

    const h3 = document.createElement('h2');
    h3.textContent = r.nombre;

    const acciones = document.createElement('div');
    acciones.style.display = 'flex';
    acciones.style.gap = '0.75rem';
    acciones.style.flexWrap = 'wrap';

    const btnDetalle = document.createElement('button');
    btnDetalle.type = 'button';
    btnDetalle.className = 'btn btn-primario btn-ver-destacada';
    btnDetalle.textContent = 'Ver preparación completa';

    const btnComparar = document.createElement('button');
    btnComparar.type = 'button';
    btnComparar.className = 'btn btn-secundario btn-comparar-destacada';
    btnComparar.textContent = '+ Agregar al comparador';

    acciones.appendChild(btnDetalle);
    acciones.appendChild(btnComparar);

    contenido.appendChild(badges);
    contenido.appendChild(h3);
    contenido.appendChild(acciones);

    card.appendChild(img);
    card.appendChild(contenido);
    this.zonaDestacada.appendChild(card);
  }

  mostrarErrorDestacada(mensaje) {
    this.zonaDestacada.textContent = '';
    const err = new EstadoCarga(this.zonaDestacada, {
      modo: 'error',
      titulo: 'No se pudo cargar la receta destacada',
      mensaje: mensaje || 'Error al consultar la receta aleatoria.',
      mostrarReintentar: true
    });
    err.elemento.dataset.seccionReintento = 'destacada';
    this.componentesHijos.push(err);
  }

  renderizarCategorias() {
    this.zonaCategorias.textContent = '';
    const grid = document.createElement('div');
    grid.className = 'cuadricula-tarjetas';

    this.estado.categorias.forEach((cat) => {
      const card = document.createElement('article');
      card.className = 'tarjeta-categoria';
      card.style.cursor = 'pointer';
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.dataset.categoriaNombre = cat.nombre;

      const img = document.createElement('img');
      img.className = 'tarjeta-img';
      img.style.objectFit = 'contain';
      img.style.padding = '0.75rem';
      img.src = cat.imagen;
      img.alt = cat.nombre;

      const cuerpo = document.createElement('div');
      cuerpo.className = 'tarjeta-cuerpo';

      const titulo = document.createElement('h3');
      titulo.className = 'tarjeta-titulo';
      titulo.textContent = cat.nombre;

      const desc = document.createElement('p');
      desc.style.fontSize = '0.88rem';
      desc.style.color = 'var(--texto-secundario)';
      desc.textContent = `${cat.descripcion.slice(0, 120)}...`;

      cuerpo.appendChild(titulo);
      cuerpo.appendChild(desc);
      card.appendChild(img);
      card.appendChild(cuerpo);
      grid.appendChild(card);
    });

    this.zonaCategorias.appendChild(grid);
  }

  mostrarErrorCategorias(mensaje) {
    this.zonaCategorias.textContent = '';
    const err = new EstadoCarga(this.zonaCategorias, {
      modo: 'error',
      titulo: 'No se pudieron cargar las categorías',
      mensaje: mensaje || 'Error al obtener la lista de categorías.',
      mostrarReintentar: true
    });
    err.elemento.dataset.seccionReintento = 'categorias';
    this.componentesHijos.push(err);
  }

  configurarEventos() {
    this.manejadorClick = async (e) => {
      if (e.target.classList.contains('btn-otra-receta')) {
        this.cargarOtraAleatoria();
        return;
      }

      if (e.target.classList.contains('btn-ver-destacada') && this.estado.recetaDestacada) {
        this.elemento.dispatchEvent(
          new CustomEvent('abrir-detalle', {
            bubbles: true,
            detail: { id: this.estado.recetaDestacada.id }
          })
        );
        return;
      }

      if (e.target.classList.contains('btn-comparar-destacada') && this.estado.recetaDestacada) {
        this.elemento.dispatchEvent(
          new CustomEvent('agregar-comparador', {
            bubbles: true,
            detail: {
              id: this.estado.recetaDestacada.id,
              receta: this.estado.recetaDestacada
            }
          })
        );
        return;
      }

      const cardCategoria = e.target.closest('[data-categoria-nombre]');
      if (cardCategoria) {
        this.elemento.dispatchEvent(
          new CustomEvent('abrir-ficha-categoria', {
            bubbles: true,
            detail: { categoria: cardCategoria.dataset.categoriaNombre }
          })
        );
      }
    };

    this.manejadorKeydown = (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const cardCategoria = e.target.closest('[data-categoria-nombre]');
      if (!cardCategoria) return;
      e.preventDefault();
      this.elemento.dispatchEvent(
        new CustomEvent('abrir-ficha-categoria', {
          bubbles: true,
          detail: { categoria: cardCategoria.dataset.categoriaNombre }
        })
      );
    };

    this.manejadorReintentar = async (e) => {
      const contenedorSeccion = e.target.closest('[data-seccion-reintento]');
      if (!contenedorSeccion) return;
      const tipo = contenedorSeccion.dataset.seccionReintento;
      if (tipo === 'destacada') {
        this.cargarOtraAleatoria();
      } else if (tipo === 'categorias') {
        this.zonaCategorias.textContent = '';
        const carga = new EstadoCarga(this.zonaCategorias, {
          modo: 'cargando',
          forma: 'tarjetas',
          cantidad: 6
        });
        this.componentesHijos.push(carga);
        try {
          const cats = await ServicioApi.obtenerCategorias();
          if (this.estado.destruida) return;
          carga.destruir();
          this.estado.categorias = cats;
          this.renderizarCategorias();
        } catch (err) {
          if (this.estado.destruida) return;
          carga.destruir();
          this.mostrarErrorCategorias(err.message);
        }
      }
    };

    this.elemento.addEventListener('click', this.manejadorClick);
    this.elemento.addEventListener('keydown', this.manejadorKeydown);
    this.elemento.addEventListener('reintentar-accion', this.manejadorReintentar);
  }

  destruir() {
    this.estado.destruida = true;
    this.componentesHijos.forEach((c) => c.destruir());
    this.componentesHijos = [];
    if (this.elemento) {
      this.elemento.removeEventListener('click', this.manejadorClick);
      this.elemento.removeEventListener('keydown', this.manejadorKeydown);
      this.elemento.removeEventListener('reintentar-accion', this.manejadorReintentar);
      this.elemento.remove();
      this.elemento = null;
    }
  }
}