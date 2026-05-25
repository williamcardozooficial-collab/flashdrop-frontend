require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');

const webhookRoutes = require('./routes/webhook');
const adminRoutes = require('./routes/admin');
const notificacoesRoutes = require('./routes/notificacoes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'flashdrop-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

app.use('/webhook', webhookRoutes);
app.use('/admin', adminRoutes);
app.use('/notificacoes', notificacoesRoutes);

app.get('/', (req, res) => res.redirect('/admin'));

app.listen(PORT, () => {
  console.log('[FlashDrop Bot] Rodando na porta ' + PORT);
});
