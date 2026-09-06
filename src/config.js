const dotenv = require('dotenv');
dotenv.config({ path: process.env.DOTENV_CONFIG_PATH || '.env' });

const required = ['MONGODB_URI'];
function validateEnvironment() {
  const missing = required.filter(key => !process.env[key]);
  if (missing.length) throw new Error(`Missing required environment variable(s): ${missing.join(', ')}`);
  if (!process.env.ADMIN_PASSWORD_HASH) throw new Error('Missing ADMIN_PASSWORD_HASH.');
  if (!process.env.ADMIN_JWT_SECRET) throw new Error('Missing ADMIN_JWT_SECRET.');
}
module.exports = { port: Number(process.env.PORT) || 5000, mongoUri: process.env.MONGODB_URI, clientUrl: process.env.CLIENT_URL || 'http://localhost:3000', adminPasswordHash: process.env.ADMIN_PASSWORD_HASH, adminJwtSecret: process.env.ADMIN_JWT_SECRET, validateEnvironment };
