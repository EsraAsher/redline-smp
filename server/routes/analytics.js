import { Router } from 'express';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Collection from '../models/Collection.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

// All analytics routes require auth
router.use(authMiddleware);

// GET /api/analytics/overview
router.get('/overview', async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ isActive: true });
    const totalCollections = await Collection.countDocuments();

    const orders = await Order.find({ status: { $in: ['completed', 'paid', 'delivered'] } });
    const totalSales = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const totalItemsSold = orders.reduce(
      (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
      0
    );

    res.json({
      totalProducts,
      activeProducts,
      totalCollections,
      totalSales,
      totalRevenue,
      totalItemsSold,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/analytics/products - per-product sales
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find()
      .populate('collection', 'name slug')
      .sort({ totalSold: -1 });

    const stats = products.map((p) => ({
      _id: p._id,
      title: p.title,
      collection: p.collection?.name || 'Unknown',
      price: p.price,
      totalSold: p.totalSold,
      totalRevenue: p.totalRevenue,
      isActive: p.isActive,
    }));

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/analytics/recent-orders
router.get('/recent-orders', async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('items.product', 'title');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── Revenue Analytics ────────────────────────────────────
// GET /api/analytics/revenue
router.get('/revenue', async (req, res) => {
  try {
    const now = new Date();

    // Start of today (midnight local → UTC)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 7 days ago
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 6); // include today → last 7 days

    // Start of current month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Start of current year
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const matchStage = {
      $match: {
        paymentStatus: 'paid',
        webhookVerified: true,
      },
    };

    const [result] = await Order.aggregate([
      matchStage,
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          todayRevenue: {
            $sum: {
              $cond: [{ $gte: ['$paidAt', todayStart] }, '$total', 0],
            },
          },
          weeklyRevenue: {
            $sum: {
              $cond: [{ $gte: ['$paidAt', weekStart] }, '$total', 0],
            },
          },
          monthlyRevenue: {
            $sum: {
              $cond: [{ $gte: ['$paidAt', monthStart] }, '$total', 0],
            },
          },
          yearlyRevenue: {
            $sum: {
              $cond: [{ $gte: ['$paidAt', yearStart] }, '$total', 0],
            },
          },
        },
      },
    ]);

    res.json({
      totalRevenue: result?.totalRevenue || 0,
      todayRevenue: result?.todayRevenue || 0,
      weeklyRevenue: result?.weeklyRevenue || 0,
      monthlyRevenue: result?.monthlyRevenue || 0,
      yearlyRevenue: result?.yearlyRevenue || 0,
    });
  } catch (error) {
    console.error('Revenue analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── Sales Logs ───────────────────────────────────────────
// GET /api/analytics/sales
router.get('/sales', async (req, res) => {
  try {
    const orders = await Order.find({
      paymentStatus: 'paid',
      webhookVerified: true,
    })
      .sort({ paidAt: -1 })
      .select('mcUsername email items total paidAt deliveryStatus')
      .lean();

    const logs = orders.map((o) => ({
      orderId: o._id,
      mcUsername: o.mcUsername,
      email: o.email,
      items: o.items.map((i) => ({ title: i.title, quantity: i.quantity })),
      total: o.total,
      paidAt: o.paidAt,
      deliveryStatus: o.deliveryStatus,
    }));

    res.json(logs);
  } catch (error) {
    console.error('Sales logs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
