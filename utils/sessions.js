const crypto = require('crypto');

const sessions = new Map();

function createSession(userData) {
    const sessionId = crypto.randomBytes(16).toString('hex');
    sessions.set(sessionId, userData);
    return sessionId;
}

function getSession(sessionId) {
    return sessions.get(sessionId);
}

function deleteSession(sessionId) {
    sessions.delete(sessionId);
}

function parseCookies(cookieHeader) {
    const cookies = {};
    if (!cookieHeader) return cookies;

    cookieHeader.split(';').forEach(cookie => {
        const [key, value] = cookie.split('=');
        if (key && value) {
            cookies[key.trim()] = decodeURIComponent(value.trim());
        }
    });
    return cookies;
}

module.exports = {
    createSession,
    getSession,
    deleteSession,
    parseCookies
}