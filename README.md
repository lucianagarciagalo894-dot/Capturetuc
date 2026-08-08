# CAPTURE TUC

E-commerce especializado en la venta de álbumes de fotos personalizados. Proyecto final de Backend — CoderHouse.

Permite a un cliente ver el catálogo de álbumes, consultar el detalle de cada uno (tamaño, tapa, hojas, opción de agregar hojas extra pagando un costo adicional), agregarlos a un carrito, modificar cantidades y vaciar el carrito. Un administrador cuenta con un panel de gestión (`/admin`, sin link visible en el sitio público) para crear, editar, eliminar, activar/desactivar álbumes y modificar precio, stock y características, con actualización en tiempo real hacia los clientes conectados vía WebSockets.

> Nota sobre el modelo: la primera versión de la consigna pedía además `features: finish, orientation, material`. Esos tres campos se sacaron a pedido explícito de la dueña del emprendimiento (no los usa el negocio real), pero `code` volvió a incorporarse porque la versión final de la consigna lo vuelve a pedir de forma explícita como campo obligatorio del producto.

---

## 1. Tecnologías

- Node.js + Express (CommonJS)
- MongoDB Atlas + Mongoose + mongoose-paginate-v2
- Persistencia alternativa por FileSystem (JSON), intercambiable por variable de entorno
- Socket.io (actualización en tiempo real del catálogo)
- Handlebars (express-handlebars) para las vistas
- dotenv (variables de entorno) / cookie-parser
- nodemon (desarrollo)

## 2. Instalación

```bash
npm install
```

## 3. Variables de entorno

Copiá `.env.example` a `.env` (ya existe un `.env` de ejemplo en este proyecto) y completá los valores:

```
PORT=8080
PERSISTENCE=mongo
MONGO_URI=
DB_NAME=ecommerce
ADMIN_PATH=admin
```

- `PORT`: puerto HTTP del servidor (por defecto 8080).
- `PERSISTENCE`: `mongo` o `filesystem`. Define qué DAO usa toda la app (ver sección 12).
- `MONGO_URI`: tu cadena de conexión de MongoDB Atlas. **Nunca se hardcodea ni se sube a git** (está en `.gitignore`).
- `DB_NAME`: nombre de la base de datos (`ecommerce`).
- `ADMIN_PATH`: segmento de URL del panel admin (por defecto `admin`, o sea `/admin`).

## 4. Conectar MongoDB Atlas

1. En MongoDB Atlas, tomá tu usuario de base de datos (Database Access) y su contraseña.
2. Armá la URI con el formato:
   ```
   mongodb+srv://<usuario>:<password>@cluster0.oyawvdv.mongodb.net
   ```
3. Pegala en `MONGO_URI` dentro de `.env`.
4. En **Network Access**, asegurate de tener tu IP (o `0.0.0.0/0` para pruebas) habilitada, o la conexión fallará aunque el usuario/contraseña sean correctos.

> Nota técnica: en algunas redes (routers/VPN hogareños) el DNS local no resuelve bien los registros SRV que usa `mongodb+srv://` y Node tira `querySrv ECONNREFUSED`. `src/config/db.js` detecta ese caso puntual y usa temporalmente un DNS público (8.8.8.8 / 1.1.1.1) solo para ese proceso, sin tocar la configuración de red del sistema ni la URI.

## 5. Ejecutar

```bash
npm run dev
```

El flujo de arranque (`src/server.js`) es: cargar `.env` → conectar a MongoDB (si `PERSISTENCE=mongo`) → **recién ahí** levantar el servidor HTTP y Socket.io. Si Mongo no conecta, el proceso corta con un error claro y no queda un servidor "a medias".

Accedé a:

- `http://localhost:8080` — Home
- `http://localhost:8080/products` — Catálogo
- `http://localhost:8080/admin` — Panel de desarrollador

## 6. Cargar datos de ejemplo

```bash
npm run seed
```

