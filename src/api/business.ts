import express from 'express';
import { db } from '../prisma/db';
import { businessId } from '../lib/tenant';
// import { } from '../lib/middleware';

const router = express.Router();
const Business = db.orm.public.Business;

router.get('/', async (req, res) => {
    const business = await Business.where({id: businessId}).first
    // error validation?
    res.json(business);
})

router.patch('/', async (req, res) => {
    const { name } = req.body ?? {};
    // name validation?
    const rows = await Business.where({id: businessId}).updateAll({name})
    res.json(rows[0]);
})

export default router
