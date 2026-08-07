const http = require('http');
const app = require('./app');
const config = require('./config/env');
const { connectMongo } = require('./config/db');
const initSockets = require('./sockets');
const { persistence } = require('./dao/factory');

async function startServer() {
  try {
    if (persistence === 'mongo') {
      await connectMongo();
    } else {
      console.log('[Persistencia] Modo FileSystem activo: no se requiere conexión a MongoDB');
    }

    const httpServer = http.createServer(app);
    const io = initSockets(httpServer);
    app.set('io', io);

    httpServer.listen(config.port, () => {
      console.log(`[Server] CAPTURE TUC corriendo en http://localhost:${config.port}`);
    });
  } catch (error) {
    console.error('[Server] No se pudo iniciar el servidor. Motivo:');
    console.error(error.message);
    process.exit(1);
  }
}

startServer();
