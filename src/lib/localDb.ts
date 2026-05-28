/**
 * localDb.ts — Stockage local des messages avec expo-sqlite
 *
 * Les messages ne quittent jamais cet appareil en clair.
 * Supabase ne stocke RIEN : il sert uniquement de relais temps réel.
 *
 * Schéma :
 *   messages      → messages locaux (chiffrés + déchiffrés localement)
 *   ratchet_log   → journal de rotation des clés (debug uniquement)
 */

import * as SQLite from 'expo-sqlite';

const DB_NAME = 'connect_local.db';

let _db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync(DB_NAME);
  await initSchema(_db);
  return _db;
}

async function initSchema(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS messages (
      id            TEXT PRIMARY KEY,
      partner_id    TEXT NOT NULL,
      sender_id     TEXT NOT NULL,
      plaintext     TEXT NOT NULL,
      encrypted     TEXT NOT NULL,
      nonce         TEXT NOT NULL,
      dh_pub        TEXT NOT NULL,
      msg_n         INTEGER NOT NULL DEFAULT 0,
      created_at    INTEGER NOT NULL,
      delivered     INTEGER NOT NULL DEFAULT 0,
      read_at       INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_messages_partner
      ON messages (partner_id, created_at);

    CREATE TABLE IF NOT EXISTS ratchet_log (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      partner_id  TEXT NOT NULL,
      event       TEXT NOT NULL,
      ts          INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
    );
  `);
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface LocalMessage {
  id: string;
  partner_id: string;
  sender_id: string;
  plaintext: string;
  encrypted: string;
  nonce: string;
  dh_pub: string;
  msg_n: number;
  created_at: number;       // timestamp ms
  delivered: boolean;
  read_at: number | null;
}

// ─────────────────────────────────────────────
// Opérations CRUD
// ─────────────────────────────────────────────

/** Insère un message dans la base locale */
export async function insertMessage(msg: LocalMessage): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR IGNORE INTO messages
       (id, partner_id, sender_id, plaintext, encrypted, nonce, dh_pub, msg_n, created_at, delivered, read_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      msg.id,
      msg.partner_id,
      msg.sender_id,
      msg.plaintext,
      msg.encrypted,
      msg.nonce,
      msg.dh_pub,
      msg.msg_n,
      msg.created_at,
      msg.delivered ? 1 : 0,
      msg.read_at ?? null,
    ]
  );
}

/** Récupère tous les messages d'une conversation, du plus ancien au plus récent */
export async function getMessages(partnerId: string, limit = 200): Promise<LocalMessage[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM messages
     WHERE partner_id = ?
     ORDER BY created_at ASC
     LIMIT ?`,
    [partnerId, limit]
  );
  return rows.map(rowToMessage);
}

/** Marque un message comme livré (accusé de réception transit) */
export async function markDelivered(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE messages SET delivered = 1 WHERE id = ?`, [id]);
}

/** Marque un message comme lu */
export async function markRead(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE messages SET read_at = ? WHERE id = ? AND read_at IS NULL`,
    [Date.now(), id]
  );
}

/** Compte les messages non lus d'un partenaire */
export async function countUnread(partnerId: string, myId: string): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ c: number }>(
    `SELECT COUNT(*) as c FROM messages
     WHERE partner_id = ? AND sender_id != ? AND read_at IS NULL`,
    [partnerId, myId]
  );
  return row?.c ?? 0;
}

/** Supprime tous les messages locaux d'une conversation */
export async function deleteConversation(partnerId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM messages WHERE partner_id = ?`, [partnerId]);
}

/** Log d'un événement de rotation de clé (optionnel, debug) */
export async function logKeyRotation(partnerId: string, event: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO ratchet_log (partner_id, event) VALUES (?, ?)`,
    [partnerId, event]
  );
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function rowToMessage(row: any): LocalMessage {
  return {
    id:         row.id,
    partner_id: row.partner_id,
    sender_id:  row.sender_id,
    plaintext:  row.plaintext,
    encrypted:  row.encrypted,
    nonce:      row.nonce,
    dh_pub:     row.dh_pub,
    msg_n:      row.msg_n,
    created_at: row.created_at,
    delivered:  row.delivered === 1,
    read_at:    row.read_at,
  };
}
