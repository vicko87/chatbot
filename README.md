# 🤖 Lashbot

> AI WhatsApp admin bot for a lash & brow salon — multilingual, auto-booking, owner escalation

Bot de WhatsApp con inteligencia artificial para gestionar clientes del salón **Lash Angels** (Barcelona). Disponible 24/7, responde en el idioma del cliente y escala preguntas a la dueña cuando no sabe la respuesta.

---

## ✨ Funcionalidades

- 🌍 **Multilingüe** — detecta el idioma del cliente y responde en español, inglés, ruso, etc.
- 💬 **Respuestas automáticas** — precios, servicios, horarios, reglas del salón
- 📅 **Gestión de citas** — guía al cliente para reservar (vía Treatwell o Google Calendar)
- 🔔 **Escalación inteligente** — si no sabe responder, avisa a la dueña por WhatsApp y reenvía su respuesta al cliente
- 🧠 **Memoria de conversación** — recuerda el historial de cada cliente por número de teléfono
- 💾 **Base de datos local** — SQLite, sin coste, sin configuración externa

---

## 🛠️ Stack

| Componente | Tecnología |
|---|---|
| WhatsApp | [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js) |
| IA | Google Gemini 1.5 Flash (gratis) |
| Base de datos | SQLite via better-sqlite3 |
| Servidor | Node.js 18+ |

---

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/lashbot.git
cd lashbot
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus valores:

```env
GEMINI_API_KEY=tu_clave_aqui
OWNER_PHONE=34612345678@c.us
```

- **GEMINI_API_KEY** → obtén tu clave gratis en [aistudio.google.com](https://aistudio.google.com)
- **OWNER_PHONE** → número de WhatsApp de la dueña en formato `34XXXXXXXXX@c.us`

### 4. Arrancar el bot

```bash
npm start
```

Escanea el código QR que aparece en la terminal con tu WhatsApp.

---

## 📁 Estructura del proyecto

```
lashbot/
├── index.js              ← punto de entrada
├── src/
│   ├── whatsapp.js       ← conexión WhatsApp + QR + lógica de mensajes
│   ├── ai.js             ← integración Google Gemini
│   ├── database.js       ← historial de conversaciones (SQLite)
│   ├── knowledge.js      ← servicios, precios y reglas del salón
│   └── escalation.js     ← notificación a la dueña
├── .env.example          ← plantilla de variables de entorno
└── package.json
```

---

## 🔄 Flujo de funcionamiento

```
Cliente escribe en WhatsApp
        ↓
Bot detecta idioma → busca en base de conocimiento
        ↓
¿Sabe responder? ──→ SÍ → Responde al instante (24/7)
                └──→ NO → "Un momento 🙏" → WhatsApp a dueña → reenvía respuesta
        ↓ (si pide cita)
Guía al cliente → link Treatwell o gestión manual
```

---

## 💅 Servicios del salón (Lash Angels)

| Servicio | Precio |
|---|---|
| Extensiones Clásico 1D | 55€ |
| Extensiones Volumen 2D–6D | 60€–75€ |
| Hollywood 7–10D | 80€ |
| Volumen Ruso 10D+ | 85€ |
| Relleno (2–3 semanas) | precio base – 10€ |
| Retirada de extensiones | 10€ |
| Lifting + tinte | 50€ |
| Laminado de cejas | 40–45€ |
| Set lifting + laminado cejas | 85€ |

Reservas: [widget.treatwell.es/establecimiento/lash-angels](https://widget.treatwell.es/establecimiento/lash-angels/)

---

## ⚠️ Notas

- Este bot usa `whatsapp-web.js` (sesión QR), no la API oficial de Meta
- Para uso en producción con alto volumen se recomienda migrar a WATI.io o 360dialog
- El archivo `.env` nunca debe subirse a GitHub (ya está en `.gitignore`)

---

## 📄 Licencia

MIT
