const express = require('express');
const router = express.Router();
const { broadcastStatus } = require('./admin');

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

    const phone = message.key?.remoteJid;
    console.log('[Webhook] Mensagem recebida de ' + phone + ' — ignorada (modo somente notificacoes)');
    // Mensagens recebidas sao ignoradas intencionalmente.
    // O bot apenas envia notificacoes via POST /notificacoes/enviar
  } catch (err) {
    console.error('[Webhook] Erro:', err.message);
  }
});

module.exports = router;
