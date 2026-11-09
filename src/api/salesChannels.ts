import express from 'express';

import { db } from '../prisma/db'
import { businessId } from '../lib/tenant'
import { defined, parseId, isText, isDuplicate, isInUse } from '../lib/middleware'

const router = express.Router();
const SalesChannel = db.orm.public.SalesChannel;

const types = [ 'etsy', 'shopify', 'custon' ];

router.get('/api/sales-channels', async (req, res) => {
    const channels = await SalesChannel.where({ businessId }).select('id', 'type', 'displayName', 'externalShopId', 'lastSyncedAt')
        .all();
    res.json(channels);
});

router.post('api/sales-channels', async (req, res) => {
    const { type, displayName, externalShopId } = req.body ?? {};
    if (!types.includes(type) || !isText(displayName)) {
        return res.status(400).json({ error: `type (${types.join('/')}) and displayName are required` });
    }

    try {
        const channel = await SalesChannel.create({
            type, displayName, businessId, ...defined({ externalShopId }),
        });
        res.status(201).json({ id: channel.id, type: channel.type, displayName: channel.displayName });
    } catch (e) {
        if (isDuplicate(e)) return res.status(409).json({ error: 'That shop is already connected' });
        throw e
    }
});

router.delete('/api/sales-channel/:id', async (req, res) => {
    const id = parseId(req.params.id);
    if(!id) return res.status(400).json({ error: 'Invalid id '});

    try {
        const rows = await SalesChannel.where ({ id, businessId }).deleteAll();
        if (rows.length === 0) return res.status(404).json({ error: 'Channel not found'});
        res.status(204).send();
    } catch (e) {
        if (isInUse(e)) return res.status(409).json({ error: 'Channel has orders or product mappings' });
        throw e;
    }
});

export default router

