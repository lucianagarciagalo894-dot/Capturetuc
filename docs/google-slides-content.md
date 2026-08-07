# Contenido para Google Slides — CAPTURE TUC

Guía para armar la presentación (aprox. 20-22 diapositivas). Para cada una: título, texto breve sugerido, qué captura de pantalla poner, qué parte del código mostrar, y qué explicar en voz alta. Las capturas **no están incluidas** — la lista completa de capturas a sacar está al final del README y se repite abajo, ordenada.

---

### Diapositiva 1 — Portada

**Texto:** CAPTURE TUC — E-commerce de álbumes de fotos personalizados. Proyecto final Backend, CoderHouse. Tu nombre, fecha.
**Captura:** Ninguna (solo texto/logo).
**Código:** Ninguno.
**Explicar:** Quién sos, qué es el proyecto en una frase.

### Diapositiva 2 — Definición de CAPTURE TUC

**Texto:** Aplicación web tipo e-commerce para vender álbumes de fotos personalizados: catálogo, carrito de compras y panel de administración, con actualización en tiempo real.
**Captura:** Home (`/`) del sitio.
**Código:** Ninguno.
**Explicar:** Qué hace la app de punta a punta, en 30 segundos.

### Diapositiva 3 — Problema que resuelve

**Texto:** Digitalizar la venta de álbumes personalizados: mostrar el catálogo con sus características técnicas (tamaño, tapa, hojas, acabado), permitir armar un pedido (carrito) y dar a quien vende una forma simple de mantener precios/stock actualizados sin tocar código.
**Captura:** Ninguna.
**Código:** Ninguno.
**Explicar:** Por qué un negocio de álbumes necesitaría esto en vez de manejarlo por WhatsApp/Excel.

### Diapositiva 4 — Público objetivo

**Texto:** Dos perfiles de usuario: el **cliente** (navega catálogo, arma carrito) y el **administrador** (carga y mantiene el catálogo desde un panel separado).
**Captura:** Ninguna.
**Código:** Ninguno.
**Explicar:** Por qué el panel admin está separado del sitio público (distintas necesidades, distinto diseño).

### Diapositiva 5 — Funcionalidades principales

**Texto:** Catálogo con filtros/orden/paginación · detalle de producto · carrito (agregar, modificar cantidad, eliminar, vaciar) · panel admin (CRUD completo) · catálogo en tiempo real vía WebSockets · persistencia intercambiable Mongo/FileSystem.
**Captura:** Ninguna (slide de texto/lista).
**Código:** Ninguno.
**Explicar:** Enumerar rápido, sin entrar en detalle (el detalle viene en las próximas slides).

### Diapositiva 6 — Tecnologías

**Texto:** Node.js, Express, MongoDB Atlas, Mongoose + mongoose-paginate-v2, Socket.io, Handlebars, dotenv.
**Captura:** Ninguna.
**Código:** `package.json` (sección `dependencies`).
**Explicar:** Por qué cada una: Express para el servidor HTTP, Mongoose para modelar y validar datos, Socket.io para tiempo real, Handlebars para renderizar HTML en el servidor.

### Diapositiva 7 — Arquitectura en capas

**Texto:** routes → controllers → services → dao (factory) → models. Cada capa tiene una única responsabilidad.
**Captura:** Ninguna (usar el diagrama de texto del README, sección 7).
**Código:** Mostrar en el explorador de archivos la carpeta `src/` completa.
**Explicar:** Qué hace cada capa y por qué separarlas (testeable, fácil de explicar, cambios aislados).

### Diapositiva 8 — Estructura de carpetas

**Texto:** `config`, `controllers`, `services`, `dao` (mongo/filesystem), `models`, `routes`, `middlewares`, `sockets`, `views`, `public`.
**Captura:** Screenshot del árbol de carpetas de `src/` en el editor.
**Código:** Ninguno (es la captura la protagonista).
**Explicar:** Recorrer carpeta por carpeta en 1 frase cada una (usar la sección "GUÍA PARA DEFENDER EL PROYECTO" del README).

### Diapositiva 9 — Modelos (Product y Cart)

**Texto:** `Product`: title, description, price, status, stock, category, thumbnails, features (subdocumento: size, cover, pages, extraPageCost). `Cart`: products [{ product: ObjectId ref Product, quantity, extraPages }].
**Captura:** Ninguna.
**Código:** `src/models/Product.js` y `src/models/Cart.js` completos.
**Explicar:** Por qué `features` es subdocumento y no colección aparte (sección 8 del README); por qué `Cart` referencia en vez de copiar.

### Diapositiva 10 — CRUD de productos

