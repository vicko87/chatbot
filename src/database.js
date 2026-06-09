const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'lashbot.db'));

// Crear tabla de conversaciones si no existe   
bd.exec(`
CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS clients (
phone TEXT PRIMARY KEY,
name TEXT,
last_servise TEXT,
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

function saveMessage(phone, role, content) {
    db.prepare('INSERT INTO conversations (phone, role, content) VALUES (?, ?, ?)').run(phone, role, content);
}
function getHistory(phone, limit = 10) {
    return db.prepare
    ('SELECT role, content FROM conversations WHERE phone = ? ORDER BY created_at DESC LIMIT ?').all(phone, limit).reverse();

}
function saveClient(phone, name) {
    db.prepare(
        'INSERT INTO clients (phone, name) VALUES (?, ?) ON CONFLICT(phone) DO UPDATE SET name = excluded.name, updated_at = CURRENT_TIMESTAMP'
    ).run(phone, name);
}


module.exports = { saveMessage, getHistory, saveClient };