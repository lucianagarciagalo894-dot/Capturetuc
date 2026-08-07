const dns = require('dns');
const mongoose = require('mongoose');
const config = require('./env');

// Algunas redes (VPN/routers hogareños) configuran un DNS local en 127.0.0.1
// que no resuelve correctamente los registros SRV que usa "mongodb+srv://".
// Apuntamos la resolución DNS de este proceso a un servidor público solo
// para evitar ese problema puntual; no modifica la configuración de red del
// sistema ni la cadena de conexión del usuario.
if (dns.getServers().some((server) => server === '127.0.0.1' || server === '::1')) {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
}

async function connectMongo() {
  if (!config.mongoUri) {
    throw new Error(
      'MONGO_URI no está definida. Completá el archivo .env con tu cadena de conexión de MongoDB Atlas (ver .env.example).'
    );
  }

  try {
    await mongoose.connect(config.mongoUri, {
      dbName: config.dbName
    });
    console.log(`[MongoDB] Conectado correctamente a la base de datos "${config.dbName}"`);
  } catch (error) {
    console.error('[MongoDB] Error al conectar con MongoDB Atlas:');
    console.error(error.message);
    throw error;
  }
}

module.exports = { connectMongo };
