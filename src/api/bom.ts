import express from 'express';

import { db } from '../prisma/db'
import { businessId } from '../lib/tenant'
import { parseId } from '../lib/middleware'

const router = express.Router();
const BillOfMaterial = db.orm.public.BillOfMaterial;

router.get('/api/products/:id/bom', async(req, res) => {
    const productId = parseId(req.params.id);
    res.json(await BillOfMaterial.where({ productId }).include('supply').all());
});

router.post('/api/products/:id/bom', async(req, res) => {
    const productId = parseId(req.params.id);
    if (!productId) return res.status(400).json({ error: 'Invalid id'});

    const { supplyId, qtyRequired, unit } = req.body ?? {};
    res.status(201).json(await BillOfMaterial.create({ productId, supplyId, qtyRequired, unit }));
});

router.delete('/api/products/:id/bom/:supplyId', async (req, res) => {
    const productId = parseId(req.params.id);
    const supplyId = parseId(req.params.supplyId);

    const rows = await BillOfMaterial.where({ productId, supplyId }).deleteAll();
    res.status(204).send();
});