**Texto:** GET (lista paginada) / GET :pid / POST / PUT / DELETE, todos bajo `/api/products`. El `_id` nunca se modifica.
**Captura:** Postman ejecutando `POST /api/products` (201 Created) y `GET /api/products/:pid`.
**Código:** `src/routes/products.router.js` + `src/controllers/products.controller.js`.
**Explicar:** El recorrido completo de una petición `POST` desde la ruta hasta el service que valida y el DAO que persiste.

### Diapositiva 11 — CRUD de carritos

**Texto:** Crear carrito, agregar producto (incrementa si ya existe), quitar producto, reemplazar productos, modificar cantidad, vaciar carrito. Valida stock en cada operación. Si el álbum ofrece hojas extra, el precio de esa línea del carrito se recalcula solo (`price + extraPages × extraPageCost`).
**Captura:** Postman ejecutando `POST /api/carts/:cid/products/:pid` dos veces seguidas (mostrar cómo la cantidad se incrementa en la segunda), y la vista de detalle de un álbum con hojas extra mostrando el total en vivo.
**Código:** `src/services/carts.service.js` (método `addProduct`) y `src/public/js/cart.js` (función `initEstimatedTotal`).
**Explicar:** Cómo se valida el stock antes de agregar, qué pasa si no alcanza (400 con mensaje claro), y cómo se calcula el precio cuando hay hojas extra.

### Diapositiva 12 — MongoDB Atlas

**Texto:** Conexión vía variables de entorno (`MONGO_URI` en `.env`, nunca hardcodeada). El servidor conecta a Mongo **antes** de levantar el puerto HTTP.
**Captura:** Consola mostrando `[MongoDB] Conectado correctamente a la base de datos "ecommerce"`. Opcional: pantalla de MongoDB Atlas con la colección `products` poblada.
**Código:** `src/config/db.js`.
**Explicar:** Qué pasa si Mongo no conecta (el server no arranca, error claro) y por qué eso es una decisión de diseño, no un bug.

### Diapositiva 13 — Persistencia alternativa: FileSystem

**Texto:** Cambiando `PERSISTENCE=filesystem` en `.env`, toda la app pasa a guardar en `data/products.json` y `data/carts.json`, sin tocar una línea de código.
**Captura:** Contenido de `data/products.json` después de crear un producto en modo filesystem.
**Código:** `src/dao/factory.js`.
**Explicar:** El patrón factory/DAO: los `services` no saben (ni les importa) si detrás hay Mongo o un archivo JSON.

### Diapositiva 14 — Populate

**Texto:** El carrito guarda solo el `ObjectId` del producto. `populate('products.product')` trae el documento completo del producto al consultar el carrito, siempre con precio/stock actualizados.
**Captura:** Respuesta de `GET /api/carts/:cid` en Postman, mostrando el producto completo dentro de `products[0].product`.
**Código:** `src/dao/mongo/carts.dao.js` (método `getById`, con `.populate(...)`).
**Explicar:** Por qué no se copia el producto dentro del carrito (sección 8 del README).

### Diapositiva 15 — Paginación, filtros y ordenamiento

**Texto:** `GET /api/products?limit=10&page=1&sort=asc&query=category:Fotolibros Cuadrados`. Respuesta con `totalPages`, `hasNextPage`, `prevLink`/`nextLink` funcionales.
**Captura:** Vista `/products` mostrando los controles de filtro/orden, y una respuesta de Postman con el JSON completo de paginación.
**Código:** `src/services/products.service.js` (funciones `parseQuery`, `buildSort`, `buildLink`).
**Explicar:** Cómo se arma el filtro a partir del query param y cómo se calculan los links de paginación.

### Diapositiva 16 — Panel de desarrollador (admin)

**Texto:** Vista `/admin`, con diseño propio: crear álbum, listar, editar (formulario prellenado), eliminar, activar/desactivar. Reutiliza la misma API pública de productos. No tiene link en el menú público (para que un cliente no lo vea): se accede escribiendo la URL directamente.
**Captura:** Panel `/admin` completo, y el formulario de edición desplegado de un álbum.
**Código:** `src/views/admin.handlebars` + `src/public/js/admin.js`.
**Explicar:** Por qué el admin no duplica lógica de negocio (pega contra `/api/products`, igual que cualquier cliente), y por qué no está en el menú pero sigue siendo funcional.

### Diapositiva 17 — WebSockets en acción

**Texto:** Al crear/editar/eliminar un álbum desde `/admin`, el servidor emite `products:updated` y todos los clientes con `/products` abierto se actualizan solos, sin recargar.
**Captura:** Dos ventanas lado a lado — una en `/admin` haciendo un cambio, otra en `/products` mostrando el catálogo ya actualizado (idealmente dos capturas: antes/después).
**Código:** `src/controllers/products.controller.js` (función `emitProductsUpdated`) + `src/public/js/catalog.js`.
**Explicar:** Diferencia entre HTTP tradicional (pregunta-respuesta) y WebSockets (el server avisa cuando quiere).

