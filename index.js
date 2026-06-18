require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');


const {startWhatsApp} = require('./src/whatsapp');
const { loadDB } = require('./src/database');
const { generateToken, verifyToken } = require('./src/auth');

const AVAILABILITY_FILE = path.join(__dirname, "availability.json");

const app = express();
app.use(cors());
app.use(express.json());

// POST /auth/login
app.post('/auth/login', (req, res) => {
  const { user, pass } = req.body;
  if (user !== process.env.ADMIN_USER || pass !== process.env.ADMIN_PASS) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }
  res.json({ token: generateToken() });
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