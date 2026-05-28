/**
 * crypto.ts — Chiffrement de bout en bout avec Perfect Forward Secrecy
 *
 * Implémentation inspirée du Signal Protocol :
 *   - X3DH  : échange de clés initial (Extended Triple Diffie-Hellman)
 *   - Double Ratchet : rotation automatique des clés à chaque message
 *
 * Bibliothèque : tweetnacl (Curve25519 + XSalsa20-Poly1305)
 *
 * AUCUN message n'est stocké côté serveur. Supabase Realtime sert
 * uniquement de tunnel de transit pour les ciphertext éphémères.
 */

import nacl from 'tweetnacl';
import {
  encodeBase64,
  decodeBase64,
  encodeUTF8,
  decodeUTF8,
} from 'tweetnacl-util';
import * as SecureStore from 'expo-secure-store';

// ─────────────────────────────────────────────
// Clés stockées dans SecureStore (sur l'appareil)
// ─────────────────────────────────────────────
const IDENTITY_PRIVATE = 'ik_private';   // Clé d'identité à long terme
const IDENTITY_PUBLIC  = 'ik_public';
const SIGNED_PRE_PRIV  = 'spk_private';  // Signed PreKey (rotation hebdo)
const SIGNED_PRE_PUB   = 'spk_public';
const RATCHET_STATE    = 'ratchet_state'; // État Double Ratchet sérialisé

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export interface IdentityBundle {
  identityKey: string;      // base64 — clé publique d'identité
  signedPreKey: string;     // base64 — signed pre-key publique courante
  signedPreKeyId: number;   // identifiant de la SPK
}

interface RatchetState {
  partnerId: string;
  DHs: { pub: string; priv: string }; // Clé DH d'envoi courante
  DHr: string | null;                  // Dernière clé DH reçue du partenaire
  RK: string;                          // Root Key
  CKs: string;                         // Chain Key d'envoi
  CKr: string;                         // Chain Key de réception
  Ns: number;                          // Compteur messages envoyés
  Nr: number;                          // Compteur messages reçus
  PN: number;                          // Nbre msgs envoyés dans chaîne précédente
}

// ─────────────────────────────────────────────
// Primitives bas niveau
// ─────────────────────────────────────────────

/** HKDF simplifié avec nacl — dérive len octets à partir d'un secret et d'un label */
function hkdf(inputKey: Uint8Array, salt: Uint8Array, info: string, len = 32): Uint8Array {
  // Étape 1 : extract
  const prk = nacl.hash(new Uint8Array([...salt, ...inputKey])).slice(0, 32);
  // Étape 2 : expand (T1 suffit pour 32 octets)
  const infoBytes = encodeUTF8(info);
  const t1 = nacl.hash(new Uint8Array([...prk, ...infoBytes, 0x01])).slice(0, len);
  return t1;
}

/** Diffie-Hellman Curve25519 */
function dh(myPriv: Uint8Array, theirPub: Uint8Array): Uint8Array {
  return nacl.scalarMult(myPriv, theirPub);
}

/** KDF sur la Root Key — retourne [newRK, newChainKey] */
function kdfRK(rk: Uint8Array, dhOut: Uint8Array): [Uint8Array, Uint8Array] {
  const derived = hkdf(dhOut, rk, 'RootKey', 64);
  return [derived.slice(0, 32), derived.slice(32, 64)];
}

/** KDF sur une Chain Key — retourne [newCK, messageKey] */
function kdfCK(ck: Uint8Array): [Uint8Array, Uint8Array] {
  const mk = nacl.hash(new Uint8Array([...ck, 0x01])).slice(0, 32);
  const newCK = nacl.hash(new Uint8Array([...ck, 0x02])).slice(0, 32);
  return [newCK, mk];
}

// ─────────────────────────────────────────────
// Gestion des clés d'identité
// ─────────────────────────────────────────────

