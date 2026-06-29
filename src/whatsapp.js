const { Client, LocalAuth, MessageTypes } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const { askGemini, transcribeAudio } = require('./ai');
const { saveMessage, getHistory, getClient } = require('./database');
const { escalateToOwner } = require('./escalation');
const Salon = require('./models/Salon');

let BOT_SALON_ID = null;
async function loadBotSalon() {
  const salon = await Salon.findOne();
  if (salon) {
    BOT_SALON_ID = salon._id;
    console.log(` Salon cargado: ${salon.name} (${BOT_SALON_ID})`);
  } else {
    console.warn('⚠️  No hay salón en la base de datos. El bot no guardará conversaciones.');
  }
}

// Horario del salón: Lunes(1)-Sábado(6), 10:00-20:00 hora Barcelona
function isWithinBusinessHours() {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
  const day = now.getDay(); // 0=domingo, 1=lunes...
  const hour = now.getHours();
  const minute = now.getMinutes();
  const timeNum = hour * 100 + minute;
  return day >= 1 && day <= 6 && timeNum >= 1000 && timeNum < 2000;
}

function getOutOfHoursMessage(lang) {
  if (lang === 'en') return "Hello! 🌙 We're currently closed. Our hours are Monday to Saturday, 10:00–20:00. We'll reply as soon as we open! 😊";
  if (lang === 'ru') return "Привет! 🌙 Мы сейчас закрыты. Работаем с понедельника по субботу с 10:00 до 20:00. Ответим как только откроемся! 😊";
  return "¡Hola! 🌙 Ahora estamos cerrados. Nuestro horario es de lunes a sábado de 10:00 a 20:00. ¡Te respondemos en cuanto abramos! 😊";
}

const OWNER_PHONE = process.env.OWNER_PHONE;
// Números permitidos: solo estos números recibirán respuesta del bot
// Si está vacío, responde a todos
const ALLOWED_NUMBERS = (process.env.ALLOWED_NUMBERS || '').split(',').filter(Boolean);

const pendingEscalations = new Map();
let botReadyTime = null;

