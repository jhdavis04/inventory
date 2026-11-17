import express from 'express';
import { db } from '../prisma/db';
import { currentUser } from '../lib/tenant';
import { parseId, round2, toDecimal, ownsProduct } from '../lib/helperFunctions';

const router = express.Router();
const Batch = db.orm.public.Batch;
const BatchSupplyUsage = db.orm.public.BatchSupplyUsage;
const SupplyLot = db.orm.public.SupplyLot;

class BatchError extends Error {}

// returns a list of all batches in table
router.get("/api/batches", async (req, res) => {
    const { businessId } = currentUser(res);
    res.json(await Batch.where({ businessId }).orderBy((b) => b.id.desc()).limit(50).all());
});

// gets specific batch by id number
router.get('/api/batches/:id', async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid ID' });

    const { businessId } = currentUser(res);
    const batch = await Batch.where({ id, businessId }).first();
    if (!batch) return res.status(400).json({ error: 'Batch not found' });

    const usage = await BatchSupplyUsage.where({ batchId: id }).all();
    const lots = await Promise.all(usage.map((u) => SupplyLot.where({ id: u.supplyLotId }).first()));

    res.json({ ...batch, usage: usage.map((u, i) => ({ ...u, supplyLot: lots[i] })) });
});

// creates a batch using a product and how much was made
router.post('/api/batches', async (req, res) => {
    const { productId, qtyMade } = req.body ?? {};
    const { businessId } = currentUser(res);
    
    if (!parseId(productId) || !Number.isInteger(qtyMade) || qtyMade <= 0) {
        return res.status(400).json({ error: 'productId and a positive whole qtyMade are required'});
    }
    if (!(await ownsProduct(businessId, productId))) return res.status(404).json({ error: 'Product not found' });

    // If anything is thrown, the entire transaction is undone
    try {
        const batch = await db.transaction(async (tx) => {
            const recipe = await tx.orm.public.BillOfMaterial.where({ productId }).all()
            if (recipe.length === 0) throw new BatchError('This product has no recipe');
            
            const { businessId } = currentUser(res);
            const batch = await tx.orm.public.Batch.create({ businessId, productId, qtyMade});
            
            for (const item of recipe) {
                let needed = round2(Number(item.qtyRequired) * qtyMade);

                const lots = await tx.orm.public.SupplyLot.where({ supplyId: item.supplyId }).all();
                lots.sort((a, b) => a.id - b.id);

                for(const lot of lots) {
                    if (needed <= 0) break;
                    const available = Number(lot.qtyRemaining);
                    if (available <= 0) continue;
                    
                    const take = Math.min(available, needed);
                    await tx.orm.public.SupplyLot.where({ id: lot.id }).updateAll({ qtyRemaining: toDecimal(round2(available - take)) });
                    await tx.orm.public.BatchSupplyUsage.create({ batchId: batch.id, supplyLotId: lot.id, businessId, qtyUsed: toDecimal(take) });
                    needed = round2(needed - take);
                }
                if (needed > 0) throw new BatchError('Not enough stock for supply');
            }
            return batch;
        });
        res.status(201).json(batch);
    } catch (e) {
        if (e instanceof BatchError) return res.status(400).json({ error: e.message });
        throw e;
    }        
});

export default router;

// TRY-CATCH??
// 2 BATCHES COULD USE SAME STOCK NOT LOCKED
// INCREMENTATION??