/** Génère ou récupère la paire de clés d'identité à long terme */
export async function getOrCreateIdentityKeyPair(): Promise<{ publicKey: string }> {
  let pub = await SecureStore.getItemAsync(IDENTITY_PUBLIC);
  if (!pub) {
    const kp = nacl.box.keyPair();
    pub = encodeBase64(kp.publicKey);
    await SecureStore.setItemAsync(IDENTITY_PRIVATE, encodeBase64(kp.secretKey));
    await SecureStore.setItemAsync(IDENTITY_PUBLIC, pub);
  }
  return { publicKey: pub };
}

/** Génère une nouvelle Signed PreKey (à appeler ~hebdomadairement) */
export async function rotateSignedPreKey(): Promise<{ publicKey: string; id: number }> {
  const kp = nacl.box.keyPair();
  const pub = encodeBase64(kp.publicKey);
  const id = Date.now(); // timestamp comme identifiant
  await SecureStore.setItemAsync(SIGNED_PRE_PRIV, encodeBase64(kp.secretKey));
  await SecureStore.setItemAsync(SIGNED_PRE_PUB, pub);
  await SecureStore.setItemAsync('spk_id', String(id));
  return { publicKey: pub, id };
}

/** Retourne le bundle public à publier sur Supabase (profil) */
export async function getIdentityBundle(): Promise<IdentityBundle> {
  const { publicKey: identityKey } = await getOrCreateIdentityKeyPair();
  let spkPub = await SecureStore.getItemAsync(SIGNED_PRE_PUB);
  let spkId  = await SecureStore.getItemAsync('spk_id');
  if (!spkPub || !spkId) {
    const r = await rotateSignedPreKey();
    spkPub = r.publicKey;
    spkId  = String(r.id);
  }
  return {
    identityKey,
    signedPreKey: spkPub,
    signedPreKeyId: Number(spkId),
  };
}

// ─────────────────────────────────────────────
// X3DH — établissement de session initial
// ─────────────────────────────────────────────

/**
 * INITIATEUR : calcule le secret partagé X3DH et initialise l'état Ratchet.
 * À appeler une seule fois quand Alice envoie son premier message à Bob.
 *
 * @param partnerBundle — bundle public de Bob récupéré depuis Supabase
 */
export async function x3dhInitiator(
  partnerBundle: IdentityBundle,
  partnerId: string
): Promise<void> {
  const myIKpriv = decodeBase64((await SecureStore.getItemAsync(IDENTITY_PRIVATE))!);
  const myIKpub  = decodeBase64((await SecureStore.getItemAsync(IDENTITY_PUBLIC))!);
  const theirIK  = decodeBase64(partnerBundle.identityKey);
  const theirSPK = decodeBase64(partnerBundle.signedPreKey);

  // Génère une ephemeral key pair (EK)
  const ek = nacl.box.keyPair();

  // DH1 = DH(IKa, SPKb)
  const dh1 = dh(myIKpriv, theirSPK);
  // DH2 = DH(EKa, IKb)
  const dh2 = dh(ek.secretKey, theirIK);
  // DH3 = DH(EKa, SPKb)
  const dh3 = dh(ek.secretKey, theirSPK);

  // SK = KDF(DH1 || DH2 || DH3)
  const combined = new Uint8Array([...dh1, ...dh2, ...dh3]);
  const salt = new Uint8Array(32); // zéro — standard X3DH
  const SK = hkdf(combined, salt, 'X3DH', 32);

  // Initialise le Double Ratchet (côté initiateur)
  const dhSend = nacl.box.keyPair();
  const [RK, CKs] = kdfRK(SK, dh(dhSend.secretKey, theirSPK));

  const state: RatchetState = {
    partnerId,
    DHs: { pub: encodeBase64(dhSend.publicKey), priv: encodeBase64(dhSend.secretKey) },
    DHr: partnerBundle.signedPreKey,
    RK: encodeBase64(RK),
    CKs: encodeBase64(CKs),
    CKr: encodeBase64(SK), // provisoire jusqu'au premier message reçu
    Ns: 0,
    Nr: 0,
    PN: 0,
  };

  await saveRatchetState(partnerId, state);

  // Publie EK + IK dans le premier message header pour que Bob puisse compléter X3DH
  await SecureStore.setItemAsync(
    `x3dh_ek_${partnerId}`,
    JSON.stringify({
      ek: encodeBase64(ek.publicKey),
      ik: encodeBase64(myIKpub),
    })
  );
}

