const jwt = require('jsonwebtoken');

function generateToken() {
    return jwt.sign({ admin: true }, process.env.JWT_SECRET, { expiresIn: '8h' });

}

function verifyToken(req, res, next) {
    const header = req.headers['authorization'];
    const token = header && header.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No autorizado' });

    try {
        jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        return res.status(403).json({ error: 'Token inválido' });
    }
}

module.exports = { generateToken, verifyToken };