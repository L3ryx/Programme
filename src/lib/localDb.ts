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

    CREATE TABLE IF NOT EXISTS flag_scores (
      partner_id   TEXT PRIMARY KEY,
      red_count    INTEGER NOT NULL DEFAULT 0,
      green_count  INTEGER NOT NULL DEFAULT 0,
      total_score  INTEGER NOT NULL DEFAULT 50,
      red_labels   TEXT NOT NULL DEFAULT '[]',
      green_labels TEXT NOT NULL DEFAULT '[]',
      analyzed_ids TEXT NOT NULL DEFAULT '[]',
      updated_at   INTEGER NOT NULL DEFAULT 0
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
// Flag scores (analyse cumulative Phi-3)
// ─────────────────────────────────────────────

export interface FlagScore {
  partner_id:   string;
  red_count:    number;
  green_count:  number;
  total_score:  number;
  red_labels:   string[];
  green_labels: string[];
  analyzed_ids: string[]; // IDs des messages déjà analysés
  updated_at:   number;
}

/** Récupère le score cumulé pour un partenaire */
export async function getFlagScore(partnerId: string): Promise<FlagScore | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<any>(
    `SELECT * FROM flag_scores WHERE partner_id = ?`,
    [partnerId]
  );
  if (!row) return null;
  return {
    partner_id:   row.partner_id,
    red_count:    row.red_count,
    green_count:  row.green_count,
    total_score:  row.total_score,
    red_labels:   JSON.parse(row.red_labels  ?? '[]'),
    green_labels: JSON.parse(row.green_labels ?? '[]'),
    analyzed_ids: JSON.parse(row.analyzed_ids ?? '[]'),
    updated_at:   row.updated_at,
  };
}

/** Met à jour le score cumulé (upsert) */
export async function saveFlagScore(score: FlagScore): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO flag_scores
       (partner_id, red_count, green_count, total_score, red_labels, green_labels, analyzed_ids, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(partner_id) DO UPDATE SET
       red_count    = excluded.red_count,
       green_count  = excluded.green_count,
       total_score  = excluded.total_score,
       red_labels   = excluded.red_labels,
       green_labels = excluded.green_labels,
       analyzed_ids = excluded.analyzed_ids,
       updated_at   = excluded.updated_at`,
    [
      score.partner_id,
      score.red_count,
      score.green_count,
      score.total_score,
      JSON.stringify(score.red_labels),
      JSON.stringify(score.green_labels),
      JSON.stringify(score.analyzed_ids),
      score.updated_at,
    ]
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
