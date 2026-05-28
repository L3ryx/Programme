/**
 * messaging.ts — Couche de messagerie sécurisée
 *
 * Responsabilités :
 *   1. Chiffrer avec Double Ratchet avant tout envoi
 *   2. Transmettre via Supabase Realtime (transit pur — pas de persistance serveur)
 *   3. Recevoir, déchiffrer, stocker localement avec expo-sqlite
 *   4. Gérer la suppression automatique côté serveur après livraison
 *
 * Le serveur Supabase ne voit que des blobs chiffrés en transit.
 * Même Supabase ne peut pas lire les messages.
 */

import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabase';
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
 * Envoie un message chiffré au partenaire.
 *
 * Flow :
 *   1. Si pas de session → X3DH initiation
 *   2. Double Ratchet encrypt
 *   3. Stockage local immédiat
 *   4. Transit via Supabase (channel ephemeral)
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

    // 4. Transit via Supabase Realtime broadcast
    //    On utilise insert dans la table transit (TTL court via trigger Postgres)
    const payload = {
      id:          msgId,
      sender_id:   myId,
      receiver_id: partner.id,
      envelope:    JSON.stringify(envelope), // blob opaque chiffré
      expires_at:  new Date(now + 30_000).toISOString(), // 30 s TTL
    };

    await supabase.from('transit_messages').insert(payload);

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
 * Traite un message entrant depuis Supabase Realtime.
 * Déchiffre, stocke localement, accuse réception (pour suppression serveur).
 */
export async function receiveMessage(
  raw: any,
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
      id:         raw.id,
      partner_id: partner.id,
      sender_id:  partner.id,
      plaintext,
      encrypted:  envelope.ciphertext,
      nonce:      envelope.nonce,
      dh_pub:     envelope.dhPub,
      msg_n:      envelope.n,
      created_at: new Date(raw.created_at ?? Date.now()).getTime(),
      delivered:  true,
      read_at:    null,
    };
    await insertMessage(local);

    // Accusé de réception → déclenche suppression serveur
    await supabase
      .from('transit_messages')
      .update({ delivered_at: new Date().toISOString() })
      .eq('id', raw.id);

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
 * Ouvre un canal Supabase Realtime pour recevoir les messages entrants.
 * Retourne une fonction de nettoyage.
 */
export function subscribeToMessages(
  myId: string,
  partner: PartnerProfile,
  myBundle: { identityKey: string },
  onMessage: (msg: LocalMessage) => void
): () => void {
  const channel = supabase
    .channel(`transit_${myId}`)
    .on(
      'postgres_changes',
      {
        event:  'INSERT',
        schema: 'public',
        table:  'transit_messages',
        filter: `receiver_id=eq.${myId}`,
      },
      async (payload) => {
        const raw = payload.new as any;
        if (raw.sender_id !== partner.id) return;

        const msg = await receiveMessage(raw, myId, partner, myBundle);
        if (msg) onMessage(msg);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ─────────────────────────────────────────────
// Chargement de l'historique local
// ─────────────────────────────────────────────

export { getMessages };
