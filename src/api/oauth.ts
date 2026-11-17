import { Router } from 'express';
import type { Response } from 'express';
import { randomBytes } from 'node:crypto';
import { db } from '../prisma/db';
import { currentUser } from '../lib/tenant';
import { isDuplicate } from '../lib/helperFunctions';
import { tokenFields } from '../lib/channelTokens';
import type { TokenSet } from '../lib/channelTokens';
import { toMillis } from '../lib/time'
import { etsyAuthorizeUrl, exchangeEtsyCode, getEtsyShopId } from '../lib/etsyHelpers';
// import { exchangeShopifyCode, hasRequiredScopes, isValidShop, shopifyAuthorizeUrl, verifyShopifyCallback, } from '../lib/shopifyHelpers';

const OauthState = db.orm.public.OauthState;
const SalesChannel = db.orm.public.SalesChannel;
const STATE_MAX_AGE_MS = 10 * 60 * 1000;

const asText = (v: unknown) => (typeof v === 'string' && v.length > 0 ? v : undefined);
const randomText = (bytes: number) => randomBytes(bytes).toString('base64url');

// Where the browser lands when we're done. Your frontend reads the result from the URL.
function backToApp(res: Response, provider: string, result: string): void {
  const url = new URL('/channels', process.env.FRONTEND_URL ?? 'http://localhost:5173');
  url.searchParams.set('provider', provider);
  url.searchParams.set('result', result);
  res.redirect(url.toString());
}

// Fetch AND delete the state in one step, so it can only ever be used once.
async function takeState(state: unknown, provider: string) {
  const id = asText(state);
  if (!id) return null;

  const rows = await OauthState.where({ id }).deleteAll();
  const record = rows[0];
  if (!record || record.provider !== provider) return null;
  if (Date.now() - toMillis(record.createdAt) > STATE_MAX_AGE_MS) return null;
  return record;
}

// Create the channel, or refresh its tokens if this business already connected this shop.
async function saveChannel(input: {
  businessId: number;
  type: 'etsy' | 'shopify';
  externalShopId: string;
  displayName: string;
  tokens: TokenSet;
}): Promise<'connected' | 'shop_in_use'> {
  const { businessId, type, externalShopId, displayName, tokens } = input;

  const existing = await SalesChannel.where({ type, externalShopId }).first();
  if (existing && existing.businessId !== businessId) return 'shop_in_use'; // another business owns it

  try {
    if (existing) {
      await SalesChannel.where({ id: existing.id }).updateAll(tokenFields(tokens)); // a reconnect
    } else {
      await SalesChannel.create({ businessId, type, externalShopId, displayName, ...tokenFields(tokens) });
    }
  } catch (e) {
    if (isDuplicate(e)) return 'shop_in_use'; // another business connected it a moment ago
    throw e;
  }
  return 'connected';
}

// ---- Step 1: logged-in routes. They return a URL for the frontend to send the browser to. ----
export const oauthStart = Router();

oauthStart.post('/etsy', async (req, res) => {
  const { businessId } = currentUser(res);
  const state = randomText(24);
  const verifier = randomText(32); // 43 characters, which PKCE requires (43-128)

  await OauthState.create({ id: state, provider: 'etsy', businessId, codeVerifier: verifier });
  res.json({ url: etsyAuthorizeUrl(state, verifier) });
});

/* SHOPIFY OAUTH FOR LATER IMPLEMENTATION
oauthStart.post('/shopify', async (req, res) => {
  const { businessId } = currentUser(res);
  const shop = asText(req.body?.shop)?.trim().toLowerCase();

  if (!isValidShop(shop)) {
    res.status(400).json({ error: 'shop must look like my-store.myshopify.com' });
    return;
  }

  const state = randomText(24);
  await OauthState.create({ id: state, provider: 'shopify', businessId, shop });
  res.json({ url: shopifyAuthorizeUrl(shop, state) });
}); */

// ---- Step 2: public routes. The browser arrives here from Etsy or Shopify, with no login token. ----
export const oauthCallbacks = Router();

oauthCallbacks.get('/etsy/callback', async (req, res) => {
  const record = await takeState(req.query.state, 'etsy');
  if (!record?.codeVerifier) return backToApp(res, 'etsy', 'invalid_state');

  const code = asText(req.query.code);
  if (!code) return backToApp(res, 'etsy', 'denied'); // the seller declined, or Etsy reported an error

  try {
    const tokens = await exchangeEtsyCode(code, record.codeVerifier);
    const shopId = await getEtsyShopId(tokens.accessToken);
    if (!shopId) return backToApp(res, 'etsy', 'no_shop');

    const result = await saveChannel({
      businessId: record.businessId,
      type: 'etsy',
      externalShopId: shopId,
      displayName: `Etsy shop ${shopId}`,
      tokens,
    });
    backToApp(res, 'etsy', result);
  } catch (e) {
    console.error('Etsy connect failed', e);
    backToApp(res, 'etsy', 'error');
  }
});

/* SHOPIFY IMPLEMENTATION FOR LATER
oauthCallbacks.get('/shopify/callback', async (req, res) => {
  const record = await takeState(req.query.state, 'shopify');
  if (!record) return backToApp(res, 'shopify', 'invalid_state');

  const shop = req.query.shop;
  const code = asText(req.query.code);

  // Before trusting anything: it's signed by Shopify, it's the shop we sent them to, and the hostname is valid.
  if (!verifyShopifyCallback(req.query) || !isValidShop(shop) || shop !== record.shop || !code) {
    return backToApp(res, 'shopify', 'invalid_request');
  }

  try {
    const tokens = await exchangeShopifyCode(shop, code);
    if (!hasRequiredScopes(tokens.scope ?? '')) return backToApp(res, 'shopify', 'missing_scopes');

    const result = await saveChannel({
      businessId: record.businessId,
      type: 'shopify',
      externalShopId: shop,
      displayName: shop,
      tokens,
    });
    backToApp(res, 'shopify', result);
  } catch (e) {
    console.error('Shopify connect failed', e);
    backToApp(res, 'shopify', 'error');
  }
});*/