import 'dotenv/config'
import jwt from 'jsonwebtoken'

const secret: string = process.env.JWT_SECRET ?? '';
if (secret.length < 32) {
    throw new Error('JWT_SECRET must be set in .env and be at least 32 characters');
}

export function signToken(userId: number): string{
    return jwt.sign({}, secret, { subject: String(userId), algorithm: 'HS256', expiresIn: '7d'});
}

export function verifyToken(token: string): number | null {
    try {
        const payload = jwt.verify(token, secret, { algorithms: ['HS256'] });
        if(typeof payload === 'string' || typeof payload.sub !== 'string') return null;

        const id = Number(payload.sub);
        return Number.isInteger(id) && id > 0 ? id : null;
    } catch {
        return null;
    }
}