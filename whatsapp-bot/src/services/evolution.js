const axios = require('axios');

const BASE_URL = process.env.EVOLUTION_API_URL;
const API_KEY = process.env.EVOLUTION_API_KEY;
const INSTANCE = process.env.EVOLUTION_INSTANCE || 'flashdrop';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { apikey: API_KEY }
});

async function getInstance() {
  try {
    const { data } = await api.get(`/instance/fetchInstances`);
    return data.find(i => i.instance?.instanceName === INSTANCE) || null;
  } catch {
    return null;
  }
}

async function createInstance(webhookUrl) {
  const { data } = await api.post('/instance/create', {
    instanceName: INSTANCE,
    qrcode: true,
    integration: 'WHATSAPP-BAILEYS',
    webhook: {
      url: webhookUrl,
      byEvents: true,
      base64: true,
      events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED']
    }
  });
  return data;
}

async function getConnectionState() {
  try {
    const { data } = await api.get(`/instance/connectionState/${INSTANCE}`);
    return data?.instance?.state || 'close';
  } catch {
    return 'close';
  }
}

async function getQrCode() {
  try {
    const { data } = await api.get(`/instance/connect/${INSTANCE}`);
    return data?.base64 || null;
  } catch {
    return null;
  }
}

async function sendText(to, text) {
  const { data } = await api.post(`/message/sendText/${INSTANCE}`, {
    number: to,
    text
  });
  return data;
}

async function reconnect() {
  try {
    await api.delete(`/instance/logout/${INSTANCE}`);
  } catch {}
  const { data } = await api.get(`/instance/connect/${INSTANCE}`);
  return data?.base64 || null;
}

async function ensureInstance(webhookUrl) {
  const existing = await getInstance();
  if (!existing) {
    console.log('[Evolution] Criando instância...');
    await createInstance(webhookUrl);
  }
}

module.exports = { getConnectionState, getQrCode, sendText, reconnect, ensureInstance, INSTANCE };
