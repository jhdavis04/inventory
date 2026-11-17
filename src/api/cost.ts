import express from 'express';
import { db } from '../prisma/db';
import { currentUser } from '../lib/tenant';
import { parseId, round2 } from '../lib/helperFunctions';
import { calculateProductCost } from '../lib/cost';


const router = express.Router();

// returns how much it costs to make a product
router.get('/api/products/:id/cost', async(req, res) => {
    const { businessId } = currentUser(res);

    const id = parseId(req.params.id);
    if (!id) return res.status(404).json({ error: 'Invalid ID'});

    const result = await calculateProductCost(businessId, id);
    if (!result) return res.status(404).json({ error: 'Product not found'});

    res.json({
        productId: id,
        cost: result.cost === null ? null : round2(result.cost),
        knownCost: round2(result.knownCost),
        source: result?.source,
        missingSupplies: result?.missingSupplies,
    });
});

// returns what the profit margin is on a product
router.get('/api/products/:id/profit', async(req, res) => {
    const { businessId } = currentUser(res);
    
    const id = parseId(req.params.id);
    if (!id) return res.status(404).json({ error: 'Invalid ID'});

    const result = await calculateProductCost(businessId, id);
    if (!result) return res.status(404).json({ error: 'Product not found'});

    const price = Number(result.product.price);
    const cost = result.cost

    res.json({
        productId: id,
        price,
        cost: cost === null ? null : round2(cost),
        profit: cost === null ? null : round2(price - cost),
        source: result?.source,
        missingSupplies: result?.missingSupplies,
    });
});

// NO UNIT CONVERSION FIGURE OUT
export default router;

