const dotenv = require('dotenv');
dotenv.config({ path: process.env.DOTENV_CONFIG_PATH || '.env' });

const required = ['MONGODB_URI'];
function validateEnvironment() {
  const missing = required.filter(key => !process.env[key]);
  if (missing.length) throw new Error(`Missing required environment variable(s): ${missing.join(', ')}`);
  if (!process.env.ADMIN_PASSWORD_HASH) throw new Error('Missing ADMIN_PASSWORD_HASH.');
  if (!process.env.ADMIN_JWT_SECRET) throw new Error('Missing ADMIN_JWT_SECRET.');
}
const configuredClientUrls = (process.env.CLIENT_URL || '').split(',').map(url => url.trim().replace(/\/$/, '')).filter(Boolean);
const developmentClientUrls = process.env.NODE_ENV === 'production' ? [] : ['http://localhost:3000'];
const clientUrls = [...new Set([...configuredClientUrls, ...developmentClientUrls])];
const blogSiteUrl = (process.env.BLOG_SITE_URL || 'http://localhost:5000').replace(/\/$/, '');
module.exports = { port: Number(process.env.PORT) || 5000, mongoUri: process.env.MONGODB_URI, clientUrl: clientUrls[0], clientUrls, blogSiteUrl, adminPasswordHash: process.env.ADMIN_PASSWORD_HASH, adminJwtSecret: process.env.ADMIN_JWT_SECRET, storage: { endpoint: process.env.S3_ENDPOINT, region: process.env.S3_REGION || 'auto', bucket: process.env.S3_BUCKET, accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY, publicBaseUrl: process.env.S3_PUBLIC_BASE_URL?.replace(/\/$/, '') }, validateEnvironment };
