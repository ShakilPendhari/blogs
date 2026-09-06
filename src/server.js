const mongoose = require('mongoose');
const app = require('./app');
const { port, mongoUri, validateEnvironment } = require('./config');

async function start() {
  validateEnvironment();
  await mongoose.connect(mongoUri);
  console.log('MongoDB connected');
  app.listen(port, () => console.log(`API listening on port ${port}`));
}
start().catch(error => { console.error('Unable to start server:', error.message); process.exit(1); });
