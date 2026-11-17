import 'dotenv/config';
import { createHmac, timingSafeEqual } from 'node:crypto';

// signature safety
function safeEqual(a: string, b: string): boolean {
    const left = Buffer.from(a);
    const right = Buffer.from(b);
    return left.length === right.length && timingSafeEqual(left, right)
}

export function verifyShopify() {
    // secret
    // valid test

    // expected HMAC

    // return safe equal (expected and sig)?
}

type EtsyHeaders = { id?: string; timestamp?: string; signature?: string };

export function verifyEtsy(rawBody: Buffer, { id, timestamp, signature }: EtsyHeaders) {
    // set secret
    // valid test

    // replay protection??

    // base64 decode?
    // expected HMAC

    //return sig => safeEqual

}