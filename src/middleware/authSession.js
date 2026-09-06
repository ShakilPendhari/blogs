const bcrypt = require('bcryptjs');
const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');

const SALT_ROUNDS = 12;
const revokedTokens = new Set();

function hashPassword(password) {
    return bcrypt.hashSync(password, SALT_ROUNDS);
}

function verifyPassword(password, storedHash) {
    return Boolean(password && storedHash && bcrypt.compareSync(password, storedHash));
}

function createSession(secret) {
    return jwt.sign({ role: 'admin', nonce: crypto.randomUUID() }, secret, { expiresIn: '8h' });
}

function destroySession(token) {
    if (token) revokedTokens.add(token);
}

function hasSession(token, secret) {
    if (!token || revokedTokens.has(token)) return false;
    try { jwt.verify(token, secret); return true; } catch { return false; }
}

module.exports = { hashPassword, verifyPassword, createSession, destroySession, hasSession };
