const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

const config = {
  port: process.env.PORT || 8080,
  persistence: process.env.PERSISTENCE || 'mongo',
  mongoUri: process.env.MONGO_URI || '',
  dbName: process.env.DB_NAME || 'ecommerce',
  adminPath: process.env.ADMIN_PATH || 'admin'
};

module.exports = config;
