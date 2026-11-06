import express from 'express';
import { db } from '../prisma/db'

const app = express();
app.use(express.json());

app.get('/api/users', async (req, res) => {
    const users = await db.orm.public.User.all();
    res.json(users);
});

// return all categories
app.get('/api/categories', async (req, res) => {
    const categories = await db.orm.public.Category.all();
    return res.json(categories);
});

app.post('/api/categories', async (req, res) => {
    const categories = await db.orm.public.Category;
    res.json(categories);
});

app.post('/api/categories', async (req, res) => {
    //const { }
});