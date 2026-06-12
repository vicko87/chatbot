const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '../lashbot_data.json');

function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ conversations: [], clients: {} }));
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function saveMessage(phone, role, content) {
  const db = loadDB();
  db.conversations.push({ phone, role, content, created_at: new Date().toISOString() });
  saveDB(db);
}

function getHistory(phone, limit = 10) {
  const db = loadDB();
  return db.conversations
    .filter(m => m.phone === phone)
    .slice(-limit);
}

function saveClient(phone, name) {
  const db = loadDB();
  db.clients[phone] = { name, updated_at: new Date().toISOString() };
  saveDB(db);
}

module.exports = { saveMessage, getHistory, saveClient };