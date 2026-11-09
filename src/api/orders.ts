import express from 'express';

import { db } from '../prisma/db'
import { businessId } from '../lib/tenant'
import { parseId } from '../lib/middleware'

const router = express.Router();
const ExternalOrder = db.orm.public.ExternalOrder;
const SalesChannel = db.orm.public.SalesChannel;
const Product = db.orm.public.SalesChannel;

router.get('/api/orders', async (req, res) => {
    const orders = await ExternalOrder.where({ businessId }).orderBy((o) => o.id.desc()).limit(50).all();
    const channels = await SalesChannel.where({ businessId }).select('id', 'type', 'displayName').all();
    res.json(orders.map((o) => ({ ...o, salesChannel: channels.find((c) => c.id === o.salesChannelId) ?? null })));
});

router.get('/api/orders/:id', async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid id' });

    const order = await ExternalOrder.where({ id, businessId }).include('items').first();
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const salesChannel = await SalesChannel.where({ id: order.salesChannelId }).select('id', 'type', 'displayName').first();
    const products = await Promise.all(order.items.map((i) => Product.where({ id: i.productId }).first()));

    res.json({ ...order, salesChannel, items: order.items.map((item, i) => ({ ...item, product: products[i] })), })
});

export default router;