function startWhatsApp() {
    const client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {args: ['--no-sandbox']}
    });

    client.on('qr', qr => {
        console.log('Escanea este código QR con tu WhatsApp:');
        qrcode.generate(qr, {small: true});
    });

    client.on('ready', async () => {
        botReadyTime = Date.now();
        console.log('✅ Lashbot conectado y listo!');
        await loadBotSalon();
    });

    client.on('message', async msg => {
        const from = msg.from;
        const text = msg.body;

        if (msg.fromMe) return;
        if (from.includes('@g.us')) return;
        if (from === 'status@broadcast') return;
        // Ignorar mensajes anteriores al arranque del bot
        if (botReadyTime && msg.timestamp * 1000 < botReadyTime) return;
        // Solo responder a números permitidos (si la lista está configurada)
        if (ALLOWED_NUMBERS.length > 0 && !ALLOWED_NUMBERS.includes(from) && from !== OWNER_PHONE) {
            console.log(`⏭️ Ignorado (no en lista): ${from}`);
            return;
        }

        //Si la dueña responde a una escalación pendiente, enviar su respuesta al cliente
        if (from === OWNER_PHONE && pendingEscalations.size > 0) {
            const recent = [...pendingEscalations.entries()].find(([_, data]) =>
                (Date.now() - data.timestamp) < 30 * 60 * 1000
            );
            if (recent) {
                const [clientPhone] = recent;
                await client.sendMessage(clientPhone, text);
                if (BOT_SALON_ID) await saveMessage(BOT_SALON_ID, clientPhone, 'assistant', text);
                pendingEscalations.delete(clientPhone);
                console.log(`✅ Respuesta enviada al cliente ${clientPhone}`);
                return;
            }
        }

        // Respuesta automática fuera de horario (solo si no es la dueña)
        if (from !== OWNER_PHONE && !isWithinBusinessHours()) {
            const lang = /[а-яёА-ЯЁ]/.test(text) ? 'ru' : /\b(hi|hello|how|what|i |my |can |please)\b/i.test(text) ? 'en' : 'es';
            await client.sendMessage(from, getOutOfHoursMessage(lang));
            if (BOT_SALON_ID) await saveMessage(BOT_SALON_ID, from, 'assistant', '[fuera de horario]');
            console.log(`🌙 [${from}]: fuera de horario, respuesta automática`);
            return;
        }

        // Transcribir audio si es mensaje de voz
        let userText = text;
        if (msg.type === MessageTypes.VOICE || msg.type === MessageTypes.AUDIO) {
            console.log(`🎤 [${from}]: mensaje de voz recibido`);
            try {
                const media = await msg.downloadMedia();
                const audioPath = path.join(__dirname, '../temp_audio.ogg');
                fs.writeFileSync(audioPath, Buffer.from(media.data, 'base64'));
                userText = await transcribeAudio(audioPath);
                fs.unlinkSync(audioPath);
                console.log(`🎤 Transcripción: ${userText}`);
            } catch (audioErr) {
                console.error('Error transcribiendo audio:', audioErr.message);
                await client.sendMessage(from, 'Lo siento, no pude escuchar el audio. ¿Puedes escribirme tu pregunta? 😊');
                return;
            }
        }

        console.log(`📩 [${from}]: ${userText}`);
        if (BOT_SALON_ID) await saveMessage(BOT_SALON_ID, from, 'user', userText);

    try {
        const history = BOT_SALON_ID ? await getHistory(BOT_SALON_ID, from) : [];
        const clientInfo = BOT_SALON_ID ? await getClient(BOT_SALON_ID, from) : null;
        const isFirstMessage = history.length <= 1;

        // Saludo fijo en el primer mensaje — sin llamar a la IA
        const isSimpleGreeting = /^(hola|hi|hello|привет|buenos días|buenas|hey)\s*[!?.]*$/i.test(userText.trim());
        if (isFirstMessage && isSimpleGreeting) {
            const lang = /[а-яёА-ЯЁ]/.test(userText) ? 'ru' : /^(hi|hello|hey)/i.test(userText) ? 'en' : 'es';
            const greeting = lang === 'en'
                ? 'Hello! 😊 Welcome to Lash Angels. How can I help you today?'
                : lang === 'ru'
                ? 'Привет! 😊 Добро пожаловать в Lash Angels. Чем могу помочь?'
                : 'Hola 😊, bienvenida a Lash Angels. ¿En qué puedo ayudarte hoy?';
            await client.sendMessage(from, greeting);
            if (BOT_SALON_ID) await saveMessage(BOT_SALON_ID, from, 'assistant', greeting);
            return;
        }

        const response = await askGemini(userText, history, isFirstMessage, clientInfo);

        //Si la respuesta sugiere escalar, enviar a la dueña
        if (response.startsWith('ESCALAR:')) {
            const question = response.replace('ESCALAR:', '').trim();
            await client.sendMessage(from, 'Un momento, te confirmo enseguida 🙏');
            await escalateToOwner(client, OWNER_PHONE, from, userText, question);
            pendingEscalations.set(from, { timestamp: Date.now() });
            if (BOT_SALON_ID) await saveMessage(BOT_SALON_ID, from, 'assistant', 'Un momento, te confirmo enseguida 🙏');
        } else {
            await client.sendMessage(from, response);
            if (BOT_SALON_ID) await saveMessage(BOT_SALON_ID, from, 'assistant', response);
        }
    } catch (err) {
      console.error("Error:", err.message);
      await client.sendMessage(from, "Lo siento, ha habido un error técnico. Por favor intenta de nuevo en un momento.");
    }
  });

  client.initialize();
}

module.exports = { startWhatsApp };