# Recetario — Proyecto 2

> **Nombre provisional.** El enunciado exige un nombre original y creativo; reemplazar «Recetario» por la identidad definitiva antes de la entrega.

Aplicación web de página única (SPA) para explorar, consultar y comparar recetas usando la API pública [TheMealDB](https://www.themealdb.com/). Proyecto de **Desarrollo de Lenguajes para Clientes Web**.

## Estado

Esqueleto inicial. La navegación, el estado global y los servicios base ya están conectados. Las vistas y los componentes tienen su estructura y sus `TODO` para completar por la pareja.

## Integrantes

- Santiago Padrón — [@Santixpadron](https://github.com/Santixpadron)
- [Nombre completo] — [@DaimarPP](https://github.com/DaimarPP)

## Cómo ejecutar

1. Clonar el repositorio.
2. Abrir `index.html` directamente en el navegador. No requiere servidor.
3. No se usan módulos ES ni dependencias externas.

## Estructura

```text
/
  index.html
  /css
    base.css
    componentes.css
    vistas.css
  /js
    /util
      dom.js
    /servicios
      api.js
      cache.js
      recetas.js
      comparacion.js
    /componentes
      Pseudocomponente.js
      Aviso.js
      EstadoCarga.js
      Modal.js
      BarraNavegacion.js
      TarjetaReceta.js
      Paginador.js
      FormularioBusqueda.js
      ListaIngredientes.js
      PasosPreparacion.js
      PanelComparador.js
      TablaComparacion.js
    /vistas
      VistaInicio.js
      VistaExplorar.js
      VistaDetalle.js
      VistaCategoriasOrigenes.js
      VistaComparador.js
    estado.js
    app.js
  /assets
    icono.svg
    receta-placeholder.svg
    ingrediente-placeholder.svg
```

## Pseudocomponentes

| Componente | Responsabilidad | Eventos que emite |
| --- | --- | --- |
| `BarraNavegacion` | Navegación permanente y contador del comparador. | `nav:ir` |
| `TarjetaReceta` | Tarjeta reutilizable de receta; soporta estado incompleto y reintento. | `receta:abrir`, `receta:comparar`, `tarjeta:reintentar` |
| `Paginador` | Paginación en cliente de 12 resultados por página. | `pagina:cambiar` |
| `FormularioBusqueda` | Criterios combinables de Explorar y validación en línea. | `busqueda:aplicar`, `busqueda:limpiar` |
| `ListaIngredientes` | Imagen, nombre y medida de cada ingrediente. | — |
| `PasosPreparacion` | Pasos numerados a partir de `strInstructions`. | — |
| `PanelComparador` | Panel A/B con buscador interno, debounce y `AbortController`. | `comparador:cambio`, `comparador:vaciar` |
| `TablaComparacion` | Métricas, resaltado del menor y receta más sencilla. | — |
| `EstadoCarga` | Estados de carga, vacío y error con reintento. | `estado:reintentar` |
| `Modal` | Diálogos integrados al DOM (reemplazo de panel, avisos). | `modal:opcion`, `modal:cerrar` |
| `Aviso` | Mensajes flotantes integrados al DOM. | — |
| `VistaInicio` | Receta destacada y cuadrícula de categorías. | — |
| `VistaExplorar` | Búsqueda con filtros combinados, resultados y paginación. | — |
| `VistaDetalle` | Detalle completo, ingredientes, pasos y relacionadas. | `nav:volver` |
| `VistaCategoriasOrigenes` | Pestañas de categorías y orígenes con fichas. | — |
| `VistaComparador` | Composición de los paneles y la tabla de comparación. | `comparador:estado` |

> Las vistas también se implementan como pseudocomponentes: mismo ciclo de vida y `destruir()`.

## `Promise.all` y `Promise.allSettled`

| Dónde | Combinador | Por qué |
| --- | --- | --- |
| Inicio: receta destacada + categorías | `allSettled` | Si una sección falla, la otra debe mostrarse igualmente. |
| Explorar: peticiones de cada criterio | `all` | La intersección necesita todas las respuestas para ser correcta. |
| Explorar: detalle de las tarjetas de la página visible | `allSettled` | Un fallo individual no debe tumbar el resto de la página. |
| Detalle: relacionadas por categoría + por origen | `allSettled` | El fallo de una sección no impide mostrar la otra. |
| Comparador | peticiones individuales | Cada panel busca por su cuenta; la comparación solo se calcula con ambas recetas. |

## Decisiones de diseño (provisionales)

- **Paleta:** paprika (`#c4472d`), oliva (`#6b7f3a`) y crema (`#fbf7f0`). Pendiente de validar con la identidad final.
- **Tipografías:** Georgia para títulos y la tipografía del sistema para el cuerpo.
- **Iconografía:** SVG locales en `assets/`; sin kits externos.
- **Controles:** botones, campos, selectores, pestañas y avisos con estilo propio; estados de `hover` y `:focus-visible`.

## División del trabajo

| Paquete | Responsable |
| --- | --- |
| Núcleo: `api.js`, `cache.js`, `recetas.js`, `app.js`, `BarraNavegacion`, CSS base | Ambos, en pareja |
| Búsqueda y resultados: `VistaExplorar`, `FormularioBusqueda`, `Paginador`, `TarjetaReceta`, `VistaCategoriasOrigenes` | A |
| Contenido y detalle: `VistaInicio`, `VistaDetalle`, `ListaIngredientes`, `PasosPreparacion`, `EstadoCarga` | B |
| Comparador: `PanelComparador` (A) vs `comparacion.js` + `TablaComparacion` (B); `VistaComparador` en pareja | A y B |
| README, pruebas y capturas | Ambos |

> Completar los nombres definitivos y ajustar el reparto real al historial de commits.

## Capturas de pantalla

Pendientes. Se agregarán en `capturas/` al cerrar la Fase 4.
