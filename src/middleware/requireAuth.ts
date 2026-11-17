import type { RequestHandler } from 'express';
import { db } from '../prisma/db';
import { verifyToken } from '../lib/jwt';

export const requireAuth: RequestHandler = async (req, res, next) => {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
    const userId = token ? verifyToken(token) : null;

    // looks for user on every request so a deleted one loses access and the ids for check come rom database
    const user = userId ? await db.orm.public.User.where({ id: userId }).first() : null;

    if (!user) {
        res.status(401).json({ error: 'Authenticaation required' });
        return;
    }
    
    res.locals.user ={ id: user.id, businessId: user.businessId, role: user.role };
    next();
};