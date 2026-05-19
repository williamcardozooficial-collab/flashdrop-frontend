const express = require('express');
const router = express.Router();
const { getConnectionState, getQrCode, reconnect, ensureInstance } = require('../services/evolution');
const { requireAuth } = require('../middleware/auth');

const sseClients = new Set();
const messageLogs = [];
const MAX_LOGS = 100;

function addLog(entry) {
  messageLogs.unshift({ ...entry, timestamp: new Date().toISOString() });
  if (messageLogs.length > MAX_LOGS) messageLogs.pop();
  broadcastStatus();
}

async function broadcastStatus() {
  if (sseClients.size === 0) return;
  try {
    const state = await getConnectionState();
    const qrcode = state !== 'open' ? await getQrCode() : null;
    const payload = JSON.stringify({ state, qrcode, logs: messageLogs.slice(0, 20) });
    for (const client of sseClients) {
      client.write(`data: ${payload}\n\n`);
    }
  } catch {}
}

setInterval(broadcastStatus, 5000);

router.get('/login', (req, res) => {
  if (req.session?.authenticated) return res.redirect('/admin/dashboard');
  res.sendFile(require('path').join(__dirname, '../../public/admin.html'));
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    req.session.authenticated = true;
    return res.redirect('/admin/dashboard');
  }
  res.redirect('/admin/login?error=1');
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

router.get('/dashboard', requireAuth, (req, res) => {
  res.sendFile(require('path').join(__dirname, '../../public/admin.html'));
});

router.get('/', (req, res) => {
  if (req.session?.authenticated) return res.redirect('/admin/dashboard');
  res.redirect('/admin/login');
});

router.get('/events', requireAuth, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.add(res);
  broadcastStatus();

  req.on('close', () => sseClients.delete(res));
});

router.get('/api/status', requireAuth, async (req, res) => {
  try {
    const state = await getConnectionState();
    const qrcode = state !== 'open' ? await getQrCode() : null;
    res.json({ state, qrcode });
  } catch (err) {
    res.json({ state: 'error', qrcode: null, error: err.message });
  }
});

router.post('/api/reconnect', requireAuth, async (req, res) => {
  try {
    const qrcode = await reconnect();
    res.json({ ok: true, qrcode });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

router.get('/api/logs', requireAuth, (req, res) => {
  res.json(messageLogs.slice(0, 50));
});

router.post('/api/setup', requireAuth, async (req, res) => {
  try {
    const webhookUrl = `${req.protocol}://${req.get('host')}/webhook`;
    await ensureInstance(webhookUrl);
    res.json({ ok: true, webhookUrl });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

module.exports = router;
module.exports.addLog = addLog;
module.exports.broadcastStatus = broadcastStatus;
