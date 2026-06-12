const { Client, LocalAuth, MessageTypes } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const { askGemini, transcribeAudio } = require('./ai');
const { saveMessage, getHistory } = require('./database');
const { escalateToOwner } = require('./escalation');

const OWNER_PHONE = process.env.OWNER_PHONE;
// Números permitidos: solo estos números recibirán respuesta del bot
// Si está vacío, responde a todos
const ALLOWED_NUMBERS = (process.env.ALLOWED_NUMBERS || '').split(',').filter(Boolean);

const pendingEscalations = new Map();

function startWhatsApp() {
    const client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {args: ['--no-sandbox']}
    });

    client.on('qr', qr => {
        console.log('Escanea este código QR con tu WhatsApp:');
        qrcode.generate(qr, {small: true});
    });

    client.on('ready', () => {
        console.log('✅ Lashbot conectado y listo!');
    });

    client.on('message', async msg => {
        const from = msg.from;
        const text = msg.body;

        if (msg.fromMe) return;
        if (from.includes('@g.us')) return;
        // Solo responder a números permitidos (si la lista está configurada)
        if (ALLOWED_NUMBERS.length > 0 && !ALLOWED_NUMBERS.includes(from) && from !== OWNER_PHONE) {
            console.log(`⏭️ Ignorado (no en lista): ${from}`);
            return;
        }

        //Si la dueña responde a una escalación pendiente, enviar su respuesta al cliente
        if (from === OWNER_PHONE && pendingEscalations.size > 0) {
            //Buscr si hay una escalacion pendiente reciente(últimos 30 minutos)
            const recent = [...pendingEscalations.entries()].find(([_, data]) => 
                (Date.now() - data.timestamp) < 30 * 60 * 1000
        );
        console.log(recent);
        if (recent) {
            const [clientPhone, data] = recent;
            await client.sendMessage(clientPhone, text);
            saveMessage(clientPhone, 'assistant', text);
            pendingEscalations.delete(clientPhone);
            console.log(`✅ Respuesta enviada al cliente ${clientPhone}`);
            return;
        }
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
    saveMessage(from, "user", userText);

    try {
        const history = getHistory(from);
        const isFirstMessage = history.length <= 1;
        const response = await askGemini(userText, history, isFirstMessage);

        //Si la respuesta sugiere escalar, enviar a la dueña
        if (response.startsWith("ESCALAR:")) {
            const question = response.replace("ESCALAR:", "").trim();
        await client.sendMessage(from, "Un momento, te confirmo enseguida 🙏");
        await escalateToOwner(client, OWNER_PHONE, from, text, question);
        pendingEscalations.set(from, { timestamp: Date.now() });
        saveMessage(from, "assistant", "Un momento, te confirmo enseguida 🙏");
      } else {
        await client.sendMessage(from, response);
        saveMessage(from, "assistant", response);
      }
    } catch (err) {
      console.error("Error:", err.message);
      await client.sendMessage(from, "Lo siento, ha habido un error técnico. Por favor intenta de nuevo en un momento.");
    }
  });

  client.initialize();
}

module.exports = { startWhatsApp };