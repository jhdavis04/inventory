import express from 'express';
import type { ErrorRequestHandler } from 'express';

import businessRouter from './api/business';
import categoryRouter from './api/categories';
import productsRouter from './api/products';
import bomRouter from './api/bom';
import costRouter from './api/cost';
import suppliesRouter from './api/supplies';
import batchesRouter from './api/batches';
import salesChannelRouter from './api/salesChannels';
import ordersRouter from './api/orders';
import { mappingsByProduct, productMappings } from './api/productMappings';

const app = express();
app.use(express.json);

app.use('/api/business', businessRouter);
app.use('/api/catergories', categoryRouter);
app.use('/api/products', productsRouter);
app.use('/api/products', bomRouter);
app.use('/api/products', costRouter);
app.use('/api/products', mappingsByProduct);
app.use('/api/supplies', suppliesRouter);
app.use('/api/batches', batchesRouter);
app.use('/api/sales-channels', salesChannelRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/product-mappings', productMappings);

app.use((req, res) => res.status(404).json({ error: 'Not Found' }));

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error'});
};
app.use(errorHandler);

app.listen(3001, () => console.log('API runnings on localhost:3001'));