async function escalateToOwner(client, ownerPhone, clientPhone, question, suggestedAnswer) {
  const msg = `🔔 *LASHBOT - Pregunta de cliente*\n\n` +
    `📱 Cliente: ${clientPhone}\n` +
    `❓ Pregunta: ${question}\n\n` +
    `💡 Respuesta sugerida: ${suggestedAnswer || "Sin sugerencia"}\n\n` +
    `_Responde a este mensaje y el bot enviará tu respuesta al cliente._`;

  await client.sendMessage(ownerPhone, msg);
}

module.exports = { escalateToOwner };