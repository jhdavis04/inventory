import express from 'express';
import { db } from '../prisma/db';
import { businessId } from '../lib/tenant';
import { parseId, round2 } from '../lib/middleware';

const router = express.Router();
const Product = db.orm.public.Product;
const BillOfMaterial = db.orm.public.BillOfMaterial;
const SupplyLot = db.orm.public.SupplyLot;

async function calculateCost(productId: number) {
    const product = await Product.where({ id: productId, businessId }).first();
    if (!product) return null;
    const recipe = await BillOfMaterial.where({ productId }).all();

    // MAYBE??
    const supplyIds = recipe.map(item => item.supplyId);
    const allLots = await db.orm.public.SupplyLot.where((l) => l.supplyId.in(supplyIds)).all();
    const lotsBySupplyId = new Map<number, typeof allLots>();
    for (const lot of allLots) {
        if (!lotsBySupplyId.has(lot.supplyId)) {
            lotsBySupplyId.set(lot.supplyId, []);
        }
        lotsBySupplyId.get(lot.supplyId)!.push(lot);
    }
    // MAYBE?? END

    let cost = 0;
    const missingSupplies: number[] = [];
    for (const item of recipe) {
        const lots = await SupplyLot.where({ supplyId: item.supplyId }).all();
        if (lots.length === 0) {
            missingSupplies.push(item.supplyId);
            continue
        }
        const latest = lots.reduce((a, b) => (b.id > a.id ? b : a));

        const qtyPurchased = Number(latest.qtyPurchased);
        const totalCost = Number(latest.totalCost);
        if (!qtyPurchased || qtyPurchased <= 0) {
            console.warn(`Supply lot ${latest.id} has invalid qtyPurchased: ${latest.qtyPurchased}`);
            continue;
        }

        const unitCost = Number(latest.totalCost) / Number(latest.qtyPurchased);
        cost += Number(item.qtyRequired) * unitCost;
    }
    return { product, cost, source: 'recipe', missingSupplies };
}

router.get('/api/products/:id/cost', async(req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(404).json({ error: 'Invalid ID'});

    const result = await calculateCost(id);
    if (!result) return res.status(404).json({ error: 'Product not found'});

    res.json({
        productId: id,
        cost: round2(result.cost),
        source: result?.source,
        missingSupplies: result?.missingSupplies,
    });
});

router.get('/api/products/:id/profit', async(req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(404).json({ error: 'Invalid ID'});

    const result = await calculateCost(id);
    if (!result) return res.status(404).json({ error: 'Product not found'});

    const price = Number(result.product.price);

    res.json({
        productId: id,
        price,
        cost: round2(result.cost),
        profit: round2(price - result.cost),
        source: result?.source,
        missingSupplies: result?.missingSupplies,
    });
});

// NO UNIT CONVERSION FIGURE OUT
export default router;

