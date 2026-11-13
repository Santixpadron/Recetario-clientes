/*este archivo contiene la implementación del formulario de búsqueda para filtrar recetas */

class FormularioBusqueda { /* se encarga de crear y manejar un formulario de búsqueda para filtrar recetas según diferentes criterios */
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
    FormularioBusqueda.contador = (FormularioBusqueda.contador || 0) + 1;
    this.idBase = `filtro-${FormularioBusqueda.contador}`;
    this.elemento = null;
    this.crearElemento();
    this.renderizar();
    this.configurarEventos();
  }

  crearElemento() { /* se encarga de crear el elemento HTML del formulario de búsqueda y lo agrega al contenedor proporcionado */
    this.elemento = document.createElement('form');
    this.elemento.className = 'formulario-explorar';
    this.elemento.noValidate = true;
    this.contenedor.appendChild(this.elemento);
  }

  renderizar() { /* se encarga de renderizar el formulario de búsqueda en la interfaz de usuario, mostrando los campos y botones correspondientes */
    this.elemento.textContent = '';

    const grid = document.createElement('div');
    grid.className = 'campos-cuadricula';

    // 1. Campo Nombre
    const grupoNombre = document.createElement('div');
    grupoNombre.className = 'grupo-campo';
    const lblNombre = document.createElement('label');
    lblNombre.className = 'etiqueta-campo';
    lblNombre.textContent = 'Nombre de receta';
    lblNombre.htmlFor = `${this.idBase}-nombre`;
    const inputNombre = document.createElement('input');
    inputNombre.type = 'text';
    inputNombre.id = `${this.idBase}-nombre`;
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
    lblCat.htmlFor = `${this.idBase}-categoria`;
    const selectCat = document.createElement('select');
    selectCat.id = `${this.idBase}-categoria`;
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
    lblOri.htmlFor = `${this.idBase}-origen`;
    const selectOri = document.createElement('select');
    selectOri.id = `${this.idBase}-origen`;
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
    lblIng.htmlFor = `${this.idBase}-ingrediente`;
    const inputIng = document.createElement('input');
    inputIng.type = 'text';
    inputIng.id = `${this.idBase}-ingrediente`;
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
    msgError.setAttribute('role', 'alert');
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

  configurarEventos() { /* se encarga de configurar los eventos del formulario de búsqueda, incluyendo la entrada de texto, el clic en las sugerencias y el envío del formulario */
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

    this.manejadorClick = (e) => { // se encarga de manejar los clics en las sugerencias de ingredientes y en el botón de limpiar filtros
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

      if (e.target.classList.contains('btn-limpiar-filtros')) { // se encarga de limpiar los criterios de búsqueda y disparar un evento personalizado 'limpiar-busqueda'
        this.estado.criterios = { nombre: '', categoria: '', origen: '', ingrediente: '' };
        this.estado.errorValidacion = '';
        this.renderizar();
        this.elemento.dispatchEvent(new CustomEvent('limpiar-busqueda', { bubbles: true }));
      }
    };

    this.manejadorSubmit = (e) => { // se encarga de manejar el envío del formulario, validando los criterios de búsqueda y disparando un evento personalizado 'ejecutar-busqueda' si todo es válido
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

  mostrarError(texto) { // se encarga de mostrar un mensaje de error de validación en el formulario de búsqueda
    this.estado.errorValidacion = texto;
    const msg = this.elemento.querySelector('.mensaje-validacion');
    if (msg) msg.textContent = texto;
  }

  destruir() { // se encarga de destruir el formulario de búsqueda y limpiar los eventos
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