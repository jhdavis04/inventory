import express from 'express';

import { db } from '../prisma/db'
import { currentUser } from '../lib/tenant';
import { parseId, isDuplicate, isText, ownsChannel, ownsProduct } from '../lib/helperFunctions'

const ProductMapping = db.orm.public.ProductMapping;
export const mappingsByProduct = express.Router();

mappingsByProduct.get('/api/products/:id/mappings', async (req, res) => {
    const { businessId } = currentUser(res);
    const productId = parseId(req.params.id);
    if (!productId) return res.status(400).json({ error: 'Invalid id' });
    if (!(await ownsProduct(businessId, productId))) return res.status(404).json({ error: 'Product not found' });

    res.json(await ProductMapping.where({ productId }).all());
});

export const productMappings = express.Router();

productMappings.post("/api/product-mappings", async (req, res) => {
    const { businessId } = currentUser(res);
    const { salesChannelId, externalSkuOrProductId, productId } = req.body ?? {};

    if (!parseId(salesChannelId) || !isText(externalSkuOrProductId) || !parseId(productId)) {
        return res.status(400).json({ error: 'salesChannelId, externalSkuOrProductId, and productId are required' });
    }
    if (!(await ownsChannel(businessId, salesChannelId))) return res.status(404).json({ error: 'Channel not found' });
    if (!(await ownsProduct(businessId, productId))) return res.status(404).json({ error: 'Product not found' });

    // if error is found while trying to create mapping between internal and external products, error is thrown
    try {
        res.status(201).json(await ProductMapping.create({ businessId, salesChannelId, externalSkuOrProductId, productId} ));
    } catch(e) {
        if (isDuplicate(e)) return res.status(409).json({ error: 'That external item is already mapped' });
        throw e;
    }
});

productMappings.delete('/api/product-mappings/:id', async (req, res) => {
    const { businessId } = currentUser(res);
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid id' });

    const mapping = await ProductMapping.where({ id }).first();
    if (!mapping || !(await ownsChannel(mapping.businessId, mapping.salesChannelId))) {
        return res.status(404).json({ error: 'Mapping not found' });
    }

    await ProductMapping.where({ id }).deleteAll();
    res.status(204).send();
});