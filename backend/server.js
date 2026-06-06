import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Route imports
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
import reportRoutes from './routes/reports.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

// Middleware imports
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security Headers (Helmet) ──
app.use(helmet());

// ── CORS Configuration ──
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// ── Rate Limiting ──
// General API rate limit: 100 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});

// Stricter limit for auth routes: 10 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes.'
  }
});

// Apply general limiter to all API routes
app.use('/api', generalLimiter);

// ── Body Parsing (with size limits) ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Health Check Route ──
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'VendorBridge API running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// ── Authentication Routes (with stricter rate limit) ──
app.use('/api/auth', authLimiter, authRoutes);

// ── Feature Routes ──
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
app.use('/api', reportRoutes);
app.use('/api', dashboardRoutes);

// ── 404 Handler (must come after all routes) ──
app.use(notFound);

// ── Global Error Handler (must come after notFound) ──
app.use(errorHandler);

// ── Start Server ──
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
