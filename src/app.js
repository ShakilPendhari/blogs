const express = require('express');
require('node:dns/promises').setServers(["1.1.1.1", "8.8.8.8"]);
const path = require('node:path');
const cors = require('cors');
const { clientUrls, adminPasswordHash, adminJwtSecret } = require('./config');
const { createSession, destroySession, verifyPassword } = require('./middleware/authSession');
const blogRoutes = require('./routes/blogs');
const errorHandler = require('./middleware/errorHandler');
const app = express();
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(cors({ origin: (origin, callback) => callback(null, !origin || clientUrls.includes(origin)), methods: ['GET', 'POST', 'PUT', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json({ limit: '1mb' }));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../public/blogs.html')));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.post('/api/auth/login', (req, res) => {
    if (!adminPasswordHash || !verifyPassword(req.body?.password, adminPasswordHash)) return res.status(401).json({ error: 'Invalid password.' });
    res.json({ token: createSession(adminJwtSecret), expiresIn: '8h' });
});
app.post('/api/auth/logout', (req, res) => {
    const token = req.get('authorization')?.replace(/^Bearer\s+/i, '');
    destroySession(token);
    res.status(204).end();
});
app.use('/api/blogs', blogRoutes);
app.get('/:id', (req, res) => res.sendFile(path.join(__dirname, '../public/blog.html')));
app.use((req, res) => res.status(404).json({ error: 'Route not found.' }));
app.use(errorHandler);
module.exports = app;
