import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions} from 'node:crypto';

const options: ScryptOptions = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024};
const KEY_LENGTH = 64;

function derive(password: string, salt: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        scrypt(password, salt, KEY_LENGTH, options, (err, key) => (err ? reject(err) : resolve(key)));
    });
} 

export async function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16);
    const key = await derive(password, salt);
    return `${salt.toString('hex')}:${key.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
    const [saltHex, keyHex] = stored.split(':');
    if (!saltHex || !keyHex) return false;

    const expected = Buffer.from(keyHex, 'hex');
    const actual = await derive(password, Buffer.from(saltHex, 'hex'));
    return actual.length === expected.length && timingSafeEqual(actual, expected);
}
