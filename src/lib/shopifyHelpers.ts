import 'dotenv/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { TokenSet } from './channelTokens';

const clientId = process.env.SHOPIFY_CLIENT_ID ?? '';
const clientSecret = process.env.SHOPIFY_CLIENT_SECRET ?? '';
export const shopifyRedirectUri = `${process.env.APP_URL}/api/oauth/shopify/callback`;
const SCOPES = 'read_orders';

// Anchored at both ends. Without the "$", "x.myshopify.com.evil.com" would pass,
// and we'd send an authorization code to someone else's server.
export const isValidShop = (shop: unknown): shop is string =>
  typeof shop === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/.test(shop);

export function shopifyAuthorizeUrl(shop: string, state: string): string {
  const query = new URLSearchParams({ client_id: clientId, scope: SCOPES, redirect_uri: shopifyRedirectUri, state });
  return `https://${shop}/admin/oauth/authorize?${query}`;
}

// Shopify signs its callback: drop "hmac", sort the rest alphabetically,
// join as key=value pairs, and HMAC-SHA256 it with the client secret (hex).
export function verifyShopifyCallback(query: Record<string, unknown>): boolean {
  const { hmac, ...rest } = query;
  if (typeof hmac !== 'string') return false;

  const message = Object.entries(rest)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');

  const expected = Buffer.from(createHmac('sha256', clientSecret).update(message).digest('hex'));
  const actual = Buffer.from(hmac);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

// A write_* grant includes the matching read_*, so count those as satisfied.
export function hasRequiredScopes(granted: string): boolean {
  const have = granted.split(',');
  return SCOPES.split(',').every(
    (s) => have.includes(s) || (s.startsWith('read_') && have.includes(`write_${s.slice(5)}`)),
  );
}

type ShopifyTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_token_expires_in: number;
  scope: string;
};

const toTokenSet = (d: ShopifyTokenResponse): TokenSet => ({
  accessToken: d.access_token,
  refreshToken: d.refresh_token,
  expiresIn: d.expires_in,
  refreshExpiresIn: d.refresh_token_expires_in,
  scope: d.scope,
});

const tokenRequest = (shop: string, body: Record<string, string>) =>
  fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, ...body }),
    signal: AbortSignal.timeout(15_000),
  });

export async function exchangeShopifyCode(shop: string, code: string): Promise<TokenSet> {
  // expiring=1 asks for the short-lived token plus refresh token.
  const res = await tokenRequest(shop, { code, expiring: '1' });
  if (!res.ok) throw new Error(`Shopify code exchange failed: ${res.status}`);
  return toTokenSet((await res.json()) as ShopifyTokenResponse);
}

export async function refreshShopifyToken(refreshToken: string, shop: string | null): Promise<TokenSet | 'reauthorize'> {
  if (!isValidShop(shop)) return 'reauthorize';

  const res = await tokenRequest(shop, { grant_type: 'refresh_token', refresh_token: refreshToken });
  if (res.status === 401) return 'reauthorize'; // expired, revoked, or the app was uninstalled
  if (!res.ok) throw new Error(`Shopify token refresh failed: ${res.status}`);
  return toTokenSet((await res.json()) as ShopifyTokenResponse);
}