/**
 * RÉPONDANT : reçoit le premier message d'Alice et complète X3DH.
 * Bob reconstruit le secret partagé depuis les clés envoyées dans le header.
 */
export async function x3dhResponder(
  senderIKpub: string,
  senderEKpub: string,
  partnerId: string
): Promise<void> {
  const myIKpriv  = decodeBase64((await SecureStore.getItemAsync(IDENTITY_PRIVATE))!);
  const mySPKpriv = decodeBase64((await SecureStore.getItemAsync(SIGNED_PRE_PRIV))!);
  const mySPKpub  = (await SecureStore.getItemAsync(SIGNED_PRE_PUB))!;

  const theirIK = decodeBase64(senderIKpub);
  const theirEK = decodeBase64(senderEKpub);

  const dh1 = dh(mySPKpriv, theirIK);
  const dh2 = dh(myIKpriv, theirEK);
  const dh3 = dh(mySPKpriv, theirEK);

  const combined = new Uint8Array([...dh1, ...dh2, ...dh3]);
  const salt = new Uint8Array(32);
  const SK = hkdf(combined, salt, 'X3DH', 32);

  // Bob initialise son ratchet en position répondant
  const dhRecv = nacl.box.keyPair();
  const [RK, CKr] = kdfRK(SK, dh(myIKpriv, theirEK));

  const state: RatchetState = {
    partnerId,
    DHs: { pub: encodeBase64(dhRecv.publicKey), priv: encodeBase64(dhRecv.secretKey) },
    DHr: null,
    RK: encodeBase64(RK),
    CKs: encodeBase64(SK), // provisoire
    CKr: encodeBase64(CKr),
    Ns: 0,
    Nr: 0,
    PN: 0,
  };

  await saveRatchetState(partnerId, state);
}

// ─────────────────────────────────────────────
// Double Ratchet — chiffrement / déchiffrement
// ─────────────────────────────────────────────

export interface EncryptedEnvelope {
  /** Clé DH publique d'envoi de ce step (pour avancer le ratchet du destinataire) */
  dhPub: string;
  /** Numéro de message dans la chaîne courante */
  n: number;
  /** Nombre de messages envoyés dans la chaîne précédente */
  pn: number;
  /** Nonce nacl */
  nonce: string;
  /** Ciphertext nacl.secretbox */
  ciphertext: string;
  /** Header X3DH si premier message (sinon absent) */
  x3dh?: { ik: string; ek: string };
}

/** Chiffre un message avec rotation de clé automatique */
export async function ratchetEncrypt(
  plaintext: string,
  partnerId: string
): Promise<EncryptedEnvelope | null> {
  try {
    const state = await loadRatchetState(partnerId);
    if (!state) return null;

    // Avance la sending chain key
    const CKs = decodeBase64(state.CKs);
    const [newCKs, mk] = kdfCK(CKs);

    // Chiffre avec la message key dérivée
    const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
    const ciphertext = nacl.secretbox(encodeUTF8(plaintext), nonce, mk);

    const envelope: EncryptedEnvelope = {
      dhPub: state.DHs.pub,
      n: state.Ns,
      pn: state.PN,
      nonce: encodeBase64(nonce),
      ciphertext: encodeBase64(ciphertext),
    };

    // Attache le header X3DH si c'est le tout premier message
    const x3dhData = await SecureStore.getItemAsync(`x3dh_ek_${partnerId}`);
    if (x3dhData) {
      envelope.x3dh = JSON.parse(x3dhData);
      await SecureStore.deleteItemAsync(`x3dh_ek_${partnerId}`);
    }

    // Met à jour l'état
    state.CKs = encodeBase64(newCKs);
    state.Ns += 1;
    await saveRatchetState(partnerId, state);

    return envelope;
  } catch (e) {
    console.error('[crypto] ratchetEncrypt error', e);
    return null;
  }
}

