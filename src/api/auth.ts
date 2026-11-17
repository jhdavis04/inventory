import express from 'express';

import rateLimit from 'express-rate-limit';
import { db } from '../prisma/db'
import { hashPassword, verifyPassword } from '../lib/password';
import { signToken } from '../lib/jwt';
import { requireAuth } from '../middleware/requireAuth';
import { currentUser } from '../lib/tenant';
import { defined, isText, isDuplicate } from '../lib/helperFunctions'

const router = express.Router();
const Business = db.orm.public.Business;
const User = db.orm.public.User;

// dummy values used to prevent users from timeing whether emails are within the user database or not BASIC SECURITY
let dummyHash: Promise<string> | undefined;
const getDummyHash = () => (dummyHash ??= hashPassword('not-a-real-password'));

// allows 20 signup/login attempts every 15 minutes
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });

const cleanEmail = (v: unknown) => (typeof v === 'string' ? v.trim().toLowerCase() : '');
const emailOk = (e: string) => e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const passwordOk = (p: unknown): p is string => typeof p === 'string' && p.length >= 8 && p.length <= 128

// creation call taht allows for businesses to sign up for application
router.post('/api/auth/signup', limiter, async (req, res) => {
    const { businessName, name, password } = req.body ?? {}
    const email = cleanEmail(req.body?.email);

    if (!isText(businessName) || !emailOk(email) || !passwordOk(password)) {
        res.status(400).json({ error: 'businessName, a valid email, and a password of 8-128 characters are required' });
        return;
    }

    const passwordHash = await hashPassword(password);

    try {
        const { business, user } = await db.transaction(async (tx) => {
            const business = await tx.orm.public.Business.create({ name: businessName.trim() });
            const user = await tx.orm.public.User.create ({ businessId: business.id, email, passwordHash, ...defined({ name: isText(name) ? name.trim() : undefined }), });
            return { business, user };
        });

        res.status(201).json({ token: signToken(user.id), user: { id: user.id, email: user.email, name: user.name, role: user.role }, business: { id: business.id, name: business.name }, });
    } catch (e) {
        if (isDuplicate(e)) {
            res.status(409).json({ error: 'An account with that email already exists' });
            return;
        }
        throw e;
    }
});

// call that allows users to login
router.post('/login', limiter, async (req, res) => {
    const email = cleanEmail(req.body?.email);
    const password = req.body?.password;

    if (!email || typeof password !== 'string' || password.length > 128) {
        res.status(400).json({ error: 'email and password are required' });
        return;
    }

    const user = await User.where({ email }).first();
    const valid = await verifyPassword(password, user ? user.passwordHash : await getDummyHash());

    if (!user || !valid) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
    }

    res.json({ token: signToken(user.id), user: { id: user.id, email: user.email, name: user.name, role: user.role }, });
});

// call that checks to see if there is an account with the information given by the user
router.get('/me', requireAuth, async (req, res) => {
    const { id, businessId } = currentUser(res);
    const user = await User.where({ id }).first();
    const business = await Business.where({ id: businessId }).first();
    
    if (!user || !business) {
        res.status(404).json({ error: 'Account not found' });
        return;
    }

    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role }, business: { id: business.id, name: business.name }, });
});

export default router;
