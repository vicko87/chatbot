require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');


const {startWhatsApp} = require('./src/whatsapp');
const { loadDB, getUser, saveUser, getInvitation, saveInvitation, markInvitationUsed } = require('./src/database');
const { generateToken, verifyToken, hashPassword, comparePassword } = require('./src/auth');

const AVAILABILITY_FILE = path.join(__dirname, "availability.json");

const app = express();
app.use(cors());
app.use(express.json());

// POST /auth/login
app.post('/auth/login', async (req, res) => {
  const { user, pass } = req.body;
  if (!user || !pass) return res.status(400).json({ error: 'Faltan credenciales' });
  const found = getUser(user);
  if (!found) return res.status(401).json({ error: 'Credenciales incorrectas' });
  const valid = await comparePassword(pass, found.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Credenciales incorrectas' });
  res.json({ token: generateToken(user) });
});

// POST /auth/register
app.post('/auth/register', async (req, res) => {
  const { user, pass, inviteCode } = req.body;
  if (!user || !pass || !inviteCode) return res.status(400).json({ error: 'Faltan campos' });
  const inv = getInvitation(inviteCode);
  if (!inv) return res.status(400).json({ error: 'Código de invitación inválido o ya usado' });
  if (getUser(user)) return res.status(400).json({ error: 'Usuario ya existe' });
  const passwordHash = await hashPassword(pass);
  saveUser(user, passwordHash);
  markInvitationUsed(inviteCode);
  res.json({ ok: true });
});

// POST /auth/invite  ← solo tú puedes usarlo con MASTER_KEY
app.post('/auth/invite', (req, res) => {
  const { masterKey } = req.body;
  if (masterKey !== process.env.MASTER_KEY) return res.status(403).json({ error: 'No autorizado' });
  const code = 'INV-' + Math.random().toString(36).substring(2, 10).toUpperCase();
  saveInvitation(code);
  res.json({ code });
});

app.get('/availability', verifyToken, (req, res) => {
    const data = JSON.parse(fs.readFileSync(AVAILABILITY_FILE, 'utf8'));
    res.json(data);
});

app.post('/availability', verifyToken, (req, res) => {
    const { date, slots } = req.body;
    const data = JSON.parse(fs.readFileSync(AVAILABILITY_FILE, 'utf8'));
    data[date] = slots;
    fs.writeFileSync(AVAILABILITY_FILE, JSON.stringify(data, null, 2));
    res.json({ ok: true });
});

app.delete('/availability/:date/:time', verifyToken, (req, res) => {
    const { date, time } = req.params;
    const data = JSON.parse(fs.readFileSync(AVAILABILITY_FILE, 'utf8'));
    if (data[date]) {
        data[date] = data[date].filter(s => s !== time);
        if (data[date].length === 0) delete data[date];
        fs.writeFileSync(AVAILABILITY_FILE, JSON.stringify(data, null, 2));
    }
    res.json({ ok: true });
});
 //Clients
 app.get('/clients', verifyToken, (req, res) => {
    const db = JSON.parse(fs.readFileSync(path.join(__dirname, 'lashbot_data.json'), 'utf8'));
    res.json(db.clients || {});
 });

 app.get('/clients/:phone', verifyToken, (req, res) => {
    const db = JSON.parse(fs.readFileSync(path.join(__dirname, 'lashbot_data.json'), 'utf8'));
    const client = db.clients?.[req.params.phone];
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(client);
    });

    app.get('/clients/conversations/:phone', verifyToken, (req, res) => {
    const db = JSON.parse(fs.readFileSync(path.join(__dirname, 'lashbot_data.json'), 'utf8'));
    const msgs = (db.conversations || []).filter(m => m.phone === req.params.phone);
    res.json(msgs);
    });

//start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API corriendo en http://localhost:${PORT}`))

console.log('Iniciando lashbot para Lash Angels...');
startWhatsApp();