/**
 * SETUP APPWRITE — À lancer sur Replit
 *
 * 1. Sur Replit : New Repl → cherche "Node.js" → Create
 * 2. Remplace le contenu de index.js par ce fichier
 * 3. Remplis les 3 variables PROJECT_ID, API_KEY, DATABASE_ID
 * 4. Dans le Shell en bas tape : npm install node-appwrite
 * 5. Clique Run
 */

const { Client, Databases, Permission, Role } = require('node-appwrite');

// ─── REMPLIS CES 3 VALEURS ───────────────────────────────────────────────────
const PROJECT_ID  = 'TON_PROJECT_ID';   // Appwrite Console → ton projet → Settings → Project ID
const API_KEY     = 'TON_API_KEY';      // Appwrite Console → ton projet → Settings → API Keys → Create
const DATABASE_ID = 'adeux-db';         // l'ID de ta base visible dans l'URL
// ─────────────────────────────────────────────────────────────────────────────

const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const db = new Databases(client);

const USER_PERMS = [
  Permission.read(Role.users()),
  Permission.create(Role.users()),
  Permission.update(Role.users()),
  Permission.delete(Role.users()),
];

async function createAttr(fn, label) {
  try {
    await fn();
    console.log('  ✅ ' + label);
  } catch (e) {
    if (e && e.code === 409) {
      console.log('  ⏭️  ' + label + ' (déjà existant)');
    } else {
      console.error('  ❌ ' + label + ' :', e && e.message ? e.message : e);
    }
  }
}

async function createCollection(id, name, fn) {
  try {
    await db.createCollection(DATABASE_ID, id, name, USER_PERMS);
    console.log('\n📁 Collection "' + name + '" créée');
  } catch (e) {
    if (e && e.code === 409) {
      console.log('\n📁 Collection "' + name + '" (déjà existante)');
    } else {
      console.error('\n❌ Collection "' + name + '" :', e && e.message ? e.message : e);
      return;
    }
  }
  await fn();
}

async function main() {
  console.log('🚀 Démarrage du setup Appwrite...\n');

  // ─── PROFILES ───────────────────────────────────────────────────────────────
  await createCollection('profiles', 'profiles', async () => {
    await createAttr(() => db.createStringAttribute(DATABASE_ID,  'profiles', 'phone',             30,  false, null,          false), 'phone');
    await createAttr(() => db.createStringAttribute(DATABASE_ID,  'profiles', 'email',            255,  false, null,          false), 'email');
    await createAttr(() => db.createStringAttribute(DATABASE_ID,  'profiles', 'username',          20,  false, null,          false), 'username');
    await createAttr(() => db.createStringAttribute(DATABASE_ID,  'profiles', 'display_name',     100,  true,  'Utilisateur', false), 'display_name');
    await createAttr(() => db.createStringAttribute(DATABASE_ID,  'profiles', 'identity_key',     500,  false, null,          false), 'identity_key');
    await createAttr(() => db.createStringAttribute(DATABASE_ID,  'profiles', 'signed_pre_key',   500,  false, null,          false), 'signed_pre_key');
    await createAttr(() => db.createIntegerAttribute(DATABASE_ID, 'profiles', 'signed_pre_key_id', false, 0),                        'signed_pre_key_id');
    await createAttr(() => db.createStringAttribute(DATABASE_ID,  'profiles', 'public_key',       500,  false, null,          false), 'public_key');
    await createAttr(() => db.createStringAttribute(DATABASE_ID,  'profiles', 'avatar_url',       500,  false, null,          false), 'avatar_url');
    await createAttr(() => db.createStringAttribute(DATABASE_ID,  'profiles', 'partner_id',        36,  false, null,          false), 'partner_id');
    await createAttr(() => db.createBooleanAttribute(DATABASE_ID, 'profiles', 'partner_locked',   false, false),                     'partner_locked');

    try {
      await db.createIndex(DATABASE_ID, 'profiles', 'idx_username', 'key', ['username'], ['ASC']);
      console.log('  ✅ Index username');
    } catch (e) {
      if (e && e.code === 409) console.log('  ⏭️  Index username (déjà existant)');
      else console.error('  ❌ Index username :', e && e.message);
    }
  });

  // ─── TRANSIT_MESSAGES ───────────────────────────────────────────────────────
  await createCollection('transit_messages', 'transit_messages', async () => {
    await createAttr(() => db.createStringAttribute(DATABASE_ID, 'transit_messages', 'sender_id',    36,    true),       'sender_id');
    await createAttr(() => db.createStringAttribute(DATABASE_ID, 'transit_messages', 'receiver_id',  36,    true),       'receiver_id');
    await createAttr(() => db.createStringAttribute(DATABASE_ID, 'transit_messages', 'envelope',     65535, true),       'envelope');
    await createAttr(() => db.createStringAttribute(DATABASE_ID, 'transit_messages', 'expires_at',   36,    false, null),'expires_at');
    await createAttr(() => db.createStringAttribute(DATABASE_ID, 'transit_messages', 'delivered_at', 36,    false, null),'delivered_at');

    try {
      await db.createIndex(DATABASE_ID, 'transit_messages', 'idx_receiver', 'key', ['receiver_id'], ['ASC']);
      console.log('  ✅ Index receiver_id');
    } catch (e) {
      if (e && e.code === 409) console.log('  ⏭️  Index receiver_id (déjà existant)');
    }
  });

  // ─── RELATIONSHIP_ANALYSES ──────────────────────────────────────────────────
  await createCollection('relationship_analyses', 'relationship_analyses', async () => {
    await createAttr(() => db.createStringAttribute(DATABASE_ID,  'relationship_analyses', 'user_id',          36,   true),              'user_id');
    await createAttr(() => db.createIntegerAttribute(DATABASE_ID, 'relationship_analyses', 'score',            true, 0, 0, 100),         'score');
    await createAttr(() => db.createStringAttribute(DATABASE_ID,  'relationship_analyses', 'red_flags',        255,  false, null, true),  'red_flags');
    await createAttr(() => db.createStringAttribute(DATABASE_ID,  'relationship_analyses', 'positive_signals', 255,  false, null, true),  'positive_signals');
    await createAttr(() => db.createStringAttribute(DATABASE_ID,  'relationship_analyses', 'summary',          2000, false, null),        'summary');
  });

  // ─── PUSH_TOKENS ────────────────────────────────────────────────────────────
  await createCollection('push_tokens', 'push_tokens', async () => {
    await createAttr(() => db.createStringAttribute(DATABASE_ID, 'push_tokens', 'user_id',    36,  true),       'user_id');
    await createAttr(() => db.createStringAttribute(DATABASE_ID, 'push_tokens', 'token',      500, true),       'token');
    await createAttr(() => db.createStringAttribute(DATABASE_ID, 'push_tokens', 'updated_at', 36,  false, null),'updated_at');
  });

  console.log('\n✨ Setup terminé ! Toutes les collections sont prêtes.\n');
}

main().catch(console.error);
