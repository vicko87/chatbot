const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true },
  date: { type: String, required: true }, // formato YYYY-MM-DD
  slots: [{ type: String }] // ["10:00", "12:00", ...]
});

availabilitySchema.index({ salonId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Availability', availabilitySchema);
