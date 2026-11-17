import 'dotenv/config';
import { createHash } from 'node:crypto';
import type { TokenSet } from './channelTokens';

const keystring = process.env.ETSY_KEYSTRING ?? '';
const sharedSecret = process.env.ETSY_SHARED_SECRET ?? '';
export const etsyRedirectUri = `${process.env.APP_URL}/api/oauth/etsy/callback`;

// Every Etsy API call needs this header, on top of the seller's bearer token.
export const etsyApiKey = `${keystring}:${sharedSecret}`;

const TOKEN_URL = 'https://api.etsy.com/v3/public/oauth/token';
const REFRESH_TOKEN_LIFETIME = 90 * 24 * 60 * 60; // seconds

export function etsyAuthorizeUrl(state: string, verifier: string): string {
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  const query = new URLSearchParams({
    response_type: 'code',
    client_id: keystring,
    redirect_uri: etsyRedirectUri,
    scope: 'transactions_r shops_r',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });
  // Etsy's examples separate scopes with %20, so avoid the "+" URLSearchParams uses for spaces.
  return `https://www.etsy.com/oauth/connect?${query.toString().replace(/\+/g, '%20')}`;
}

type EtsyTokenResponse = { access_token: string; refresh_token: string; expires_in: number; scope?: string };

const toTokenSet = (d: EtsyTokenResponse): TokenSet => ({
  accessToken: d.access_token,
  refreshToken: d.refresh_token,
  expiresIn: d.expires_in,
  refreshExpiresIn: REFRESH_TOKEN_LIFETIME,
  ...(d.scope ? { scope: d.scope } : {}),
});

const tokenRequest = (body: Record<string, string>) =>
  fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams(body),
    signal: AbortSignal.timeout(15_000),
  });

export async function exchangeEtsyCode(code: string, verifier: string): Promise<TokenSet> {
  const res = await tokenRequest({
    grant_type: 'authorization_code',
    client_id: keystring,
    redirect_uri: etsyRedirectUri,
    code,
    code_verifier: verifier,
  });
  if (!res.ok) throw new Error(`Etsy code exchange failed: ${res.status}`);
  return toTokenSet((await res.json()) as EtsyTokenResponse);
}

export async function refreshEtsyToken(refreshToken: string): Promise<TokenSet | 'reauthorize'> {
  const res = await tokenRequest({ grant_type: 'refresh_token', client_id: keystring, refresh_token: refreshToken });
  if (res.status === 400 || res.status === 401) return 'reauthorize';
  if (!res.ok) throw new Error(`Etsy token refresh failed: ${res.status}`);
  return toTokenSet((await res.json()) as EtsyTokenResponse);
}

// Which Etsy shop belongs to the seller who just approved us?
export async function getEtsyShopId(accessToken: string): Promise<string | null> {
  const res = await fetch('https://openapi.etsy.com/v3/application/users/me', {
    headers: { 'x-api-key': etsyApiKey, Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Etsy getMe failed: ${res.status}`);

  const me = (await res.json()) as { shop_id?: number | string | null };
  return me.shop_id ? String(me.shop_id) : null;
}