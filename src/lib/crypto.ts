import 'dotenv/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const hex = process.env.TOKEN_ENCRYPTION_KEY ?? '';
if (!/^[0-9a-f]{64}$/i.test(hex)) {
  throw new Error('TOKEN_ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
}
const key = Buffer.from(hex, 'hex');

// Output looks like "v1.<iv>.<auth tag>.<ciphertext>", each part base64url.
export function encryptToken(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ['v1', iv.toString('base64url'), tag.toString('base64url'), data.toString('base64url')].join('.');
}

export function decryptToken(stored: string): string {
  const [version, iv, tag, data] = stored.split('.');
  if (version !== 'v1' || !iv || !tag || !data) throw new Error('Unrecognized token format');

  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(data, 'base64url')), decipher.final()]).toString('utf8');
}