const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true },
  used: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Invitation', invitationSchema);
