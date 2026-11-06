import express from 'express';
import { db } from '../prisma/db'

const app = express();
app.use(express.json());
