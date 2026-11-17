import express from 'express';

import { db } from '../prisma/db'
import { currentUser } from '../lib/tenant';
import { defined, parseId } from '../lib/helperFunctions'

const router = express.Router();
const Product = db.orm.public.Product;
const BillOfMaterial = db.orm.public.BillOfMaterial;

// get list of all products
router.get('/api/products', async (req, res) => {
    const { businessId } = currentUser(res);
    res.json(await Product.where({ businessId }).all());
});

// get products + category + bom
router.get('/api/products/:id', async (req, res) => {
    const { businessId } = currentUser(res);

    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid id' });

    const product = await Product.where({ id, businessId }).include('category').first();
    const billOfMaterials = await BillOfMaterial.where({ productId: id}).all();
    res.json({ ...product, billOfMaterials});
});

// creates a new product
router.post('/api/products', async (req, res) => {
    const { businessId } = currentUser(res);
    const { name, description, price, cost, categoryId } = req.body ?? {};
    const product = await Product.create({
        name,
        price,
        businessId,
        ...defined({ description, cost, categoryId}),
    });
    res.status(201).json(product);
});

// updates a product fetched through an id
router.patch('/api/products/:id', async (req, res) => {
    const { businessId } = currentUser(res);

    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid id' });

    const { name, description, price, cost, categoryId } = req.body ?? {};
    const changes = defined({ name, description, price, cost, categoryId });
    const rows = await Product.where({ id, businessId }).updateAll(changes);
    res.json(rows[0]);
});

// deletes a product through an id
router.delete('/api/products/:id', async (req, res) => {
    const { businessId } = currentUser(res);

    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid id' });

    const rows = await Product.where({ id, businessId }).deleteAll();
    res.status(204).send();
});

export default router;

