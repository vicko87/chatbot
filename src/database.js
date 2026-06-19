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

function saveClient(phone, name, lastService = null) {
  const db = loadDB();
  const existing = db.clients[phone] || {};
  db.clients[phone] = {
    name: name || existing.name || null,
    lastService: lastService || existing.lastService || null,
    visitCount: (existing.visitCount || 0) + (lastService ? 1 : 0),
    firstVisit: existing.firstVisit || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  saveDB(db);
}

function getClient(phone) {
  const db = loadDB();
  return db.clients[phone] || null;
}

function getUser(username) {
  const db = loadDB();
  return (db.users || []).find(u => u.username === username) || null;
}

function saveUser(username, passwordHash) {
  const db = loadDB();
  if (!db.users) db.users = [];
  db.users.push({ username, passwordHash, created_at: new Date().toISOString() });
  saveDB(db);
}

function getInvitation(code) {
  const db = loadDB();
  return (db.invitations || []).find(i => i.code === code && !i.used) || null;
}

function saveInvitation(code) {
  const db = loadDB();
  if (!db.invitations) db.invitations = [];
  db.invitations.push({ code, used: false, created_at: new Date().toISOString() });
  saveDB(db);
}

function markInvitationUsed(code) {
  const db = loadDB();
  const inv = (db.invitations || []).find(i => i.code === code);
  if (inv) inv.used = true;
  saveDB(db);
}

module.exports = { saveMessage, getHistory, saveClient, getClient, loadDB, getUser, saveUser, getInvitation, saveInvitation, markInvitationUsed };