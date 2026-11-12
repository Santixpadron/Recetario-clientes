class VistaExplorar {
  constructor(contenedor, estadoPrevio = null) {
    this.contenedor = contenedor;
    this.estado = {
      criterios: estadoPrevio?.criterios || {
        nombre: '',
        categoria: '',
        origen: '',
        ingrediente: ''
      },
      resultadosTotales: estadoPrevio?.resultadosTotales || [],
      paginaActual: estadoPrevio?.paginaActual || 1,
      busquedaRealizada: Boolean(estadoPrevio?.busquedaRealizada),
      idOperacionActual: 0,
      destruida: false
    };
    this.POR_PAGINA = 12;
    this.tarjetasActivas = [];
    this.formulario = null;
    this.paginador = null;
    this.estadoCarga = null;
    this.elemento = null;
    this.crearElemento();
    this.renderizarBase();
    this.configurarEventos();
    this.inicializarCatalogos();
  }

  obtenerEstadoConservado() {
    return {
      criterios: { ...this.estado.criterios },
      resultadosTotales: [...this.estado.resultadosTotales],
      paginaActual: this.estado.paginaActual,
      busquedaRealizada: this.estado.busquedaRealizada
    };
  }

  crearElemento() {
    this.elemento = document.createElement('div');
    this.elemento.className = 'vista-animada';
    this.contenedor.appendChild(this.elemento);
  }

  renderizarBase() {
    this.elemento.textContent = '';

    const titulo = document.createElement('h1');
    titulo.className = 'titulo-seccion';
    titulo.style.marginBottom = '1rem';
    titulo.textContent = 'Exploración con Filtros Combinados';

    this.zonaFormulario = document.createElement('div');
    this.zonaResumen = document.createElement('div');
    this.zonaResumen.style.marginBottom = '1rem';
    this.zonaResumen.style.fontWeight = '700';

    this.zonaResultados = document.createElement('div');
    this.zonaPaginador = document.createElement('div');

    this.elemento.appendChild(titulo);
    this.elemento.appendChild(this.zonaFormulario);
    this.elemento.appendChild(this.zonaResumen);
    this.elemento.appendChild(this.zonaResultados);
    this.elemento.appendChild(this.zonaPaginador);

    this.paginador = new Paginador(this.zonaPaginador, {
      paginaActual: this.estado.paginaActual,
      totalPaginas: 1
    });
  }

  async inicializarCatalogos() {
    const idOp = ++this.estado.idOperacionActual;
    try {
      const [categorias, origenes, ingredientes] = await Promise.all([
        ServicioApi.obtenerCategorias(),
        ServicioApi.obtenerOrigenes(),
        ServicioApi.obtenerIngredientes()
      ]);

      if (this.estado.destruida || idOp !== this.estado.idOperacionActual) return;

      this.formulario = new FormularioBusqueda(this.zonaFormulario, {
        categorias,
        origenes,
        ingredientes,
        criteriosIniciales: this.estado.criterios
      });

      if (this.estado.busquedaRealizada) {
        this.renderizarPaginaActual();
      } else {
        this.mostrarEstadoVacio(
          'Aplica al menos un filtro arriba para explorar recetas combinadas.'
        );
      }
    } catch (error) {
      if (this.estado.destruida) return;
      this.mostrarErrorGeneral(error.message, () => this.inicializarCatalogos());
    }
  }

  async ejecutarBusquedaCombinada(criterios) {
    this.estado.criterios = { ...criterios };
    this.estado.paginaActual = 1;
    this.estado.busquedaRealizada = true;
    const idOp = ++this.estado.idOperacionActual;

    this.limpiarTarjetas();
    this.zonaResumen.textContent = '';
    this.paginador.actualizar(1, 1);

    this.estadoCarga = new EstadoCarga(this.zonaResultados, {
      modo: 'cargando',
      forma: 'tarjetas',
      cantidad: 6
    });

    const promesas = [];
    if (criterios.nombre) {
      promesas.push(ServicioApi.buscarPorNombre(criterios.nombre));
    }
    if (criterios.categoria) {
      promesas.push(ServicioApi.filtrarPorCategoria(criterios.categoria));
    }
    if (criterios.origen) {
      promesas.push(ServicioApi.filtrarPorOrigen(criterios.origen));
    }
    if (criterios.ingrediente) {
      promesas.push(ServicioApi.filtrarPorIngrediente(criterios.ingrediente));
    }

    try {
      const listasResultados = await Promise.all(promesas);
      if (this.estado.destruida || idOp !== this.estado.idOperacionActual) return;

      this.estadoCarga.destruir();

      // Intersección de resultados por id
      let interseccion = listasResultados[0] || [];
      for (let i = 1; i < listasResultados.length; i++) {
        const idsActuales = new Set(listasResultados[i].map((r) => r.id));
        interseccion = interseccion.filter((r) => idsActuales.has(r.id));
      }

      // Ordenar alfabéticamente por nombre
      interseccion.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
      this.estado.resultadosTotales = interseccion;

      await this.renderizarPaginaActual();
    } catch (error) {
      if (this.estado.destruida || idOp !== this.estado.idOperacionActual) return;
      if (this.estadoCarga) this.estadoCarga.destruir();
      this.mostrarErrorGeneral(error.message, () =>
        this.ejecutarBusquedaCombinada(this.estado.criterios)
      );
    }
  }

  async renderizarPaginaActual() {
    const idOp = ++this.estado.idOperacionActual;
    this.limpiarTarjetas();
    this.zonaResultados.textContent = '';

    const total = this.estado.resultadosTotales.length;
    if (total === 0) {
      this.zonaResumen.textContent = '0 resultados encontrados';
      this.paginador.actualizar(1, 1);
      this.mostrarEstadoVacio(
        'Ninguna receta cumple simultáneamente con todos los criterios seleccionados.'
      );
      return;
    }

    const totalPaginas = Math.ceil(total / this.POR_PAGINA);
    const inicio = (this.estado.paginaActual - 1) * this.POR_PAGINA;
    const recorte = this.estado.resultadosTotales.slice(inicio, inicio + this.POR_PAGINA);

    this.zonaResumen.textContent = `Total de resultados: ${total} recetas (ordenadas A-Z)`;
    this.paginador.actualizar(this.estado.paginaActual, totalPaginas);

    const indicadorPagina = new EstadoCarga(this.zonaResultados, {
      modo: 'cargando',
      forma: 'tarjetas',
      cantidad: recorte.length
    });

    // Resolución en paralelo del detalle de las recetas visibles con Promise.allSettled
    const resoluciones = await Promise.allSettled(
      recorte.map((resumen) => ServicioApi.obtenerRecetaPorId(resumen.id))
    );

    if (this.estado.destruida || idOp !== this.estado.idOperacionActual) {
      indicadorPagina.destruir();
      return;
    }

    indicadorPagina.destruir();
    const grid = document.createElement('div');
    grid.className = 'cuadricula-tarjetas';
    this.zonaResultados.appendChild(grid);

    resoluciones.forEach((resultado, idx) => {
      const baseResumen = recorte[idx];
      if (resultado.status === 'fulfilled') {
        const tarjeta = new TarjetaReceta(grid, {
          receta: resultado.value,
          incompleta: false
        });
        this.tarjetasActivas.push(tarjeta);
      } else {
        const tarjetaIncompleta = new TarjetaReceta(grid, {
          receta: baseResumen,
          incompleta: true
        });
        this.tarjetasActivas.push(tarjetaIncompleta);
      }
    });
  }

  mostrarEstadoVacio(mensaje) {
    this.zonaResultados.textContent = '';
    this.estadoCarga = new EstadoCarga(this.zonaResultados, {
      modo: 'vacio',
      titulo: 'Explorar recetas',
      mensaje
    });
  }

  mostrarErrorGeneral(mensaje, callbackReintento) {
    this.zonaResultados.textContent = '';
    this.accionReintentoActual = callbackReintento;
    this.estadoCarga = new EstadoCarga(this.zonaResultados, {
      modo: 'error',
      titulo: 'Error en la consulta',
      mensaje,
      mostrarReintentar: true
    });
  }

  configurarEventos() {
    this.manejadorEjecutar = (e) => {
      this.ejecutarBusquedaCombinada(e.detail.criterios);
    };

    this.manejadorLimpiar = () => {
      this.estado.idOperacionActual++;
      this.estado.criterios = { nombre: '', categoria: '', origen: '', ingrediente: '' };
      this.estado.resultadosTotales = [];
      this.estado.paginaActual = 1;
      this.estado.busquedaRealizada = false;
      this.zonaResumen.textContent = '';
      this.paginador.actualizar(1, 1);
      this.limpiarTarjetas();
      this.mostrarEstadoVacio(
        'Filtros limpiados. Selecciona al menos un criterio para buscar.'
      );
    };

    this.manejadorCambioPagina = (e) => {
      this.estado.paginaActual = e.detail.pagina;
      this.renderizarPaginaActual();
    };

    this.manejadorReintentarTarjeta = async (e) => {
      const { id, instanciaTarjeta } = e.detail;
      try {
        const completa = await ServicioApi.obtenerRecetaPorId(id);
        if (!this.estado.destruida) {
          instanciaTarjeta.actualizarReceta(completa, false);
        }
      } catch (err) {
        if (!this.estado.destruida) {
          instanciaTarjeta.actualizarReceta(instanciaTarjeta.estado.receta, true);
        }
      }
    };

    this.manejadorReintentarGeneral = () => {
      if (this.accionReintentoActual) this.accionReintentoActual();
    };

    this.elemento.addEventListener('ejecutar-busqueda', this.manejadorEjecutar);
    this.elemento.addEventListener('limpiar-busqueda', this.manejadorLimpiar);
    this.elemento.addEventListener('cambio-pagina', this.manejadorCambioPagina);
    this.elemento.addEventListener('reintentar-tarjeta', this.manejadorReintentarTarjeta);
    this.elemento.addEventListener('reintentar-accion', this.manejadorReintentarGeneral);
  }

  limpiarTarjetas() {
    this.tarjetasActivas.forEach((t) => t.destruir());
    this.tarjetasActivas = [];
    if (this.estadoCarga) {
      this.estadoCarga.destruir();
      this.estadoCarga = null;
    }
  }

  destruir() {
    this.estado.destruida = true;
    this.limpiarTarjetas();
    if (this.formulario) this.formulario.destruir();
    if (this.paginador) this.paginador.destruir();
    if (this.elemento) {
      this.elemento.removeEventListener('ejecutar-busqueda', this.manejadorEjecutar);
      this.elemento.removeEventListener('limpiar-busqueda', this.manejadorLimpiar);
      this.elemento.removeEventListener('cambio-pagina', this.manejadorCambioPagina);
      this.elemento.removeEventListener('reintentar-tarjeta', this.manejadorReintentarTarjeta);
      this.elemento.removeEventListener('reintentar-accion', this.manejadorReintentarGeneral);
      this.elemento.remove();
      this.elemento = null;
    }
  }
}