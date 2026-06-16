const fs = require("fs");
const path = require("path");

const AVAILABILITY_FILE = path.join(__dirname, "../availability.json");

const DAY_NAMES_ES = {
  lunes: 1, martes: 2, miercoles: 3, miércoles: 3,
  jueves: 4, viernes: 5, sabado: 6, sábado: 6
};

function getNextDateForDay(dayName) {
  const dayNum = DAY_NAMES_ES[dayName.toLowerCase().trim()];
  if (dayNum === undefined) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentDay = today.getDay(); // 0=Dom, 1=Lun...

  let daysAhead = dayNum - currentDay;
  if (daysAhead <= 0) daysAhead += 7;

  const result = new Date(today);
  result.setDate(today.getDate() + daysAhead);
  return result.toISOString().split("T")[0];
}

function parseDate(dateInput) {
  if (!dateInput) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) return dateInput;
  return getNextDateForDay(dateInput);
}

function loadAvailability() {
  try {
    return JSON.parse(fs.readFileSync(AVAILABILITY_FILE, "utf8"));
  } catch {
    return {};
  }
}

function checkAvailability(date, time) {
  const dateStr = parseDate(date);
  if (!dateStr) return { available: false, error: "Fecha no reconocida: " + date };

  const slots = loadAvailability();
  const daySlots = slots[dateStr] || [];
  const available = daySlots.includes(time);

  return { available, date: dateStr, time, otherSlots: daySlots.filter(s => s !== time) };
}

function getAvailableSlots(date) {
  const dateStr = parseDate(date);
  if (!dateStr) return { error: "Fecha no reconocida: " + date, slots: [] };

  const slots = loadAvailability();
  const daySlots = slots[dateStr] || [];

  return { date: dateStr, slots: daySlots, hasSlots: daySlots.length > 0 };
}

module.exports = { checkAvailability, getAvailableSlots };
