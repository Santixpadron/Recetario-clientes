# UmamiLab

**Laboratorio de exploración y comparación gastronómica** construido con HTML5, CSS3 y JavaScript vanilla sobre la API pública de [TheMealDB](https://www.themealdb.com/).

El proyecto permite descubrir recetas, filtrarlas por nombre, categoría, origen o ingrediente, consultar su ficha completa y enfrentar dos recetas para saber cuál es más sencilla.

---

## Cómo ejecutarlo

No necesita servidor, dependencias ni proceso de compilación:

1. Abre `index.html` directamente en el navegador (doble clic o arrastrarlo a la ventana).
2. Espera unos segundos mientras se cargan las primeras recetas desde TheMealDB.
3. Navega con la barra superior o con los enlaces internos.

> Requiere conexión a internet: todas las recetas e imágenes provienen de `https://www.themealdb.com/api/json/v1/1/`.

---

## Funcionalidades

- **Inicio:** receta aleatoria destacada, accesos rápidos a categorías y orígenes.
- **Explorar:** búsqueda combinada por nombre, categoría, origen e ingrediente. Los filtros se ejecutan en paralelo y se cruzan por identificador.
- **Detalle:** imagen, categoría, origen, etiquetas, ingredientes con medida e imagen, pasos numerados, video opcional y recetas relacionadas.
- **Categorías y orígenes:** dos pestañas de catálogos, fichas seleccionables, recetas paginadas, estados de carga, error y vacío.
- **Comparador:** dos paneles A/B con búsqueda de recetas (debounce de 400 ms y `AbortController`), intercambio de paneles, tabla de métricas y veredicto sobre la receta más sencilla.

---

## Estructura del repositorio

```text
umamilab/
├── index.html
├── css/
│   └── styles.css
├── assets/
│   └── ingrediente-default.svg
├── js/
│   ├── servicios/
│   │   ├── cache.js
│   │   ├── api.js
│   │   ├── recetas.js
│   │   └── comparacion.js
│   ├── componentes/
│   │   ├── EstadoCarga.js
│   │   ├── BarraNavegacion.js
│   │   ├── TarjetaReceta.js
│   │   ├── Paginador.js
│   │   ├── FormularioBusqueda.js
│   │   ├── ListaIngredientes.js
│   │   ├── PasosPreparacion.js
│   │   ├── PanelComparador.js
│   │   └── TablaComparacion.js
│   ├── vistas/
│   │   ├── VistaInicio.js
│   │   ├── VistaExplorar.js
│   │   ├── VistaDetalle.js
│   │   ├── VistaCategoriasOrigenes.js
│   │   └── VistaComparador.js
│   └── app.js
└── README.md
```

Los scripts se cargan con etiquetas `<script>` clásicas, en orden de dependencia. No se usan módulos ES, `import`/`export`, frameworks ni librerías externas.

---

## División del trabajo

- **Integrante 1:** Neil_togandi
- **Integrante 2:** Santixpadron

| Integrante | Archivos |
| --- | --- |
| **Integrante 1** | `index.html`, base de `css/styles.css`, `cache.js`, `api.js`, `EstadoCarga`, `BarraNavegacion`, `TarjetaReceta`, `Paginador`, `FormularioBusqueda`, `VistaInicio`, `VistaExplorar` |
| **Integrante 2** | CSS de detalle y comparador, `assets/ingrediente-default.svg`, `recetas.js`, `comparacion.js`, `ListaIngredientes`, `PasosPreparacion`, `PanelComparador`, `TablaComparacion`, `VistaDetalle`, `VistaCategoriasOrigenes`, `VistaComparador`, `app.js`, `README.md` |

### Estado de esta entrega

Esta rama contiene la **mitad del Integrante 2 completamente implementada**. Los archivos del Integrante 1 marcados como `PROVISIONAL` son versiones funcionales mínimas que permiten ejecutar y probar la aplicación de extremo a extremo; Neil_togandi debe reemplazarlos por su implementación definitiva y hacer sus propios commits.

Archivos provisionales:

- `js/servicios/cache.js`
- `js/servicios/api.js`
- `js/componentes/EstadoCarga.js`
- `js/componentes/BarraNavegacion.js`
- `js/componentes/TarjetaReceta.js`
- `js/componentes/Paginador.js`
- `js/componentes/FormularioBusqueda.js`
- `js/vistas/VistaInicio.js`
- `js/vistas/VistaExplorar.js`

---

## Servicios

### `ServicioRecetas`

Normaliza las respuestas crudas de TheMealDB:

- `normalizarResumen(cruda)`: modelo ligero para tarjetas.
- `normalizarCompleta(cruda)`: modelo completo con ingredientes, pasos, etiquetas y metadatos.
- `extraerPasos(texto)`: divide instrucciones, descarta encabezados como `Step 1` o `Paso 2:` y separa párrafos u oraciones cuando la API devuelve todo en una sola línea.
- `obtenerImagenIngrediente(nombre)`: construye la URL de la imagen del ingrediente.

### `ServicioComparacion`

Calcula las métricas del comparador ignorando mayúsculas, acentos y espacios sobrantes:

- Cantidad de ingredientes, pasos y palabras.
- Coincidencia de categoría y origen.
- Ingredientes comunes y exclusivos.
- Etiquetas en común.
- Disponibilidad de video.
- Porcentaje de similitud.
- Receta más sencilla y motivo del desempate.

### `ServicioApi`

Única puerta de entrada a la red:

- `peticionCentralizada(endpoint, opciones)`: `fetch` con `AbortController`, validación de `response.ok` y errores tipificados (`SIN_CONEXION`, `SERVICIO_NO_DISPONIBLE`, `ABORTADO`).
- `buscarPorNombre`, `obtenerRecetaPorId`, `obtenerRecetaAleatoria`.
- `obtenerCategorias`, `obtenerOrigenes`, `obtenerIngredientes`.
- `filtrarPorCategoria`, `filtrarPorOrigen`, `filtrarPorIngrediente`.

### `ServicioCache`

Caché en memoria durante la sesión, sin `localStorage` ni `sessionStorage`. Deduplica peticiones simultáneas mediante `pedirUnaVez(clave, productor)`.

---

## Pseudocomponentes y eventos

Cada pseudocomponente es una clase con estado propio, renderizado y `destruir()`. La comunicación se hace con `CustomEvent` que burbujean hasta `document`, donde `app.js` los escucha.

| Pseudocomponente | Responsabilidad | Eventos que emite |
| --- | --- | --- |
| `EstadoCarga` | Esqueletos, estados vacíos y errores | `reintentar-accion` |
| `BarraNavegacion` | Navegación principal y contador del comparador | `navegar-vista` |
| `TarjetaReceta` | Ficha resumida de receta | `abrir-detalle`, `agregar-comparador` |
| `Paginador` | Cambio de página | `cambio-pagina` |
| `FormularioBusqueda` | Filtros combinados | `ejecutar-busqueda`, `limpiar-busqueda` |
| `ListaIngredientes` | Cuadrícula de ingredientes | — |
| `PasosPreparacion` | Pasos numerados | — |
| `PanelComparador` | Panel A/B con búsqueda y sugerencias | `seleccionar-receta-panel`, `vaciar-panel-comparador` |
| `TablaComparacion` | Tabla de métricas y veredicto | — |

Eventos globales adicionales: `volver-vista-origen`, `abrir-ficha-categoria`, `intercambiar-comparador`.

---

## Decisiones técnicas

- **Sin frameworks ni librerías:** solo APIs nativas del navegador.
- **Sin módulos ES:** scripts clásicos para que `file://` funcione sin servidor.
- **Sin `innerHTML` con datos de la API:** todo el contenido dinámico se construye con `document.createElement`, `textContent` y `append`.
- **Sin persistencia:** el estado vive en memoria y se pierde al recargar.
- **Sin `alert`, `confirm` ni `prompt`:** los avisos usan una región `aria-live` y el diálogo de reemplazo es un `role="dialog"` propio.
- **Rutas por hash:** `#/inicio`, `#/explorar`, `#/detalle/:id`, `#/categorias-origenes`, `#/comparador`.
- **Cancelación de peticiones:** `AbortController` en búsquedas, detalle, paneles y cambio de vista.
- **`Promise.all`:** filtros combinados de Explorar.
- **`Promise.allSettled`:** portada de Inicio y recetas relacionadas del Detalle, para tolerar fallos parciales.

---

## Accesibilidad

- Enlace "Saltar al contenido principal" y foco visible en todos los controles.
- Navegación con `aria-current="page"`.
- Pestañas con `role="tablist"`, `role="tab"`, `aria-selected` y navegación con flechas, Home y End.
- Combobox de los paneles con `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant` y opciones navegables con flechas, Enter y Escape.
- Etiquetas asociadas a sus campos con `for`/`id`.
- Imágenes decorativas con `alt=""`; imágenes informativas con texto alternativo.
- Diálogo de reemplazo con `role="dialog"`, `aria-modal`, foco atrapado, Escape y restauración del foco.
- Región `aria-live` para anuncios de estado.
- Respeto por `prefers-reduced-motion`.

---

## Endpoints utilizados

```text
search.php?s={nombre}
lookup.php?i={id}
random.php
categories.php
list.php?a=list
list.php?i=list
filter.php?c={categoria}
filter.php?a={origen}
filter.php?i={ingrediente}
```

Todos con la clave pública `1` y la base `https://www.themealdb.com/api/json/v1/1/`.

---

## Créditos

Proyecto académico de la materia **Clientes Web**. Datos e imágenes: [TheMealDB](https://www.themealdb.com/).
