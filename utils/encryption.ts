// Chiffrement XOR simple compatible Hermes/React Native
// Remplace crypto-js qui est incompatible avec Hermes en mode release

const SECRET_KEY = 'alemille-couple-secret-2025-x7k9';

function xorEncrypt(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(
      text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return result;
}

function toBase64(str: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  const bytes = [];
  for (let i = 0; i < str.length; i++) {
    bytes.push(str.charCodeAt(i));
  }
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i], b1 = bytes[i + 1] ?? 0, b2 = bytes[i + 2] ?? 0;
    output += chars[b0 >> 2];
    output += chars[((b0 & 3) << 4) | (b1 >> 4)];
    output += i + 1 < bytes.length ? chars[((b1 & 15) << 2) | (b2 >> 6)] : '=';
    output += i + 2 < bytes.length ? chars[b2 & 63] : '=';
  }
  return output;
}

function fromBase64(str: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  str = str.replace(/[^A-Za-z0-9+/=]/g, '');
  for (let i = 0; i < str.length; i += 4) {
    const e0 = chars.indexOf(str[i]);
    const e1 = chars.indexOf(str[i + 1]);
    const e2 = chars.indexOf(str[i + 2]);
    const e3 = chars.indexOf(str[i + 3]);
    const b0 = (e0 << 2) | (e1 >> 4);
    const b1 = ((e1 & 15) << 4) | (e2 >> 2);
    const b2 = ((e2 & 3) << 6) | e3;
    output += String.fromCharCode(b0);
    if (e2 !== 64) output += String.fromCharCode(b1);
    if (e3 !== 64) output += String.fromCharCode(b2);
  }
  return output;
}

export function encryptMessage(plainText: string): string {
  try {
    const encrypted = xorEncrypt(plainText, SECRET_KEY);
    return 'ENC:' + toBase64(encrypted);
  } catch {
    return plainText;
  }
}

export function decryptMessage(cipherText: string): string {
  try {
    if (!cipherText.startsWith('ENC:')) return cipherText;
    const decoded = fromBase64(cipherText.slice(4));
    return xorEncrypt(decoded, SECRET_KEY);
  } catch {
    return cipherText;
  }
}

export function isEncrypted(text: string): boolean {
  return text.startsWith('ENC:');
}
