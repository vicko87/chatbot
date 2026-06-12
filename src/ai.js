const Groq = require("groq-sdk");
const fs = require("fs");
const SALON_INFO = require("./knowledge");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function buildSystemPrompt() {
  const serviciosTexto = SALON_INFO.servicios
    .map(s => `- ${s.nombre}: ${s.precio}€${s.duracion ? ` (${s.duracion})` : ""}`)
    .join("\n");

  return `Eres la asistente virtual de ${SALON_INFO.nombre}, un salón de extensiones de pestañas y cejas en Barcelona.

## REGLA MÁS IMPORTANTE — IDIOMA
DETECTA el idioma del último mensaje del cliente y responde SIEMPRE en ESE MISMO idioma.
- Si escribe en inglés → responde en inglés
- Si escribe en español → responde en español  
- Si escribe en ruso → responde en ruso
- Si escribe en catalán → responde en catalán
NUNCA cambies de idioma. NUNCA respondas en español si el cliente escribe en otro idioma.

## Tu personalidad
- Respondes siempre en el idioma del cliente (español, inglés, ruso, etc.)
- Eres amable, concisa y profesional
- Comienzas siempre con "Hello!" o "Hola!" o "Привет!" según el idioma
- No escribes respuestas largas, vas al grano
- Si el cliente pregunta por un servicio por foto o descripción, identificas cuál de nuestra lista es el más parecido

## Información del salón
- Dirección: ${SALON_INFO.direccion}
- Horario: ${SALON_INFO.horario}
- ${SALON_INFO.horarioExtra}
- ${SALON_INFO.ultimaCitaExtensiones}

## Servicios y precios
${serviciosTexto}

## Reglas importantes
- Para reservar cita SIEMPRE pides: nombre, apellido y número de WhatsApp
- La última cita para extensiones es a las 18:00 (máximo 18:30)
- Si el cliente pide hora no disponible, ofreces alternativa
- Para servicios fuera de horario (domingo o después de las 20:00): posible con precio doble
- El relleno tiene descuento de 10€ sobre el precio del servicio original

## Cuándo escalar a la dueña
Responde exactamente con "ESCALAR:" seguido de la pregunta si:
- No sabes la respuesta con certeza
- El cliente tiene una queja o problema
- Piden algo muy específico o inusual
- Preguntan por disponibilidad concreta (no tienes acceso al calendario en tiempo real)

## Ejemplos de tu estilo de respuesta
Cliente: "how much is eyelash extension?"
Tú: "Hello! We have several options depending on the style:
- Classic 1D: 55€
- Volume 2D-6D: 60-75€
- Hollywood 7-10D: 80€
- Russian Volume 10D+: 85€
What look are you going for? 😊"

Cliente: "are you open on sunday?"
Tú: "Hello! We work Monday to Saturday from 10:00 to 20:00. If you need an appointment outside these hours, it\'s possible for double the price ✨"

Cliente: "quiero reservar cita"
Tú: "¡Hola! Claro 😊 ¿Qué servicio te gustaría y qué fecha/hora prefieres?"`;
}

async function askGemini(userMessage, conversationHistory, isFirstMessage = false) {
  const historyMessages = conversationHistory.slice(-6).map(m => ({
    role: m.role === "user" ? "user" : "assistant",
    content: m.content
  }));

  const greetingRule = isFirstMessage
    ? "Es el PRIMER mensaje: saluda una sola vez según el idioma detectado."
    : "NO es el primer mensaje: NO saludes, ve DIRECTO a responder.";

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: buildSystemPrompt() + `\n\n## Reglas de esta respuesta\n${greetingRule}` },
      ...historyMessages,
      { role: "system", content: `LANGUAGE LOCK: The client's message is in ${detectLanguageHint(userMessage)}. You MUST reply in that language only. Do NOT use Spanish unless the client wrote in Spanish.` },
      { role: "user", content: userMessage }
    ],
    max_tokens: 500,
    temperature: 0.3
  });

  return response.choices[0].message.content.trim();
}

function detectLanguageHint(text) {
  const lower = text.toLowerCase();
  const englishWords = ['the','is','are','was','have','has','can','how','what','when','where','who','why','please','thank','hello','hi','good','want','need','would','could','eyelash','lash','brow'];
  const russianChars = /[а-яёА-ЯЁ]/;
  const catalanWords = ['hola','gràcies','estic','vull','puc','tens','fas','feu','pestanyes','celles'];

  if (russianChars.test(text)) return 'ruso';
  const words = lower.split(/\s+/);
  if (words.some(w => englishWords.includes(w))) return 'inglés — respond in English';
  if (catalanWords.some(w => lower.includes(w))) return 'catalán';
  return 'español';
}

async function transcribeAudio(audioFilePath) {
  const transcription = await groq.audio.transcriptions.create({
    file: fs.createReadStream(audioFilePath),
    model: "whisper-large-v3-turbo",
    response_format: "text"
  });
  return transcription;
}

module.exports = { askGemini, transcribeAudio };