Inserta 15 álbumes de muestra (categorías `Fotolibros Apaisados`, `Fotolibros Cuadrados`, `Fotolibros Verticales`, precios variados, algunos con costo por hoja extra, uno inactivo) para poder demostrar filtros, orden y paginación sin cargar todo a mano. Solo funciona con `PERSISTENCE=mongo`.

---

## 7. Arquitectura

Arquitectura en capas, con responsabilidad única por capa:

```
routes  →  controllers  →  services  →  dao (factory)  →  models
                                            ├── mongo/
                                            └── filesystem/
```

- **routes/**: define URLs y métodos HTTP, no contiene lógica.
- **controllers/**: traduce HTTP (`req`/`res`) a llamadas de servicio; maneja status codes y emite eventos de socket.
- **services/**: lógica de negocio — validaciones, armado de filtros/paginación, reglas de stock.
- **dao/**: acceso a datos puro, sin lógica de negocio. Una factory (`dao/factory.js`) elige en tiempo de arranque si se usa Mongo o FileSystem, según `PERSISTENCE`. El resto de la app (services) no sabe ni le importa cuál está activa.
- **models/**: esquemas Mongoose (`Product`, `Cart`).

```
src/
├── config/       env.js, db.js
├── controllers/  products, carts, admin
├── services/     products, carts (lógica de negocio)
├── dao/
│   ├── factory.js
│   ├── mongo/        (Mongoose)
│   └── filesystem/   (JSON en /data)
├── models/       Product.js, Cart.js
├── routes/       products.router, carts.router, views.router
├── middlewares/  logger, errorHandler, notFound, validators
├── sockets/      index.js (Socket.io)
├── views/        home, products, product-detail, cart, admin + layout
├── public/       css/js del cliente
├── app.js        configuración de Express (middlewares, rutas)
└── server.js     conecta Mongo, arranca HTTP + Socket.io
```

Esta estructura sigue el diseño pedido por la consigna sin modificaciones; se agregó únicamente `src/utils/ApiError.js` (clase de error con `statusCode`, usada por services y el error handler central) y `scripts/seed.js` (carga de datos de ejemplo), que no rompen la arquitectura de capas.

## 8. Modelos y por qué usamos referencias + populate

**Product** (colección `products`): `title`, `description`, `code` (único), `price`, `status`, `stock`, `category`, `thumbnails[]` y un subdocumento `features` (`size`, `cover`, `pages`, `extraPageCost`). `extraPageCost` es el costo de cada hoja adicional a las que trae el álbum de base; si es `0` (o no se carga), el cliente no ve la opción de agregar hojas extra en el detalle del producto. Se modeló `features` como subdocumento (no colección aparte) porque es información que **siempre** pertenece a un único álbum, nunca se reutiliza entre productos ni se consulta de forma independiente — no tiene sentido relacional, por eso no lleva `populate`.

**Cart** (colección `carts`): `products: [{ product: ObjectId (ref Product), quantity: Number, extraPages: Number }]`. `extraPages` guarda cuántas hojas extra eligió el cliente para esa línea del carrito; el precio de esa línea se calcula como `(product.price + extraPages * product.features.extraPageCost) * quantity`.

Usamos **referencia + populate** (en vez de embeber el producto completo dentro del carrito) porque el catálogo cambia todo el tiempo (precio, stock, estado) y un carrito puede vivir mucho tiempo: si copiáramos los datos del producto dentro del carrito, quedarían desactualizados apenas el admin cambia un precio. Con referencia, `GET /api/carts/:cid` siempre trae la info más actual del producto vía `populate('products.product')`. Usamos `select` en el populate para traer solo los campos que la vista/API necesitan (`title description code price stock category thumbnails features status`), evitando arrastrar campos internos.

Un producto solo puede aparecer **una vez** por carrito: si se vuelve a agregar el mismo álbum con una cantidad de hojas extra distinta, se actualiza `extraPages` de esa línea y se suma la cantidad, en vez de crear una segunda línea para el mismo producto. Esto mantiene simple el contrato de `DELETE/PUT /api/carts/:cid/products/:pid` (identifican una línea únicamente por `:pid`, tal como pide la consigna).

## 9. CRUD de productos (`/api/products`)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/products` | Lista paginada. Query params: `limit` (10), `page` (1), `sort` (`asc`/`desc` por precio), `query` (`category:Fotolibros Cuadrados`, `status:true`, etc). |
| GET | `/api/products/:pid` | Detalle por ID. |
| POST | `/api/products` | Crea álbum. |
| PUT | `/api/products/:pid` | Actualiza álbum (parcial). El `_id` nunca se modifica, aunque venga en el body (se descarta explícitamente en el DAO). |
| DELETE | `/api/products/:pid` | Elimina álbum. |

Respuesta de `GET /api/products` (formato exacto pedido por la consigna):

```json
{
  "status": "success",
  "payload": [],
  "totalPages": 0,
  "prevPage": null,
  "nextPage": null,
  "page": 1,
  "hasPrevPage": false,
  "hasNextPage": false,
  "prevLink": null,
  "nextLink": null
}
```

`prevLink`/`nextLink` son URLs completas y funcionales que preservan `limit`, `sort` y `query` actuales.

## 10. CRUD de carritos (`/api/carts`)

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/carts` | Crea carrito vacío. |
| GET | `/api/carts/:cid` | Trae el carrito con los productos poblados (`populate`). |
| POST | `/api/carts/:cid/products/:pid` | Agrega producto (body opcional `{ quantity, extraPages }`, default `1` y `0`). Si ya existe, **incrementa** la cantidad y actualiza `extraPages`. Valida stock disponible y que el producto ofrezca hojas extra si `extraPages > 0`. |
| DELETE | `/api/carts/:cid/products/:pid` | Elimina un producto puntual del carrito. |
| PUT | `/api/carts/:cid` | Reemplaza completamente el arreglo de productos (`{ products: [{ product, quantity }] }`). |
| PUT | `/api/carts/:cid/products/:pid` | Modifica solo la cantidad de un producto (`{ quantity }`). |
| DELETE | `/api/carts/:cid` | Vacía el carrito. |

Todas las operaciones validan: que el carrito exista, que el producto exista, que la cantidad sea un número positivo y que haya stock suficiente.

**Nota:** la consigna de la cátedra no pide un flujo de pago/checkout (solo gestión de carrito), así que esto **no** forma parte de la API ni de la evaluación técnica. Se agregó igual, a pedido del negocio real, como una capa puramente visual en `/carts/:cid`: el botón "Finalizar compra" despliega un selector de medio de pago (Transferencia / Efectivo). Si se elige Transferencia, se muestran Alias, CVU, Nombre y el Monto total del carrito (dato real, tomado del mismo `total` que ya calcula el servidor). No crea ninguna orden ni toca la base de datos — es informativo, pensado para que el cliente sepa cómo pagar y mande el comprobante por WhatsApp.

## 11. Paginación, filtros y ordenamiento

Implementado con `mongoose-paginate-v2` sobre `Product` (modo Mongo) y de forma equivalente a mano (slice + sort) en modo FileSystem, exponiendo la misma forma de respuesta en ambos casos.

- `limit` / `page`: tamaño de página y página actual (defaults 10 y 1).
- `sort=asc|desc`: ordena por `price`.
- `query=category:<valor>` o `query=status:true|false`: filtra por categoría o disponibilidad. También acepta `query=<categoria>` a secas como atajo.

## 12. Persistencia: Mongo vs FileSystem

`PERSISTENCE=mongo` (recomendado, el que usa este proyecto por defecto) usa Mongoose contra MongoDB Atlas. `PERSISTENCE=filesystem` guarda `products` y `carts` como arrays JSON en `data/products.json` y `data/carts.json`, generando IDs con el mismo formato de Mongo (`mongoose.Types.ObjectId`) para que el resto del código (rutas, validaciones) no tenga que distinguir el modo.

La elección se resuelve una sola vez, al arrancar, en `src/dao/factory.js`: expone `ProductsDAO` y `CartsDAO` con la **misma interfaz** (`paginate`, `getById`, `create`, `update`, `delete` / `create`, `getById`, `addProduct`, etc.) sin importar qué implementación hay detrás. Los `services` (que contienen la lógica de negocio) llaman siempre a `dao/factory`, nunca a Mongo o FileSystem directamente — así el resto de la app es agnóstico a la persistencia elegida.

## 13. WebSockets (Socket.io)

Cuando el admin crea, edita o elimina un álbum (`POST` / `PUT` / `DELETE` en `/api/products`), el controller emite `io.emit('products:updated')` (ver `src/controllers/products.controller.js`). En la vista `/products`, `public/js/catalog.js` escucha ese evento y vuelve a pedir el catálogo actual a la API para redibujar la grilla, **sin que el usuario recargue la página**. Se probó de punta a punta: un cliente de socket conectado recibió el evento en menos de 1 segundo tras un `PUT` a un producto vía API.

## 14. Panel admin (`/admin`, configurable con `ADMIN_PATH`)

Vista con diseño propio, separada del sitio público. **No tiene link en el menú de navegación** (para que un cliente no lo encuentre de casualidad), pero la ruta sigue 100% activa: se accede escribiendo la URL directamente (`http://localhost:8080/admin`). Es la forma recomendada de cargar el catálogo real y también la que hay que mostrarle al profesor durante la defensa.

- Formulario de creación de álbum (todos los campos + características).
- Listado de álbumes con precio, stock, tamaño y estado.
- Por álbum: botón **Editar** (despliega un formulario prellenado), **Eliminar** y **Activar/Desactivar**.
- Todas las acciones pegan vía `fetch` contra la misma API pública (`/api/products`), que persiste en MongoDB y dispara el evento de socket — es decir, el panel admin no duplica lógica de negocio, reutiliza el mismo CRUD que ya está probado.

## 15. Manejo de errores

Middleware central (`src/middlewares/errorHandler.js`): las `services` lanzan `ApiError(statusCode, message)`; si el error no es un `ApiError` (algo inesperado), se responde `500` genérico y se loguea el detalle en consola (nunca se expone el stack al cliente). Casos cubiertos:

- `400` — datos inválidos (campos requeridos faltantes, cantidad no numérica, stock insuficiente, ID con formato inválido).
- `404` — producto, carrito o ruta inexistente.
- `500` — error interno no esperado.

## 16. Índices

En `Product` (`src/models/Product.js`):

- `code`: único (`unique: true`), genera su propio índice — evita SKUs duplicados y permite búsquedas puntuales por código.
- `{ category: 1, status: 1 }` (compuesto): la consulta más frecuente del catálogo público filtra por categoría **y** disponibilidad al mismo tiempo (`query=category:x` combinado con "solo disponibles"). Se puso `category` primero porque tiene mayor cardinalidad (más valores distintos) que `status` (que es binario), lo cual hace que el índice compuesto sea más selectivo en ese orden.
- `{ price: 1 }`: usado por el `sort=asc|desc` del catálogo.

No se agregaron índices sobre `title`/`description` (no se buscan por texto en este proyecto) ni sobre `stock` (no se filtra por stock directamente) para no pagar el costo de escritura de índices que no se usan.

Evidencia real (`explain('executionStats')`, corrido contra la base ya poblada):

```
Query: Product.find({ category: 'Fotolibros Cuadrados', status: true })
→ winningPlan.inputStage.stage = "IXSCAN"
→ indexName = "category_1_status_1"
→ totalDocsExamined = nReturned (no se escanean documentos de más)

Query: Product.find().sort({ price: 1 })
→ winningPlan.stage = "FETCH", inputStage.stage = "IXSCAN" (usa el índice de price para ordenar sin sort en memoria)
```

Para comparar manualmente **COLLSCAN vs IXSCAN** desde `mongosh`:

```js
use ecommerce
db.products.find({ category: "Fotolibros Cuadrados", status: true }).explain("executionStats")
// sin índice → winningPlan.stage: "COLLSCAN" (recorre toda la colección)
// con índice → winningPlan.inputStage.stage: "IXSCAN" (usa category_1_status_1)
```

Un `COLLSCAN` recorre documento por documento (costo lineal con el tamaño de la colección); un `IXSCAN` salta directo a los documentos que matchean usando la estructura del índice (B-tree), mucho más rápido a medida que crece la colección.

## 17. Populate

Ver sección 8. Se usa `populate('products.product')` con `select` acotado en `GET /api/carts/:cid`. Se evita populate anidado (no hace falta: `Product` no referencia a otra colección) y se evita traer el carrito entero sin `select` para no arrastrar campos innecesarios en la respuesta.

## 18. Postman

Colección en `postman/CAPTURE-TUC.postman_collection.json`, con variables `{{baseUrl}}`, `{{productId}}`, `{{cartId}}` y todos los endpoints de productos y carritos con body de ejemplo. Importala en Postman y completá `productId`/`cartId` con valores reales (los devuelve el propio `POST /api/products` / `POST /api/carts`).

## 19. Mejoras futuras

- Autenticación real para `/admin` (hoy es una ruta de demostración, sin login).
- Subida de imágenes (hoy `thumbnails` son URLs de texto).
- Tests automatizados (unitarios sobre `services`, e2e sobre las rutas).
- Búsqueda full-text por título/descripción con índice de texto.
- Historial de pedidos / checkout real (hoy el carrito no se convierte en una orden).

---

## GUÍA PARA DEFENDER EL PROYECTO

**¿Qué hace cada carpeta?**

- `config/`: lee `.env` (`env.js`) y conecta a Mongo (`db.js`). Es el único lugar que sabe leer variables de entorno.
- `models/`: define la forma de los datos en Mongo (`Product`, `Cart`) usando Mongoose.
- `dao/`: es la única capa que sabe *cómo* se guardan los datos (Mongo o archivos JSON). `factory.js` decide cuál usar.
- `services/`: la lógica de negocio ("¿hay stock?", "¿el precio es válido?", "¿cómo armo la paginación?"). No sabe nada de HTTP.
- `controllers/`: traducen HTTP a llamadas de service y arman la respuesta (`res.json(...)`, status codes).
- `routes/`: mapean URL + método HTTP → función de controller.
- `middlewares/`: funciones que se ejecutan antes/después de las rutas (logging, validar IDs, manejar errores).
- `sockets/`: configura Socket.io.
- `views/`: plantillas Handlebars que arman el HTML que ve el usuario.
- `public/`: CSS y JS que corren en el navegador del cliente (no en el servidor).

**¿Cómo entra una petición al backend?** El cliente pega a una URL (ej. `GET /api/products`). Express la matchea en `app.js` contra los routers montados (`/api/products` → `products.router.js`). El router ejecuta middlewares de validación si los hay, y llama al controller correspondiente. El controller llama al service, el service llama al DAO, el DAO habla con Mongo (o el archivo JSON), y la respuesta vuelve subiendo esa misma cadena hasta convertirse en JSON (o en una vista renderizada).

**¿Qué es una ruta / un controller / un service / el DAO?**
- **Ruta**: la "dirección" (URL + verbo HTTP) que dispara una función.
- **Controller**: agarra lo que llega por HTTP (`req.params`, `req.body`), pide el trabajo al service, y devuelve la respuesta HTTP (status + JSON).
- **Service**: hace el trabajo real — valida datos, decide si hay stock, arma la paginación. No sabe qué es `req` o `res`.
- **DAO**: el que efectivamente lee/escribe en la base de datos o en el archivo JSON. No sabe de reglas de negocio, solo hace CRUD.

**¿Cómo funciona Mongoose?** Es una librería que traduce entre objetos de JavaScript y documentos de MongoDB. Los `models` (`Product`, `Cart`) definen un *schema* (qué campos tiene, de qué tipo, si son requeridos) y Mongoose valida esos datos antes de guardarlos, además de dar métodos como `.find()`, `.findById()`, `.create()`.

**¿Cómo funciona MongoDB?** Es una base de datos NoSQL orientada a documentos: en vez de tablas con filas, tiene colecciones (`products`, `carts`) con documentos tipo JSON. No exige que todos los documentos tengan exactamente los mismos campos, aunque acá sí lo forzamos vía Mongoose para mantener consistencia.

**¿Qué es populate?** Cuando un documento (`Cart`) solo guarda el `_id` de otro documento (`Product`) como referencia, `populate` le dice a Mongoose "andá a buscar el documento completo de esa referencia y reemplazalo", en vez de tener que hacer dos consultas manuales.

**¿Qué es paginación?** En vez de devolver los 1000 productos de una sola vez, se devuelven de a "páginas" (ej. 10 por página), junto con metadatos (página actual, si hay página siguiente/anterior, total de páginas) para que el cliente pueda navegar.

**¿Qué es un middleware?** Una función que se ejecuta *en el medio* del camino entre la petición y la respuesta: puede loguear, validar, cortar la cadena con un error, o simplemente dejar pasar la petición al siguiente paso (`next()`).

**¿Cómo funciona Socket.io?** Mantiene una conexión abierta y bidireccional entre servidor y cliente (a diferencia de HTTP normal, que se cierra después de cada respuesta). El servidor puede "avisarle" al cliente en cualquier momento (`io.emit(...)`) sin que el cliente tenga que preguntar primero.

**¿Cómo funciona el panel admin?** Es una vista Handlebars (`/admin`) que lista los productos y tiene formularios. Esos formularios no envían el formulario tradicional de HTML: usan JavaScript (`public/js/admin.js`) para mandar la info por `fetch` a la misma API pública de productos (`POST`/`PUT`/`DELETE /api/products`). Así no hay dos implementaciones distintas del CRUD, solo una, reutilizada.

**¿Cómo se actualiza el catálogo en tiempo real?** Cada vez que el admin crea/edita/borra un producto, el controller emite `products:updated` por socket. Cualquier cliente que tenga abierta `/products` está escuchando ese evento (`public/js/catalog.js`) y, al recibirlo, vuelve a pedir el listado actualizado a la API y redibuja la grilla.

**¿Cómo funcionan las hojas extra?** Si el admin carga `features.extraPageCost` (mayor a 0) para un álbum, en `/products/:pid` aparece un input "Hojas extra" además del de cantidad, con el precio actualizándose en vivo (`public/js/cart.js`, función `initEstimatedTotal`). Al agregar al carrito, `extraPages` viaja en el body del `POST /api/carts/:cid/products/:pid` y queda guardado en esa línea del carrito. El precio final de esa línea (`unitPrice = price + extraPages * extraPageCost`, multiplicado por `quantity`) se calcula en `src/routes/views.router.js` al renderizar `/carts/:cid`.

**¿Por qué usamos FileSystem?** Es un requisito del curso (mostrar que sabemos persistir sin base de datos, usando el módulo `fs` de Node) y sirve como plan B si no hay conexión a Mongo disponible en algún momento de la demo. Se activa cambiando una sola variable de entorno (`PERSISTENCE=filesystem`), sin tocar una sola línea del resto del código.

**¿Por qué usamos MongoDB?** Porque el modelo de datos (álbumes con características variables, carritos que referencian productos) encaja bien con documentos JSON, y porque es el estándar que se enseña en el curso junto con Mongoose.

**¿Qué índices usamos y por qué?** Ver sección 16 del README. En resumen: `{category, status}` compuesto para el filtro más común del catálogo, y `price` para el ordenamiento.

**¿Qué pasa si MongoDB falla?** El servidor **no arranca**: `server.js` intenta conectar antes de levantar el puerto HTTP, y si falla, imprime el motivo exacto por consola y corta el proceso (`process.exit(1)`). Esto es intencional: preferimos un error claro en el arranque antes que un servidor "medio roto" que responda 500 en cada request. Si se quiere seguir trabajando sin Mongo, se cambia `PERSISTENCE=filesystem` en `.env`.

---

## POSIBLES PREGUNTAS DEL PROFESOR

1. **¿Por qué separaron controllers de services?**
   Para que la lógica de negocio (validaciones, reglas de stock) no dependa de Express. Si mañana cambiamos de framework HTTP, o agregamos una CLI o un cron job que también necesite crear productos, el service se reutiliza tal cual.

2. **¿Qué pasa si mando un `_id` distinto en el body de un `PUT /api/products/:pid`?**
   Se ignora: el DAO (`dao/mongo/products.dao.js` y `dao/filesystem/products.dao.js`) desestructura y descarta `_id` del payload antes de aplicar la actualización.

3. **¿Cómo garantizan que no se agregue más cantidad de la que hay en stock?**
   `carts.service.js` consulta el producto antes de agregar/actualizar cantidad y compara contra `product.stock`; si no alcanza, lanza un `ApiError(400, ...)`.

4. **¿Qué pasa si pido un producto con un ID que no existe?**
   El service lanza `ApiError(404, ...)`, que el `errorHandler` central convierte en una respuesta `404` con un mensaje claro.

5. **¿Y si el ID ni siquiera tiene formato válido de MongoDB?**
   El middleware `validateObjectId` (en `validators.js`) corta antes de llegar al service con un `400`, evitando que Mongoose tire una excepción interna menos clara.

6. **¿Por qué `features` es un subdocumento y no una colección aparte?**
   Porque no tiene identidad propia ni se reutiliza entre productos: cada álbum tiene sus propias características, siempre se leen junto con el producto, nunca se consultan solas. Una colección aparte solo agregaría un `populate` innecesario.

7. **¿Por qué el carrito referencia productos en vez de copiarlos?**
   Para que el precio/stock que ve el usuario en el carrito sea siempre el actual, no una foto vieja del momento en que se agregó. Ver sección 8.

8. **¿Qué ventaja tiene `mongoose-paginate-v2` sobre hacer `skip`/`limit` a mano?**
   Devuelve automáticamente todos los metadatos (`totalDocs`, `totalPages`, `hasNextPage`, etc.) con una sola consulta bien optimizada, evitando calcular esos valores a mano y cometer errores de borde (ej. página fuera de rango).

9. **¿Cómo decide el sistema si usar Mongo o FileSystem?**
   Al arrancar, `dao/factory.js` lee `PERSISTENCE` desde `.env` una única vez y exporta la implementación correspondiente. El resto de la app (`services`) siempre importa desde `factory.js`, nunca directo de `dao/mongo` o `dao/filesystem`.

10. **¿Qué pasa si dos personas agregan el mismo producto al carrito al mismo tiempo?**
    En modo Mongo, cada request hace su propio `findById` + `save()`; en un escenario de alta concurrencia podría haber una condición de carrera (el clásico "lost update"). Para este proyecto académico no se resolvió con transacciones porque el volumen de uso no lo requiere, pero quedó documentado como mejora futura.

11. **¿Por qué el admin no tiene login?**
    Fue una decisión consciente para mantener el foco del proyecto en el CRUD, la persistencia y los WebSockets (los temas pedidos por la consigna). Se documenta como mejora futura agregar autenticación.

12. **¿Qué es `populate` exactamente, a nivel de consulta?**
    Mongoose primero trae el documento `Cart` con los `ObjectId` de producto tal cual están guardados, y después hace una segunda consulta (`$in` sobre los IDs) a la colección `products` para traer los documentos completos y "pegarlos" en el resultado antes de devolverlo.

13. **¿Cómo se prueban los WebSockets en la presentación?**
    Abriendo `/products` en una pestaña y `/admin` en otra: al crear/editar/eliminar un álbum desde `/admin`, la pestaña de `/products` se actualiza sola, sin F5.

14. **¿Qué significa `IXSCAN` vs `COLLSCAN` en el `explain()`?**
    `COLLSCAN` = Mongo recorre *todos* los documentos de la colección uno por uno. `IXSCAN` = Mongo usa la estructura de árbol del índice para ir directo a los documentos que matchean, sin recorrer los demás. Ver evidencia real en la sección 16.

15. **¿Por qué eligieron ese orden en el índice compuesto `{category, status}`?**
    Porque `category` tiene muchos valores posibles (alta cardinalidad) y `status` solo dos (`true`/`false`). Poner primero el campo más selectivo hace que el índice descarte más documentos en el primer paso de la búsqueda.

16. **¿Qué pasa si `MONGO_URI` está vacía o mal escrita?**
    `db.js` valida explícitamente que exista antes de intentar conectar, y si falta tira un error propio y claro (no un error críptico de Mongoose). Si está mal escrita, Mongo devuelve su propio error (ej. `bad auth`), que se loguea completo en consola.

17. **¿Cómo evitan hardcodear credenciales?**
    Todo pasa por `.env` (ignorado por git) y `src/config/env.js`. `.env.example` solo tiene las claves, sin valores sensibles.

18. **¿Qué validaciones tiene el modelo `Product` a nivel de Mongoose, además de las del service?**
    Campos requeridos (`required: true`), tipos, `min: 0` en precio/stock/`extraPageCost`, `unique: true` en `code`. Son una segunda barrera además de las validaciones manuales en `services/products.service.js` (defensa en profundidad).

19. **¿Por qué usan `async/await` en vez de `.then()` encadenado?**
    Porque el código queda más lineal y fácil de leer, y el manejo de errores se centraliza en un solo `try/catch` por función en vez de un `.catch()` por cada promesa.

20. **¿Qué pasa si el servidor se cae mientras un cliente tiene el catálogo abierto?**
    Socket.io intenta reconectar automáticamente del lado del cliente; si el servidor vuelve a estar arriba, la conexión se restablece sola y el cliente vuelve a recibir eventos `products:updated` sin recargar la página manualmente.

21. **¿Por qué no metieron toda la lógica en el controller, como en proyectos más simples?**
    Porque mezclar HTTP con reglas de negocio hace que el código sea más difícil de testear y de reutilizar, y complica separar "qué hace la app" de "cómo se expone por HTTP". Es una decisión de arquitectura pensada para que se pueda explicar con claridad, no para complejizar innecesariamente.

22. **¿Por qué un producto no puede tener dos líneas distintas en el mismo carrito (por ejemplo, con 0 y con 3 hojas extra)?**
    Para no romper el contrato de la consigna, donde `DELETE`/`PUT /api/carts/:cid/products/:pid` identifican una línea del carrito únicamente por `:pid`. Si un mismo producto pudiera aparecer varias veces, esos endpoints dejarían de ser unívocos. Por eso, al re-agregar el mismo álbum con otra cantidad de hojas extra, se actualiza la línea existente en vez de crear una nueva.

23. **¿Por qué el modelo de `Product` no tiene `finish`, `orientation` ni `material` si la primera versión de la consigna los pedía?**
    Fue un pedido explícito de la dueña del emprendimiento real para simplificar el formulario de carga a lo que efectivamente usa el negocio (no vende variantes de "acabado" o "material"). `code` sí volvió a incorporarse porque la versión final de la consigna lo exige como campo obligatorio, único, generado por el negocio como SKU (ej. `FA-21X15-B`).
