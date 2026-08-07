const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const { engine } = require('express-handlebars');

const logger = require('./middlewares/logger');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');

const productsRouter = require('./routes/products.router');
const cartsRouter = require('./routes/carts.router');
const viewsRouter = require('./routes/views.router');

const app = express();

app.engine(
  'handlebars',
  engine({
    defaultLayout: 'main',
    partialsDir: path.join(__dirname, 'views', 'partials'),
    helpers: {
      eq: (a, b) => a === b,
      formatPrice: (value) =>
        new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value || 0),
      multiply: (a, b) => a * b
    }
  })
);
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(logger);

app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);
app.use('/', viewsRouter);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