/** Déchiffre un message reçu et avance le ratchet si nécessaire */
export async function ratchetDecrypt(
  envelope: EncryptedEnvelope,
  partnerId: string
): Promise<string | null> {
  try {
    let state = await loadRatchetState(partnerId);
    if (!state) return null;

    // Si le header DH est nouveau → avancer le ratchet symétrique
    if (envelope.dhPub !== state.DHr) {
      state = await ratchetStep(state, envelope.dhPub);
    }

    // Avance la receiving chain key
    const CKr = decodeBase64(state.CKr);
    const [newCKr, mk] = kdfCK(CKr);

    const nonce      = decodeBase64(envelope.nonce);
    const ciphertext = decodeBase64(envelope.ciphertext);
    const plaintext  = nacl.secretbox.open(ciphertext, nonce, mk);

    if (!plaintext) return null;

    state.CKr = encodeBase64(newCKr);
    state.Nr += 1;
    await saveRatchetState(partnerId, state);

    return decodeUTF8(plaintext);
  } catch (e) {
    console.error('[crypto] ratchetDecrypt error', e);
    return null;
  }
}

/** Effectue un pas de ratchet DH (rotation de clé complète) */
async function ratchetStep(state: RatchetState, newDHr: string): Promise<RatchetState> {
  state.PN  = state.Ns;
  state.Ns  = 0;
  state.Nr  = 0;
  state.DHr = newDHr;

  // Avance la Root Key avec le nouveau DH
  const dhOut     = dh(decodeBase64(state.DHs.priv), decodeBase64(newDHr));
  const [RK, CKr] = kdfRK(decodeBase64(state.RK), dhOut);

  // Génère une nouvelle paire DH d'envoi
  const newDHs    = nacl.box.keyPair();
  const dhOut2    = dh(newDHs.secretKey, decodeBase64(newDHr));
  const [newRK, CKs] = kdfRK(RK, dhOut2);

  state.RK  = encodeBase64(newRK);
  state.CKs = encodeBase64(CKs);
  state.CKr = encodeBase64(CKr);
  state.DHs = {
    pub:  encodeBase64(newDHs.publicKey),
    priv: encodeBase64(newDHs.secretKey),
  };

  return state;
}

// ─────────────────────────────────────────────
// Persistance de l'état Ratchet (local SecureStore)
// ─────────────────────────────────────────────

async function saveRatchetState(partnerId: string, state: RatchetState): Promise<void> {
  const key = `${RATCHET_STATE}_${partnerId}`;
  await SecureStore.setItemAsync(key, JSON.stringify(state));
}

async function loadRatchetState(partnerId: string): Promise<RatchetState | null> {
  const key = `${RATCHET_STATE}_${partnerId}`;
  const raw = await SecureStore.getItemAsync(key);
  return raw ? JSON.parse(raw) : null;
}

export async function hasRatchetSession(partnerId: string): Promise<boolean> {
  const state = await loadRatchetState(partnerId);
  return state !== null;
}

/** Supprime toutes les clés liées à une session (si partenaire change) */
export async function destroySession(partnerId: string): Promise<void> {
  await SecureStore.deleteItemAsync(`${RATCHET_STATE}_${partnerId}`);
  await SecureStore.deleteItemAsync(`x3dh_ek_${partnerId}`);
}
