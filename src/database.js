const Conversation = require('./models/Conversation'); 
const client = require('./models/Client');
const User = require('./models/User');
const Invitation = require('./models/Invitation');

// ─── MESSAGES
async function saveMessage(salonId, phone, role, content) {
   await Conversation.create({ salonId, phone, role, content });
}

async function getHistory(salonId, phone, limit = 10) {
    return await Conversation.find({ salonId, phone })
        .sort({ createdAt: -1 })
        .limit(limit)
        .exec();
}

// ─── CLIENTS 
async function saveClient(salonId, phone, name, lastService = null) {
  await client.findOneAndUpdate(
    { salonId, phone },
    { $set: { name, lastService, updatedAt: new Date() }, 
    $setOnInsert: { firstVisit: new Date() },
    $inc: { visitCount: lastService} },
    { upsert: true }
  );
}

async function getClient(salonId, phone) {
  return await client.findOne({ salonId, phone });
}

// ─── USERS 
async function getUser(username) {
  return User.findOne({ username });
}

async function saveUser(username, passwordHash, salonId) {
  return User.create({ username, passwordHash, salonId });
}

// ─── INVITATIONS 
async function getInvitation(code) {
  return Invitation.findOne({ code, used: false });
}

async function saveInvitation(code, salonId) {
  return Invitation.create({ code, salonId });
}

async function markInvitationUsed(code) {
  await Invitation.findOneAndUpdate({ code }, { $set: { used: true } });
}

module.exports = {
  saveMessage,
  getHistory,
  saveClient,
  getClient,
  getUser,
  saveUser,
  getInvitation,
  saveInvitation,
  markInvitationUsed
};





