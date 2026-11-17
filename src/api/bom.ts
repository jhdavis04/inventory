import express from 'express';

import { db } from '../prisma/db'
import { currentUser } from '../lib/tenant';
import { parseId, ownsProduct, isNum, isText, ownsSupply, isDuplicate, toDecimal } from '../lib/helperFunctions'

const router = express.Router();
const BillOfMaterial = db.orm.public.BillOfMaterial;

// returns the bill of materials for a specific product
router.get('/api/products/:id/bom', async(req, res) => {
    const { businessId } = currentUser(res);
    const productId = parseId(req.params.id);
    
    if (!productId) return res.status(400).json({ error: 'Invalid id'});
    if (!(await ownsProduct(businessId, productId))) return res.status(404).json({ error: 'Product not found' });

    res.json(await BillOfMaterial.where({ productId }).include('supply').all());
});

// creates bill of material for a specific product
router.post('/api/products/:id/bom', async(req, res) => {
    const { businessId } = currentUser(res);
    const productId = parseId(req.params.id);
    if (!productId) return res.status(400).json({ error: 'Invalid id'});

    const { supplyId, qtyRequired, unit } = req.body ?? {};
    if (!parseId(supplyId) || !isNum(qtyRequired) || qtyRequired <= 0 || !isText(unit)) {
        return res.status(400).json({ error: 'supplyId, qtyRequired, and unit are required'})
    }
    if (!(await ownsProduct(businessId, productId))) return res.status(404).json({ error: 'Product not found' });
    if (!(await ownsSupply(businessId, supplyId))) return res.status(404).json({ error: 'Supply not found' });

    try { 
        const item = await BillOfMaterial.create({
            businessId,
            productId,
            supplyId,
            qtyRequired: toDecimal(qtyRequired, 2),
            unit,
        });
        res.status(201).json(item);
    } catch (e) {
        if(isDuplicate(e)) return res.status(409).json({ error: 'Supply is already in this recipe' });
        throw e;
    }
    
});

// deletes a supply id from bill of materials for a product
router.delete('/api/products/:id/bom/:supplyId', async (req, res) => {
    const { businessId } = currentUser(res);
    const productId = parseId(req.params.id);
    const supplyId = parseId(req.params.supplyId);
    if (!productId || !supplyId) return res.status(400).json({ error: 'Invalid id'});
    if (!(await ownsProduct(businessId, productId))) return res.status(404).json({ error: 'Product not found' });

    const rows = await BillOfMaterial.where({ productId, supplyId }).deleteAll();
    if (rows.length === 0) return res.status(404).json({ error: 'Supply is not in this recipe' })
    res.status(204).send();
});

export default router;