import express from 'express';

import { db } from '../prisma/db'
import { businessId } from '../lib/tenant'
import { parseId, ownsSupply, isNum, isText, toDecimal } from '../lib/middleware'

const router = express.Router();
const Supply = db.orm.public.Supply;
const SupplyLot = db.orm.public.SupplyLot;

router.get('/api/supplies', async (req, res) => {
    res.json(await Supply.where({ businessId }).all());
}); 

router.post('/api/supplies', async (req, res) => {
    const { name } = req.body ?? {};
    res.status(201).json(await Supply.create({ name, businessId }));
});

router.get('/api/supplies/:id', async (req, res) => {
    const id = parseId(req.params.id);
    const supply = await Supply.where({ id, businessId }).include('supplyLots').first();
    res.json(supply);
});

router.delete('/api/supplies/:id', async (req, res) => {
    const id = parseId(req.params.id);
    const rows = await Supply.where({ id, businessId }).deleteAll();
    res.status(204).send();
});

router.get('/api/supplies/:id/lots', async (req, res) => {
    const id = parseId(req.params.id);
    res.json(await SupplyLot.where({ supplyId: id }).all());
});

router.post('/api/supplies/:id/lots', async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid supplyId'});
    
    const { qtyPurchased, unit, totalCost } = req.body ?? {};
    if (!isNum(qtyPurchased) || qtyPurchased <= 0 || !isText(unit) || !isNum(totalCost) || totalCost < 0) {
        return res.status(400).json({ error: 'qtyPurchased, unit, and totalCost are required' });
    }

    if (!(await ownsSupply(id))) return res.status(404).json({ error: 'Supply not found' });

    const lot = await SupplyLot.create({
        supplyId: id,
        qtyPurchased: toDecimal(qtyPurchased),
        qtyRemaining: toDecimal(qtyPurchased),
        unit,
        totalCost: toDecimal(qtyPurchased),
    });

    res.status(201).json(lot);
});

export default router;