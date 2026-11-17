import express from 'express';

import { db } from '../prisma/db'
import { currentUser } from '../lib/tenant';
import { parseId } from '../lib/helperFunctions'

const router = express.Router();
const Category = db.orm.public.Category;

// return all categories
router.get('/api/categories', async (req, res) => {
    const { businessId } = currentUser(res);
    res.json(await Category.where({ businessId }).all());
});

// create new category
router.post('/api/categories', async (req, res) => {
    const { businessId } = currentUser(res);
    const { name } = req.body ?? {};
    res.status(201).json(await Category.create({ name, businessId}));
});

// update category
router.patch('/api/categories:id', async (req, res) => {
    const { businessId } = currentUser(res);
    const id = parseId(req.params.id);
    const { name } = req.body ?? {};
    const rows = await Category.where({ id, businessId}).updateAll({ name });
    res.json(rows[0]);
});

// delete category
router.delete('/api/catergories/:id', async (req, res) => {
    const { businessId } = currentUser(res);
    const id = parseId(req.params.id);
    const rows = await Category.where({ id, businessId }).deleteAll();
    res.status(204).send();
});

export default router;