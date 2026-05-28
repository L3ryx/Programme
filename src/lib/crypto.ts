import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64, encodeUTF8, decodeUTF8 } from 'tweetnacl-util';
import * as SecureStore from 'expo-secure-store';

const PRIVATE_KEY_STORE = 'e2e_private_key';
const PUBLIC_KEY_STORE = 'e2e_public_key';

/**
 * Génère une paire de clés NaCl pour l'utilisateur courant
 */
export async function generateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
  const keyPair = nacl.box.keyPair();
  const publicKey = encodeBase64(keyPair.publicKey);
  const privateKey = encodeBase64(keyPair.secretKey);

  await SecureStore.setItemAsync(PRIVATE_KEY_STORE, privateKey);
  await SecureStore.setItemAsync(PUBLIC_KEY_STORE, publicKey);

  return { publicKey, privateKey };
}

/**
 * Récupère la clé publique locale (ou génère si absente)
 */
export async function getOrCreateKeyPair(): Promise<{ publicKey: string }> {
  let publicKey = await SecureStore.getItemAsync(PUBLIC_KEY_STORE);
  if (!publicKey) {
    const kp = await generateKeyPair();
    publicKey = kp.publicKey;
  }
  return { publicKey };
}

/**
 * Chiffre un message pour le destinataire
 */
export async function encryptMessage(
  plaintext: string,
  recipientPublicKeyB64: string
): Promise<{ encrypted: string; nonce: string } | null> {
  try {
    const privateKeyB64 = await SecureStore.getItemAsync(PRIVATE_KEY_STORE);
    if (!privateKeyB64) return null;

    const message = encodeUTF8(plaintext);
    const recipientPublicKey = decodeBase64(recipientPublicKeyB64);
    const senderPrivateKey = decodeBase64(privateKeyB64);
    const nonce = nacl.randomBytes(nacl.box.nonceLength);

    const encrypted = nacl.box(message, nonce, recipientPublicKey, senderPrivateKey);

    return {
      encrypted: encodeBase64(encrypted),
      nonce: encodeBase64(nonce),
    };
  } catch {
    return null;
  }
}

/**
 * Déchiffre un message reçu
 */
export async function decryptMessage(
  encryptedB64: string,
  nonceB64: string,
  senderPublicKeyB64: string
): Promise<string | null> {
  try {
    const privateKeyB64 = await SecureStore.getItemAsync(PRIVATE_KEY_STORE);
    if (!privateKeyB64) return null;

    const encrypted = decodeBase64(encryptedB64);
    const nonce = decodeBase64(nonceB64);
    const senderPublicKey = decodeBase64(senderPublicKeyB64);
    const receiverPrivateKey = decodeBase64(privateKeyB64);

    const decrypted = nacl.box.open(encrypted, nonce, senderPublicKey, receiverPrivateKey);
    if (!decrypted) return null;

    return decodeUTF8(decrypted);
  } catch {
    return null;
  }
}
