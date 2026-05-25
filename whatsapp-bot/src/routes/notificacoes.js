const express = require('express');
const router = express.Router();
const { sendText } = require('../services/evolution');

router.post('/enviar', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.NOTIF_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { phone, evento, nome } = req.body;
  if (!phone || !evento || !nome) {
    return res.status(400).json({ error: 'Missing required fields: phone, evento, nome' });
  }

  let message;

  if (evento === 'cadastro_recebido') {
    message = `Ola, *${nome}*! 👋\n\nRecebemos o seu cadastro na *FlashDrop*. ✅\n\nEm breve nossa equipe ira analisar e voce sera notificado aqui. Obrigado!`;
  } else if (evento === 'cadastro_aprovado') {
    message = `Parabens, *${nome}*! 🎉\n\nSeu cadastro na *FlashDrop* foi *aprovado*! ✅\n\nVoce ja pode acessar sua conta e comecar a usar a plataforma. Bem-vindo(a)!`;
  } else {
    return res.status(400).json({ error: 'Invalid evento. Use cadastro_recebido or cadastro_aprovado' });
  }

  try {
    await sendText(phone, message);
    console.log('[Notificacoes] Mensagem enviada para ' + phone + ' - evento: ' + evento);
    return res.json({ ok: true });
  } catch (err) {
    console.error('[Notificacoes] Erro ao enviar mensagem:', err.message);
    return res.status(500).json({ error: 'Failed to send message', details: err.message });
  }
});

module.exports = router;