### Diapositiva 18 — Evidencias (resumen técnico)

**Texto:** Servidor arrancando y conectado a Mongo · CRUD probado en Postman · vistas funcionando · WebSockets probados de punta a punta · índices verificados con `explain()`.
**Captura:** Colage o slide con 3-4 capturas chicas ya usadas antes (servidor arrancando, Postman, `/products`, panel admin).
**Código:** Ninguno.
**Explicar:** Que todo el proyecto fue probado manualmente antes de darlo por terminado (no solo "compila").

### Diapositiva 19 — Dificultades y soluciones

**Texto:** Ejemplo real de este proyecto: en la conexión a MongoDB Atlas, el driver fallaba con `querySrv ECONNREFUSED` por un DNS local que no resolvía registros SRV — se solucionó apuntando la resolución DNS del proceso de Node a un servidor público (8.8.8.8), sin tocar la red del sistema ni la cadena de conexión.
**Captura:** Consola mostrando el error original y luego la conexión exitosa.
**Código:** `src/config/db.js` (bloque de `dns.setServers`).
**Explicar:** Cómo se diagnosticó (comparando resolución DNS del sistema operativo vs. la de Node) antes de aplicar la solución — mostrar proceso de debugging, no solo el resultado.

### Diapositiva 20 — Mejoras futuras

**Texto:** Autenticación real para `/admin` · subida de imágenes · tests automatizados · búsqueda full-text · checkout/orden de compra real.
**Captura:** Ninguna.
**Código:** Ninguno.
**Explicar:** Que son mejoras conscientemente dejadas afuera para mantener el alcance del proyecto enfocado en lo pedido por la consigna.

### Diapositiva 21 — GitHub / repositorio

**Texto:** Estructura del repo, `README.md` con toda la documentación técnica, `.env` excluido de git.
**Captura:** Vista del repositorio (si se sube a GitHub) o del explorador de archivos con `.gitignore` abierto.
**Código:** `.gitignore`.
**Explicar:** Por qué nunca se sube `.env` ni credenciales al repositorio.

### Diapositiva 22 — Cierre

**Texto:** Resumen de una línea: "CAPTURE TUC integra todo el recorrido del curso — Express, MongoDB, Mongoose, WebSockets y Handlebars — en un caso de uso real y demostrable." Agradecimiento / apertura a preguntas.
**Captura:** Ninguna.
**Código:** Ninguno.
**Explicar:** Cierre y disposición a responder preguntas (repasar la sección "POSIBLES PREGUNTAS DEL PROFESOR" del README antes de la mesa).

---

## CAPTURAS QUE DEBO SACAR (orden sugerido)

1. Consola tras `npm run dev`, mostrando `[MongoDB] Conectado correctamente...` y `[Server] CAPTURE TUC corriendo en http://localhost:8080`.
2. Home (`/`) en el navegador.
3. Catálogo (`/products`) con filtros visibles.
4. Catálogo con un filtro por categoría aplicado (URL con `?query=category:...`).
5. Catálogo con orden por precio aplicado (`?sort=asc` o `desc`).
6. Catálogo mostrando el paginado (página 2, botón "Anterior" visible).
7. Detalle de un álbum (`/products/:pid`) con sus características.
8. Carrito vacío (`/carts/:cid`) con el mensaje "Tu carrito está vacío".
9. Carrito con productos, mostrando cantidad, subtotal y total.
10. Panel admin (`/admin`) completo, con el formulario de creación y el listado.
11. Formulario de edición de un álbum desplegado (`<details>` abierto) en el panel admin.
12. Postman: `GET /api/products` mostrando la respuesta con `status`, `payload`, `totalPages`, etc.
13. Postman: `POST /api/products` creando un álbum (201).
14. Postman: `PUT /api/products/:pid` modificando precio y/o stock.
15. Postman: `DELETE /api/products/:pid` (200).
16. Postman: `POST /api/carts` creando un carrito.
17. Postman: `GET /api/carts/:cid` mostrando el producto **poblado** (populate) dentro del carrito.
18. Postman: `POST /api/carts/:cid/products/:pid` dos veces, mostrando cómo la cantidad se incrementa.
19. Dos ventanas del navegador lado a lado: `/admin` haciendo un cambio y `/products` actualizándose solo (WebSockets) — antes y después.
20. Consola de MongoDB Atlas (Collections) mostrando la base `ecommerce` con las colecciones `products` y `carts` pobladas.
21. (Opcional, para la slide de dificultades) Consola mostrando el error `querySrv ECONNREFUSED` y luego la conexión exitosa tras el fix.
22. (Opcional) Salida de `explain('executionStats')` en `mongosh` mostrando `IXSCAN` vs `COLLSCAN`.
