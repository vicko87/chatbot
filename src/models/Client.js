const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true },
  phone: { type: String, required: true },
  name: { type: String, default: null },
  lastService: { type: String, default: null },
  visitCount: { type: Number, default: 0 },
  firstVisit: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

clientSchema.index({ salonId: 1, phone: 1 }, { unique: true });

module.exports = mongoose.model('Client', clientSchema);
