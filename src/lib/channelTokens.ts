import { db } from '../prisma/db';
import { decryptToken, encryptToken } from './crypto';
import { toMillis, toDbTime } from '../lib/time';

export type TokenSet = {
	accessToken: string;
	refreshToken: string;
	expiresIn: number;        // seconds until the access token expires
	refreshExpiresIn: number; // seconds until the refresh token expires
	scope?: string;
};

export class ReauthRequired extends Error {}

const SalesChannel = db.orm.public.SalesChannel;
const fromNow = (seconds: number) => toDbTime(Date.now() + seconds * 1000);

// The columns to write for a fresh set of tokens. They are encrypted before touching the database.
export const tokenFields = (t: TokenSet) => ({
	accessToken: encryptToken(t.accessToken),
	refreshToken: encryptToken(t.refreshToken),
	tokenExpiresAt: fromNow(t.expiresIn),
	refreshTokenExpiresAt: fromNow(t.refreshExpiresIn),
	needsReauth: false,
	...(t.scope ? { scopes: t.scope } : {}),
});

// Each platform supplies its own refresh call.
type Refresher = (refreshToken: string, shop: string | null) => Promise<TokenSet | 'reauthorize'>;

const inFlight = new Map<number, Promise<string>>();

// Returns a working access token for a channel, refreshing it first if it's about to expire.
// Refresh tokens are single-use, so two refreshes at once would invalidate each other:
// callers that arrive during a refresh share its result instead of starting another.
export function getAccessToken(channelId: number, refresh: Refresher): Promise<string> {
	const running = inFlight.get(channelId);
	if (running) return running;

	const job = loadOrRefresh(channelId, refresh).finally(() => inFlight.delete(channelId));
	inFlight.set(channelId, job);
	return job;
}

async function loadOrRefresh(channelId: number, refresh: Refresher): Promise<string> {
	const channel = await SalesChannel.where({ id: channelId }).first();
	if (!channel?.accessToken || !channel.refreshToken) throw new ReauthRequired('Channel has no tokens');
	if (channel.needsReauth) throw new ReauthRequired('Channel must be reconnected');

	// Still good for more than 2 minutes: use it.
	const expiresAt = channel.tokenExpiresAt ? toMillis(channel.tokenExpiresAt) : 0;
	if (expiresAt - Date.now() > 2 * 60 * 1000) return decryptToken(channel.accessToken);

	const result = await refresh(decryptToken(channel.refreshToken), channel.externalShopId);

	if (result === 'reauthorize') {
	await SalesChannel.where({ id: channelId }).updateAll({ needsReauth: true });
	throw new ReauthRequired('Refresh token was rejected');
	}

	await SalesChannel.where({ id: channelId }).updateAll(tokenFields(result));
	return result.accessToken;
}