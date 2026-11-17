import express from 'express';
import { db } from '../prisma/db';
import { currentUser } from '../lib/tenant';

const router = express.Router();
const Business = db.orm.public.Business;

router.get('/api/business', async (req, res) => {
    const { businessId } = currentUser(res);
    const business = await Business.where({id: businessId}).first
    // error validation?
    res.json(business);
})

router.patch('/api/business', async (req, res) => {
    const { businessId } = currentUser(res);
    const { name } = req.body ?? {};
    // name validation?
    const rows = await Business.where({id: businessId}).updateAll({name})
    res.json(rows[0]);
})

export default router
