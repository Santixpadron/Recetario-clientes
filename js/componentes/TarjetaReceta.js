"use strict";

class TarjetaReceta {
  constructor(contenedor, props = {}) {
    this.contenedor = contenedor;
    this.estado = {
      receta: props.receta,
      incompleta: Boolean(props.incompleta),
      reintentando: false
    };
    this.elemento = null;
    this.manejadorClick = null;
    this.crearElemento();
    this.renderizar();
    this.configurarEventos();
  }

  crearElemento() {
    this.elemento = document.createElement('article');
    this.elemento.className = 'tarjeta-receta';
    this.contenedor.appendChild(this.elemento);
  }

  actualizarReceta(recetaCompleta, incompleta = false) {
    this.estado.receta = recetaCompleta;
    this.estado.incompleta = incompleta;
    this.estado.reintentando = false;
    this.renderizar();
  }

  renderizar() {
    this.elemento.textContent = '';
    const { receta, incompleta, reintentando } = this.estado;
    this.elemento.classList.toggle('incompleta', incompleta);

    const img = document.createElement('img');
    img.className = 'tarjeta-img';
    img.src = receta.imagen;
    img.alt = receta.nombre;
    img.loading = 'lazy';

    const cuerpo = document.createElement('div');
    cuerpo.className = 'tarjeta-cuerpo';

    const titulo = document.createElement('h3');
    titulo.className = 'tarjeta-titulo';
    titulo.textContent = receta.nombre;
    cuerpo.appendChild(titulo);

    const filaInsignias = document.createElement('div');
    filaInsignias.className = 'insignias-fila';

    if (receta.completa && !incompleta) {
      const pCat = document.createElement('span');
      pCat.className = 'pildora';
      pCat.textContent = receta.categoria;

      const pOri = document.createElement('span');
      pOri.className = 'pildora pildora-origen';
      pOri.textContent = receta.origen;

      const pIng = document.createElement('span');
      pIng.className = 'pildora pildora-neutro';
      pIng.textContent = `${receta.ingredientes.length} ingr.`;

      filaInsignias.appendChild(pCat);
      filaInsignias.appendChild(pOri);
      filaInsignias.appendChild(pIng);
    } else if (incompleta) {
      const aviso = document.createElement('span');
      aviso.className = 'pildora pildora-origen';
      aviso.textContent = 'Datos incompletos';
      filaInsignias.appendChild(aviso);
    }

    cuerpo.appendChild(filaInsignias);

    const acciones = document.createElement('div');
    acciones.className = 'tarjeta-acciones';

    const btnDetalle = document.createElement('button');
    btnDetalle.type = 'button';
    btnDetalle.className = 'btn btn-primario';
    btnDetalle.dataset.accion = 'detalle';
    btnDetalle.textContent = 'Ver detalle';
    acciones.appendChild(btnDetalle);

    const btnComparar = document.createElement('button');
    btnComparar.type = 'button';
    btnComparar.className = 'btn btn-secundario';
    btnComparar.dataset.accion = 'comparar';
    btnComparar.textContent = '+ Comparar';
    acciones.appendChild(btnComparar);

    if (incompleta) {
      const btnReintentar = document.createElement('button');
      btnReintentar.type = 'button';
      btnReintentar.className = 'btn';
      btnReintentar.dataset.accion = 'reintentar';
      btnReintentar.disabled = reintentando;
      btnReintentar.textContent = reintentando ? 'Cargando...' : 'Reintentar ficha';
      acciones.appendChild(btnReintentar);
    }

    cuerpo.appendChild(acciones);
    this.elemento.appendChild(img);
    this.elemento.appendChild(cuerpo);
  }

  configurarEventos() {
    this.manejadorClick = (e) => {
      const btn = e.target.closest('button[data-accion]');
      if (!btn) return;
      const accion = btn.dataset.accion;

      if (accion === 'detalle') {
        this.elemento.dispatchEvent(
          new CustomEvent('abrir-detalle', {
            bubbles: true,
            detail: { id: this.estado.receta.id }
          })
        );
      } else if (accion === 'comparar') {
        this.elemento.dispatchEvent(
          new CustomEvent('agregar-comparador', {
            bubbles: true,
            detail: { id: this.estado.receta.id, receta: this.estado.receta }
          })
        );
      } else if (accion === 'reintentar') {
        this.estado.reintentando = true;
        this.renderizar();
        this.elemento.dispatchEvent(
          new CustomEvent('reintentar-tarjeta', {
            bubbles: true,
            detail: { id: this.estado.receta.id, instanciaTarjeta: this }
          })
        );
      }
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