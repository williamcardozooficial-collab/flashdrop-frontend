const express = require('express');
const router = express.Router();
const { getAIResponse } = require('../services/ai');
const { sendText } = require('../services/evolution');
const { addLog, broadcastStatus } = require('./admin');

const processingLock = new Set();

router.post('/', async (req, res) => {
  res.sendStatus(200);

  try {
    const body = req.body;
    const event = body.event;

    if (event === 'connection.update' || event === 'qrcode.updated') {
      broadcastStatus();
      return;
    }

    if (event !== 'messages.upsert') return;

    const message = body.data;
    if (!message) return;

    const fromMe = message.key?.fromMe;
    if (fromMe) return;

    const isGroup = message.key?.remoteJid?.endsWith('@g.us');
    if (isGroup) return;

    const phone = message.key?.remoteJid;
    const text = message.message?.conversation
      || message.message?.extendedTextMessage?.text
      || '';

    if (!phone || !text.trim()) return;
    if (processingLock.has(phone)) return;

    processingLock.add(phone);

    try {
      console.log(`[Webhook] Mensagem de ${phone}: ${text}`);

      const reply = await getAIResponse(phone, text);
      await sendText(phone, reply);

      addLog({ phone, message: text, response: reply });
      console.log(`[Webhook] Respondido para ${phone}`);
    } finally {
      processingLock.delete(phone);
    }
  } catch (err) {
    console.error('[Webhook] Erro:', err.message);
  }
});

module.exports = router;
