const mongoose = require('mongoose');

const salonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  whatsappNumber: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Salon', salonSchema);
