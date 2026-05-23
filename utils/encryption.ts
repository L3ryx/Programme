import CryptoJS from 'crypto-js';

// Shared secret key — in production, use ECDH key exchange per conversation
const SECRET_KEY = 'alemille-couple-secret-2025-x7k9';

export function encryptMessage(plainText: string): string {
  try {
    const encrypted = CryptoJS.AES.encrypt(plainText, SECRET_KEY).toString();
    return encrypted;
  } catch {
    return plainText;
  }
}

export function decryptMessage(cipherText: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || cipherText;
  } catch {
    return cipherText;
  }
}

export function isEncrypted(text: string): boolean {
  // AES cipher text is base64 encoded
  return /^U2FsdGVkX1/.test(text);
}
