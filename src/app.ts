import express, { type Express, type Request, type Response } from 'express';
//import productsRouter from './api/products';

const app: Express = express();
app.use(express.json);


app.use('/api/products', productsRouter);

app.listen(3000);