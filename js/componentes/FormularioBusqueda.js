class FormularioBusqueda {
  constructor(contenedor, props = {}) {
    this.contenedor = contenedor;
    this.estado = {
      categorias: props.categorias || [],
      origenes: props.origenes || [],
      ingredientes: props.ingredientes || [],
      criterios: {
        nombre: (props.criteriosIniciales && props.criteriosIniciales.nombre) || '',
        categoria: (props.criteriosIniciales && props.criteriosIniciales.categoria) || '',
        origen: (props.criteriosIniciales && props.criteriosIniciales.origen) || '',
        ingrediente: (props.criteriosIniciales && props.criteriosIniciales.ingrediente) || ''
      },
      sugerenciasIngrediente: [],
      errorValidacion: ''
    };
    this.elemento = null;
    this.crearElemento();
    this.renderizar();
    this.configurarEventos();
  }

  crearElemento() {
    this.elemento = document.createElement('form');
    this.elemento.className = 'formulario-explorar';
    this.elemento.noValidate = true;
    this.contenedor.appendChild(this.elemento);
  }

  renderizar() {
    this.elemento.textContent = '';

    const grid = document.createElement('div');
    grid.className = 'campos-cuadricula';

    // 1. Campo Nombre
    const grupoNombre = document.createElement('div');
    grupoNombre.className = 'grupo-campo';
    const lblNombre = document.createElement('label');
    lblNombre.className = 'etiqueta-campo';
    lblNombre.textContent = 'Nombre de receta';
    const inputNombre = document.createElement('input');
    inputNombre.type = 'text';
    inputNombre.name = 'nombre';
    inputNombre.className = 'campo-control';
    inputNombre.placeholder = 'Ej. Arrabiata, Tacos...';
    inputNombre.value = this.estado.criterios.nombre;
    grupoNombre.appendChild(lblNombre);
    grupoNombre.appendChild(inputNombre);

    // 2. Selector Categoría
    const grupoCat = document.createElement('div');
    grupoCat.className = 'grupo-campo';
    const lblCat = document.createElement('label');
    lblCat.className = 'etiqueta-campo';
    lblCat.textContent = 'Categoría';
    const selectCat = document.createElement('select');
    selectCat.name = 'categoria';
    selectCat.className = 'selector-control';
    const optCatTodas = document.createElement('option');
    optCatTodas.value = '';
    optCatTodas.textContent = 'Todas las categorías';
    selectCat.appendChild(optCatTodas);
    this.estado.categorias.forEach((cat) => {
      const opt = document.createElement('option');
      opt.value = cat.nombre;
      opt.textContent = cat.nombre;
      if (this.estado.criterios.categoria === cat.nombre) opt.selected = true;
      selectCat.appendChild(opt);
    });
    grupoCat.appendChild(lblCat);
    grupoCat.appendChild(selectCat);

    // 3. Selector Origen
    const grupoOri = document.createElement('div');
    grupoOri.className = 'grupo-campo';
    const lblOri = document.createElement('label');
    lblOri.className = 'etiqueta-campo';
    lblOri.textContent = 'Origen (Cocina)';
    const selectOri = document.createElement('select');
    selectOri.name = 'origen';
    selectOri.className = 'selector-control';
    const optOriTodos = document.createElement('option');
    optOriTodos.value = '';
    optOriTodos.textContent = 'Todos los orígenes';
    selectOri.appendChild(optOriTodos);
    this.estado.origenes.forEach((ori) => {
      const opt = document.createElement('option');
      opt.value = ori;
      opt.textContent = ori;
      if (this.estado.criterios.origen === ori) opt.selected = true;
      selectOri.appendChild(opt);
    });
    grupoOri.appendChild(lblOri);
    grupoOri.appendChild(selectOri);

    // 4. Campo Ingrediente con sugerencias
    const grupoIng = document.createElement('div');
    grupoIng.className = 'grupo-campo';
    const lblIng = document.createElement('label');
    lblIng.className = 'etiqueta-campo';
    lblIng.textContent = 'Ingrediente';
    const inputIng = document.createElement('input');
    inputIng.type = 'text';
    inputIng.name = 'ingrediente';
    inputIng.autocomplete = 'off';
    inputIng.className = 'campo-control';
    inputIng.placeholder = 'Escribe para filtrar...';
    inputIng.value = this.estado.criterios.ingrediente;

    const ulSugerencias = document.createElement('ul');
    ulSugerencias.className = 'lista-sugerencias';
    ulSugerencias.style.display = 'none';

    grupoIng.appendChild(lblIng);
    grupoIng.appendChild(inputIng);
    grupoIng.appendChild(ulSugerencias);

    grid.appendChild(grupoNombre);
    grid.appendChild(grupoCat);
    grid.appendChild(grupoOri);
    grid.appendChild(grupoIng);
    this.elemento.appendChild(grid);

    // Mensaje de validación
    const msgError = document.createElement('p');
    msgError.className = 'mensaje-validacion';
    msgError.textContent = this.estado.errorValidacion;
    this.elemento.appendChild(msgError);

    // Botones de acción
    const filaBotones = document.createElement('div');
    filaBotones.style.display = 'flex';
    filaBotones.style.gap = '0.75rem';
    filaBotones.style.marginTop = '1rem';

    const btnBuscar = document.createElement('button');
    btnBuscar.type = 'submit';
    btnBuscar.className = 'btn btn-primario';
    btnBuscar.textContent = 'Aplicar filtros';

    const btnLimpiar = document.createElement('button');
    btnLimpiar.type = 'button';
    btnLimpiar.className = 'btn btn-secundario btn-limpiar-filtros';
    btnLimpiar.textContent = 'Limpiar';

    filaBotones.appendChild(btnBuscar);
    filaBotones.appendChild(btnLimpiar);
    this.elemento.appendChild(filaBotones);
  }

  configurarEventos() {
    this.manejadorInput = (e) => {
      const { name, value } = e.target;
      if (!name) return;
      this.estado.criterios[name] = value;

      if (name === 'ingrediente') {
        const ul = this.elemento.querySelector('.lista-sugerencias');
        const termino = value.trim().toLowerCase();
        ul.textContent = '';

        if (termino.length >= 1) {
          const coincidencias = this.estado.ingredientes
            .filter((ing) => ing.toLowerCase().includes(termino))
            .slice(0, 8);

          if (coincidencias.length > 0) {
            coincidencias.forEach((item) => {
              const li = document.createElement('li');
              li.className = 'item-sugerencia';
              li.textContent = item;
              li.dataset.valorIngrediente = item;
              ul.appendChild(li);
            });
            ul.style.display = 'block';
            return;
          }
        }
        ul.style.display = 'none';
      }
    };

    this.manejadorClick = (e) => {
      const sugerencia = e.target.closest('[data-valor-ingrediente]');
      if (sugerencia) {
        const valor = sugerencia.dataset.valorIngrediente;
        this.estado.criterios.ingrediente = valor;
        const inputIng = this.elemento.querySelector('input[name="ingrediente"]');
        const ul = this.elemento.querySelector('.lista-sugerencias');
        if (inputIng) inputIng.value = valor;
        if (ul) ul.style.display = 'none';
        return;
      }

      if (e.target.classList.contains('btn-limpiar-filtros')) {
        this.estado.criterios = { nombre: '', categoria: '', origen: '', ingrediente: '' };
        this.estado.errorValidacion = '';
        this.renderizar();
        this.elemento.dispatchEvent(new CustomEvent('limpiar-busqueda', { bubbles: true }));
      }
    };

    this.manejadorSubmit = (e) => {
      e.preventDefault();
      const { nombre, categoria, origen, ingrediente } = this.estado.criterios;
      const nLimpio = nombre.trim();
      const iLimpio = ingrediente.trim();

      if (!nLimpio && !categoria && !origen && !iLimpio) {
        this.mostrarError('Debes seleccionar o escribir al menos un criterio de búsqueda.');
        return;
      }

      if (nLimpio.length > 0 && nLimpio.length < 2) {
        this.mostrarError('El nombre a buscar debe tener al menos 2 caracteres.');
        return;
      }

      if (iLimpio.length > 0 && iLimpio.length < 2) {
        this.mostrarError('El ingrediente debe tener al menos 2 caracteres.');
        return;
      }

      this.mostrarError('');
      this.elemento.dispatchEvent(
        new CustomEvent('ejecutar-busqueda', {
          bubbles: true,
          detail: {
            criterios: {
              nombre: nLimpio,
              categoria,
              origen,
              ingrediente: iLimpio
            }
          }
        })
      );
    };

    this.elemento.addEventListener('input', this.manejadorInput);
    this.elemento.addEventListener('change', this.manejadorInput);
    this.elemento.addEventListener('click', this.manejadorClick);
    this.elemento.addEventListener('submit', this.manejadorSubmit);
  }

  mostrarError(texto) {
    this.estado.errorValidacion = texto;
    const msg = this.elemento.querySelector('.mensaje-validacion');
    if (msg) msg.textContent = texto;
  }

  destruir() {
    if (this.elemento) {
      this.elemento.removeEventListener('input', this.manejadorInput);
      this.elemento.removeEventListener('change', this.manejadorInput);
      this.elemento.removeEventListener('click', this.manejadorClick);
      this.elemento.removeEventListener('submit', this.manejadorSubmit);
      this.elemento.remove();
      this.elemento = null;
    }
  }
}