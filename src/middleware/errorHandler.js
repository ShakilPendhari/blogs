module.exports = (err, req, res, next) => {
  console.error(err);
  if (err.name === 'ValidationError') return res.status(400).json({ error: 'Validation failed', details: Object.values(err.errors).map(item => item.message) });
  if (err.code === 11000) return res.status(409).json({ error: 'A blog with this slug already exists.' });
  if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid resource identifier.' });
  res.status(err.status || 500).json({ error: err.message || 'Internal server error.' });
};
