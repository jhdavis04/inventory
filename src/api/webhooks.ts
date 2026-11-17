import express from "express";
import type { Request } from "express";
import { db } from "../prisma/db";
import { isDuplicate } from "../lib/helperFunctions";
import { verifyEtsy, verifyShopify } from "../lib/signatures";
import { calculateProductCost } from "../lib/cost";

const router = express.Router();

// sigs needs exact bytes, read bodies raw here
router.use(express.raw({ type: '*/*', limit: '1mb' }));
const rawBodyOf = (req: Request): Buffer | null => (Buffer.isBuffer(req.body) ? req.body : null);


async function costSnapshot(businessId: number, productId: number): Promise<number | null> {
	const result = await calculateProductCost(businessId, productId);
	return result?.cost ?? null
}

router.post('/api/webhooks/etsy', async (req, res) => {
	const body = rawBodyOf(req);
	const webhookId = req.get('webhook-id');
	const valid = body !== null && verifyEtsy(body, { id: webhookId, timestamp: req.get('webhook-timestamp'), signature: req.get('webhook-signature') });
	if (!body || !webhookId || !valid) { 
		res.status(401).json({ error: 'Invalid Signature' }) 
		return; 
	}

	const event = JSON.parse(body.toString('utf8')) as {
		event_type?: string;
		resource_url?: string;
		shop_id?: string | number;
	};
	const shopId = String(event.shop_id ?? '');
	const topic = String(event.event_type ?? '').toLowerCase;
	
	const channel = await db.orm.public.SalesChannel.where({ type: 'etsy', externalShopId: shopId }).first();
	if (!channel) {
		res.sendStatus(200);
		return;
	}

	// try block with webhookevent create , id, source, topic, shopid, status
});

export default router;

/* FUTURE IMPLENMENTATION
type ShopifyLine = {

}

async function resolveProductId() {

}

router.post('/api/webhooks/shopify', async (req, res) => {

})
*/