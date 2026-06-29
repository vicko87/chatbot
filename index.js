require('dotenv').config();
const { connectDB } = require('./src/db');
const express = require('express');
const cors = require('cors');
const path = require('path');


const {startWhatsApp} = require('./src/whatsapp');
const {getUser, saveUser, getInvitation, saveInvitation, markInvitationUsed} = require('./src/database');
const { generateToken, verifyToken, hashPassword, comparePassword } = require('./src/auth');
const Availability = require('./src/models/Availability');
const Client = require('./src/models/Client');
const Conversation = require('./src/models/Conversation');
const Salon = require('./src/models/Salon');



const app = express();
app.use(cors());
app.use(express.json());

// POST /auth/login
app.post('/auth/login', async (req, res) => {
  try {
    const { user, pass } = req.body;
    if (!user || !pass) return res.status(400).json({ error: 'Faltan credenciales' });
    const found = await getUser(user);
    if (!found) return res.status(401).json({ error: 'Credenciales incorrectas' });
    const valid = await comparePassword(pass, found.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Credenciales incorrectas' });
    res.json({ token: generateToken(found.username, found.salonId) });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /auth/register
app.post('/auth/register', async (req, res) => {
  try {
    const { user, pass, inviteCode } = req.body;
    if (!user || !pass || !inviteCode) return res.status(400).json({ error: 'Faltan campos' });
    const inv = await getInvitation(inviteCode);
    if (!inv) return res.status(400).json({ error: 'Código de invitación inválido o ya usado' });
    if (await getUser(user)) return res.status(400).json({ error: 'Usuario ya existe' });
    const salon = await Salon.create({ name: user });
    const passwordHash = await hashPassword(pass);
    await saveUser(user, passwordHash, salon._id);
    await markInvitationUsed(inviteCode);
    res.json({ ok: true });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /auth/invite  ← solo tú puedes usarlo con MASTER_KEY
app.post('/auth/invite', async (req, res) => {
  try {
    const { masterKey } = req.body;
    if (masterKey !== process.env.MASTER_KEY) return res.status(403).json({ error: 'No autorizado' });
    const code = 'INV-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    await saveInvitation(code, null);
    res.json({ code });
  } catch (err) {
    console.error('Invite error:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


app.get('/availability', verifyToken, async (req, res) => {
 const docs = await Availability.find({ salonId: req.salonId });
  const result = {};
  docs.forEach(d => { result[d.date] = d.slots; });
  res.json(result);
});

app.post('/availability', verifyToken, async (req, res) => {
  const { date, slots } = req.body;
  await Availability.findOneAndUpdate(
    { salonId: req.salonId, date },
    { $set: { slots } },
    { upsert: true }
  );
    res.json({ ok: true });
});

app.delete('/availability/:date/:time', verifyToken, async (req, res) => {
    const { date, time } = req.params;
    const doc = await Availability.findOne({ salonId: req.salonId, date });
    if (doc) {
        doc.slots = doc.slots.filter(s => s !== time);
        if (doc.slots.length === 0) await doc.deleteOne();
        else await doc.save();
    }
    res.json({ ok: true });
});
 //Clients
 app.get('/clients', verifyToken, async (req, res) => {
    const clients = await Client.find({ salonId: req.salonId });
  res.json(clients);
 });

 app.get('/clients/:phone', verifyToken, async (req, res) => {
   const client = await Client.findOne({ salonId: req.salonId, phone: req.params.phone });
   if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
   res.json(client);
 });

    app.get('/clients/conversations/:phone', verifyToken, async (req, res) => {
    const msgs = await Conversation.find({ salonId: req.salonId, phone: req.params.phone });
    res.json(msgs);
    });

//start server
const PORT = process.env.PORT || 3000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`API corriendo en http://localhost:${PORT}`));
  console.log('Iniciando lashbot para Lash Angels...');
  startWhatsApp();
});