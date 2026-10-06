const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DATA_DIR = path.join(__dirname, '../data');
const DB_PATH = path.join(DATA_DIR, 'conversations.db');

fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
`);

const HISTORY_LIMIT = parseInt(process.env.HISTORY_LIMIT || '20', 10);

function addMessage(chatId, role, content) {
  db.prepare('INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?)')
    .run(String(chatId), role, content);
  trimHistory(chatId);
}

function getHistory(chatId) {
  const rows = db.prepare(
    'SELECT role, content FROM messages WHERE chat_id = ? ORDER BY id ASC'
  ).all(String(chatId));
  return rows.map((r) => ({ role: r.role, content: r.content }));
}

function trimHistory(chatId) {
  const { c: count } = db.prepare(
    'SELECT COUNT(*) as c FROM messages WHERE chat_id = ?'
  ).get(String(chatId));

  if (count > HISTORY_LIMIT) {
    const excess = count - HISTORY_LIMIT;
    db.prepare(`
      DELETE FROM messages WHERE id IN (
        SELECT id FROM messages WHERE chat_id = ? ORDER BY id ASC LIMIT ?
      )
    `).run(String(chatId), excess);
  }
}

function clearHistory(chatId) {
  db.prepare('DELETE FROM messages WHERE chat_id = ?').run(String(chatId));
}

module.exports = { addMessage, getHistory, clearHistory };
