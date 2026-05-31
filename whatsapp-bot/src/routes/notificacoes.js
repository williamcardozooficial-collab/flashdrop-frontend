const express = require('express');
const router = express.Router();
const { sendText } = require('../services/evolution');

router.post('/enviar', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.NOTIF_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { phone, evento, nome, pedido_id, loja_nome, endereco_entrega, tipo_pagamento, valor_total, valor_cobrado } = req.body;
  if (!phone || !evento || !nome) {
    return res.status(400).json({ error: 'Missing required fields: phone, evento, nome' });
  }

  let message;

  if (evento === 'cadastro_recebido') {
    message = `Ola, *${nome}*! 👋\n\nRecebemos o seu cadastro na *FlashDrop*. ✅\n\nEm breve nossa equipe ira analisar e voce sera notificado aqui. Obrigado!`;
  } else if (evento === 'cadastro_aprovado') {
    message = `Parabens, *${nome}*! 🎉\n\nSeu cadastro na *FlashDrop* foi *aprovado*! ✅\n\nVoce ja pode acessar sua conta e comecar a usar a plataforma. Bem-vindo(a)!`;
  } else if (evento === 'novo_pedido') {
    const pagLabel = { dinheiro: '💵 Dinheiro', maquina: '💳 Máquina de Cartão', pix: '📱 PIX', cartao_aproximacao: '💳 Cartão por Aproximação' };
    const pagStr = pagLabel[tipo_pagamento] || tipo_pagamento || '—';
    const valorStr = valor_total ? `R$ ${parseFloat(valor_total).toFixed(2)}` : '—';
    message = `🛵 *Novo Pedido #${pedido_id}* — *${loja_nome || nome}*\n\n`;
    message += `📍 *Entrega:* ${endereco_entrega || '—'}\n`;
    message += `💳 *Pagamento:* ${pagStr}\n`;
    message += `💰 *Taxa:* ${valorStr}\n`;
    if (tipo_pagamento === 'dinheiro' && valor_cobrado && parseFloat(valor_cobrado) > 0) {
      message += `💵 *Cobrar do cliente:* R$ ${parseFloat(valor_cobrado).toFixed(2)}\n`;
    }
    message += `\n⏳ Aguardando motoboy disponível...`;
  } else if (evento === 'pedido_entregue') {
    message = `✅ *Pedido #${pedido_id} entregue!*\n\nObrigado pela preferência! Em nome da Flash Drop, esperamos que aproveite muito sua compra. 😊💚\n\n🛍️ Conheça também nossas lojas parceiras e descubra novas opções para seus próximos pedidos:\nhttps://flashdrop-frontend-six.vercel.app/lojas.html\n\n🚀 Entregas rápidas, seguras e com praticidade para você.\n\nVolte sempre! 💚`;
  } else {
    return res.status(400).json({ error: 'Invalid evento. Use: cadastro_recebido, cadastro_aprovado, novo_pedido, pedido_entregue' });
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
