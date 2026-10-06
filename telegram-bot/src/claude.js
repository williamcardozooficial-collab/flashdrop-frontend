const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = process.env.CLAUDE_MODEL || 'claude-opus-5';
const SYSTEM_PROMPT = process.env.SYSTEM_PROMPT
  || 'Voce e um assistente virtual simpatico e objetivo. Responda sempre em portugues.';

async function getReply(history, userMessage) {
  const messages = [...history, { role: 'user', content: userMessage }];

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages,
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  return textBlock ? textBlock.text : 'Desculpe, nao consegui gerar uma resposta.';
}

module.exports = { getReply };
