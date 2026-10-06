require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { addMessage, getHistory, clearHistory } = require('./db');
const { getReply } = require('./claude');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TOKEN) {
  console.error('[Telegram Bot] TELEGRAM_BOT_TOKEN nao definido no .env');
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });

bot.onText(/^\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Ola! Sou o assistente da FlashDrop. Pode perguntar o que quiser. 😊');
});

bot.onText(/^\/limpar/, (msg) => {
  clearHistory(msg.chat.id);
  bot.sendMessage(msg.chat.id, 'Historico da conversa apagado.');
});

bot.on('message', async (msg) => {
  if (!msg.text || msg.text.startsWith('/')) return;

  const chatId = msg.chat.id;
  bot.sendChatAction(chatId, 'typing');

  try {
    const history = getHistory(chatId);
    const reply = await getReply(history, msg.text);

    addMessage(chatId, 'user', msg.text);
    addMessage(chatId, 'assistant', reply);

    await bot.sendMessage(chatId, reply);
  } catch (err) {
    console.error('[Telegram Bot] Erro ao processar mensagem:', err.message);
    bot.sendMessage(chatId, 'Desculpe, tive um problema ao responder. Tente novamente em instantes.');
  }
});

bot.on('polling_error', (err) => {
  console.error('[Telegram Bot] Erro de polling:', err.message);
});

console.log('[Telegram Bot] Rodando...');
