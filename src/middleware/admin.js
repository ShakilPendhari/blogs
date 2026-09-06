const { adminJwtSecret } = require('../config');
const { hasSession } = require('./authSession');
module.exports = (req, res, next) => {
  const bearer = req.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!hasSession(bearer, adminJwtSecret)) return res.status(401).json({ error: 'Unauthorized' });
  next();
};
