import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import adminRoutes from './routes/admin.js';
import collectionRoutes from './routes/collections.js';
import productRoutes from './routes/products.js';
import analyticsRoutes from './routes/analytics.js';
import paymentRoutes from './routes/payments.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── CORS ─────────────────────────────────────────────────
// Allow local dev + any Vercel deployment + custom FRONTEND_URL
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    // Allow any Vercel preview/production deployment
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    // Allow explicitly listed origins
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json());

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/products', productRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/payments', paymentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root route — confirms API is online
app.get('/', (req, res) => {
  res.json({ message: 'Redline SMP API is running', docs: '/api/health' });
});

// Connect to MongoDB then start server
const start = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not set in server/.env');
    }
    await connectDB();
    app.listen(PORT, () => {
      console.log(`\n✅ Redline SMP Server running on http://localhost:${PORT}`);
      console.log(`📡 MongoDB connected`);
      console.log(`\n  → Admin panel: http://localhost:5173/adminishere\n`);
    });
  } catch (err) {
    console.error('\n❌ Server failed to start:', err.message);
    console.error('\nCheck your MONGODB_URI in server/.env');
    process.exit(1);
  }
};

start();
