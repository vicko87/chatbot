const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { askGemini } = require('./ai');
const { saveMessage, getHistory } = require('./database');
const{ escalateToOwner } = require('./escalation');

const OWNER_PHONE = process.env.OWNER_PHONE; // Número de la dueña para escalaciones

//Mapa temporal para rastrear qué cliente está a la espera de respuesta de la dueña
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

        // Ignorar mensaje del propio bot
        if (msg.fromMe) return;
        //Ignorar grupos
        if (from.includes('@g.us')) return;

        //Si la dueña responde a una escalación pendiente, enviar su respuesta al cliente
        if (from === OWNER_PHONE && pendingEscalations.size > 0) {
            //Buscr si hay una escalacion pendiente reciente(últimos 30 minutos)
            const recent = [...pendingEscalations.entries()].find(([_, data]) => 
                (Date.now() - data.timestamp) < 30 * 60 * 1000
        );
        if (recent) {
            const [clientPhone, data] = recent;
            await client.sendMessage(clientPhone, text);
            saveMessage(clientPhone, 'assistant', text);
            pendingEscalations.delete(clientPhone);
            console.log(`✅ Respuesta enviada al cliente ${clientPhone}`);
            return;
        }
    }

        console.log(`📩 [${from}]: ${text}`);
    saveMessage(from, "user", text);

    try {
        const history = getHistory(from);
        const response = await askGemini(text, history);

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