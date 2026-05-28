/**
 * messaging.ts — Couche de messagerie sécurisée (Appwrite)
 *
 * Responsabilités :
 *   1. Chiffrer avec Double Ratchet avant tout envoi
 *   2. Transmettre via Appwrite Database (transit pur — pas de persistance serveur)
 *   3. Recevoir, déchiffrer, stocker localement avec expo-sqlite
 *   4. Gérer la suppression automatique côté serveur après livraison
 *
 * Le serveur Appwrite ne voit que des blobs chiffrés en transit.
 */

import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import {
  databases,
  subscribeTransitMessages,
  DATABASE_ID,
  COLLECTION_TRANSIT_MESSAGES,
  type TransitMessage,
} from './appwrite';
import {
  ratchetEncrypt,
  ratchetDecrypt,
  x3dhInitiator,
  x3dhResponder,
  hasRatchetSession,
  getIdentityBundle,
  EncryptedEnvelope,
} from './crypto';
import {
  insertMessage,
  getMessages,
  markDelivered,
  logKeyRotation,
  LocalMessage,
} from './localDb';

// ─────────────────────────────────────────────
// Types partenaire
// ─────────────────────────────────────────────

export interface PartnerProfile {
  id: string;
  display_name: string;
  phone: string;
  identity_key: string;
  signed_pre_key: string;
  signed_pre_key_id: number;
  public_key: string; // legacy — on garde pour compatibilité
}

// ─────────────────────────────────────────────
// Envoi d'un message
// ─────────────────────────────────────────────

/**
 * Envoie un message chiffré au partenaire via Appwrite.
 *
 * Flow :
 *   1. Si pas de session → X3DH initiation
 *   2. Double Ratchet encrypt
 *   3. Stockage local immédiat
 *   4. Transit via Appwrite Database
 */
export async function sendMessage(
  plaintext: string,
  myId: string,
  partner: PartnerProfile
): Promise<LocalMessage | null> {
  try {
    // 1. Initialise la session si nécessaire (X3DH)
    const hasSession = await hasRatchetSession(partner.id);
    if (!hasSession) {
      await x3dhInitiator(
        {
          identityKey:    partner.identity_key,
          signedPreKey:   partner.signed_pre_key,
          signedPreKeyId: partner.signed_pre_key_id,
        },
        partner.id
      );
      await logKeyRotation(partner.id, 'X3DH_INIT');
    }

    // 2. Chiffrement Double Ratchet
    const envelope = await ratchetEncrypt(plaintext, partner.id);
    if (!envelope) return null;

    const msgId = uuidv4();
    const now   = Date.now();

    // 3. Stockage local immédiat (avant l'envoi réseau)
    const local: LocalMessage = {
      id:         msgId,
      partner_id: partner.id,
      sender_id:  myId,
      plaintext,
      encrypted:  envelope.ciphertext,
      nonce:      envelope.nonce,
      dh_pub:     envelope.dhPub,
      msg_n:      envelope.n,
      created_at: now,
      delivered:  false,
      read_at:    null,
    };
    await insertMessage(local);

    // 4. Transit via Appwrite Database (TTL géré par une Appwrite Function ou scheduled job)
    await databases.createDocument(
      DATABASE_ID,
      COLLECTION_TRANSIT_MESSAGES,
      msgId,
      {
        sender_id:    myId,
        receiver_id:  partner.id,
        envelope:     JSON.stringify(envelope), // blob opaque chiffré
        expires_at:   new Date(now + 30_000).toISOString(), // 30 s TTL
        delivered_at: null,
      }
    );

    return local;
  } catch (e) {
    console.error('[messaging] sendMessage error', e);
    return null;
  }
}

// ─────────────────────────────────────────────
// Réception d'un message
// ─────────────────────────────────────────────

/**
 * Traite un message entrant depuis Appwrite Realtime.
 * Déchiffre, stocke localement, accuse réception (pour suppression serveur).
 */
export async function receiveMessage(
  raw: TransitMessage,
  myId: string,
  partner: PartnerProfile,
  myBundle: { identityKey: string }
): Promise<LocalMessage | null> {
  try {
    const envelope: EncryptedEnvelope = JSON.parse(raw.envelope);

    // Si c'est le premier message → X3DH répondant
    if (envelope.x3dh) {
      const hasSession = await hasRatchetSession(partner.id);
      if (!hasSession) {
        await x3dhResponder(envelope.x3dh.ik, envelope.x3dh.ek, partner.id);
        await logKeyRotation(partner.id, 'X3DH_RESPOND');
      }
    }

    // Déchiffrement Double Ratchet
    const plaintext = await ratchetDecrypt(envelope, partner.id);
    if (!plaintext) {
      console.warn('[messaging] Déchiffrement échoué — message ignoré');
      return null;
    }

    // Stockage local
    const local: LocalMessage = {
      id:         raw.$id,
      partner_id: partner.id,
      sender_id:  partner.id,
      plaintext,
      encrypted:  envelope.ciphertext,
      nonce:      envelope.nonce,
      dh_pub:     envelope.dhPub,
      msg_n:      envelope.n,
      created_at: new Date(raw.$createdAt ?? Date.now()).getTime(),
      delivered:  true,
      read_at:    null,
    };
    await insertMessage(local);

    // Accusé de réception → déclenche suppression serveur via Appwrite Function
    await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_TRANSIT_MESSAGES,
      raw.$id,
      { delivered_at: new Date().toISOString() }
    );

    return local;
  } catch (e) {
    console.error('[messaging] receiveMessage error', e);
    return null;
  }
}

// ─────────────────────────────────────────────
// Souscription temps réel
// ─────────────────────────────────────────────

/**
 * Ouvre un canal Appwrite Realtime pour recevoir les messages entrants.
 * Retourne une fonction de nettoyage.
 */
export function subscribeToMessages(
  myId: string,
  partner: PartnerProfile,
  myBundle: { identityKey: string },
  onMessage: (msg: LocalMessage) => void
): () => void {
  return subscribeTransitMessages(myId, async (raw) => {
    if (raw.sender_id !== partner.id) return;

    const msg = await receiveMessage(raw, myId, partner, myBundle);
    if (msg) onMessage(msg);
  });
}

// ─────────────────────────────────────────────
// Chargement de l'historique local
// ─────────────────────────────────────────────

export { getMessages };
