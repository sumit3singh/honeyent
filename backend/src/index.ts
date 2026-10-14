import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/index.ts';
import { errorHandler } from './middleware/errorHandler.ts';

// Routes
import authRouter from './routes/auth.ts';
import customersRouter from './routes/customers.ts';
import suppliersRouter from './routes/suppliers.ts';
import productsRouter from './routes/products.ts';
import vehiclesRouter from './routes/vehicles.ts';
import driversRouter from './routes/drivers.ts';
import ordersRouter from './routes/orders.ts';
import invoicesRouter from './routes/invoices.ts';
import tripsRouter from './routes/trips.ts';
import dealsRouter from './routes/deals.ts';
import weighSlipsRouter from './routes/weighSlips.ts';
import deliveryChallansRouter from './routes/deliveryChallans.ts';
import paymentsRouter from './routes/payments.ts';
import expensesRouter from './routes/expenses.ts';
import hsnRouter from './routes/hsn.ts';
import companyProfileRouter from './routes/companyProfile.ts';
import expenseHeadsRouter from './routes/expenseHeads.ts';

const app = express();

// Security and middleware
app.use(helmet());
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const cleanOrigin = origin.replace(/\/$/, '');
        if (
            config.cors.origin.includes(cleanOrigin) ||
            config.cors.origin.includes('*') ||
            cleanOrigin.endsWith('.railway.app') ||
            cleanOrigin.endsWith('.netlify.app') ||
            config.nodeEnv !== 'production'
        ) {
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Root welcome route
app.get('/', (req, res) => {
    res.json({
        name: 'Honeyent ERP Backend API',
        status: 'online',
        version: '1.0.0',
        health: '/health',
        message: 'Backend is running. API endpoints are available under /api.'
    });
});

// Auth routes (public)
app.use('/api/auth', authRouter);

// API Routes
app.use('/api/customers', customersRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/products', productsRouter);
app.use('/api/vehicles', vehiclesRouter);
app.use('/api/drivers', driversRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/trips', tripsRouter);
app.use('/api/deals', dealsRouter);
app.use('/api/weigh-slips', weighSlipsRouter);
app.use('/api/delivery-challans', deliveryChallansRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/hsn', hsnRouter);
app.use('/api/company-profile', companyProfileRouter);
app.use('/api/expense-heads', expenseHeadsRouter);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

const PORT = config.port;

app.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
    console.log(`Environment: ${config.nodeEnv}`);
    console.log(`Database: ${config.database.host}:${config.database.port}/${config.database.database}`);
    // Reload trigger comment to force tsx watch to pick up model queries updates


    // try {
    //     const { userQueries } = await import('./models/queries.ts');
    //     await userQueries.createAdminIfMissing();
    // } catch (err) {
    //     console.error('Failed to auto-seed admin user on startup:', err);
    // }
});
