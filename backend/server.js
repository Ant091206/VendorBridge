import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import vendorRoutes from './routes/vendors.js';
import vendorCategoryRoutes from './routes/vendorCategoryRoutes.js';
import rfqRoutes from './routes/rfqs.js';
import quotationRoutes from './routes/quotationRoutes.js';
import comparisonRoutes from './routes/comparisonRoutes.js';
import approvalRoutes from './routes/approvals.js';
import purchaseOrderRoutes from './routes/purchaseOrders.js';
import invoiceRoutes from './routes/invoices.js';
import activityLogRoutes from './routes/activityLogs.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import reportRoutesNew from './routes/reportRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS policy: origin '${origin}' not allowed`));
  },
  credentials: true
}));

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes.'
  }
});

app.use('/api', generalLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'VendorBridge API running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authLimiter, authRoutes);

app.use('/api', userRoutes);
app.use('/api', vendorRoutes);
app.use('/api', vendorCategoryRoutes);
app.use('/api', rfqRoutes);
app.use('/api', quotationRoutes);
app.use('/api', comparisonRoutes);
app.use('/api', approvalRoutes);
app.use('/api', purchaseOrderRoutes);
app.use('/api', invoiceRoutes);
app.use('/api', activityLogRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', notificationRoutes);
app.use('/api', reportRoutesNew);
app.use('/api', analyticsRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});
