# Arquitectura — Recetario

Documento de contrato de la pareja. Si algo no está aquí, se discute antes de codificarlo. Es la fuente de verdad para nombres, modelos, eventos y estado.

## 1. Principios

- JavaScript vanilla, sin librerías, sin módulos ES y sin persistencia.
- Cada pseudocomponente vive en su propio archivo y se carga con `<script defer>` en el orden de `index.html`.
- Los datos de la API se insertan con `textContent` o como atributos. Nunca con `innerHTML`.
- Los componentes no acceden al DOM de otro componente: emiten `CustomEvent` con `bubbles: true` y la vista o `app.js` reacciona.
- El estado vive en memoria, en `Estado` (`js/estado.js`), no dentro del DOM.

## 2. Modelos normalizados

```js
RecetaResumen = {
  id: string,
  nombre: string,
  imagen: string
}

Receta = {
  id: string,
  nombre: string,
  imagen: string,
  categoria: string,
  origen: string,
  instrucciones: string,
  pasos: string[],
  etiquetas: string[],
  video: string | null,
  ingredientes: [
    { nombre: string, medida: string, imagen: string }
  ]
}

Categoria = {
  id: string,
  nombre: string,
  imagen: string,
  descripcion: string
}

Origen = { nombre: string }
IngredienteLista = { nombre: string }
```

La normalización se hace una sola vez en `js/servicios/recetas.js`.

## 3. Eventos

| Evento | Emisor | `detail` | Escucha |
| --- | --- | --- | --- |
| `nav:ir` | `BarraNavegacion` | `{ vista }` | `app.js` |
| `nav:volver` | `VistaDetalle` | `{}` | `app.js` |
| `receta:abrir` | `TarjetaReceta`, `VistaDetalle` | `{ id }` | `app.js` |
| `receta:comparar` | `TarjetaReceta`, `VistaDetalle` | `{ receta }` | `app.js` |
| `tarjeta:reintentar` | `TarjetaReceta` | `{ id }` | Vista contenedora |
| `busqueda:aplicar` | `FormularioBusqueda` | `{ nombre, categoria, origen, ingrediente }` | `VistaExplorar` |
| `busqueda:limpiar` | `FormularioBusqueda` | `{}` | `VistaExplorar` |
| `pagina:cambiar` | `Paginador` | `{ pagina, seccion }` | Vista contenedora |
| `comparador:cambio` | `PanelComparador` | `{ panel, receta }` | `VistaComparador` |
| `comparador:vaciar` | `PanelComparador` | `{ panel }` | `VistaComparador` |
| `comparador:estado` | `VistaComparador` | `{ A, B }` | `app.js` |
| `estado:reintentar` | `EstadoCarga` | `{ seccion }` | Vista contenedora |
| `modal:opcion` | `Modal` | `{ valor }` | Quien lo abrió |
| `modal:cerrar` | `Modal` | `{}` | Quien lo abrió |

Regla: el `detail` lleva datos planos, nunca nodos del DOM ni instancias de componentes.

## 4. Estado global

```js
Estado = {
  vista: 'inicio',
  origenDetalle: null, // { vista: 'explorar' | 'categorias' | 'inicio' }
  explorar: {
    criterios: { nombre: '', categoria: '', origen: '', ingrediente: '' },
    resultados: [],       // RecetaResumen[]
    pagina: 1,
    totalPaginas: 1
  },
  categorias: {
    pestana: 'categorias',
    seleccion: null,      // { tipo: 'categoria' | 'origen', nombre }
    pagina: 1
  },
  comparador: { A: null, B: null } // Receta | null
}
```

- `Estado` se reinicia al recargar la página: no hay persistencia.
- Al cambiar de vista se destruyen los pseudocomponentes de la vista anterior, pero `Estado` se conserva.
- `VistaDetalle` usa `Estado.origenDetalle` para volver a la vista de origen con su estado.

## 5. Archivos y orden de carga

```text
js/util/dom.js
js/servicios/api.js
js/servicios/cache.js
js/servicios/recetas.js
js/servicios/comparacion.js
js/estado.js
js/componentes/Pseudocomponente.js
js/componentes/Aviso.js
js/componentes/EstadoCarga.js
js/componentes/Modal.js
js/componentes/BarraNavegacion.js
js/componentes/TarjetaReceta.js
js/componentes/Paginador.js
js/componentes/FormularioBusqueda.js
js/componentes/ListaIngredientes.js
js/componentes/PasosPreparacion.js
js/componentes/PanelComparador.js
js/componentes/TablaComparacion.js
js/vistas/VistaInicio.js
js/vistas/VistaExplorar.js
js/vistas/VistaDetalle.js
js/vistas/VistaCategoriasOrigenes.js
js/vistas/VistaComparador.js
js/app.js
```

`Pseudocomponente` debe cargarse antes que cualquier clase que lo extienda.

## 6. Errores

`api.js` distingue:

- `ErrorRed`: `fetch` no llegó al servidor (sin conexión).
- `ErrorServicio`: el servidor respondió con un estado no exitoso; incluye `estado`.
- `AbortError`: la petición se canceló; **no se muestra como error**.

Toda función asíncrona usa `try/catch` y comunica el error al DOM. Ningún error se reporta solo en consola.

## 7. Caché

- `Cache.recetas`: `id -> Promise<Receta>`; incluye peticiones en vuelo para deduplicar.
- `Cache.listas`: `'categorias' | 'origenes' | 'ingredientes' -> Promise<...>`.
- Una promesa rechazada se elimina del `Map` para permitir reintento.
- No se cachean resultados de búsqueda ni recetas resumidas.

## 8. Reglas de código

- Sin `alert()`, `confirm()` ni `prompt()`.
- Sin `localStorage`, `sessionStorage`, `IndexedDB` ni cookies.
- Sin `.then()`; todo con `async/await`.
- Sin `innerHTML` para datos de la API.
- Sin `customElements.define`, Shadow DOM ni plantillas de Web Components.
- Todos los controles tienen `hover` y `:focus-visible`.
- Cada vista debe funcionar a 320 px sin desplazamiento horizontal.

## 9. Reparto

| Paquete | Responsable |
| --- | --- |
| Núcleo y CSS base | Ambos, en pareja |
| `VistaExplorar`, `FormularioBusqueda`, `Paginador`, `TarjetaReceta`, `VistaCategoriasOrigenes` | A |
| `VistaInicio`, `VistaDetalle`, `ListaIngredientes`, `PasosPreparacion`, `EstadoCarga` | B |
| `PanelComparador` (A) vs `comparacion.js` + `TablaComparacion` (B) | A y B |
| `VistaComparador`, README, pruebas y capturas | Ambos |

## 10. Decisiones pendientes

- Nombre original e identidad visual definitiva.
- Paleta y tipografías finales.
- Diseño del modal de reemplazo de panel y de los estados vacíos.
- Capturas de pantalla de las cinco vistas.
- Nombres completos de los integrantes en el README.
